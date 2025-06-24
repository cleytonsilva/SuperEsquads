/**
 * Configurações específicas do Supabase para autenticação
 * Inclui configurações para verificação de email e callbacks
 */

export const supabaseConfig = {
  auth: {
    redirectTo: {
      emailConfirmation: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      passwordReset: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      defaultLogin: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      error: `${process.env.NEXT_PUBLIC_APP_URL}/auth?error=true`
    },
    email: {
      tokenExpiryTime: 3600, // 1 hora
      allowMultipleConfirmations: false
    },
    settings: {
      autoConfirmEmail: false,
      sessionTimeout: 86400 // 24 horas
    },
    allowedRedirectUrls: [
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      `${process.env.NEXT_PUBLIC_APP_URL}/auth`
    ]
  }
};

/**
 * Configurações de tabelas do banco de dados
 */
export const databaseConfig = {
  tables: {
    profiles: 'profiles',
    courses: 'courses',
    enrollments: 'enrollments',
    lessons: 'lessons',
    progress: 'progress',
    achievements: 'achievements',
    notifications: 'notifications'
  },
  policies: {
    enableRLS: true,
    defaultPolicies: {
      select: 'authenticated',
      insert: 'authenticated',
      update: 'own_record',
      delete: 'own_record'
    }
  }
};

/**
 * Configurações de storage
 */
export const storageConfig = {
  buckets: {
    avatars: 'avatars',
    courseContent: 'course-content',
    certificates: 'certificates',
    uploads: 'uploads'
  },
  policies: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/webp'],
      videos: ['video/mp4', 'video/webm'],
      documents: ['application/pdf', 'text/plain']
    }
  }
};

/**
 * Configurações de real-time
 */
export const realtimeConfig = {
  channels: {
    notifications: 'notifications',
    progress: 'progress',
    chat: 'chat'
  },
  events: {
    INSERT: 'INSERT',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
  }
};