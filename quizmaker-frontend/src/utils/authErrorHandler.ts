// src/utils/authErrorHandler.ts
// ---------------------------------------------------------------------------
// Utility functions for handling authentication errors consistently across components
// ---------------------------------------------------------------------------

import { AxiosError } from 'axios';

/**
 * Checks if an error is an authentication error (401 Unauthorized)
 * @param error - The error to check
 * @returns true if the error is a 401 authentication error
 */
export const isAuthError = (error: unknown): error is AxiosError => {
  return (
    error instanceof Error &&
    'response' in error &&
    (error as AxiosError).response?.status === 401
  );
};

/**
 * Safely extracts error message from axios error, ignoring auth errors
 * @param error - The error to extract message from
 * @returns The error message or null if it's an auth error
 */
export const extractErrorMessage = (error: unknown): string | null => {
  if (isAuthError(error)) {
    // Don't extract message for auth errors - let the interceptor handle them
    return null;
  }

  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message || axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

/**
 * Hook-like function to handle API errors in components
 * Returns the error message only for non-auth errors
 * @param error - The error to handle
 * @param defaultMessage - Default message if no specific message can be extracted
 * @returns The error message or null if it's an auth error
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string | null => {
  if (isAuthError(error)) {
    // Auth errors are handled by the axios interceptor
    // Components should not show error messages for these
    return null;
  }

  const message = extractErrorMessage(error);
  return message || defaultMessage;
};
