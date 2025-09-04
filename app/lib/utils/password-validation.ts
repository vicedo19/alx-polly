/**
 * Password validation utility functions
 */

// Password strength requirements
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_REQUIRES_UPPERCASE = true;
export const PASSWORD_REQUIRES_LOWERCASE = true;
export const PASSWORD_REQUIRES_NUMBER = true;
export const PASSWORD_REQUIRES_SPECIAL = true;

/**
 * Validates password strength based on configurable requirements
 * @param password The password to validate
 * @returns Object containing validation result and error message if any
 */
export function validatePasswordStrength(password: string): { isValid: boolean; error: string | null } {
  // Check minimum length
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    };
  }

  // Check for uppercase letters if required
  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for lowercase letters if required
  if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter',
    };
  }

  // Check for numbers if required
  if (PASSWORD_REQUIRES_NUMBER && !/[0-9]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }

  // Check for special characters if required
  if (PASSWORD_REQUIRES_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character',
    };
  }

  // All checks passed
  return {
    isValid: true,
    error: null,
  };
}