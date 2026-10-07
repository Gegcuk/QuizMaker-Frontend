import React, { useId } from 'react';
import { ExclamationTriangleIcon, InformationCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: { Icon: TrashIcon, iconClass: 'text-theme-interactive-danger' },
  warning: { Icon: ExclamationTriangleIcon, iconClass: 'text-theme-interactive-warning' },
  info: { Icon: InformationCircleIcon, iconClass: 'text-theme-interactive-info' },
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false
}) => {
  const messageId = useId();

  if (!isOpen) return null;

  const { Icon, iconClass } = variantStyles[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false}
      closeOnEscape={!isLoading}
      closeOnBackdrop={!isLoading}
      ariaDescribedBy={messageId}
      initialFocusSelector="[data-confirmation-cancel]"
      backdropTestId="confirmation-modal-backdrop"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-theme-bg-tertiary" aria-hidden="true">
            <Icon className={`h-6 w-6 ${iconClass}`} />
          </div>
          <p id={messageId} className="min-w-0 break-words text-sm leading-6 text-theme-text-secondary">
            {message}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            data-confirmation-cancel
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            fullWidth
            className="min-h-11 min-w-0 whitespace-normal break-words"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            loading={isLoading}
            variant={variant === 'danger' ? 'danger' : 'primary'}
            fullWidth
            className="min-h-11 min-w-0 whitespace-normal break-words"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
