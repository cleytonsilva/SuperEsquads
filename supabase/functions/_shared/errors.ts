// Error handling utilities for Edge Functions
// Utilitários de tratamento de erros para Edge Functions

/**
 * Base class for application errors
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number
  abstract readonly code: string
  abstract readonly isOperational: boolean

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message)
    this.name = this.constructor.name
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Validation error - 400 Bad Request
 */
export class ValidationError extends AppError {
  readonly statusCode = 400
  readonly code = 'VALIDATION_ERROR'
  readonly isOperational = true
}

/**
 * Authorization error - 401 Unauthorized
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 401
  readonly code = 'AUTHORIZATION_ERROR'
  readonly isOperational = true
}

/**
 * Not found error - 404 Not Found
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly code = 'NOT_FOUND_ERROR'
  readonly isOperational = true
}

/**
 * Conflict error - 409 Conflict
 */
export class ConflictError extends AppError {
  readonly statusCode = 409
  readonly code = 'CONFLICT_ERROR'
  readonly isOperational = true
}

/**
 * Rate limit error - 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly code = 'RATE_LIMIT_ERROR'
  readonly isOperational = true
}

/**
 * Internal server error - 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500
  readonly code = 'INTERNAL_SERVER_ERROR'
  readonly isOperational = false
}

/**
 * External service error - 502 Bad Gateway
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502
  readonly code = 'EXTERNAL_SERVICE_ERROR'
  readonly isOperational = true
}

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  error: string
  code: string
  timestamp: string
  path?: string
  context?: Record<string, any>
}

/**
 * Creates a standardized error response
 * @param error - The error object
 * @param path - Optional request path
 * @returns Standardized error response
 */
export function createErrorResponse(error: AppError, path?: string): ErrorResponse {
  return {
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    path,
    context: error.context
  }
}

/**
 * Logs error with structured format
 * @param error - The error to log
 * @param context - Additional context information
 */
export function logError(error: Error, context?: Record<string, any>) {
  const logData = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  }
  
  if (error instanceof AppError) {
    logData.code = error.code
    logData.statusCode = error.statusCode
    logData.isOperational = error.isOperational
    logData.errorContext = error.context
  }
  
  console.error('🚨 Error occurred:', JSON.stringify(logData, null, 2))
}

/**
 * Wraps async functions to catch and handle errors consistently
 * @param fn - The async function to wrap
 * @returns Wrapped function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AppError) {
        logError(error)
        throw error
      }
      
      // Convert unknown errors to InternalServerError
      const internalError = new InternalServerError(
        'An unexpected error occurred',
        { originalError: error.message }
      )
      
      logError(internalError, { originalError: error })
      throw internalError
    }
  }
}