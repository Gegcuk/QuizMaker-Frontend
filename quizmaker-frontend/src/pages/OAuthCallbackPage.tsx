// src/pages/OAuthCallbackPage.tsx
// ---------------------------------------------------------------------------
// OAuth callback handler page
// Handles the redirect from OAuth providers after authentication
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { getAccessToken } from '@/utils';
import { Seo } from '@/features/seo';
import { OAuthExchangeError } from '@/features/auth/services/oauthExchange';
import {
  OAuthCallbackError,
  processLegacyOAuthCallbackForTestOnce,
  processOAuthCallbackOnce,
} from '@/features/auth/services/oauthCallback';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let active = true;
    let redirectTimer: number | undefined;

    const showFailure = (message: string) => {
      if (!active) return;
      setStatus('error');
      setErrorMessage(message);
      redirectTimer = window.setTimeout(() => navigate('/login', { replace: true }), 3000);
    };

    const completeAuthentication = async (redirectTo: string) => {
      await checkAuthStatus();
      if (!getAccessToken()) {
        throw new Error('Current-user validation failed');
      }
      if (!active) return;
      setStatus('success');
      redirectTimer = window.setTimeout(
        () => navigate(redirectTo, { replace: true }),
        1500,
      );
    };

    const handleCallback = async () => {
      try {
        const legacyResult = await processLegacyOAuthCallbackForTestOnce();
        if (!active) return;
        if (legacyResult) {
          await completeAuthentication(legacyResult.returnPath);
          return;
        }

        const result = await processOAuthCallbackOnce();
        if (!active) return;
        await completeAuthentication(result.returnPath);
      } catch (error) {
        const message = error instanceof OAuthCallbackError || error instanceof OAuthExchangeError
          ? error.message
          : 'Failed to complete authentication. Please restart sign-in.';
        showFailure(message);
      }
    };

    handleCallback();

    return () => {
      active = false;
      if (redirectTimer !== undefined) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [navigate, checkAuthStatus]);

  return (
    <>
      <Seo
        title="Completing sign in… | Quizzence"
        description="Completing OAuth sign-in and redirecting you to your Quizzence account."
        canonicalPath="/oauth/callback"
        ogType="website"
        noindex
      />
      <div className="min-h-screen bg-theme-bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              {status === 'processing' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-interactive-primary bg-opacity-10 mb-4">
                  <svg
                    className="animate-spin h-8 w-8 text-theme-interactive-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                  Completing sign in...
                </h2>
                <p className="text-sm text-theme-text-secondary">
                  Please wait while we complete your authentication
                </p>
              </>
            )}

              {status === 'success' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-bg-success mb-4">
                  <svg
                    className="h-8 w-8 text-theme-status-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                  Success!
                </h2>
                <p className="text-sm text-theme-text-secondary">
                  You've been signed in successfully. Redirecting...
                </p>
              </>
            )}

              {status === 'error' && (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-bg-danger mb-4">
                  <svg
                    className="h-8 w-8 text-theme-status-danger"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                  Authentication Failed
                </h2>
                <p className="text-sm text-theme-text-secondary">
                  {errorMessage}
                </p>
                <p className="text-xs text-theme-text-tertiary mt-2">
                  Redirecting to login page...
                </p>
              </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OAuthCallbackPage;
