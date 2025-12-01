// src/pages/EmailVerificationPage.tsx
// ---------------------------------------------------------------------------
// Email verification page for handling email verification links
// ---------------------------------------------------------------------------

import React from 'react';
import { EmailVerification } from '../features/auth';

const EmailVerificationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-theme-bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-theme-text-primary">Quizzence</h1>
          <p className="mt-2 text-sm text-theme-text-secondary">
            Email Verification
          </p>
        </div>
      </div>

      <EmailVerification />
    </div>
  );
};

export default EmailVerificationPage;

