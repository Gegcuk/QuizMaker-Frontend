import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className = ''
}) => {
  return (
    <div className={`mb-8 ${className}`}>
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-theme-text-primary sm:text-3xl sm:truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-theme-text-tertiary">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex md:mt-0 md:ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 