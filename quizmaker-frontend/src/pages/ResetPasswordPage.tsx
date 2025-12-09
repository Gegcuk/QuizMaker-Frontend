// src/pages/ResetPasswordPage.tsx
// ---------------------------------------------------------------------------
// Reset password page using the ResetPasswordForm component.
// ---------------------------------------------------------------------------

import React from 'react';
import { ResetPasswordForm } from '../features/auth';
import { Seo } from '@/features/seo';

const ResetPasswordPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Set New Password | Quizzence"
        description="Set a new password for your Quizzence account to continue using your quizzes and learning tools."
        canonicalPath="/reset-password"
        ogType="website"
        noindex
      />
      <div className="min-h-screen bg-theme-bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-theme-text-primary">Quizzence</h1>
            <p className="mt-2 text-sm text-theme-text-secondary">
              Set your new password
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <ResetPasswordForm 
              onSuccess={() => {
                console.log('Password reset successfully');
              }}
              onError={(error) => {
                console.error('Password reset error:', error);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
