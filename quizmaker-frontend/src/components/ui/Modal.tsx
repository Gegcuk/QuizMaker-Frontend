import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = ''
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-3xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  // Always render modal in portal (it handles visibility internally via conditional)
  // Ensure modal is always mounted but only visible when isOpen is true
  if (!isOpen) return null;
  
  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 9999,
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div className="flex min-h-screen items-start sm:items-center justify-center p-3 sm:p-4 md:p-6">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-theme-bg-overlay bg-opacity-50 transition-opacity"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0
          }}
          onClick={handleBackdropClick}
        />
        
        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative bg-theme-bg-primary rounded-lg shadow-theme w-full mx-2 sm:mx-4 ${sizeClasses[size]} ${className}`}
          style={{ 
            position: 'relative',
            maxHeight: 'calc(100vh - 3rem)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-medium text-theme-text-primary"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-theme-text-tertiary hover:text-theme-text-secondary transition-colors duration-200"
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  // Always render modal via portal when isOpen is true
  return createPortal(modalContent, document.body);
};

export default Modal; 
