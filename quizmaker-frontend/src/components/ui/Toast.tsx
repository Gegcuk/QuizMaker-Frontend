import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { getErrorMessage, getErrorTitle } from '@/utils/errorUtils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  message?: string;
  error?: any; // Auto-format errors (ProblemDetails, Axios errors, strings)
  type?: ToastType;
  duration?: number; // ms
}

interface ToastInternal {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextValue {
  addToast: (opts: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastInternal[]>([]);
  const timers = useRef<Record<string, number>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
      timers.current = {};
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const addToast = useCallback((opts: ToastOptions) => {
    // Use crypto.randomUUID for better ID generation, fallback to Math.random for older browsers
    const id = opts.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    
    // Auto-format error if provided
    let message = opts.message || '';
    let title = opts.title || '';
    
    if (opts.error) {
      message = getErrorMessage(opts.error);
      const errorTitle = getErrorTitle(opts.error);
      if (errorTitle && !title) {
        title = errorTitle;
      }
    }
    
    const toast: ToastInternal = {
      id,
      title,
      message,
      type: opts.type || 'info',
      duration: opts.duration ?? 3000,
    };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      timers.current[id] = window.setTimeout(() => removeToast(id), toast.duration);
    }
    return id;
  }, [removeToast]);

  const clearToasts = useCallback(() => {
    setToasts([]);
    Object.values(timers.current).forEach((t) => window.clearTimeout(t));
    timers.current = {};
  }, []);

  const value = useMemo(() => ({ addToast, removeToast, clearToasts }), [addToast, removeToast, clearToasts]);

  const typeStyles: Record<ToastType, string> = {
    success: 'bg-theme-bg-success border-theme-border-success text-theme-text-primary',
    error: 'bg-theme-bg-danger border-theme-border-danger text-theme-text-primary',
    info: 'bg-theme-bg-info border-theme-border-info text-theme-text-primary',
    warning: 'bg-theme-bg-warning border-theme-border-warning text-theme-text-primary',
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 w-80 sm:w-96">
        {toasts.map((t) => (
          <div key={t.id} className={`border rounded-lg shadow-lg p-4 ${typeStyles[t.type]}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold mb-1">{t.title}</p>}
                <p className="text-sm break-words">{t.message}</p>
              </div>
              <button
                aria-label="Close"
                className="flex-shrink-0 text-theme-text-secondary hover:text-theme-text-primary transition-colors p-1 hover:bg-theme-bg-tertiary rounded-md"
                onClick={() => removeToast(t.id)}
                type="button"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

