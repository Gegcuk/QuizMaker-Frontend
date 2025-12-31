import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth';
import {
  Modal,
  Form,
  FormField,
  Textarea,
  Button,
  useToast,
  Dropdown,
} from '@/components';
import type { BugSeverity, CreateBugReportRequest } from '@/types';
import { bugReportService } from '../services/bug-report.service';
import { useFormContext } from '@/components/ui/Form';

type BugReportFormValues = {
  message: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  clientVersion?: string;
  severity: BugSeverity;
};

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FormTextarea: React.FC<{
  name: keyof BugReportFormValues;
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
          // Create a synthetic event that matches HTMLInputElement for the form handler
          const syntheticEvent = {
            ...e,
            target: {
              ...e.target,
              name: registered.name,
              type: 'text',
            } as unknown as HTMLInputElement,
            currentTarget: e.currentTarget as unknown as HTMLInputElement,
          } as unknown as React.FocusEvent<HTMLInputElement>;
          // Pass synthetic event to form's onBlur for consistency with React's event system
          originalOnBlur(syntheticEvent);
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

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [includeDetails, setIncludeDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaults = useMemo(() => ({
    message: '',
    reporterName: user?.username || '',
    reporterEmail: user?.email || '',
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    stepsToReproduce: '',
    clientVersion: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    severity: 'UNSPECIFIED' as BugSeverity,
  }), [user?.username, user?.email, isOpen]);

  const formKey = useMemo(() => `${user?.id || 'guest'}-${isOpen ? 'open' : 'closed'}`, [user?.id, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setIncludeDetails(false);
    setFormError(null);
  }, [isOpen]);

  const handleSubmit = async (data: BugReportFormValues) => {
    setFormError(null);

    if (!data.message || !data.message.trim()) {
      setFormError('Please add a quick note about what went wrong.');
      return;
    }

    const payload: CreateBugReportRequest = {
      message: data.message.trim(),
      reporterName: data.reporterName?.trim() || user?.username || undefined,
      reporterEmail: (data.reporterEmail?.trim() || user?.email || '').trim() || undefined,
      pageUrl: (data.pageUrl || defaults.pageUrl).trim() || undefined,
      stepsToReproduce: includeDetails ? data.stepsToReproduce?.trim() || undefined : undefined,
      clientVersion: includeDetails
        ? data.clientVersion?.trim() || defaults.clientVersion || undefined
        : undefined,
      severity: includeDetails ? data.severity : 'UNSPECIFIED',
    };

    if (payload.severity === 'UNSPECIFIED') {
      delete (payload as any).severity;
    }

    try {
      setSubmitting(true);
      await bugReportService.submitBugReport(payload);
      addToast({
        title: 'Thanks for reporting!',
        message: 'We logged your note and will investigate.',
        type: 'success',
      });
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Unable to submit bug report right now.';
      setFormError(message);
      addToast({
        title: 'Could not send report',
        message,
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Found a bug?"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4">
          <p className="text-sm text-theme-text-secondary">
            Keep it simple: drop a sentence about what broke.
          </p>
        </div>

        <Form<BugReportFormValues>
          onSubmit={handleSubmit}
          defaultValues={defaults}
          key={formKey}
          className="space-y-5"
          name="bug-report-form"
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
              placeholder="We’ll attach your account email if left blank"
            />
          </div>

          <button
            type="button"
            onClick={() => setIncludeDetails((prev) => !prev)}
            className="w-full flex items-center justify-between rounded-lg border border-theme-border-primary bg-theme-bg-secondary px-4 py-3 text-left hover:bg-theme-bg-tertiary transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-theme-text-primary">Add more detail</p>
              <p className="text-xs text-theme-text-secondary">Steps, URL, severity if you want.</p>
            </div>
            <svg
              className={`h-5 w-5 text-theme-text-secondary transition-transform ${includeDetails ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {includeDetails && (
            <div className="space-y-3">
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
            </div>
          )}

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
              Send report
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default BugReportModal;
