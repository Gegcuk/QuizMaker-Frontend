// src/pages/OAuthCallbackPage.tsx
// ---------------------------------------------------------------------------
// OAuth callback handler page
// Handles the redirect from OAuth providers after authentication
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { setTokens } from '@/utils';

const OAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if there's an error from the OAuth provider
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || 'Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // According to the backend API docs, JWT tokens are returned in URL query parameters
        const accessToken = searchParams.get('accessToken') || searchParams.get('access_token');
        const refreshToken = searchParams.get('refreshToken') || searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Store tokens in localStorage
          setTokens(accessToken, refreshToken);
          
          // Fetch user info to update auth context
          await checkAuthStatus();
          
          setStatus('success');
          
          // Redirect to the intended destination or default to /my-quizzes
          const redirectTo = sessionStorage.getItem('oauth_redirect') || '/my-quizzes';
          sessionStorage.removeItem('oauth_redirect');
          
          setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
        } else {
          // No tokens found in URL - this shouldn't happen
          setStatus('error');
          setErrorMessage('No authentication tokens received. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('Failed to complete authentication. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, checkAuthStatus]);

  return (
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
  );
};

export default OAuthCallbackPage;

