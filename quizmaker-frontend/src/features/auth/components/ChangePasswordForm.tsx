import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Button, Input } from '@/components';
import { authService } from '@/services';
import { getErrorMessage } from '@/utils/errorUtils';

interface ChangePasswordFormProps {
  className?: string;
  onSuccess?: () => void;
}

interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

const ChangePasswordForm = ({ className = '', onSuccess }: ChangePasswordFormProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
      general: undefined,
    }));
    setSuccessMessage(null);
  };

  const validateForm = (): FormErrors => {
    const validationErrors: FormErrors = {};

    if (!currentPassword) {
      validationErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      validationErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8 || newPassword.length > 100) {
      validationErrors.newPassword = 'New password must be between 8 and 100 characters';
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      validationErrors.confirmPassword = 'New passwords do not match';
    }

    return validationErrors;
  };

  const handleCurrentPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCurrentPassword(event.target.value);
    clearFieldError('currentPassword');
  };

  const handleNewPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewPassword(event.target.value);
    clearFieldError('newPassword');
  };

  const handleConfirmPasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(event.target.value);
    clearFieldError('confirmPassword');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setSuccessMessage(null);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.changePassword({ currentPassword, newPassword });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(response.message || 'Password updated successfully.');
      onSuccess?.();
    } catch (error) {
      setErrors({ general: getErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={`max-w-xl space-y-4 ${className}`} noValidate onSubmit={handleSubmit}>
      {errors.general && <Alert type="error">{errors.general}</Alert>}
      {successMessage && <Alert type="success">{successMessage}</Alert>}

      <Input
        id="current-password"
        name="currentPassword"
        type="password"
        label="Current password"
        autoComplete="current-password"
        required
        fullWidth
        value={currentPassword}
        onChange={handleCurrentPasswordChange}
        disabled={isSubmitting}
        error={errors.currentPassword}
      />

      <Input
        id="new-password"
        name="newPassword"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        fullWidth
        minLength={8}
        maxLength={100}
        value={newPassword}
        onChange={handleNewPasswordChange}
        disabled={isSubmitting}
        helperText="Use 8 to 100 characters."
        error={errors.newPassword}
      />

      <Input
        id="confirm-new-password"
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        fullWidth
        value={confirmPassword}
        onChange={handleConfirmPasswordChange}
        disabled={isSubmitting}
        error={errors.confirmPassword}
      />

      <div className="flex justify-end">
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting}>
          {isSubmitting ? 'Updating password...' : 'Update password'}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
