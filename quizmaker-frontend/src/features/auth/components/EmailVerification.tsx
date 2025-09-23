// src/components/EmailVerification.tsx
// ---------------------------------------------------------------------------
// Email verification component for handling email verification after registration
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { AxiosError } from 'axios';

interface EmailVerificationProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface VerificationStatus {
  status: 'pending' | 'verifying' | 'success' | 'error' | 'expired';
  message: string;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Component state
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>({
    status: 'pending',
    message: 'Please check your email and click the verification link.'
  });
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Get token from URL parameters
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  // Handle automatic verification on component mount
  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  // Handle resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Verify email with token
  const verifyEmail = async (verificationToken: string) => {
    setVerificationStatus({
      status: 'verifying',
      message: 'Verifying your email address...'
    });

    try {
      // TODO: Implement actual email verification API call
      // This would typically call an API endpoint like:
      // await authService.verifyEmail({ token: verificationToken });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setVerificationStatus({
        status: 'success',
        message: 'Your email has been successfully verified! You can now log in to your account.'
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Email verification failed. Please try again.';
      
      const status = axiosError.response?.status;
      
      if (status === 400 || status === 410) {
        setVerificationStatus({
          status: 'expired',
          message: 'This verification link has expired. Please request a new one.'
        });
      } else {
        setVerificationStatus({
          status: 'error',
          message: errorMessage
        });
      }
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  // Resend verification email
  const handleResendVerification = async () => {
    if (!email || resendCountdown > 0) return;

    setIsResending(true);

    try {
      // TODO: Implement actual resend verification API call
      // This would typically call an API endpoint like:
      // await authService.resendVerificationEmail({ email });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResendCountdown(60); // 60 second countdown
      setVerificationStatus({
        status: 'pending',
        message: 'Verification email sent! Please check your inbox.'
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Failed to resend verification email. Please try again.';
      
      setVerificationStatus({
        status: 'error',
        message: errorMessage
      });
    } finally {
      setIsResending(false);
    }
  };

  // Render different states based on verification status
  const renderContent = () => {
    switch (verificationStatus.status) {
      case 'verifying':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">Verifying your email</h2>
            <p className="text-theme-text-secondary">{verificationStatus.message}</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-theme-bg-success mb-4">
              <svg className="h-6 w-6 text-theme-interactive-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">Email verified successfully!</h2>
            <p className="text-theme-text-secondary mb-6">{verificationStatus.message}</p>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-primary bg-theme-interactive-primary hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
            >
              Continue to login
            </Link>
          </div>
        );

      case 'error':
      case 'expired':
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-theme-bg-danger mb-4">
              <svg className="h-6 w-6 text-theme-interactive-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
              {verificationStatus.status === 'expired' ? 'Verification link expired' : 'Verification failed'}
            </h2>
            <p className="text-theme-text-secondary mb-6">{verificationStatus.message}</p>
            <div className="space-y-3">
              {email && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCountdown > 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-primary bg-theme-interactive-primary hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-theme-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : resendCountdown > 0 ? (
                    `Resend in ${resendCountdown}s`
                  ) : (
                    'Resend verification email'
                  )}
                </button>
              )}
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-theme-border-primary text-sm font-medium rounded-md text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary"
              >
                Back to login
              </Link>
            </div>
          </div>
        );

      default: // pending
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-theme-bg-info mb-4">
              <svg className="h-6 w-6 text-theme-interactive-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">Check your email</h2>
            <p className="text-theme-text-secondary mb-4">{verificationStatus.message}</p>
            {email && (
              <p className="text-sm text-theme-text-tertiary mb-6">
                We sent a verification link to <strong>{email}</strong>
              </p>
            )}
            <div className="space-y-3">
              {email && (
                <button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCountdown > 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-primary bg-theme-interactive-primary hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-theme-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : resendCountdown > 0 ? (
                    `Resend in ${resendCountdown}s`
                  ) : (
                    'Resend verification email'
                  )}
                </button>
              )}
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-theme-border-primary text-sm font-medium rounded-md text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary"
              >
                Back to login
              </Link>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-theme-bg-primary py-8 px-6 shadow rounded-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default EmailVerification; 