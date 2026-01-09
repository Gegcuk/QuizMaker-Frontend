import React from 'react';
import { useFormContext } from './Form';
import Input from './Input';
import { logger } from '@/utils';

export interface FormFieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  rightIcon?: React.ReactNode;
  rightIconClickable?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any, formData?: any) => string | null;
  };
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  helperText,
  className = '',
  disabled = false,
  autoComplete,
  rightIcon,
  rightIconClickable = false,
  validation = {}
}) => {
  const { form } = useFormContext();
  const { register, formState: { errors } } = form;
  
  const fieldProps = register(name);
  const fieldError = errors[name]?.message;
  
  // Enhanced validation on blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    let errorMessage: string | null = null;
    
    // Required validation
    if (validation.required && (!value || value.trim() === '')) {
      errorMessage = `${label || name} is required`;
    }
    // Min length validation
    else if (validation.minLength && value && value.length < validation.minLength) {
      errorMessage = `${label || name} must be at least ${validation.minLength} characters`;
    }
    // Max length validation
    else if (validation.maxLength && value && value.length > validation.maxLength) {
      errorMessage = `${label || name} must be no more than ${validation.maxLength} characters`;
    }
    // Custom validation
    if (!errorMessage && validation.custom) {
      errorMessage = validation.custom(value, form.getValues());
    }
    // Pattern validation
    if (!errorMessage && validation.pattern && value && !validation.pattern.test(value)) {
      errorMessage = `${label || name} format is invalid`;
    }
    
    if (errorMessage) {
      form.setError(name, { message: errorMessage });
    } else {
      form.clearErrors(name);
    }
    
    // Call original onBlur
    fieldProps.onBlur();
  };
  
  // Log validation errors for debugging
  if (fieldError) {
    logger.debug('Form field validation error', 'FormField', { name, error: fieldError });
  }
  
  return (
    <div className={className}>
      <Input
        {...fieldProps}
        type={type}
        label={label}
        placeholder={placeholder}
        error={fieldError}
        helperText={helperText}
        disabled={disabled}
        autoComplete={autoComplete}
        rightIcon={rightIcon}
        rightIconClickable={rightIconClickable}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
        pattern={validation.pattern?.source}
        onBlur={handleBlur}
        required={required}
      />
    </div>
  );
};

export default FormField;
