import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  size?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

export interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  variant = 'default',
  size = 'md',
  hoverable = false,
  clickable = false,
  onClick,
  className = ''
}) => {
  const baseClasses = 'bg-theme-bg-primary rounded-lg';
  
  const variantClasses = {
    default: 'border border-theme-border-primary shadow-theme',
    elevated: 'shadow-theme-lg',
    outlined: 'border-2 border-theme-border-primary',
    flat: 'border border-theme-border-secondary'
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const hoverClasses = hoverable ? 'transition-shadow duration-200 hover:shadow-lg' : '';
  const clickableClasses = clickable ? 'cursor-pointer transition-transform duration-200 hover:scale-[1.02]' : '';

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    hoverClasses,
    clickableClasses,
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={classes}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      } : undefined}
    >
      {header && (
        <div className="px-6 py-4 border-b border-theme-border-primary bg-theme-bg-primary text-theme-text-primary">
          {header}
        </div>
      )}
      <div className="px-6 py-4">
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-theme-border-primary bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
          {footer}
        </div>
      )}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`font-semibold text-theme-text-primary ${className}`}>
    {children}
  </div>
);

const CardBody: React.FC<CardBodyProps> = ({ 
  children, 
  className = '', 
  padding = 'md' 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-3',
    md: 'px-6 py-4',
    lg: 'px-8 py-6'
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between ${className}`}>
    {children}
  </div>
);

const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold text-theme-text-primary ${className}`}>
    {children}
  </h3>
);

// Export the main component and sub-components
export { CardHeader, CardBody, CardFooter, CardContent, CardTitle };
export default Card; 