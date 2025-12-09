// src/pages/EmailVerificationPage.tsx
// ---------------------------------------------------------------------------
// Email verification page for handling email verification links
// ---------------------------------------------------------------------------

import React from 'react';
import { EmailVerification } from '../features/auth';
import { Seo } from '@/features/seo';

const EmailVerificationPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Verify Email | Quizzence"
        description="Verify your email address to activate your Quizzence account and start creating AI-powered quizzes."
        canonicalPath="/verify-email"
        ogType="website"
        noindex
      />
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
    </>
  );
};

export default EmailVerificationPage;
