// Authentication utilities for Edge Functions
// Utilitários de autenticação para Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AuthorizationError } from './errors.ts'

/**
 * Validates JWT token and returns user information
 * @param authHeader - Authorization header with Bearer token
 * @param supabase - Supabase client instance
 * @returns User object if valid
 * @throws AuthorizationError if invalid
 */
export async function validateUser(authHeader: string, supabase: any) {
  try {
    // Extract token from "Bearer <token>" format
    const token = authHeader.replace('Bearer ', '')
    
    if (!token) {
      throw new AuthorizationError('Token de acesso não fornecido')
    }

    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new AuthorizationError('Token de acesso inválido ou expirado')
    }

    return user
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error
    }
    throw new AuthorizationError('Erro na validação do token de acesso')
  }
}

/**
 * Validates admin permissions for the authenticated user
 * @param authHeader - Authorization header with Bearer token
 * @param supabase - Supabase client instance
 * @returns User object if valid admin
 * @throws AuthorizationError if not admin
 */
export async function validateAdmin(authHeader: string, supabase: any) {
  const user = await validateUser(authHeader, supabase)
  
  // Check if user has admin role in profiles table
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    throw new AuthorizationError('Perfil de usuário não encontrado')
  }
  
  if (profile.role !== 'admin') {
    throw new AuthorizationError('Acesso negado. Permissões de administrador necessárias.')
  }
  
  return user
}

/**
 * Validates instructor permissions for the authenticated user
 * @param authHeader - Authorization header with Bearer token
 * @param supabase - Supabase client instance
 * @returns User object if valid instructor
 * @throws AuthorizationError if not instructor
 */
export async function validateInstructor(authHeader: string, supabase: any) {
  const user = await validateUser(authHeader, supabase)
  
  // Check if user has instructor or admin role
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (error || !profile) {
    throw new AuthorizationError('Perfil de usuário não encontrado')
  }
  
  if (!['instructor', 'admin'].includes(profile.role)) {
    throw new AuthorizationError('Acesso negado. Permissões de instrutor necessárias.')
  }
  
  return user
}

/**
 * Checks if user has permission to access a specific course
 * @param userId - User ID to check
 * @param courseId - Course ID to check access for
 * @param supabase - Supabase client instance
 * @returns boolean indicating access permission
 */
export async function hasAccessToCourse(userId: string, courseId: string, supabase: any): Promise<boolean> {
  try {
    // Check if user is enrolled in the course
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single()
    
    if (!error && enrollment) {
      return true
    }
    
    // Check if user is the course creator or admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (!profileError && profile && ['admin', 'instructor'].includes(profile.role)) {
      return true
    }
    
    // Check if user created the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('created_by')
      .eq('id', courseId)
      .single()
    
    if (!courseError && course && course.created_by === userId) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error checking course access:', error)
    return false
  }
}