import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('🚨 Missing Supabase environment variables:', { url: !!url, key: !!key })
    throw new Error('Variáveis de ambiente do Supabase não configuradas')
  }
  
  console.log('🔧 Creating Supabase client:', { 
    url, 
    keyLength: key.length,
    keyPrefix: key.substring(0, 20) + '...' 
  })
  
  return createBrowserClient(url, key, {
    auth: {
      debug: process.env.NODE_ENV === 'development',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}