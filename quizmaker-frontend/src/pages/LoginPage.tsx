import React from 'react';
import { LoginForm } from '../features/auth';
import { Seo } from '@/features/seo';

const LoginPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Log In | Quizzence"
        description="Log in to Quizzence to access your quizzes, track progress and continue learning."
        canonicalPath="/login"
        ogType="website"
      />
      <div className="min-h-screen bg-theme-bg-secondary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-theme-text-primary">Quizzence</h1>
            <p className="mt-2 text-sm text-theme-text-secondary">
              Master any subject. One quiz at a time.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-theme-bg-primary py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <LoginForm 
              redirectTo="/my-quizzes"
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
    </>
  );
};

export default LoginPage;
