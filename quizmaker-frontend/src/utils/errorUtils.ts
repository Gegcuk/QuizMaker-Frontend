// src/utils/errorUtils.ts
// ---------------------------------------------------------------------------
// Utility functions for handling API errors and ProblemDetails
// ---------------------------------------------------------------------------

import type { ProblemDetails } from '@/types';

/**
 * Extract user-friendly error message from various error formats
 * Supports: ProblemDetails (RFC 7807), standard API errors, and generic errors
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Check if it's an Axios error with response data
  if (error.response?.data) {
    const data = error.response.data;

    // RFC 7807 Problem Details format
    if (isProblemDetails(data)) {
      return formatProblemDetails(data);
    }

    // Legacy format with 'message' field
    if (data.message) {
      return data.message;
    }

    // Legacy format with 'error' field
    if (data.error) {
      return data.error;
    }
  }

  // Direct Error object or string
  if (error.message) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error response is RFC 7807 Problem Details
 */
export function isProblemDetails(data: any): data is ProblemDetails {
  return (
    data &&
    typeof data === 'object' &&
    'status' in data &&
    'title' in data
  );
}

/**
 * Format ProblemDetails into user-friendly message
 * Prioritizes detail over title for better context
 */
export function formatProblemDetails(problem: ProblemDetails): string {
  // Prefer detail (more specific) over title (generic)
  return problem.detail || problem.title;
}

/**
 * Extract error title from ProblemDetails or generate one from message
 */
export function getErrorTitle(error: any): string | undefined {
  if (!error) return undefined;

  // Check if it's an Axios error with ProblemDetails
  if (error.response?.data && isProblemDetails(error.response.data)) {
    return error.response.data.title;
  }

  return undefined;
}

/**
 * Extract validation errors from ProblemDetails
 */
export function getValidationErrors(error: any): Record<string, string[]> | undefined {
  if (!error) return undefined;

  // Check if it's an Axios error with ProblemDetails
  if (error.response?.data && isProblemDetails(error.response.data)) {
    return error.response.data.errors;
  }

  // Legacy format
  if (error.response?.data?.details) {
    return error.response.data.details;
  }

  return undefined;
}

/**
 * Check if error is a specific HTTP status
 */
export function isErrorStatus(error: any, status: number): boolean {
  return error?.response?.status === status || error?.status === status;
}

/**
 * Check if error is validation error (400)
 */
export function isValidationError(error: any): boolean {
  return isErrorStatus(error, 400);
}

/**
 * Check if error is authentication error (401)
 */
export function isAuthenticationError(error: any): boolean {
  return isErrorStatus(error, 401);
}

/**
 * Check if error is authorization error (403)
 */
export function isAuthorizationError(error: any): boolean {
  return isErrorStatus(error, 403);
}

/**
 * Check if error is not found error (404)
 */
export function isNotFoundError(error: any): boolean {
  return isErrorStatus(error, 404);
}

/**
 * Check if error is conflict error (409)
 */
export function isConflictError(error: any): boolean {
  return isErrorStatus(error, 409);
}

