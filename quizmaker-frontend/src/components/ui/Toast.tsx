import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number; // ms
}

interface ToastInternal extends Required<Omit<ToastOptions, 'id'>> {
  id: string;
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
    const toast: ToastInternal = {
      id,
      title: opts.title || '',
      message: opts.message,
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
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 w-80">
        {toasts.map((t) => (
          <div key={t.id} className={`border rounded-md shadow-sm p-3 ${typeStyles[t.type]}`}>
            <div className="flex items-start">
              <div className="flex-1 min-w-0">
                {t.title && <p className="text-sm font-semibold mb-0.5">{t.title}</p>}
                <p className="text-sm break-words">{t.message}</p>
              </div>
              <button
                aria-label="Close toast"
                className="ml-3 text-current/70 hover:text-current"
                onClick={() => removeToast(t.id)}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 8.586L3.757 2.343 2.343 3.757 8.586 10l-6.243 6.243 1.414 1.414L10 11.414l6.243 6.243 1.414-1.414L11.414 10l6.243-6.243-1.414-1.414L10 8.586z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

