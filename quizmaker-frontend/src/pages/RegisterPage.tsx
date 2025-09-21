// src/pages/RegisterPage.tsx
// ---------------------------------------------------------------------------
// User-registration form page using the enhanced RegisterForm component.
// ---------------------------------------------------------------------------

import React from 'react';
import { RegisterForm } from '../features/auth';

const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">QuizMaker Studio</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm 
            redirectTo="/login"
            onSuccess={() => {
              console.log('Registration successful');
            }}
            onError={(error) => {
              console.error('Registration error:', error);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
