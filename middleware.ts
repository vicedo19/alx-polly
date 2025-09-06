import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { checkAdminAccess } from '@/lib/supabase/admin-middleware'
import { validateEnvVariables } from '@/lib/utils/env-validation';

// Run validation on startup
validateEnvVariables();

export async function middleware(request: NextRequest) {
  // Check if the request is for an admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return await checkAdminAccess(request);
  }
  
  // For all other routes, use the standard session update
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|register|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}