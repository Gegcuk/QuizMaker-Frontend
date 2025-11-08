// src/components/LoginForm.tsx
// ---------------------------------------------------------------------------
// Enhanced login form component with comprehensive validation and error handling
// Based on LoginRequest type from auth.types.ts
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LoginRequest } from '@/types';
import { Form, FormField, Button } from '@/components';
import { commonRules } from '@/utils';
import type { AxiosError } from 'axios';
import OAuthButton from './OAuthButton';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  className?: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  redirectTo = '/quizzes',
  className = ''
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Handle form submission with improved error handling
  const handleSubmit = async (data: LoginRequest) => {
    try {
      await login(data);
      
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
        'Login failed. Please check your credentials and try again.';
      
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
      <Form<LoginRequest>
        name="login-form"
        onSubmit={handleSubmit}
        defaultValues={{
          username: '',
          password: ''
        }}
        className="space-y-6"
      >
        <FormField
          name="username"
          label="Username or Email"
          placeholder="Enter your username or email"
          validation={{
            required: true,
            minLength: 3
          }}
          autoComplete="username"
          required
        />

        <FormField
          name="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          validation={{
            required: true,
            minLength: 8
          }}
          autoComplete="current-password"
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

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded bg-theme-bg-primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-theme-text-primary">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link
              to="/forgot-password"
              className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
          >
            Sign in
          </Button>
        </div>

        {/* Registration link */}
        <div className="text-center">
          <p className="text-sm text-theme-text-secondary">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors duration-200"
            >
              Sign up here
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
            <span className="px-2 bg-theme-bg-primary text-theme-text-secondary">Or continue with</span>
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

export default LoginForm; 