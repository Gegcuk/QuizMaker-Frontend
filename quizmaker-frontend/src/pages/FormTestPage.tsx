import React from 'react';
import { QuizCreationForm } from '@/components';
import { LoginForm } from '@/features/auth';

const FormTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Form Components Test</h1>
          <p className="mt-2 text-gray-600">Testing the improved form components</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Login Form (Updated)</h2>
            <LoginForm />
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Quiz Creation Form Example</h2>
            <QuizCreationForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormTestPage;
