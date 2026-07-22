// ---------------------------------------------------------------------------
// ComplianceEditor.tsx - Compliance question editor
// Based on ComplianceContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { ComplianceContent, ComplianceStatement, MediaRefDto } from '@/types';
import { InstructionsModal, AddItemButton, QuestionPreviewSection, ItemManagementContainer, Textarea, Button, Radio, Checkbox } from '@/components';
import { MediaPicker } from '@/features/media';

interface ComplianceEditorProps {
  content: ComplianceContent;
  onChange: (content: ComplianceContent) => void;
  className?: string;
  showPreview?: boolean;
}

const MIN_COMPLIANCE_STATEMENTS = 2;
const MAX_COMPLIANCE_STATEMENTS = 6;

const getMediaUrl = (media?: ComplianceStatement['media']) =>
  media && 'cdnUrl' in media ? media.cdnUrl : undefined;

const ComplianceEditor: React.FC<ComplianceEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [statements, setStatements] = useState<ComplianceStatement[]>(
    () => normalizeInitialStatements(content?.statements)
  );

  // Update parent when statements change
  useEffect(() => {
    onChange({ statements });
  }, [statements, onChange]);

  // Auto-resize all textareas on mount and when statements change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-compliance-statement]');
    textareas.forEach((textarea) => {
      const element = textarea as HTMLTextAreaElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    });
  }, [statements]);

  const addStatement = () => {
    if (statements.length >= MAX_COMPLIANCE_STATEMENTS) return;

    const newId = getNextStatementId(statements);
    setStatements(prev => [...prev, { id: newId, text: '', compliant: true }]);
  };

  const removeStatement = (id: number) => {
    if (statements.length <= MIN_COMPLIANCE_STATEMENTS) return;
    setStatements(prev => prev.filter(statement => statement.id !== id));
  };

  const updateStatementText = (id: number, text: string) => {
    setStatements(prev => prev.map(statement => 
      statement.id === id ? { ...statement, text } : statement
    ));
  };

  const updateStatementCompliance = (id: number, compliant: boolean) => {
    setStatements(prev => prev.map(statement => 
      statement.id === id ? { ...statement, compliant } : statement
    ));
  };

  const updateStatementMedia = (id: number, media: MediaRefDto | null) => {
    setStatements(prev => prev.map(statement =>
      statement.id === id ? { ...statement, media: media ?? undefined } : statement
    ));
  };

  const getCompliantCount = () => statements.filter(s => s.compliant).length;
  const getNonCompliantCount = () => statements.filter(s => !s.compliant).length;
  const getEmptyStatements = () => statements.filter(s => !s.text?.trim() && !s.media?.assetId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">Identify compliant and non-compliant statements</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {statements.length} statement{statements.length !== 1 ? 's' : ''}
          </span>
          {getEmptyStatements().length > 0 && (
            <span className="text-xs text-theme-text-danger">
              {getEmptyStatements().length} empty statement{getEmptyStatements().length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Statements */}
      <ItemManagementContainer
        title="Statements"
        helperText={`${getCompliantCount()} Compliant • ${getNonCompliantCount()} Non-compliant`}
      >
        {statements.map((statement) => (
          <div key={statement.id} className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary space-y-3">
            {/* Statement Text */}
            <div className="flex-1">
              <Textarea
                value={statement.text || ''}
                onChange={(e) => updateStatementText(statement.id, e.target.value)}
                placeholder="Enter statement text..."
                rows={1}
                minRows={1}
                autoResize
                fullWidth
                data-compliance-statement
              />
            </div>

            <MediaPicker
              value={(statement.media as MediaRefDto | undefined) || null}
              onChange={(media) => updateStatementMedia(statement.id, media)}
              label="Statement image"
              helperText="Optional. An image can be used instead of statement text."
              uploadLabel="Upload image"
            />

            {/* Compliance Toggle + Delete Button */}
            <div className="flex items-start sm:items-center justify-between gap-3 pl-1">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Radio
                  id={`compliant-${statement.id}`}
                  name={`compliance-${statement.id}`}
                  value="compliant"
                  checked={statement.compliant}
                  onChange={() => updateStatementCompliance(statement.id, true)}
                  label="Compliant"
                />
                <Radio
                  id={`non-compliant-${statement.id}`}
                  name={`compliance-${statement.id}`}
                  value="non-compliant"
                  checked={!statement.compliant}
                  onChange={() => updateStatementCompliance(statement.id, false)}
                  label="Non-compliant"
                />
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeStatement(statement.id)}
                disabled={statements.length <= MIN_COMPLIANCE_STATEMENTS}
                className="!text-theme-interactive-danger hover:!text-theme-interactive-danger disabled:!text-theme-text-tertiary"
                title="Remove statement"
                aria-label={`Remove statement ${statement.id}`}
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                }
              />
            </div>
          </div>
        ))}
        <AddItemButton
          onClick={addStatement}
          itemType="Statement"
          disabled={statements.length >= MAX_COMPLIANCE_STATEMENTS}
        />
      </ItemManagementContainer>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Write statements to evaluate</li>
          <li>Mark each statement as Compliant or Non-compliant</li>
          <li>Minimum 2 statements required</li>
          <li>Maximum 6 statements allowed</li>
        </ul>
      </InstructionsModal>

      <QuestionPreviewSection showPreview={showPreview}>
        <p>How it will appear:</p>
        <div className="mt-2 space-y-2">
          {statements.map((statement) => (
            <div key={statement.id} className="flex items-start space-x-3 p-3 border border-theme-border-primary rounded bg-theme-bg-primary">
              <Checkbox
                disabled
                checked={false}
                onChange={() => {}}
                label=""
                className="mt-1"
              />
              <div className="min-w-0 space-y-2 text-sm">
                {getMediaUrl(statement.media) && (
                  <img
                    src={getMediaUrl(statement.media)}
                    alt={`Statement ${statement.id} media`}
                    className="h-10 w-auto rounded-md border border-theme-border-primary"
                  />
                )}
                {!getMediaUrl(statement.media) && statement.media?.assetId && !statement.text?.trim() && (
                  <span className="text-theme-text-tertiary">Image unavailable.</span>
                )}
                {statement.text || (getMediaUrl(statement.media) ? 'Image statement' : `Statement ${statement.id}`)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-theme-text-tertiary">
          Check the statements that are compliant.
        </p>
      </QuestionPreviewSection>

    </div>
  );
};

const getNextStatementId = (statements: ComplianceStatement[]) =>
  Math.max(0, ...statements.map(statement => statement.id)) + 1;

const createDefaultStatement = (id: number): ComplianceStatement => ({
  id,
  text: '',
  compliant: id === 1,
});

const normalizeInitialStatements = (statements: ComplianceStatement[] = []) => {
  const normalized = statements.slice(0, MAX_COMPLIANCE_STATEMENTS);

  while (normalized.length < MIN_COMPLIANCE_STATEMENTS) {
    normalized.push(createDefaultStatement(getNextStatementId(normalized)));
  }

  return normalized;
};

export default ComplianceEditor; 
