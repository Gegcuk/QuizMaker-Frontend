import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FieldValues {
  [key: string]: any;
}

export interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, { message?: string }>;
}

export interface UseFormReturn<T extends FieldValues> {
  register: (name: string) => {
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e?: React.FocusEvent<HTMLInputElement>) => void;
  };
  handleSubmit: (onSubmit: (data: T) => void) => (e: React.FormEvent) => void;
  formState: FormState;
  setValue: (name: string, value: any) => void;
  getValues: () => T;
  reset: (values?: Partial<T>) => void;
  setError: (name: string, error: { message: string }) => void;
  clearErrors: (name?: string) => void;
}

export type SubmitHandler<T> = (data: T) => void | Promise<void>;

export interface FormContextValue {
  form: UseFormReturn<FieldValues>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a Form component');
  }
  return context;
};

const useForm = <T extends FieldValues>(defaultValues?: Partial<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(defaultValues as T);
  const [errors, setErrors] = useState<Record<string, { message?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Field validation function
  const validateField = (name: string, value: any) => {
    // Basic validation rules
    const fieldErrors: { message?: string } = {};
    
    if (typeof value === 'string' && value.trim() === '') {
      fieldErrors.message = `${name} is required`;
    } else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      fieldErrors.message = 'Please enter a valid email address';
    } else if (name === 'password' && value && value.length < 6) {
      fieldErrors.message = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const register = (name: string) => ({
    name,
    value: values[name] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setValues(prev => ({ ...prev, [name]: value }));
      setIsDirty(true);
      if (errors[name]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    onBlur: (e?: React.FocusEvent<HTMLInputElement>) => {
      // Trigger validation on blur
      // Event parameter is optional for compatibility with React's event system
      validateField(name, values[name]);
    }
  });

  const handleSubmit = (onSubmit: (data: T) => void) => async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({}); // Clear previous errors
    
    try {
      await Promise.resolve(onSubmit(values));
    } catch (error: any) {
      // Handle async submission errors
      const errorMessage = error?.message || 'An error occurred while submitting the form';
      setErrors({ general: { message: errorMessage } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const setValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const getValues = () => values;

  const reset = (newValues?: Partial<T>) => {
    setValues(newValues as T || defaultValues as T);
    setErrors({});
    setIsDirty(false);
  };

  const setError = (name: string, error: { message: string }) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const clearErrors = (name?: string) => {
    if (name) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    } else {
      setErrors({});
    }
  };

  return {
    register,
    handleSubmit,
    formState: {
      isSubmitting,
      isDirty,
      isValid: Object.keys(errors).length === 0,
      errors
    },
    setValue,
    getValues,
    reset,
    setError,
    clearErrors
  };
};

export interface FormProps<T extends FieldValues = FieldValues> {
  children: React.ReactNode;
  onSubmit: SubmitHandler<T>;
  defaultValues?: Partial<T>;
  mode?: 'onBlur' | 'onChange' | 'onSubmit' | 'onTouched' | 'all';
  reValidateMode?: 'onBlur' | 'onChange' | 'onSubmit';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  showValidationErrors?: boolean;
  name?: string;
}

const Form = <T extends FieldValues = FieldValues>({
  children,
  onSubmit,
  defaultValues,
  className = '',
  disabled = false,
  loading = false,
  showValidationErrors = true,
  name
}: FormProps<T>) => {
  const form = useForm<T>(defaultValues);

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty, isValid, errors }
  } = form;

  const onSubmitHandler = useCallback(
    async (data: T) => {
      if (disabled || loading) return;
      await onSubmit(data);
    },
    [onSubmit, disabled, loading]
  );

  const contextValue: FormContextValue = {
    form: form as UseFormReturn<FieldValues>,
    isSubmitting: isSubmitting || loading,
    isDirty,
    isValid
  };

  return (
    <FormContext.Provider value={contextValue}>
      <form
        name={name}
        onSubmit={handleSubmit(onSubmitHandler)}
        className={`space-y-6 ${className}`}
        noValidate
      >
        {children}
        
        {showValidationErrors && Object.keys(errors).length > 0 && (
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-theme-interactive-danger"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-theme-interactive-danger">
                  Please fix the following errors:
                </h3>
                <div className="mt-2 text-sm text-theme-interactive-danger">
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(errors).map(([fieldName, error]) => (
                      <li key={fieldName}>
                        {error?.message || `${fieldName} is invalid`}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </FormContext.Provider>
  );
};

export default Form; 