// src/components/quiz/QuizCreationTabs.tsx
// ---------------------------------------------------------------------------
// Tabbed interface for quiz creation with three methods:
// 1. Manual creation (existing QuizForm)
// 2. Generate from text (new textarea-based generation)
// 3. Generate from document upload (moved from DocumentUploadWithQuizPage)
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import QuizForm from './QuizForm';
import { TextGenerationTab } from './TextGenerationTab';
import { DocumentUploadTab } from './DocumentUploadTab';

type TabType = 'manual' | 'text' | 'upload';

interface TabConfig {
  id: TabType;
  label: string;
  description: string;
  icon: string;
}

const tabs: TabConfig[] = [
  {
    id: 'manual',
    label: 'Manual Creation',
    description: 'Create quiz manually by adding questions and settings',
    icon: '✏️'
  },
  {
    id: 'text',
    label: 'Generate from Text',
    description: 'Generate quiz from plain text content using AI',
    icon: '📝'
  },
  {
    id: 'upload',
    label: 'Generate from Document',
    description: 'Upload a document and generate quiz automatically',
    icon: '📄'
  }
];

export const QuizCreationTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  return (
    <div className="max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-theme-border-primary">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-theme-interactive-primary'
                    : 'border-transparent text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-primary'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Description */}
        <div className="mt-4">
          <p className="text-theme-text-secondary text-sm">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg">
        {activeTab === 'manual' && (
          <div className="p-6">
            <QuizForm />
          </div>
        )}
        
        {activeTab === 'text' && (
          <div className="p-6">
            <TextGenerationTab />
          </div>
        )}
        
        {activeTab === 'upload' && (
          <div className="p-6">
            <DocumentUploadTab />
          </div>
        )}
      </div>
    </div>
  );
};
