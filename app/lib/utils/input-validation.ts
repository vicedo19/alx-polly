/**
 * Input validation and sanitization utilities for poll creation and updates
 */

import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

/**
 * Validates and sanitizes a poll question
 * @param question The poll question to validate
 * @returns ValidationResult object
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
 * Validates and sanitizes poll options
 * @param options Array of poll options to validate
 * @returns ValidationResult object
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