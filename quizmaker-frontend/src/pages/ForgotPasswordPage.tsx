// src/pages/ForgotPasswordPage.tsx
// ---------------------------------------------------------------------------
// Forgot password page using the ForgotPasswordForm component.
// ---------------------------------------------------------------------------

import React from 'react';
import { ForgotPasswordForm } from '../features/auth';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme-text-primary">Quizzence Studio</h1>
          <p className="mt-2 text-sm text-theme-text-secondary">
            Reset your password
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <ForgotPasswordForm 
            onSuccess={() => {
              console.log('Password reset email sent successfully');
            }}
            onError={(error) => {
              console.error('Password reset error:', error);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
