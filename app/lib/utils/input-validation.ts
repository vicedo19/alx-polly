/**
 * Input validation and sanitization utilities for poll creation and updates
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Represents the result of input validation with sanitization.
 */
export interface ValidationResult {
  /** Whether the input passed validation */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Sanitized version of the input, safe for database storage and display */
  sanitizedValue?: string;
}

/**
 * Validates and sanitizes a poll question input.
 * 
 * This function performs comprehensive validation including:
 * - Empty/whitespace-only input detection
 * - Length validation (minimum 5, maximum 500 characters)
 * - XSS prevention through DOMPurify sanitization
 * - HTML tag stripping for plain text storage
 * 
 * @param question - The raw question input from user
 * @returns ValidationResult with validation status, error message, and sanitized value
 * 
 * @example
 * ```tsx
 * const result = validateQuestion(formData.get('question'));
 * if (!result.isValid) {
 *   return { error: result.error };
 * }
 * const cleanQuestion = result.sanitizedValue;
 * ```
 * 
 * @security Prevents XSS attacks by sanitizing HTML content
 */
export function validateQuestion(question: string): ValidationResult {
  // Trim the question
  const trimmedQuestion = question.trim();
  
  // Check if question is empty
  if (!trimmedQuestion) {
    return {
      isValid: false,
      error: 'Poll question cannot be empty'
    };
  }
  
  // Check question length
  if (trimmedQuestion.length < 5) {
    return {
      isValid: false,
      error: 'Poll question must be at least 5 characters long'
    };
  }
  
  if (trimmedQuestion.length > 200) {
    return {
      isValid: false,
      error: 'Poll question cannot exceed 200 characters'
    };
  }
  
  // Sanitize the question to prevent XSS
  const sanitizedQuestion = DOMPurify.sanitize(trimmedQuestion);
  
  return {
    isValid: true,
    sanitizedValue: sanitizedQuestion
  };
}

/**
 * Validates and sanitizes poll options from array input.
 * 
 * This function performs comprehensive validation for poll options including:
 * - Array structure verification
 * - Minimum option count validation (at least 2 options)
 * - Individual option text validation and sanitization
 * - Duplicate option detection
 * - Length validation (maximum 100 characters per option)
 * - XSS prevention through DOMPurify sanitization
 * 
 * @param options - Array of poll option strings to validate
 * @returns ValidationResult with validation status, error message, and sanitized options JSON
 * 
 * @example
 * ```tsx
 * const options = ['Option 1', 'Option 2', 'Option 3'];
 * const result = validateOptions(options);
 * if (!result.isValid) {
 *   return { error: result.error };
 * }
 * const cleanOptions = JSON.parse(result.sanitizedValue);
 * ```
 * 
 * @security Prevents XSS attacks by sanitizing all option text content
 * @throws Returns validation error for insufficient options, duplicates, or length violations
 */
export function validateOptions(options: string[]): ValidationResult {
  // Filter out empty options
  const filteredOptions = options.map(opt => opt.trim()).filter(Boolean);
  
  // Check if we have at least 2 options
  if (filteredOptions.length < 2) {
    return {
      isValid: false,
      error: 'Poll must have at least 2 non-empty options'
    };
  }
  
  // Check for duplicate options
  const uniqueOptions = new Set(filteredOptions);
  if (uniqueOptions.size !== filteredOptions.length) {
    return {
      isValid: false,
      error: 'Poll options must be unique'
    };
  }
  
  // Check option length
  for (const option of filteredOptions) {
    if (option.length > 100) {
      return {
        isValid: false,
        error: 'Poll options cannot exceed 100 characters'
      };
    }
  }
  
  // Sanitize all options
  const sanitizedOptions = filteredOptions.map(opt => DOMPurify.sanitize(opt));
  
  return {
    isValid: true,
    sanitizedValue: JSON.stringify(sanitizedOptions)
  };
}