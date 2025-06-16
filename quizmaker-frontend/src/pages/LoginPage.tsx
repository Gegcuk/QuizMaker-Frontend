import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';

type Errors = {
  username?: string;
  password?: string;
  server?: string;
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const clearFieldError = (field: keyof Errors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined, server: undefined }));

  const validate = (): Errors => {
    const newErrors: Errors = {};
    if (!username.trim()) newErrors.username = 'Email is required.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters.';
    return newErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ username, password });
      navigate('/quizzes', { replace: true });
    } catch (err) {
      const message =
        (err as AxiosError<{ error?: string }>)?.response?.data?.error ||
        'Login failed';
      setErrors({ server: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 border rounded-xl shadow-md bg-white">
      {/* Branding */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">QuizMaker Studio</h1>
        <p className="text-gray-600 mt-1">
          Master any subject. One quiz at a time.
        </p>
      </div>

      {/* Server error */}
      {errors.server && (
        <div className="text-red-500 mb-4 text-sm text-center">
          {errors.server}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Email */}
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            type="text"
            className="mt-1 w-full border px-3 py-2 rounded"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (errors.username) clearFieldError('username');
            }}
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </label>

        {/* Password */}
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            className="mt-1 w-full border px-3 py-2 rounded"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) clearFieldError('password');
            }}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </label>

        {/* Remember Me & Forgot */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <a href="#" className="text-indigo-600 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Sign In */}
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>

        {/* Divider */}
        <div className="text-center text-gray-500 text-sm mt-4">
          or sign in with...
        </div>

        {/* Social Login */}
        <div className="flex gap-4 mt-2">
          <button
            type="button"
            className="flex-1 py-2 bg-gray-100 border rounded hover:bg-gray-200 transition"
          >
            Google
          </button>
          <button
            type="button"
            className="flex-1 py-2 bg-gray-100 border rounded hover:bg-gray-200 transition"
          >
            Microsoft
          </button>
        </div>

        {/* Register Link */}
        <div className="text-center text-sm text-gray-700 mt-6">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline">
            Register
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;