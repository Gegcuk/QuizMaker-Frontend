import { isErrorStatus, getErrorMessage } from './errorUtils';

/** Authentication errors continue to be handled by the shared auth flow. */
export const isAuthError = (error: unknown): boolean => isErrorStatus(error, 401);

export const extractErrorMessage = (error: unknown): string | null =>
  isAuthError(error) ? null : getErrorMessage(error);

export const handleApiError = (
  error: unknown,
  defaultMessage = 'An error occurred',
): string | null => {
  if (isAuthError(error)) return null;
  return error == null ? defaultMessage : getErrorMessage(error);
};
