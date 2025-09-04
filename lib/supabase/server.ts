import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getEnvVariable } from '../utils/env-validation'
export async function createClient() {
  const cookieStore = await cookies()
  
  // Get environment variables with validation
  const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}