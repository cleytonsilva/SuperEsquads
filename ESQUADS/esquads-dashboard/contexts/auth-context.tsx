'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User as SupabaseUser } from '@supabase/supabase-js'

export type UserRole = "student" | "admin" | "instructor"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  joinDate: string
  lastLogin: string
  needsProfileSetup?: boolean
  // Campos do Supabase
  supabaseUser?: SupabaseUser
  // Permissões específicas
  permissions?: {
    canAccessAdmin: boolean
    canManageUsers: boolean
    canCreateCourses: boolean
    canViewAnalytics: boolean
  }
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  signOut: () => Promise<void> // Alias para logout
  switchRole: (role: UserRole) => void
  isLoading: boolean
  needsProfileSetup: boolean
  userRole: UserRole | null
  // Métodos do Supabase
  signUp: (signUpData: {
    email: string
    password: string
    fullName?: string
    role?: string
  }) => Promise<{ success: boolean; data?: any; message?: string }>
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>
  // Verificações de permissão
  hasPermission: (permission: keyof User['permissions']) => boolean
  canAccessAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setIsLoading(false)
          return
        }

        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setNeedsProfileSetup(false)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      // Buscar perfil do usuário na tabela profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading profile:', error)
        return
      }

      // Se não há perfil, marcar para setup
      if (!profile) {
        setNeedsProfileSetup(true)
        setUser({
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Usuário',
          email: supabaseUser.email || '',
          role: 'student',
          joinDate: supabaseUser.created_at || new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          needsProfileSetup: true,
          supabaseUser,
          permissions: {
            canAccessAdmin: false,
            canManageUsers: false,
            canCreateCourses: false,
            canViewAnalytics: false
          }
        })
        return
      }

      // Definir permissões baseadas no role
      const permissions = {
        canAccessAdmin: profile.role === 'admin',
        canManageUsers: profile.role === 'admin',
        canCreateCourses: ['admin', 'instructor'].includes(profile.role),
        canViewAnalytics: ['admin', 'instructor'].includes(profile.role)
      }

      setUser({
        id: profile.id,
        name: profile.full_name || profile.display_name || supabaseUser.email?.split('@')[0] || 'Usuário',
        email: profile.email || supabaseUser.email || '',
        role: profile.role || 'student',
        avatar: profile.avatar_url,
        joinDate: profile.created_at || supabaseUser.created_at || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        needsProfileSetup: false,
        supabaseUser,
        permissions
      })
      
      setNeedsProfileSetup(false)
    } catch (error) {
      console.error('Error in loadUserProfile:', error)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        await loadUserProfile(data.user)
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (signUpData: {
    email: string
    password: string
    fullName?: string
    role?: string
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            role: signUpData.role || 'student'
          }
        }
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { 
        success: true, 
        data, 
        message: 'Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.' 
      }
    } catch (error) {
      console.error('SignUp error:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        throw error
      }
      setUser(null)
      setNeedsProfileSetup(false)
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  const signOut = logout // Alias

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { 
        success: true, 
        message: 'Email de recuperação enviado! Verifique sua caixa de entrada.' 
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      }
    }
  }

  const switchRole = (role: UserRole) => {
    if (user) {
      const permissions = {
        canAccessAdmin: role === 'admin',
        canManageUsers: role === 'admin',
        canCreateCourses: ['admin', 'instructor'].includes(role),
        canViewAnalytics: ['admin', 'instructor'].includes(role)
      }

      setUser({
        ...user,
        role,
        permissions
      })
    }
  }

  const hasPermission = (permission: keyof User['permissions']) => {
    return user?.permissions?.[permission] || false
  }

  const canAccessAdmin = () => {
    return hasPermission('canAccessAdmin')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    signOut,
    signUp,
    resetPassword,
    switchRole,
    isLoading,
    needsProfileSetup,
    userRole: user?.role || null,
    hasPermission,
    canAccessAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}