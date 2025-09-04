/**
 * Environment variable validation utility
 * This file provides functions to validate required environment variables
 * and provide helpful error messages when they are missing.
 */

/**
 * Validates that all required environment variables are set
 * @throws Error if any required environment variable is missing
 */
export function validateEnvVariables(): void {
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }
}

/**
 * Gets an environment variable with validation
 * @param key The environment variable key
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 * @throws Error if the environment variable is not set and no default value is provided
 */
export function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Environment variable ${key} is not set`);
  }
  
  return value;
}

/**
 * Gets a public environment variable (NEXT_PUBLIC_*) with validation
 * @param key The environment variable key (without the NEXT_PUBLIC_ prefix)
 * @param defaultValue Optional default value if the environment variable is not set
 * @returns The environment variable value or the default value
 */
export function getPublicEnvVariable(key: string, defaultValue?: string): string {
  const fullKey = `NEXT_PUBLIC_${key}`;
  return getEnvVariable(fullKey, defaultValue);
}