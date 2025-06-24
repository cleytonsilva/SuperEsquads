// Edge Function: Certificate Generator
// Responsável por gerar certificados em PDF para estudantes que completaram cursos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { validateUser } from '../_shared/auth.ts'
import { generateCertificatePDF } from '../_shared/pdf-generator.ts'
import { AppError, ValidationError, AuthorizationError, NotFoundError } from '../_shared/errors.ts'

interface CertificateRequest {
  courseId: string
  studentId?: string // Optional, defaults to authenticated user
}

interface CertificateResponse {
  certificateId: string
  downloadUrl: string
  issuedAt: string
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

    // Validate user authentication
    const user = await validateUser(authHeader, supabase)
    
    // Parse and validate request body
    const requestBody: CertificateRequest = await req.json()
    
    // Validate input parameters
    if (!requestBody.courseId || typeof requestBody.courseId !== 'string') {
      throw new ValidationError('Campo "courseId" é obrigatório e deve ser uma string')
    }

    // Use authenticated user ID if studentId is not provided
    const studentId = requestBody.studentId || user.id

    console.log(`📜 Gerando certificado`, {
      courseId: requestBody.courseId,
      studentId,
      requestedBy: user.id
    })

    // 1. Verify course exists and is published
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, estimated_duration')
      .eq('id', requestBody.courseId)
      .eq('status', 'published')
      .single()

    if (courseError || !course) {
      throw new NotFoundError('Curso não encontrado ou não está publicado')
    }

    // 2. Verify student enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, enrolled_at, completed_at')
      .eq('course_id', requestBody.courseId)
      .eq('user_id', studentId)
      .single()

    if (enrollmentError || !enrollment) {
      throw new NotFoundError('Estudante não está matriculado neste curso')
    }

    // 3. Verify course completion
    if (!enrollment.completed_at) {
      throw new ValidationError('Curso ainda não foi completado pelo estudante')
    }

    // 4. Get student information
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      throw new NotFoundError('Informações do estudante não encontradas')
    }

    // 5. Check if certificate already exists
    const { data: existingCertificate, error: certError } = await supabase
      .from('certificates')
      .select('id, certificate_url, issued_at')
      .eq('course_id', requestBody.courseId)
      .eq('user_id', studentId)
      .single()

    if (existingCertificate && !certError) {
      console.log(`📜 Certificado já existe`, {
        certificateId: existingCertificate.id,
        courseId: requestBody.courseId,
        studentId
      })

      const response: CertificateResponse = {
        certificateId: existingCertificate.id,
        downloadUrl: existingCertificate.certificate_url,
        issuedAt: existingCertificate.issued_at
      }

      return new Response(
        JSON.stringify(response),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    // 6. Generate certificate PDF
    const certificateData = {
      studentName: student.full_name,
      courseName: course.title,
      completionDate: enrollment.completed_at,
      courseDuration: course.estimated_duration,
      certificateId: crypto.randomUUID()
    }

    console.log(`🎨 Gerando PDF do certificado`, certificateData)

    const pdfBuffer = await generateCertificatePDF(certificateData)

    // 7. Upload PDF to Supabase Storage
    const fileName = `certificates/${certificateData.certificateId}.pdf`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload do certificado: ${uploadError.message}`)
    }

    // 8. Get public URL for the certificate
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(fileName)

    if (!urlData.publicUrl) {
      throw new Error('Erro ao obter URL pública do certificado')
    }

    // 9. Save certificate record to database
    const { data: certificate, error: saveError } = await supabase
      .from('certificates')
      .insert({
        id: certificateData.certificateId,
        course_id: requestBody.courseId,
        user_id: studentId,
        certificate_url: urlData.publicUrl,
        issued_at: new Date().toISOString(),
        issued_by: user.id
      })
      .select()
      .single()

    if (saveError) {
      throw new Error(`Erro ao salvar certificado no banco: ${saveError.message}`)
    }

    console.log(`✅ Certificado gerado com sucesso`, {
      certificateId: certificate.id,
      courseId: requestBody.courseId,
      studentId,
      downloadUrl: urlData.publicUrl
    })

    const response: CertificateResponse = {
      certificateId: certificate.id,
      downloadUrl: urlData.publicUrl,
      issuedAt: certificate.issued_at
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201
      }
    )

  } catch (error) {
    console.error('❌ Erro no certificate-generator:', error)

    if (error instanceof AppError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code
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
        code: 'INTERNAL_ERROR'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})