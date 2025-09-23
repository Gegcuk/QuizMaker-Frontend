import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Breadcrumb } from './';
import { ActionType } from './types';

// Simple icons (no external dependencies)
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Predefined action types with icons
export const ActionIcons = {
  create: PlusIcon,
  edit: PencilIcon,
  delete: TrashIcon,
  share: ShareIcon,
  view: EyeIcon,
  download: DownloadIcon,
} as const;

// ActionType is now imported from './types'

export interface ActionButton {
  label: string;
  type?: ActionType;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  confirmMessage?: string; // For delete actions
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ActionButton[];
  showBreadcrumb?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  onBack?: () => void;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions = [],
  showBreadcrumb = false,
  showBackButton = false,
  backTo,
  onBack,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  const handleActionClick = (action: ActionButton) => {
    if (action.confirmMessage && !window.confirm(action.confirmMessage)) {
      return;
    }
    
    if (action.onClick) {
      action.onClick();
    }
  };

  const renderActionButton = (action: ActionButton, index: number) => {
    const ActionIcon = action.icon || (action.type ? ActionIcons[action.type] : null);
    
    const baseClasses = "inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    const variantClasses = {
      primary: "bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:ring-theme-interactive-primary",
      secondary: "bg-theme-bg-tertiary text-theme-text-primary hover:bg-theme-bg-secondary focus:ring-theme-border-primary",
      danger: "bg-theme-interactive-danger text-theme-text-inverse hover:bg-red-700 focus:ring-theme-interactive-danger",
      success: "bg-theme-interactive-success text-theme-text-inverse hover:bg-green-700 focus:ring-theme-interactive-success",
    };

    const buttonClasses = `${baseClasses} ${variantClasses[action.variant || 'secondary']} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

    const buttonContent = (
      <>
        {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
        <span className="hidden sm:inline">{action.label}</span>
        <span className="sm:hidden">{action.label}</span>
      </>
    );

    if (action.href) {
      return (
        <Link
          key={index}
          to={action.href}
          className={buttonClasses}
          onClick={() => handleActionClick(action)}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <button
        key={index}
        type="button"
        className={buttonClasses}
        onClick={() => handleActionClick(action)}
        disabled={action.disabled}
      >
        {buttonContent}
      </button>
    );
  };

  return (
    <div className={`bg-theme-bg-primary border-b border-theme-border-primary ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        {showBreadcrumb && (
          <div className="mb-4">
            <Breadcrumb />
          </div>
        )}

        {/* Header Content */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Title Section */}
          <div className="flex items-center mb-4 sm:mb-0">
            {/* Back Button */}
            {showBackButton && (
              <button
                onClick={handleBack}
                className="mr-4 p-2 text-theme-text-tertiary hover:text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md transition-colors duration-200"
                aria-label="Go back"
              >
                <ArrowLeftIcon />
              </button>
            )}

            {/* Icon */}
            {Icon && (
              <div className="mr-3 p-2 bg-theme-bg-tertiary text-theme-interactive-primary rounded-lg">
                <Icon className="w-6 h-6" />
              </div>
            )}

            {/* Title and Subtitle */}
            <div>
              <h1 className="text-2xl font-bold text-theme-text-primary sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-theme-text-secondary sm:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {actions.map((action, index) => renderActionButton(action, index))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader; 