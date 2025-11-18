import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getErrorMessage, getErrorTitle, isProblemDetails } from '@/utils/errorUtils';

export interface AlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children?: React.ReactNode;
  error?: any; // Auto-format errors (ProblemDetails, Axios errors, strings)
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
  showIcon?: boolean;
  autoClearOnNavigation?: boolean; // Auto-dismiss when route changes
  autoDismissOnInput?: boolean; // Auto-dismiss when user types in any input/textarea (default: true for errors)
  autoDismissDelay?: number; // Auto-dismiss after X milliseconds (0 = disabled)
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title: titleProp,
  children,
  error,
  dismissible = false,
  onDismiss,
  className = '',
  showIcon = true,
  autoClearOnNavigation = true, // Default to true for better UX
  autoDismissOnInput = type === 'error', // Auto-dismiss on input for errors by default
  autoDismissDelay = 0 // Disabled by default
}) => {
  // Auto-format error if provided
  const errorMessage = error ? getErrorMessage(error) : null;
  const errorTitle = error ? getErrorTitle(error) : null;
  
  // Determine final title and content
  const title = titleProp || errorTitle;
  const content = error ? errorMessage : children;

  // Initialize visibility based on whether we have content
  const hasContent = !!(error || children);
  const [isVisible, setIsVisible] = useState(hasContent);
  const location = useLocation();
  const previousPathnameRef = useRef<string>(location.pathname);
  // Track previous error and children to detect when they're cleared
  const previousErrorRef = useRef<any>(error);
  const previousChildrenRef = useRef<React.ReactNode>(children);

  // Auto-dismiss when navigation occurs (if enabled)
  useEffect(() => {
    if (autoClearOnNavigation && previousPathnameRef.current !== location.pathname) {
      previousPathnameRef.current = location.pathname;
      setIsVisible(false);
      onDismiss?.();
      previousErrorRef.current = null;
      previousChildrenRef.current = null;
    }
  }, [location.pathname, autoClearOnNavigation, onDismiss]);

  // Auto-dismiss when content is cleared (error/children becomes null/empty/undefined)
  useEffect(() => {
    const hadContentBefore = !!(previousErrorRef.current || previousChildrenRef.current);
    const hasContentNow = !!(error || children);
    
    // Normalize content for comparison (handle strings, objects, etc.)
    const previousContentStr = String(previousErrorRef.current || previousChildrenRef.current || '');
    const currentContentStr = String(error || children || '');
    
    // If we had content before and now we don't, content was cleared by parent - hide alert
    if (hadContentBefore && !hasContentNow) {
      setIsVisible(false);
      onDismiss?.();
    } 
    // If content changed from one value to another (not cleared), show the alert
    else if (hasContentNow && previousContentStr !== currentContentStr) {
      setIsVisible(true);
    }
    // If content is the same string but truthy, keep current visibility state
    // (don't hide if it was showing, don't show if it was hidden)
    
    // Update previous content references
    previousErrorRef.current = error;
    previousChildrenRef.current = children;
  }, [error, children, onDismiss]);

  // Additional effect: Hide alert if children is empty string (even if truthy)
  useEffect(() => {
    // Handle case where children might be empty string (which is truthy but represents no content)
    if (typeof children === 'string' && children.trim() === '' && !error) {
      setIsVisible(false);
      onDismiss?.();
    }
  }, [children, error, onDismiss]);

  // Auto-dismiss on user actions (input, form submit, button clicks)
  useEffect(() => {
    if (!autoDismissOnInput || !isVisible) return;

    const dismissAlert = () => {
      // Use requestAnimationFrame to ensure the input value is rendered first
      requestAnimationFrame(() => {
        setIsVisible(false);
        onDismiss?.();
      });
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if it's an input, textarea, or select element
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const inputElement = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        // Only dismiss if the field actually has a value (user has typed something)
        if (inputElement.value && inputElement.value.length > 0) {
          // Use double requestAnimationFrame to ensure input value is fully rendered
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsVisible(false);
              onDismiss?.();
            });
          });
        }
      }
    };

    const handleFormSubmit = (e: Event) => {
      // Dismiss immediately on form submission
      dismissAlert();
    };

    const handleButtonClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      
      // Skip if clicking inside the alert itself (e.g., dismiss button)
      if (target.closest('[role="alert"]') || target.closest('.rounded-md.border')) {
        return;
      }
      
      // Dismiss on submit buttons or buttons inside forms (user taking action)
      if (button && (button.type === 'submit' || button.closest('form'))) {
        // Small delay to let the action proceed
        setTimeout(() => {
          dismissAlert();
        }, 100);
      }
    };

    // Listen for various user actions
    // Use capture phase to catch events early, but dismiss after current frame
    document.addEventListener('input', handleInput, true);
    document.addEventListener('change', handleInput, true);
    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('click', handleButtonClick, true);

    return () => {
      document.removeEventListener('input', handleInput, true);
      document.removeEventListener('change', handleInput, true);
      document.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('click', handleButtonClick, true);
    };
  }, [autoDismissOnInput, isVisible, onDismiss]);

  // Auto-dismiss after delay (if configured)
  useEffect(() => {
    if (!autoDismissDelay || !isVisible || autoDismissDelay <= 0) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, autoDismissDelay);

    return () => clearTimeout(timer);
  }, [autoDismissDelay, isVisible, onDismiss, error, children]); // Reset timer when content changes

  const typeConfig = {
    success: {
      bg: 'bg-theme-bg-success',
      border: 'border-theme-border-success',
      text: 'text-theme-interactive-success',
      icon: (
        <svg className="h-5 w-5 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    },
    error: {
      bg: 'bg-theme-bg-danger',
      border: 'border-theme-border-danger',
      text: 'text-theme-interactive-danger',
      icon: (
        <svg className="h-5 w-5 text-theme-interactive-danger" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )
    },
    warning: {
      bg: 'bg-theme-bg-warning',
      border: 'border-theme-border-warning',
      text: 'text-theme-interactive-warning',
      icon: (
        <svg className="h-5 w-5 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      )
    },
    info: {
      bg: 'bg-theme-bg-info',
      border: 'border-theme-border-info',
      text: 'text-theme-interactive-info',
      icon: (
        <svg className="h-5 w-5 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      )
    }
  };

  const config = typeConfig[type];

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className={`rounded-md p-4 border ${config.bg} ${config.border} ${className}`}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            {config.icon}
          </div>
        )}
        <div className={`flex-1 ${showIcon ? 'ml-3' : ''}`}>
          {title && (
            <h3 className={`text-sm font-medium ${config.text}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${config.text} ${title ? 'mt-1' : ''}`}>
            {content}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleDismiss}
              className={`flex-shrink-0 ${config.text} hover:bg-theme-bg-tertiary transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary`}
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert; 