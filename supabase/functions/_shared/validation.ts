// Validation utilities using Zod
// Utilitários de validação usando Zod

import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'
import { ValidationError } from './errors.ts'

/**
 * Schema para validação da requisição de geração de curso
 */
export const CourseGenerationSchema = z.object({
  topic: z.string()
    .min(3, 'Tópico deve ter pelo menos 3 caracteres')
    .max(200, 'Tópico deve ter no máximo 200 caracteres')
    .trim(),
  audience: z.string()
    .min(3, 'Público-alvo deve ter pelo menos 3 caracteres')
    .max(200, 'Público-alvo deve ter no máximo 200 caracteres')
    .trim(),
  moduleCount: z.number()
    .int('Número de módulos deve ser um inteiro')
    .min(1, 'Deve ter pelo menos 1 módulo')
    .max(10, 'Máximo de 10 módulos permitidos')
})

export type CourseGenerationRequest = z.infer<typeof CourseGenerationSchema>

/**
 * Schema para validação da requisição de geração de certificado
 */
export const CertificateGenerationSchema = z.object({
  enrollmentId: z.string()
    .uuid('ID de matrícula deve ser um UUID válido')
})

export type CertificateGenerationRequest = z.infer<typeof CertificateGenerationSchema>

/**
 * Schema para validação de dados de curso
 */
export const CourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['draft', 'generating', 'published', 'archived']).default('draft'),
  created_by: z.string().uuid(),
  estimated_duration: z.number().positive().optional(),
  difficulty_level: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})

/**
 * Schema para validação de dados de módulo
 */
export const ModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  course_id: z.string().uuid(),
  order_index: z.number().int().min(0),
  estimated_duration: z.number().positive().optional()
})

/**
 * Schema para validação de dados de lição
 */
export const LessonSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
  module_id: z.string().uuid(),
  order_index: z.number().int().min(0),
  estimated_duration: z.number().positive().optional(),
  lesson_type: z.enum(['text', 'video', 'quiz', 'interactive']).default('text')
})

/**
 * Schema para validação de questões de quiz
 */
export const QuizQuestionSchema = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().optional(),
  module_id: z.string().uuid(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium')
})

/**
 * Schema para resposta da API de LLM (estrutura do curso)
 */
export const LLMCourseResponseSchema = z.object({
  courseTitle: z.string().min(1).max(200),
  courseDescription: z.string().optional(),
  modules: z.array(z.object({
    moduleTitle: z.string().min(1).max(200),
    moduleDescription: z.string().optional(),
    lessons: z.array(z.string().min(1).max(200)).min(1).max(10)
  })).min(1).max(10)
})

/**
 * Schema para resposta da API de LLM (questionário)
 */
export const LLMQuizResponseSchema = z.array(z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().optional()
})).min(1).max(10)

/**
 * Valida dados usando um schema Zod
 */
export function validateData<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  fieldName?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      const field = fieldName || firstError.path.join('.')
      const message = firstError.message
      
      throw new ValidationError(`${field}: ${message}`, field)
    }
    
    throw new ValidationError('Dados inválidos', fieldName)
  }
}

/**
 * Valida e sanitiza dados de entrada de uma requisição
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<T> {
  try {
    const contentType = request.headers.get('content-type')
    
    if (!contentType || !contentType.includes('application/json')) {
      throw new ValidationError('Content-Type deve ser application/json')
    }

    const body = await request.json()
    return validateData(body, schema)
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error
    }
    
    if (error instanceof SyntaxError) {
      throw new ValidationError('JSON inválido no corpo da requisição')
    }
    
    throw new ValidationError('Falha ao processar dados da requisição')
  }
}

/**
 * Valida parâmetros de query string
 */
export function validateQueryParams<T>(
  url: URL,
  schema: z.ZodSchema<T>
): T {
  const params: Record<string, string> = {}
  
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value
  }
  
  return validateData(params, schema, 'query parameters')
}

/**
 * Valida UUID
 */
export function validateUUID(value: string, fieldName: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  if (!uuidRegex.test(value)) {
    throw new ValidationError(`${fieldName} deve ser um UUID válido`, fieldName)
  }
  
  return value
}

/**
 * Valida email
 */
export function validateEmail(email: string): string {
  const emailSchema = z.string().email('Email inválido')
  return validateData(email, emailSchema, 'email')
}

/**
 * Sanitiza string removendo caracteres perigosos
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, '') // Remove caracteres HTML perigosos
    .replace(/\s+/g, ' ') // Normaliza espaços
}

/**
 * Valida se uma string não está vazia após sanitização
 */
export function validateNonEmptyString(value: string, fieldName: string): string {
  const sanitized = sanitizeString(value)
  
  if (!sanitized || sanitized.length === 0) {
    throw new ValidationError(`${fieldName} não pode estar vazio`, fieldName)
  }
  
  return sanitized
}

/**
 * Valida limites de paginação
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

export type PaginationParams = z.infer<typeof PaginationSchema>

/**
 * Valida parâmetros de ordenação
 */
export function createSortSchema<T extends string>(allowedFields: T[]) {
  return z.object({
    sortBy: z.enum(allowedFields as [T, ...T[]]).optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc')
  })
}