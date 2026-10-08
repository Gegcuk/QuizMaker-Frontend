import type { ProblemDetails } from '@/types';
import { getSafeErrorMessage, toApplicationError, type ErrorCategory } from './applicationError';

export const getErrorMessage = getSafeErrorMessage;

export function isProblemDetails(data: unknown): data is ProblemDetails {
  if (!data || typeof data !== 'object') return false;
  const value = data as Record<string, unknown>;
  return typeof value.status === 'number' && Number.isInteger(value.status)
    && value.status >= 400 && value.status <= 599 && typeof value.title === 'string';
}

export function formatProblemDetails(problem: ProblemDetails): string {
  return getSafeErrorMessage({ response: { status: problem.status, data: problem } });
}

export function getErrorTitle(error: unknown): string {
  const titles: Record<ErrorCategory, string> = {
    validation: 'Invalid input', authentication: 'Sign-in required',
    authorization: 'Access denied', 'not-found': 'Item not found',
    conflict: 'Conflict', gone: 'Item unavailable', precondition: 'Item changed',
    'rate-limit': 'Too many requests', server: 'Service unavailable',
    offline: 'Offline', network: 'Connection problem', timeout: 'Request timed out',
    cancelled: 'Request cancelled', unexpected: 'Something went wrong',
  };
  return titles[toApplicationError(error).category];
}

export function getValidationErrors(error: unknown): Record<string, string[]> | undefined {
  return toApplicationError(error).fieldErrors;
}

export function isErrorStatus(error: unknown, status: number): boolean {
  return toApplicationError(error).status === status;
}

export const isValidationError = (error: unknown): boolean =>
  isErrorStatus(error, 400) || isErrorStatus(error, 422);
export const isAuthenticationError = (error: unknown): boolean => isErrorStatus(error, 401);
export const isAuthorizationError = (error: unknown): boolean => isErrorStatus(error, 403);
export const isNotFoundError = (error: unknown): boolean => isErrorStatus(error, 404);
export const isConflictError = (error: unknown): boolean => isErrorStatus(error, 409);
