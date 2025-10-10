// src/components/RegisterForm.tsx
// ---------------------------------------------------------------------------
// Enhanced registration form component with comprehensive validation and error handling
// Based on RegisterRequest type from auth.types.ts
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { RegisterRequest } from '@/types';
import { Form, FormField } from '@/components';
import type { AxiosError } from 'axios';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

interface ExtendedRegisterRequest extends RegisterRequest {
  confirmPassword: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/login',
  className = ''
}) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Password strength validation
  const validatePasswordStrength = (password: string): string | null => {
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
    
    if (issues.length > 0) {
      return `Password must contain: ${issues.join(', ')}`;
    }
    
    return null;
  };

  // Handle form submission
  const handleSubmit = async (data: ExtendedRegisterRequest) => {
    // Check terms acceptance
    if (!acceptTerms) {
      throw new Error('You must accept the terms and conditions');
    }

    // Validate password match
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // Validate password strength
    const passwordError = validatePasswordStrength(data.password);
    if (passwordError) {
      throw new Error(passwordError);
    }

    try {
      // Remove confirmPassword from the request
      const { confirmPassword, ...registerData } = data;
      await register(registerData);
      
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
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
      
      // Re-throw to let Form component handle it
      throw new Error(errorMessage);
    }
  };

  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <Form<ExtendedRegisterRequest>
        onSubmit={handleSubmit}
        defaultValues={{
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        }}
        className="space-y-6"
      >
        <FormField
          name="username"
          label="Username"
          placeholder="Choose a username (4-20 characters)"
          validation={{
            required: true,
            minLength: 4,
            maxLength: 20,
            pattern: /^[a-zA-Z0-9_]+$/,
            custom: (value) => {
              if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
                return 'Username can only contain letters, numbers, and underscores';
              }
              return null;
            }
          }}
          autoComplete="username"
          required
        />

        <FormField
          name="email"
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          validation={{
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            custom: (value) => {
              if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Please enter a valid email address';
              }
              return null;
            }
          }}
          autoComplete="email"
          required
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          placeholder="Create a strong password"
          validation={{
            required: true,
            minLength: 8,
            maxLength: 100,
            custom: validatePasswordStrength
          }}
          autoComplete="new-password"
          required
        />

        <FormField
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          validation={{
            required: true,
            minLength: 8
          }}
          autoComplete="new-password"
          required
        />

        {/* Terms and conditions */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary transition-colors duration-200"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="terms" className="text-theme-text-secondary">
              I agree to the{' '}
              <Link
                to="/terms"
                className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
                target="_blank"
              >
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link
                to="/privacy"
                className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
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
            className="w-full flex justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 focus:ring-offset-theme-bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create account
          </button>
        </div>

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-theme-text-secondary">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </Form>
    </div>
  );
};

export default RegisterForm;
