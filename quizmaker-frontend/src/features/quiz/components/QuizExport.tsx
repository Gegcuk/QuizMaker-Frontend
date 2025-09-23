// src/components/QuizExport.tsx
// ---------------------------------------------------------------------------
// Export quiz results based on RESULT_ENDPOINTS
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizDto } from '@/types';

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
  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // TODO: Implement actual export API call
      // const response = await exportQuizResults(quiz.id, {
      //   format: selectedFormat,
      //   options: exportOptions
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create download link
      const fileName = `${quiz.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.${exportFormats.find(f => f.id === selectedFormat)?.extension}`;
      
      // In a real implementation, you would download the actual file from the API
      const blob = new Blob(['Mock export data'], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setShowExportModal(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
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
      {/* Export Button */}
      <button
        onClick={() => setShowExportModal(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-theme-text-primary bg-theme-bg-overlay hover:bg-theme-bg-overlay focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-success ${className}`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export Results
      </button>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-theme-bg-overlay bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-theme-bg-primary">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-theme-text-primary">Export Quiz Results</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-theme-text-tertiary hover:text-theme-text-secondary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quiz Info */}
              <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
                <h4 className="font-medium text-theme-text-primary">{quiz.title}</h4>
                {quiz.description && (
                  <p className="text-sm text-theme-text-secondary mt-1">{quiz.description}</p>
                )}
              </div>

              {/* Export Format Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-theme-text-primary mb-3">Export Format</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {exportFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedFormat === format.id
                          ? 'border-theme-border-primary bg-theme-bg-primary'
                          : 'border-theme-border-primary hover:border-theme-border-secondary'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 ${selectedFormat === format.id ? 'text-theme-interactive-primary' : 'text-theme-text-tertiary'}`}>
                          {format.icon}
                        </div>
                        <div>
                          <p className="font-medium text-theme-text-primary">{format.name}</p>
                          <p className="text-sm text-theme-text-tertiary">{format.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-theme-text-primary mb-3">Export Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnswers}
                      onChange={(e) => handleOptionChange('includeAnswers', e.target.checked)}
                      className="rounded border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Include correct answers</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeStatistics}
                      onChange={(e) => handleOptionChange('includeStatistics', e.target.checked)}
                      className="rounded border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Include statistics and charts</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeLeaderboard}
                      onChange={(e) => handleOptionChange('includeLeaderboard', e.target.checked)}
                      className="rounded border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Include leaderboard</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeUserDetails}
                      onChange={(e) => handleOptionChange('includeUserDetails', e.target.checked)}
                      className="rounded border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Include user details (names, emails)</span>
                  </label>
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-theme-text-primary mb-3">Date Range</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={exportOptions.dateRange === 'all'}
                      onChange={(e) => handleOptionChange('dateRange', e.target.value)}
                      className="border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">All time</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="last7days"
                      checked={exportOptions.dateRange === 'last7days'}
                      onChange={(e) => handleOptionChange('dateRange', e.target.value)}
                      className="border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Last 7 days</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="last30days"
                      checked={exportOptions.dateRange === 'last30days'}
                      onChange={(e) => handleOptionChange('dateRange', e.target.value)}
                      className="border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Last 30 days</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="custom"
                      checked={exportOptions.dateRange === 'custom'}
                      onChange={(e) => handleOptionChange('dateRange', e.target.value)}
                      className="border-theme-border-primary text-theme-interactive-primary focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <span className="ml-2 text-sm text-theme-text-secondary">Custom range</span>
                  </label>
                </div>

                {exportOptions.dateRange === 'custom' && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={exportOptions.customStartDate}
                      onChange={(e) => handleOptionChange('customStartDate', e.target.value)}
                      className="px-3 py-2 border border-theme-border-primary rounded-md text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                    <input
                      type="date"
                      value={exportOptions.customEndDate}
                      onChange={(e) => handleOptionChange('customEndDate', e.target.value)}
                      className="px-3 py-2 border border-theme-border-primary rounded-md text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary border border-theme-border-primary rounded-md hover:bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary"
                  disabled={isExporting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 text-sm font-medium text-theme-text-primary bg-theme-interactive-primary border border-transparent rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-theme-text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    'Export Results'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuizExport; 