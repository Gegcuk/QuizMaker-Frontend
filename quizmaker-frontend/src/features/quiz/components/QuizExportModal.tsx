// src/features/quiz/components/QuizExportModal.tsx
// ---------------------------------------------------------------------------
// Modal for exporting quiz with options
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  TableCellsIcon,
  GlobeAltIcon,
  WrenchScrewdriverIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { Modal, Button, Checkbox } from '@/components';
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
              { value: 'PDF_PRINT', label: 'PDF Print', Icon: DocumentTextIcon, desc: 'Professional printing' },
              { value: 'XLSX_EDITABLE', label: 'Excel Editable', Icon: TableCellsIcon, desc: 'Spreadsheet format' },
              { value: 'HTML_PRINT', label: 'HTML Print', Icon: GlobeAltIcon, desc: 'Browser printing' },
              { value: 'JSON_EDITABLE', label: 'JSON Editable', Icon: WrenchScrewdriverIcon, desc: 'Full data export' },
            ].map(({ value, label, Icon, desc }) => {
              const isSelected = format === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormat(value as any)}
                  className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-theme-bg-secondary border-theme-interactive-primary shadow-md'
                      : 'bg-theme-bg-primary border-theme-border-primary hover:border-theme-border-secondary hover:shadow-sm'
                  }`}
                >
                  {/* Selected Checkmark - Top Right */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="w-5 h-5 text-theme-interactive-primary" strokeWidth={2.5} />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 pr-6">
                    <div className="flex items-start">
                      {(() => { const I = Icon; return <I className={`w-5 h-5 mr-2 flex-shrink-0 ${isSelected ? 'text-theme-interactive-primary' : 'text-theme-text-tertiary'}`} />; })()}
                      <div className="flex-1">
                        <span className={`text-sm font-medium block ${isSelected ? 'text-theme-interactive-primary' : 'text-theme-text-primary'}`}>
                          {label}
                        </span>
                        <p className="mt-1 text-xs text-theme-text-tertiary">
                          {desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Export Options - only for print formats */}
        {(format === 'PDF_PRINT' || format === 'HTML_PRINT') && (
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-3">
              Print Options
            </label>
            <div className="space-y-2">
              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('includeCover', !options.includeCover)}
              >
                <Checkbox
                  checked={options.includeCover}
                  onChange={(checked) => handleOptionChange('includeCover', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Include Cover Page</div>
                      <div className="text-xs text-theme-text-tertiary">Add title page and metadata</div>
                    </div>
                  }
                />
              </div>

              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('includeMetadata', !options.includeMetadata)}
              >
                <Checkbox
                  checked={options.includeMetadata}
                  onChange={(checked) => handleOptionChange('includeMetadata', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Include Metadata</div>
                      <div className="text-xs text-theme-text-tertiary">Show quiz details and difficulty</div>
                    </div>
                  }
                />
              </div>

              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('answersOnSeparatePages', !options.answersOnSeparatePages)}
              >
                <Checkbox
                  checked={options.answersOnSeparatePages}
                  onChange={(checked) => handleOptionChange('answersOnSeparatePages', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Answers on Separate Pages</div>
                      <div className="text-xs text-theme-text-tertiary">Print answer key separately</div>
                    </div>
                  }
                />
              </div>

              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('includeHints', !options.includeHints)}
              >
                <Checkbox
                  checked={options.includeHints}
                  onChange={(checked) => handleOptionChange('includeHints', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Include Hints</div>
                      <div className="text-xs text-theme-text-tertiary">Show question hints</div>
                    </div>
                  }
                />
              </div>

              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('includeExplanations', !options.includeExplanations)}
              >
                <Checkbox
                  checked={options.includeExplanations}
                  onChange={(checked) => handleOptionChange('includeExplanations', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Include Explanations</div>
                      <div className="text-xs text-theme-text-tertiary">Show answer explanations</div>
                    </div>
                  }
                />
              </div>

              <div 
                className="p-2 rounded-lg border border-theme-border-primary bg-theme-bg-primary hover:bg-theme-bg-secondary transition-colors cursor-pointer"
                onClick={() => handleOptionChange('groupQuestionsByType', !options.groupQuestionsByType)}
              >
                <Checkbox
                  checked={options.groupQuestionsByType}
                  onChange={(checked) => handleOptionChange('groupQuestionsByType', checked)}
                  label={
                    <div>
                      <div className="text-sm font-medium text-theme-text-primary">Group by Question Type</div>
                      <div className="text-xs text-theme-text-tertiary">Organize questions by type (MCQ, True/False, etc.)</div>
                    </div>
                  }
                />
              </div>
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

