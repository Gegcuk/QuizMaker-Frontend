// src/components/ui/Card.tsx
// ---------------------------------------------------------------------------
// Base Card component for consistent card styling across the application
// Provides composition slots for header, body, footer, and actions
// ---------------------------------------------------------------------------

import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardActionsProps {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'between' | 'center';
  className?: string;
}

// Main Card Component
const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  selected = false,
  className = '',
  onClick
}) => {
  const baseClasses = 'bg-theme-bg-primary rounded-lg overflow-hidden transition-all duration-200';

  const variantClasses = {
    default: 'border border-theme-border-primary',
    elevated: 'shadow-md',
    outlined: 'border-2 border-theme-border-primary',
    interactive: 'border border-theme-border-primary shadow-md hover:shadow-lg cursor-pointer'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  };

  const hoverClass = hoverable && variant !== 'interactive' ? 'hover:shadow-lg' : '';
  const selectedClass = selected ? 'ring-2 ring-theme-interactive-primary' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hoverClass,
    selectedClass,
    clickableClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};

// Card Header Subcomponent
export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-theme-border-primary pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Body Subcomponent
export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

// Card Footer Subcomponent
export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-t border-theme-border-primary pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Actions Subcomponent
export const CardActions: React.FC<CardActionsProps> = ({ 
  children, 
  align = 'between',
  className = '' 
}) => {
  const alignClasses = {
    left: 'justify-start',
    right: 'justify-end',
    between: 'justify-between',
    center: 'justify-center'
  };

  return (
    <div className={`flex items-center space-x-2 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
};

// Export Card with subcomponents attached
Card.displayName = 'Card';
CardHeader.displayName = 'Card.Header';
CardBody.displayName = 'Card.Body';
CardFooter.displayName = 'Card.Footer';
CardActions.displayName = 'Card.Actions';

export default Card;
