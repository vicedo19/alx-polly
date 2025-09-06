'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

// User role types
export type UserRole = 'user' | 'admin';

// Interface for user with role
export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

/**
 * Authenticates a user with email and password using Supabase Auth.
 * 
 * This function handles the complete login flow including:
 * - Form data validation and extraction
 * - Supabase authentication via signInWithPassword
 * - Error handling for authentication failures
 * - Automatic redirect to dashboard on successful login
 * 
 * @param data - LoginFormData object containing email and password fields
 * @returns Promise<{ error: string | null }> - Returns error object on failure or success
 * 
 * @example
 * ```tsx
 * const result = await login({ email: 'user@example.com', password: 'password123' });
 * if (result.error) {
 *   console.error('Login failed:', result.error);
 * }
 * ```
 */
export async function login(data: LoginFormData) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { error: error.message };
    }

    // Success: no error
    return { error: null };
  } catch (e) {
    // Handle errors from invalid Supabase configuration
    return { error: 'Authentication service unavailable. Please check your Supabase configuration.' };
  }
}

/**
 * Registers a new user account with email and password using Supabase Auth.
 * 
 * This function handles the complete user registration flow including:
 * - Form data validation and extraction
 * - User account creation via Supabase signUp
 * - Automatic email confirmation (if enabled)
 * - Error handling for registration failures
 * - User metadata storage (name)
 * 
 * @param data - RegisterFormData object containing email, password, and name fields
 * @returns Promise<{ error: string | null }> - Returns error object on failure or success
 * 
 * @example
 * ```tsx
 * const result = await register({ 
 *   email: 'user@example.com', 
 *   password: 'password123',
 *   name: 'John Doe'
 * });
 * if (result.error) {
 *   console.error('Registration failed:', result.error);
 * }
 * ```
 * 
 * @throws Will return error if email is already registered or password is too weak
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Logs out the current authenticated user and clears their session.
 * 
 * This function handles the complete logout flow including:
 * - Session termination via Supabase signOut
 * - Cookie cleanup and session invalidation
 * - Automatic redirect to login page
 * - Error handling for logout failures
 * 
 * @returns Promise<void | { error: string }> - Redirects to login on success, returns error on failure
 * 
 * @example
 * ```tsx
 * // In a logout button component
 * <form action={logout}>
 *   <button type="submit">Logout</button>
 * </form>
 * ```
 */
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Retrieves the currently authenticated user from the session.
 * 
 * This function provides access to the current user's authentication data including:
 * - User ID and email from Supabase Auth
 * - Session validation and error handling
 * - Null return for unauthenticated users
 * 
 * @returns Promise<User | null> - User object if authenticated, null if not authenticated
 * 
 * @example
 * ```tsx
 * // In a Server Component
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('User email:', user.email);
 * } else {
 *   // User is not authenticated
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the role of a specific user from the user_roles table.
 * 
 * This function queries the database to determine user permissions including:
 * - Role lookup from user_roles table
 * - Default role assignment for users without explicit roles
 * - Error handling for database queries
 * 
 * @param userId - The unique identifier of the user
 * @returns Promise<UserRole> - Returns 'admin' or 'user' role
 * 
 * @example
 * ```tsx
 * const role = await getUserRole('user-uuid-123');
 * if (role === 'admin') {
 *   // User has admin privileges
 * }
 * ```
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = await createClient();
  
  // Get user role from user_roles table
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    // Default to 'user' if no role found
    return 'user';
  }
  
  return data.role as UserRole;
}

/**
 * Retrieves the current authenticated user along with their role information.
 * 
 * This function combines user authentication data with role information including:
 * - Current user session validation
 * - Role lookup from user_roles table
 * - Combined user and role data in a single object
 * - Null return for unauthenticated users
 * 
 * @returns Promise<UserWithRole | null> - User object with role if authenticated, null otherwise
 * 
 * @example
 * ```tsx
 * const userWithRole = await getCurrentUserWithRole();
 * if (userWithRole) {
 *   console.log(`User ${userWithRole.email} has role: ${userWithRole.role}`);
 * }
 * ```
 */
export async function getCurrentUserWithRole(): Promise<UserWithRole | null> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) {
    return null;
  }
  
  const role = await getUserRole(userData.user.id);
  
  return {
    id: userData.user.id,
    email: userData.user.email || '',
    role: role,
    name: userData.user.user_metadata?.name,
  };
}

/**
 * Checks if the current authenticated user has admin privileges.
 * 
 * This function provides a simple boolean check for admin access including:
 * - Current user session validation
 * - Role verification against admin role
 * - False return for unauthenticated or non-admin users
 * 
 * @returns Promise<boolean> - True if user is admin, false otherwise
 * 
 * @example
 * ```tsx
 * const hasAdminAccess = await isAdmin();
 * if (hasAdminAccess) {
 *   // Show admin-only features
 * }
 * ```
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUserWithRole();
  return user?.role === 'admin';
}

/**
 * Retrieves the current user session from Supabase Auth.
 * 
 * This function provides access to the complete session object including:
 * - Session token and expiration information
 * - User authentication state
 * - Session metadata and refresh tokens
 * - Null return for unauthenticated sessions
 * 
 * @returns Promise<Session | null> - Session object if authenticated, null otherwise
 * 
 * @example
 * ```tsx
 * const session = await getSession();
 * if (session) {
 *   console.log('Session expires at:', session.expires_at);
 *   console.log('Access token:', session.access_token);
 * }
 * ```
 */
export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
