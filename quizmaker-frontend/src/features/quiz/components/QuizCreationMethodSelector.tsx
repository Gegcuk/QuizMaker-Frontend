// src/features/quiz/components/QuizCreationMethodSelector.tsx
// ---------------------------------------------------------------------------
// Component for selecting quiz creation method:
// 1. Manual - Create quiz manually by adding questions step by step
// 2. From Text - Generate quiz from plain text content using AI
// 3. From Document - Upload a document and generate quiz automatically
// ---------------------------------------------------------------------------

import React from 'react';
import { CreationMethod } from './QuizCreationWizard';
import { Button, Card } from '@/components';

interface QuizCreationMethodSelectorProps {
  onMethodSelect: (method: CreationMethod) => void;
  selectedMethod?: CreationMethod | null;
}

interface MethodOption {
  id: CreationMethod;
  title: string;
  description: string;
  icon: string;
  features: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
}

const methodOptions: MethodOption[] = [
  {
    id: 'manual',
    title: 'Manual Creation',
    description: 'Create your quiz manually by adding questions one by one. Perfect for custom content and precise control.',
    icon: '✏️',
    features: [
      'Full control over questions and answers',
      'Custom question types',
      'Manual difficulty setting',
      'Immediate editing and preview'
    ],
    estimatedTime: '15-30 minutes',
    difficulty: 'Easy'
  },
  {
    id: 'text',
    title: 'Generate from Text',
    description: 'Paste your text content and let AI generate relevant questions automatically. Great for educational content.',
    icon: '📝',
    features: [
      'AI-powered question generation',
      'Multiple question types',
      'Automatic difficulty assessment',
      'Content-based question creation'
    ],
    estimatedTime: '5-10 minutes',
    difficulty: 'Medium'
  },
  {
    id: 'document',
    title: 'Generate from Document',
    description: 'Upload a document (PDF, Word, etc.) and generate a comprehensive quiz automatically.',
    icon: '📄',
    features: [
      'Document parsing and analysis',
      'Chapter-based question generation',
      'Automatic content extraction',
      'Bulk question creation'
    ],
    estimatedTime: '2-5 minutes',
    difficulty: 'Advanced'
  }
];

export const QuizCreationMethodSelector: React.FC<QuizCreationMethodSelectorProps> = ({
  onMethodSelect,
  selectedMethod
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-theme-interactive-success bg-theme-bg-success';
      case 'Medium':
        return 'text-theme-interactive-warning bg-theme-bg-warning';
      case 'Advanced':
        return 'text-theme-interactive-danger bg-theme-bg-danger';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
          Choose Your Quiz Creation Method
        </h3>
        <p className="text-theme-text-secondary">
          Select how you'd like to create your quiz. You can always modify questions later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {methodOptions.map((option) => (
          <div
            key={option.id}
            className={`relative cursor-pointer transition-all duration-200 transform hover:scale-[1.02] bg-theme-bg-primary border border-theme-border-primary rounded-lg shadow-sm ${
              selectedMethod === option.id
                ? 'ring-2 ring-theme-interactive-primary border-theme-border-info shadow-lg bg-theme-bg-info'
                : 'hover:border-theme-border-secondary hover:shadow-lg hover:bg-theme-bg-secondary'
            }`}
            onClick={() => onMethodSelect(option.id)}
          >
            <div className="p-6">
              {/* Selection indicator */}
              {selectedMethod === option.id && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-theme-bg-info0 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-theme-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Icon and title */}
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-3">{option.icon}</span>
                <div>
                  <h4 className="text-lg font-semibold text-theme-text-primary">{option.title}</h4>
                </div>
              </div>

              {/* Description */}
              <p className="text-theme-text-secondary text-sm mb-4">
                {option.description}
              </p>

              {/* Features */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-theme-text-primary mb-2">Key Features:</h5>
                <ul className="text-sm text-theme-text-secondary space-y-1">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-4 h-4 text-theme-interactive-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Estimated time */}
              <div className="flex items-center text-sm text-theme-text-tertiary mb-4">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Estimated time: {option.estimatedTime}
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      <div className="bg-theme-bg-info border border-theme-border-info rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-theme-text-primary">
              Need help choosing?
            </h3>
            <div className="mt-2 text-sm text-theme-text-secondary">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Manual:</strong> Best for custom quizzes with specific requirements</li>
                <li><strong>From Text:</strong> Perfect for educational content or articles</li>
                <li><strong>From Document:</strong> Ideal for textbooks, manuals, or structured documents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
