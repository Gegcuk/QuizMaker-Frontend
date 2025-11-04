// src/components/ForgotPasswordForm.tsx
// ---------------------------------------------------------------------------
// Password recovery form component for requesting password reset
// ---------------------------------------------------------------------------

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { Button } from '@/components';

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface FormErrors {
  email?: string;
  general?: string;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSuccess,
  onError,
  className = ''
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Clear specific field error when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    return newErrors;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    clearFieldError('email');
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
      // TODO: Implement actual password reset request
      // This would typically call an API endpoint like:
      // await authService.forgotPassword({ email: email.trim() });
      
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
        'Failed to send password reset email. Please try again.';
      
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
                Password reset email sent
              </h3>
              <div className="mt-2 text-sm text-theme-interactive-success">
                <p>
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your email and follow the instructions to reset your password.
                </p>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsSubmitted(false)}
                >
                  Send another email
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary">Forgot your password?</h2>
        <p className="mt-2 text-sm text-theme-text-secondary">
          Enter your email address and we'll send you a link to reset your password.
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

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-theme-text-secondary">
            Email Address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary placeholder-theme-text-tertiary focus:outline-none focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm ${
                errors.email ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              value={email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-theme-interactive-danger">{errors.email}</p>
          )}
        </div>

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
            {isSubmitting ? 'Sending...' : 'Send reset link'}
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

export default ForgotPasswordForm; 