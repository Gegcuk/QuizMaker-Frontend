// src/components/LoginForm.tsx
// ---------------------------------------------------------------------------
// Enhanced login form component with comprehensive validation and error handling
// Based on LoginRequest type from auth.types.ts
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LoginRequest } from '@/types';
import { Form, FormField } from '@/components';
import { commonRules } from '@/utils';
import type { AxiosError } from 'axios';

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
          type="password"
          placeholder="Enter your password"
          validation={{
            required: true,
            minLength: 8
          }}
          autoComplete="current-password"
          required
        />

        {/* Remember me and forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded"
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
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        {/* Submit button */}
        <div>
          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in
          </button>
        </div>

        {/* Registration link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </Form>
    </div>
  );
};

export default LoginForm; 