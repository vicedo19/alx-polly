import { createBrowserClient } from '@supabase/ssr';
import { getEnvVariable } from '../utils/env-validation';

export function createClient() {
  // Get environment variables with validation
  const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
