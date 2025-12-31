// src/features/bug-report/components/BugReportEditModal.tsx
// ---------------------------------------------------------------------------
// Modal for editing bug reports (admin only)
// Based on BugReportModal pattern
// ---------------------------------------------------------------------------

import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Form,
  FormField,
  Textarea,
  Button,
  useToast,
  Dropdown,
} from '@/components';
import type { BugReportDto, BugSeverity, BugReportStatus, UpdateBugReportRequest } from '@/types';
import { bugReportService } from '../services/bug-report.service';
import { useFormContext } from '@/components/ui/Form';

type BugReportEditFormValues = {
  message: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  clientVersion?: string;
  severity: BugSeverity;
  status: BugReportStatus;
  internalNote?: string;
};

interface BugReportEditModalProps {
  isOpen: boolean;
  bugReport: BugReportDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const FormTextarea: React.FC<{
  name: keyof BugReportEditFormValues;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  helperText?: string;
  skipBlurValidation?: boolean;
}> = ({ name, label, placeholder, required, rows = 4, helperText, skipBlurValidation = false }) => {
  const { form } = useFormContext();
  const { register, formState: { errors } } = form;
  const registered = register(name);
  const { onChange: originalOnChange, onBlur: originalOnBlur, ...restRegistered } = registered;
  const fieldProps = {
    ...restRegistered,
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Create a synthetic event that matches HTMLInputElement for the form handler
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          type: 'text',
          value: e.target.value,
        } as unknown as HTMLInputElement,
        currentTarget: e.currentTarget as unknown as HTMLInputElement,
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      originalOnChange(syntheticEvent);
    },
    onBlur: skipBlurValidation
      ? undefined
      : (e: React.FocusEvent<HTMLTextAreaElement>) => {
          originalOnBlur();
        },
  };
  const fieldError = errors[name as string]?.message;

  return (
    <Textarea
      {...fieldProps}
      label={label}
      placeholder={placeholder}
      required={required}
      rows={rows}
      error={fieldError}
      helperText={helperText}
      autoResize
      minRows={rows}
    />
  );
};

const SeverityDropdown: React.FC = () => {
  const { form } = useFormContext();
  const current = form.getValues().severity;

  return (
    <Dropdown
      label="Severity"
      options={[
        { label: 'Unspecified', value: 'UNSPECIFIED' },
        { label: 'Low', value: 'LOW' },
        { label: 'Medium', value: 'MEDIUM' },
        { label: 'High', value: 'HIGH' },
        { label: 'Critical', value: 'CRITICAL' },
      ]}
      value={current}
      onChange={(value) => form.setValue('severity', value as BugSeverity)}
      placement="top"
      fullWidth
    />
  );
};

const StatusDropdown: React.FC = () => {
  const { form } = useFormContext();
  const current = form.getValues().status;

  return (
    <Dropdown
      label="Status"
      options={[
        { label: 'Open', value: 'OPEN' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Resolved', value: 'RESOLVED' },
        { label: 'Dismissed', value: 'DISMISSED' },
      ]}
      value={current}
      onChange={(value) => form.setValue('status', value as BugReportStatus)}
      placement="top"
      fullWidth
    />
  );
};

const BugReportEditModal: React.FC<BugReportEditModalProps> = ({
  isOpen,
  bugReport,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaults = useMemo(() => {
    if (!bugReport) {
      return {
        message: '',
        reporterName: '',
        reporterEmail: '',
        pageUrl: '',
        stepsToReproduce: '',
        clientVersion: '',
        severity: 'UNSPECIFIED' as BugSeverity,
        status: 'OPEN' as BugReportStatus,
        internalNote: '',
      };
    }

    return {
      message: bugReport.message || '',
      reporterName: bugReport.reporterName || '',
      reporterEmail: bugReport.reporterEmail || '',
      pageUrl: bugReport.pageUrl || '',
      stepsToReproduce: bugReport.stepsToReproduce || '',
      clientVersion: bugReport.clientVersion || '',
      severity: bugReport.severity || 'UNSPECIFIED',
      status: bugReport.status || 'OPEN',
      internalNote: bugReport.internalNote || '',
    };
  }, [bugReport, isOpen]);

  const formKey = useMemo(() => `${bugReport?.id || 'new'}-${isOpen ? 'open' : 'closed'}`, [bugReport?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setFormError(null);
  }, [isOpen]);

  const handleSubmit = async (data: BugReportEditFormValues) => {
    if (!bugReport) return;

    setFormError(null);

    if (!data.message || !data.message.trim()) {
      setFormError('Message is required.');
      return;
    }

    const payload: UpdateBugReportRequest = {
      message: data.message.trim(),
      reporterName: data.reporterName?.trim() || undefined,
      reporterEmail: data.reporterEmail?.trim() || undefined,
      pageUrl: data.pageUrl?.trim() || undefined,
      stepsToReproduce: data.stepsToReproduce?.trim() || undefined,
      clientVersion: data.clientVersion?.trim() || undefined,
      severity: data.severity,
      status: data.status,
      internalNote: data.internalNote?.trim() || undefined,
    };

    try {
      setSubmitting(true);
      await bugReportService.updateBugReport(bugReport.id, payload);
      addToast({
        title: 'Bug report updated',
        message: 'The bug report has been successfully updated.',
        type: 'success',
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Unable to update bug report right now.';
      setFormError(message);
      addToast({
        title: 'Could not update report',
        message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!bugReport) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Bug Report"
      size="lg"
    >
      <div className="space-y-4">
        <Form<BugReportEditFormValues>
          onSubmit={handleSubmit}
          defaultValues={defaults}
          key={formKey}
          className="space-y-5"
          name="bug-report-edit-form"
        >
          <FormTextarea
            name="message"
            label="What happened?"
            placeholder="Example: Quiz page crashed when I clicked save after adding an image."
            required
            helperText="Required"
            skipBlurValidation
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <FormField
              name="reporterName"
              label="Name"
              placeholder="Optional"
            />
            <FormField
              name="reporterEmail"
              type="email"
              label="Email"
              placeholder="Contact email"
            />
          </div>

          <FormField
            name="pageUrl"
            type="url"
            label="Page URL"
            placeholder="https://app.quizzence.com/..."
          />

          <FormTextarea
            name="stepsToReproduce"
            label="Steps to reproduce"
            placeholder="1) Open quiz editor 2) Add image 3) Click save..."
            rows={3}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <FormField
              name="clientVersion"
              label="Client/version"
              placeholder="Chrome 124, macOS"
            />
            <SeverityDropdown />
          </div>

          <StatusDropdown />

          <FormTextarea
            name="internalNote"
            label="Internal Note"
            placeholder="Internal notes for administrators (not visible to reporter)"
            rows={3}
            helperText="This note is only visible to administrators"
          />

          {formError && (
            <div className="text-sm text-theme-interactive-danger bg-theme-bg-secondary border border-theme-border-danger/70 rounded-md px-3 py-2">
              {formError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover"
            >
              Update report
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default BugReportEditModal;
