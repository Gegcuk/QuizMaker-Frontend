// src/pages/LoginPage.tsx
// ---------------------------------------------------------------------------
// Login form page. Uses AuthContext's login() and redirects on success.
// ---------------------------------------------------------------------------

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

  /* ---------------------------------------------------------------------- */
  /*  Local state                                                           */
  /* ---------------------------------------------------------------------- */
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* ---------------------------------------------------------------------- */
  /*  Helpers                                                               */
  /* ---------------------------------------------------------------------- */

  /** Clears a single field-specific error as the user types */
  const clearFieldError = (field: keyof Errors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined, server: undefined }));

  /** Validate inputs and return an Errors object (empty when valid) */
  const validate = (): Errors => {
    const newErrors: Errors = {};
    if (!username.trim()) newErrors.username = 'Username or email is required.';
    if (!password) newErrors.password = 'Password is required.';
    else if (password.length < 8)
      newErrors.password = 'Password must be at least 8 characters.';
    return newErrors;
  };

  /* ---------------------------------------------------------------------- */
  /*  Event handlers                                                        */
  /* ---------------------------------------------------------------------- */

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errors.username) clearFieldError('username');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) clearFieldError('password');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true); // Disable inputs & show “Logging in…”
    try {
      await login({ username, password });
      /* On success AuthContext navigates, but doing it here keeps the
         redirect behaviour explicit and future-proof. */
      navigate('/quizzes', { replace: true });
    } catch (err) {
      /* Extract backend message if possible, else fall back to generic text */
      const message =
        (err as AxiosError<{ error?: string }>)?.response?.data?.error ||
        'Login failed';
      setErrors({ server: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      {errors.server && (
        <div className="text-red-500 mb-2">{errors.server}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Username / Email ------------------------------------------------ */}
        <label className="block mb-4">
          <span className="block mb-1">Username or Email</span>
          <input
            type="text"
            className="w-full border px-3 py-2 rounded"
            value={username}
            onChange={handleUsernameChange}
            disabled={isSubmitting}
          />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
        </label>

        {/* Password -------------------------------------------------------- */}
        <label className="block mb-6">
          <span className="block mb-1">Password</span>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={password}
            onChange={handlePasswordChange}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </label>

        {/* Submit button --------------------------------------------------- */}
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
