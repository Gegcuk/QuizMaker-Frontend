// src/components/QuizExport.tsx
// ---------------------------------------------------------------------------
// Export quiz results based on RESULT_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizDto } from '@/types';
import Card from '@/components/ui/Card';
import QuizExportModal, { ExportOptions } from './QuizExportModal';
import { QuizService } from '../services/quiz.service';
import { api } from '@/services';
import { useToast } from '@/components';

interface QuizExportProps {
  quiz: QuizDto;
  className?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  extension: string;
}

const QuizExport: React.FC<QuizExportProps> = ({ quiz, className = '' }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const { addToast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeAnswers: true,
    includeStatistics: true,
    includeLeaderboard: false,
    includeUserDetails: false,
    dateRange: 'all' as 'all' | 'last7days' | 'last30days' | 'custom',
    customStartDate: '',
    customEndDate: ''
  });

  const exportFormats: ExportFormat[] = [
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Professional PDF report with charts and statistics',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      extension: 'pdf'
    },
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      description: 'Detailed data in Excel format for analysis',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      extension: 'xlsx'
    },
    {
      id: 'csv',
      name: 'CSV Data',
      description: 'Raw data in CSV format for external tools',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      extension: 'csv'
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Structured data in JSON format for developers',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      extension: 'json'
    }
  ];

  // Handle export
  const handleExport = async (format: string, options: ExportOptions) => {
    try {
      const quizService = new QuizService(api);
      const blob = await quizService.exportQuizzes({
        format: format as import('@/types').QuizExportFormat,
        scope: 'me',
        quizIds: [quiz.id],
        includeCover: options.includeCover,
        includeMetadata: options.includeMetadata,
        answersOnSeparatePages: options.answersOnSeparatePages,
        includeHints: options.includeHints,
        includeExplanations: options.includeExplanations,
        groupQuestionsByType: options.groupQuestionsByType,
      });

      const extensionMap: Record<string, string> = {
        'JSON_EDITABLE': 'json',
        'XLSX_EDITABLE': 'xlsx',
        'HTML_PRINT': 'html',
        'PDF_PRINT': 'pdf',
      };
      const extension = extensionMap[format] || 'file';
      const fileName = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.${extension}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      addToast({ type: 'success', message: `Quiz "${quiz.title}" exported successfully` });
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      addToast({ type: 'error', message: 'Failed to export quiz. Please try again.' });
    }
  };

  // Handle option change
  const handleOptionChange = (option: string, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  return (
    <>
      <Card
        className={className}
        header={
          <div className="flex items-center">
            <svg className="w-5 h-5 text-theme-text-tertiary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-theme-text-primary">Export Quiz</h3>
          </div>
        }
      >
        <div className="text-center">
          <p className="text-sm text-theme-text-secondary mb-4">Export your quiz to PDF, HTML, XLSX or JSON.</p>
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-inverse bg-theme-interactive-primary hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Quiz
          </button>
        </div>
      </Card>

      {/* Export Modal - shared implementation */}
      {showExportModal && (
        <QuizExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          quiz={quiz}
          onExport={handleExport}
        />
      )}
    </>
  );
};

export default QuizExport; 