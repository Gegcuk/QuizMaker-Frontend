// ---------------------------------------------------------------------------
// Validation utilities for form fields
// ---------------------------------------------------------------------------

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
};

// Validation functions
export const validateField = (value: any, rules: ValidationRule, fieldName: string): ValidationResult => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return {
      isValid: false,
      message: `${fieldName} is required`
    };
  }
  
  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: true };
  }
  
  // Min length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return {
      isValid: false,
      message: `${fieldName} must be at least ${rules.minLength} characters`
    };
  }
  
  // Max length validation
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return {
      isValid: false,
      message: `${fieldName} must be no more than ${rules.maxLength} characters`
    };
  }
  
  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return {
      isValid: false,
      message: `${fieldName} format is invalid`
    };
  }
  
  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return {
        isValid: false,
        message: customError
      };
    }
  }
  
  return { isValid: true };
};

// Common validation rules
export const commonRules = {
  email: {
    required: true,
    pattern: patterns.email
  },
  password: {
    required: true,
    minLength: 8,
    pattern: patterns.password
  },
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: patterns.username
  },
  phone: {
    pattern: patterns.phone
  },
  url: {
    pattern: patterns.url
  }
};

// Form validation helper
export const validateForm = (values: Record<string, any>, rules: Record<string, ValidationRule>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  Object.entries(rules).forEach(([fieldName, fieldRules]) => {
    const result = validateField(values[fieldName], fieldRules, fieldName);
    if (!result.isValid && result.message) {
      errors[fieldName] = result.message;
    }
  });
  
  return errors;
};
