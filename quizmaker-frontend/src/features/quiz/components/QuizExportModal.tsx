// src/features/quiz/components/QuizExportModal.tsx
// ---------------------------------------------------------------------------
// Modal for exporting quiz with options
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Modal, Button } from '@/components';
import { QuizDto, QuizExportFormat } from '@/types';

interface QuizExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: QuizDto;
  onExport: (format: string, options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  format: QuizExportFormat;
  includeCover?: boolean;
  includeMetadata?: boolean;
  answersOnSeparatePages?: boolean;
  includeHints?: boolean;
  includeExplanations?: boolean;
  groupQuestionsByType?: boolean;
}

const QuizExportModal: React.FC<QuizExportModalProps> = ({
  isOpen,
  onClose,
  quiz,
  onExport
}) => {
  const [format, setFormat] = useState<QuizExportFormat>('PDF_PRINT');
  const [options, setOptions] = useState<ExportOptions>({
    format: 'PDF_PRINT',
    includeCover: true,
    includeMetadata: true,
    answersOnSeparatePages: true,
    includeHints: false,
    includeExplanations: false,
    groupQuestionsByType: false,
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(format, { ...options, format });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (key: keyof ExportOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Export Quiz: ${quiz.title}`}
      size="md"
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-theme-text-secondary mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'PDF_PRINT', label: 'PDF Print', icon: '📄', desc: 'Professional printing' },
              { value: 'XLSX_EDITABLE', label: 'Excel Editable', icon: '📊', desc: 'Spreadsheet format' },
              { value: 'HTML_PRINT', label: 'HTML Print', icon: '🌐', desc: 'Browser printing' },
              { value: 'JSON_EDITABLE', label: 'JSON Editable', icon: '🔧', desc: 'Full data export' },
            ].map(({ value, label, icon, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormat(value as any)}
                className={`
                  flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all
                  ${format === value
                    ? 'border-theme-interactive-primary bg-theme-bg-secondary text-theme-text-primary'
                    : 'border-theme-border-primary bg-theme-bg-primary text-theme-text-secondary hover:border-theme-interactive-primary/50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-xs text-theme-text-tertiary">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export Options - only for print formats */}
        {(format === 'PDF_PRINT' || format === 'HTML_PRINT') && (
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-3">
              Print Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeCover}
                  onChange={(e) => handleOptionChange('includeCover', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Include Cover Page</div>
                  <div className="text-xs text-theme-text-tertiary">Add title page and metadata</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Include Metadata</div>
                  <div className="text-xs text-theme-text-tertiary">Show quiz details and difficulty</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.answersOnSeparatePages}
                  onChange={(e) => handleOptionChange('answersOnSeparatePages', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Answers on Separate Pages</div>
                  <div className="text-xs text-theme-text-tertiary">Print answer key separately</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeHints}
                  onChange={(e) => handleOptionChange('includeHints', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Include Hints</div>
                  <div className="text-xs text-theme-text-tertiary">Show question hints</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.includeExplanations}
                  onChange={(e) => handleOptionChange('includeExplanations', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Include Explanations</div>
                  <div className="text-xs text-theme-text-tertiary">Show answer explanations</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary cursor-pointer hover:bg-theme-bg-secondary transition-colors">
                <input
                  type="checkbox"
                  checked={options.groupQuestionsByType}
                  onChange={(e) => handleOptionChange('groupQuestionsByType', e.target.checked)}
                  className="w-4 h-4 text-theme-interactive-primary border-theme-border-primary rounded focus:ring-theme-interactive-primary"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">Group by Question Type</div>
                  <div className="text-xs text-theme-text-tertiary">Organize questions by type (MCQ, True/False, etc.)</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border-primary">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            loading={isExporting}
          >
            {isExporting ? 'Exporting...' : `Export as ${format}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuizExportModal;

