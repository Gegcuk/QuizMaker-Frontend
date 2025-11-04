// src/components/ResetPasswordForm.tsx
// ---------------------------------------------------------------------------
// Password reset form component for setting new password with reset token
// ---------------------------------------------------------------------------

import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { Button, Input } from '@/components';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
  token?: string;
  general?: string;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get token from URL parameters
  const token = searchParams.get('token');

  // Check if token is present on component mount
  useEffect(() => {
    if (!token) {
      setErrors({ token: 'Invalid or missing reset token. Please request a new password reset.' });
    }
  }, [token]);

  // Password strength validation
  const validatePasswordStrength = (password: string): string[] => {
    const issues: string[] = [];
    
    if (password.length < 8) {
      issues.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      issues.push('At least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      issues.push('At least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      issues.push('At least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      issues.push('At least one special character');
    }
    
    return issues;
  };

  // Clear specific field error when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Token validation
    if (!token) {
      newErrors.token = 'Invalid or missing reset token';
      return newErrors;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordIssues = validatePasswordStrength(password);
      if (passwordIssues.length > 0) {
        newErrors.password = `Password must contain: ${passwordIssues.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  // Handle password change
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    clearFieldError('password');
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    clearFieldError('confirmPassword');
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual password reset API call
      // This would typically call an API endpoint like:
      // await authService.resetPassword({ 
      //   token: token!, 
      //   newPassword: password 
      // });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Show success state
      setIsSubmitted(true);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Failed to reset password. Please try again.';
      
      setErrors({ general: errorMessage });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If form was successfully submitted, show success message
  if (isSubmitted) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="bg-theme-bg-success border border-theme-border-success rounded-md p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-theme-interactive-success">
                Password reset successful
              </h3>
              <div className="mt-2 text-sm text-theme-interactive-success">
                <p>
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/login">
            <Button
              type="button"
              variant="primary"
              size="md"
            >
              Continue to login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If token is invalid, show error message
  if (!token) {
    return (
      <div className={`max-w-md mx-auto ${className}`}>
        <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-theme-interactive-danger">
                Invalid reset link
              </h3>
              <div className="mt-2 text-sm text-theme-interactive-danger">
                <p>
                  This password reset link is invalid or has expired. Please request a new password reset.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/forgot-password">
            <Button
              type="button"
              variant="primary"
              size="md"
            >
              Request new reset link
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary">Reset your password</h2>
        <p className="mt-2 text-sm text-theme-text-secondary">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* General error display */}
        {errors.general && (
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-theme-interactive-danger" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-theme-interactive-danger">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        {/* Password field */}
        <Input
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          label="New Password"
          autoComplete="new-password"
          required
          fullWidth
          value={password}
          onChange={handlePasswordChange}
          disabled={isSubmitting}
          placeholder="Enter your new password"
          error={errors.password}
          rightIconClickable={true}
          rightIcon={
            <button
              type="button"
              className="text-theme-text-tertiary hover:text-theme-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-interactive-primary rounded p-0.5"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-1.654 0-3.188-.429-4.53-1.181m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
        />

        {/* Confirm Password field */}
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm New Password"
          autoComplete="new-password"
          required
          fullWidth
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          disabled={isSubmitting}
          placeholder="Confirm your new password"
          error={errors.confirmPassword}
          rightIconClickable={true}
          rightIcon={
            <button
              type="button"
              className="text-theme-text-tertiary hover:text-theme-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-interactive-primary rounded p-0.5"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-1.654 0-3.188-.429-4.53-1.181m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          }
        />

        {/* Submit button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Resetting password...' : 'Reset password'}
          </Button>
        </div>

        {/* Back to login link */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm; 