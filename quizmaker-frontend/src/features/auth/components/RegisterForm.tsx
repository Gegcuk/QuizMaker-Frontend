// src/components/RegisterForm.tsx
// ---------------------------------------------------------------------------
// Enhanced registration form component with comprehensive validation and error handling
// Based on RegisterRequest type from auth.types.ts
// ---------------------------------------------------------------------------

import React, { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { RegisterRequest } from '@/types';
import type { AxiosError } from 'axios';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/login',
  className = ''
}) => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState<RegisterRequest>({
    username: '',
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Clear specific field error when user starts typing
  const clearFieldError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
  };

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // Validation function
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    } else if (formData.username.trim().length > 20) {
      newErrors.username = 'Username must be no more than 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordIssues = validatePasswordStrength(formData.password);
      if (passwordIssues.length > 0) {
        newErrors.password = `Password must contain: ${passwordIssues.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms acceptance validation
    if (!acceptTerms) {
      newErrors.general = 'You must accept the terms and conditions';
    }

    return newErrors;
  };

  // Handle input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name as keyof FormErrors);
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
      await register(formData);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to redirect path
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Registration failed. Please try again.';
      
      setErrors({ general: errorMessage });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
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

        {/* Username field */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-theme-text-secondary">
            Username
          </label>
          <div className="mt-1">
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-theme-text-tertiary focus:outline-none focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm ${
                errors.username ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              value={formData.username}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Choose a username (4-20 characters)"
            />
          </div>
          {errors.username && (
            <p className="mt-2 text-sm text-theme-interactive-danger">{errors.username}</p>
          )}
        </div>

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
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-theme-text-tertiary focus:outline-none focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm ${
                errors.email ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              value={formData.email}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Enter your email address"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-theme-interactive-danger">{errors.email}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-theme-text-secondary">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-theme-text-tertiary focus:outline-none focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm pr-10 ${
                errors.password ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              value={formData.password}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-theme-interactive-danger">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-text-secondary">
            Confirm Password
          </label>
          <div className="mt-1 relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-theme-text-tertiary focus:outline-none focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm pr-10 ${
                errors.confirmPassword ? 'border-theme-border-danger' : 'border-theme-border-primary'
              }`}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isSubmitting}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isSubmitting}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-theme-interactive-danger">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms and conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-theme-text-secondary">
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-theme-interactive-primary hover:text-theme-interactive-primary"
                target="_blank"
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="text-theme-interactive-primary hover:text-theme-interactive-primary"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-theme-text-primary bg-theme-interactive-primary hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-theme-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </div>

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-theme-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm; 