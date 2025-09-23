import React from 'react';
import { LoginForm } from '../features/auth';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-theme-text-primary">QuizMaker Studio</h1>
          <p className="mt-2 text-sm text-theme-text-secondary">
            Master any subject. One quiz at a time.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm 
            redirectTo="/quizzes"
            onSuccess={() => {
              console.log('Login successful');
            }}
            onError={(error) => {
              console.error('Login error:', error);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;