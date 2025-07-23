import React, { forwardRef } from 'react';
import { useFormContext } from './Form';
import ValidationMessage from './ValidationMessage';

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  children: React.ReactElement;
  helperText?: string;
  className?: string;
  error?: string;
  touched?: boolean;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  name,
  label,
  required = false,
  children,
  helperText,
  className = '',
  error,
  touched = false
}, ref) => {
  const { form } = useFormContext();
  const fieldError = form.formState.errors[name];
  const showError = (error || fieldError?.message) && touched;

  const enhancedChildren = React.cloneElement(children, {
    ...(children.props || {}),
    ...form.register(name),
    'aria-describedby': showError ? `${name}-error` : helperText ? `${name}-helper` : undefined,
    'aria-invalid': showError ? 'true' : undefined
  } as any);

  return (
    <div ref={ref} className={`space-y-1 ${className}`}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {enhancedChildren}
      
      {helperText && !showError && (
        <p
          id={`${name}-helper`}
          className="text-sm text-gray-500"
        >
          {helperText}
        </p>
      )}
      
      {showError && (
        <ValidationMessage
          id={`${name}-error`}
          message={error || fieldError?.message}
        />
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField; 