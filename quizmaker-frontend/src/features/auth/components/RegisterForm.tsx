// src/components/RegisterForm.tsx
// ---------------------------------------------------------------------------
// Enhanced registration form component with comprehensive validation and error handling
// Based on RegisterRequest type from auth.types.ts
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { RegisterRequest } from '@/types';
import { Form, FormField, Button, Checkbox } from '@/components';
import type { AxiosError } from 'axios';
import OAuthButton from './OAuthButton';

const SPECIAL_CHAR_PATTERN = /[!@#$%^&*(),.?":{}|<>]/;
const PASSWORD_INPUT_PATTERN = new RegExp(`.*${SPECIAL_CHAR_PATTERN.source}.*`);

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (!SPECIAL_CHAR_PATTERN.test(password)) {
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
        name="register-form"
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
          type={showPassword ? "text" : "password"}
          placeholder="Create a strong password"
          helperText="Must contain: uppercase, lowercase, number, and special character (!@#$%^&* etc.)"
          validation={{
            required: true,
            minLength: 8,
            maxLength: 100,
            pattern: PASSWORD_INPUT_PATTERN,
            custom: validatePasswordStrength
          }}
          autoComplete="new-password"
          required
          rightIconClickable={true}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-theme-text-tertiary hover:text-theme-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-interactive-primary rounded p-0.5"
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

        <FormField
          name="confirmPassword"
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="Confirm your password"
          validation={{
            required: true,
            minLength: 8
          }}
          autoComplete="new-password"
          required
          rightIconClickable={true}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-theme-text-tertiary hover:text-theme-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-interactive-primary rounded p-0.5"
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

        {/* Terms and conditions */}
        <Checkbox
          id="terms"
          name="terms"
          checked={acceptTerms}
          onChange={setAcceptTerms}
          label={
            <span className="text-theme-text-secondary">
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
            </span>
          }
        />

        {/* Submit button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
          >
            Create account
          </Button>
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

      {/* OAuth Divider */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border-primary"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-theme-bg-primary text-theme-text-secondary">Or sign up with</span>
          </div>
        </div>
      </div>

      {/* OAuth Buttons - Flexible wrap layout: square buttons on mobile, full-width on desktop */}
      <div className="mt-6 flex flex-wrap justify-center sm:flex-col gap-3">
        <OAuthButton provider="GOOGLE" fullWidth={false} />
        <OAuthButton provider="GITHUB" fullWidth={false} />
      </div>
    </div>
  );
};

export default RegisterForm;
