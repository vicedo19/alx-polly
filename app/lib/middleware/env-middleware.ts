/**
 * Environment variable validation middleware
 * This middleware runs at application startup to validate all required environment variables
 */

import { validateEnvVariables } from '@/lib/utils/env-validation';

// Run validation at startup
try {
  validateEnvVariables();
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Environment variables validated successfully');
  }
} catch (error) {
  // In production, don't expose detailed error messages
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Environment variable validation failed:', error.message);
  } else {
    console.error('Environment variable validation failed. Check required variables.');
  }
  
  // In production, exit the process if env variables are missing
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}