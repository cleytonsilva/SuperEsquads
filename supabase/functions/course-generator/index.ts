// Edge Function: Course Generator
// Responsável por orquestrar a criação de cursos via IA de forma assíncrona

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateAdmin } from '../_shared/auth.ts'
import { generateCourseContent } from '../_shared/ai-service.ts'
import { AppError, ValidationError, AuthorizationError } from '../_shared/errors.ts'

interface CourseGenerationRequest {
  topic: string
  audience: string
  moduleCount: number
}

interface CourseGenerationResponse {
  jobId: string
  status: 'started' | 'error'
  message?: string
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      throw new ValidationError('Método não permitido. Use POST.')
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new AuthorizationError('Token de autorização necessário')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate admin permissions
    const user = await validateAdmin(authHeader, supabase)
    
    // Parse and validate request body
    const requestBody: CourseGenerationRequest = await req.json()
    
    // Validate input parameters
    if (!requestBody.topic || typeof requestBody.topic !== 'string' || requestBody.topic.trim().length === 0) {
      throw new ValidationError('Campo "topic" é obrigatório e deve ser uma string não vazia')
    }
    
    if (!requestBody.audience || typeof requestBody.audience !== 'string' || requestBody.audience.trim().length === 0) {
      throw new ValidationError('Campo "audience" é obrigatório e deve ser uma string não vazia')
    }
    
    if (!requestBody.moduleCount || typeof requestBody.moduleCount !== 'number' || requestBody.moduleCount < 1 || requestBody.moduleCount > 20) {
      throw new ValidationError('Campo "moduleCount" deve ser um número entre 1 e 20')
    }

    // Generate unique job ID
    const jobId = crypto.randomUUID()
    
    console.log(`🚀 Iniciando geração de curso - Job ID: ${jobId}`, {
      topic: requestBody.topic,
      audience: requestBody.audience,
      moduleCount: requestBody.moduleCount,
      userId: user.id
    })

    // Start asynchronous course generation (fire and forget)
    generateCourseAsync({
      jobId,
      topic: requestBody.topic.trim(),
      audience: requestBody.audience.trim(),
      moduleCount: requestBody.moduleCount,
      userId: user.id,
      supabase
    }).catch(error => {
      console.error(`❌ Erro na geração assíncrona do curso ${jobId}:`, error)
    })

    // Return immediate response
    const response: CourseGenerationResponse = {
      jobId,
      status: 'started'
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 202 // Accepted
      }
    )

  } catch (error) {
    console.error('❌ Erro no course-generator:', error)

    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          status: 'error'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: error.statusCode
        }
      )
    }

    return new Response(
      JSON.stringify({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
        status: 'error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

// Função assíncrona para gerar o curso completo
async function generateCourseAsync(params: {
  jobId: string
  topic: string
  audience: string
  moduleCount: number
  userId: string
  supabase: any
}) {
  const { jobId, topic, audience, moduleCount, userId, supabase } = params

  try {
    console.log(`📚 Gerando estrutura do curso - Job ID: ${jobId}`)

    // 1. Generate course structure using AI
    const courseStructure = await generateCourseContent({
      topic,
      audience,
      moduleCount
    })

    console.log(`✅ Estrutura gerada - Job ID: ${jobId}`, {
      title: courseStructure.title,
      modulesCount: courseStructure.modules.length
    })

    // 2. Create course in database
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseStructure.title,
        description: courseStructure.description,
        category: courseStructure.category,
        difficulty_level: courseStructure.difficulty_level,
        estimated_duration: courseStructure.estimated_duration,
        created_by: userId,
        status: 'draft',
        generation_job_id: jobId
      })
      .select()
      .single()

    if (courseError) {
      throw new Error(`Erro ao criar curso: ${courseError.message}`)
    }

    console.log(`💾 Curso criado no banco - ID: ${course.id}, Job ID: ${jobId}`)

    // 3. Create modules and lessons
    for (let moduleIndex = 0; moduleIndex < courseStructure.modules.length; moduleIndex++) {
      const moduleData = courseStructure.modules[moduleIndex]
      
      // Create module
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: course.id,
          title: moduleData.title,
          description: moduleData.description,
          order_index: moduleIndex + 1
        })
        .select()
        .single()

      if (moduleError) {
        throw new Error(`Erro ao criar módulo ${moduleIndex + 1}: ${moduleError.message}`)
      }

      // Create lessons for this module
      for (let lessonIndex = 0; lessonIndex < moduleData.lessons.length; lessonIndex++) {
        const lessonData = moduleData.lessons[lessonIndex]
        
        const { error: lessonError } = await supabase
          .from('lessons')
          .insert({
            module_id: module.id,
            title: lessonData.title,
            content: lessonData.content,
            content_type: lessonData.content_type || 'text',
            duration: lessonData.duration || 10,
            order_index: lessonIndex + 1
          })

        if (lessonError) {
          throw new Error(`Erro ao criar lição ${lessonIndex + 1} do módulo ${moduleIndex + 1}: ${lessonError.message}`)
        }
      }

      console.log(`📖 Módulo ${moduleIndex + 1} criado com ${moduleData.lessons.length} lições - Job ID: ${jobId}`)
    }

    // 4. Generate and create quizzes for the course
    if (courseStructure.quiz_questions && courseStructure.quiz_questions.length > 0) {
      for (const question of courseStructure.quiz_questions) {
        const { data: quizQuestion, error: questionError } = await supabase
          .from('quiz_questions')
          .insert({
            course_id: course.id,
            question: question.question,
            question_type: question.type,
            explanation: question.explanation
          })
          .select()
          .single()

        if (questionError) {
          throw new Error(`Erro ao criar pergunta do quiz: ${questionError.message}`)
        }

        // Create quiz options
        if (question.options && question.options.length > 0) {
          for (let optionIndex = 0; optionIndex < question.options.length; optionIndex++) {
            const option = question.options[optionIndex]
            
            const { error: optionError } = await supabase
              .from('quiz_options')
              .insert({
                question_id: quizQuestion.id,
                option_text: option.text,
                is_correct: option.is_correct,
                order_index: optionIndex + 1
              })

            if (optionError) {
              throw new Error(`Erro ao criar opção do quiz: ${optionError.message}`)
            }
          }
        }
      }

      console.log(`🧠 Quiz criado com ${courseStructure.quiz_questions.length} perguntas - Job ID: ${jobId}`)
    }

    // 5. Update course status to published
    const { error: updateError } = await supabase
      .from('courses')
      .update({ 
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', course.id)

    if (updateError) {
      throw new Error(`Erro ao publicar curso: ${updateError.message}`)
    }

    console.log(`🎉 Curso gerado com sucesso - ID: ${course.id}, Job ID: ${jobId}`)

  } catch (error) {
    console.error(`❌ Erro na geração do curso - Job ID: ${jobId}:`, error)
    
    // Log error to database for monitoring
    try {
      await supabase
        .from('generation_logs')
        .insert({
          job_id: jobId,
          job_type: 'course_generation',
          status: 'error',
          error_message: error.message,
          error_details: JSON.stringify(error),
          user_id: userId
        })
    } catch (logError) {
      console.error(`❌ Erro ao registrar log de erro - Job ID: ${jobId}:`, logError)
    }
    
    throw error
  }
}