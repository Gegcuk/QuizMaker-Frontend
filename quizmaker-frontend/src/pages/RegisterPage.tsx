// src/pages/RegisterPage.tsx
// ---------------------------------------------------------------------------
// User-registration form page. Relies on AuthContext's register() helper.
// ---------------------------------------------------------------------------

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { AxiosError } from 'axios';

/* ------------------------------------------------------------------------ */
/*  Local types                                                             */
/* ------------------------------------------------------------------------ */
type Errors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  server?: string;
};

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  /* -------------------------------------------------------------------- */
  /*  State                                                               */
  /* -------------------------------------------------------------------- */
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /* -------------------------------------------------------------------- */
  /*  Helpers                                                             */
  /* -------------------------------------------------------------------- */

  /** Utility to clear a single field-error (and any server error) */
  const clearFieldError = (field: keyof Errors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined, server: undefined }));

  /** Simple RFC-2822 compliant e-mail regex (good enough for client-side) */
  const emailRegex =
    // eslint-disable-next-line no-control-regex
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /** Runs synchronous client-side validation */
  const validate = (): Errors => {
    const v: Errors = {};

    if (!username.trim() || username.length < 4 || username.length > 20) {
      v.username = 'Username is required and must be 4–20 characters.';
    }

    if (!email.trim() || !emailRegex.test(email)) {
      v.email = 'Please enter a valid email address.';
    }

    if (!password || password.length < 8) {
      v.password = 'Password must be at least 8 characters.';
    }

    if (confirmPassword !== password) {
      v.confirmPassword = 'Passwords do not match.';
    }

    return v;
  };

  /* -------------------------------------------------------------------- */
  /*  Event handlers                                                      */
  /* -------------------------------------------------------------------- */

  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (errors.username) clearFieldError('username');
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) clearFieldError('email');
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errors.password) clearFieldError('password');
  };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) clearFieldError('confirmPassword');
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true); // Disable form + show “Registering…”
    try {
      await register({ username, email, password });
      navigate('/login', { replace: true });
    } catch (err) {
      /* Pull human-readable error from backend if provided */
      const msg =
        (err as AxiosError<{ error?: string }>).response?.data?.error ||
        'Registration failed';
      setErrors({ server: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------- */
  /*  Render                                                              */
  /* -------------------------------------------------------------------- */
  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      {errors.server && <div className="text-red-500 mb-2">{errors.server}</div>}

      <form onSubmit={handleSubmit} noValidate>
        {/* Username ------------------------------------------------------ */}
        <label className="block mb-4">
          <span className="block mb-1">Username</span>
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

        {/* Email --------------------------------------------------------- */}
        <label className="block mb-4">
          <span className="block mb-1">Email</span>
          <input
            type="email"
            className="w-full border px-3 py-2 rounded"
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </label>

        {/* Password ------------------------------------------------------ */}
        <label className="block mb-4">
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

        {/* Confirm password --------------------------------------------- */}
        <label className="block mb-6">
          <span className="block mb-1">Confirm Password</span>
          <input
            type="password"
            className="w-full border px-3 py-2 rounded"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </label>

        {/* Submit button ------------------------------------------------- */}
        <button
          type="submit"
          className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering…' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
