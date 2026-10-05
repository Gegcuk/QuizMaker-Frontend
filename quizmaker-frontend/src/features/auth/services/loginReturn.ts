import { validateOAuthReturnPath } from './oauthPkce';

// Router state carries one destination without putting it in the login URL or
// adding a second persistent auth record. Replacing login consumes that state.
export const getLoginReturnPath = (state: unknown): string => {
  const returnTo = state && typeof state === 'object' && 'returnTo' in state
    ? state.returnTo : undefined;
  return validateOAuthReturnPath(typeof returnTo === 'string' ? returnTo : undefined, window.location.origin);
};
