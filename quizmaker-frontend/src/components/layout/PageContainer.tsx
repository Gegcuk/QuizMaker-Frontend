// src/components/layout/PageContainer.tsx
// ---------------------------------------------------------------------------
// Standardized page container component for consistent layout across all pages
// Provides consistent max-width, padding, and background handling
// ---------------------------------------------------------------------------

import React from 'react';
import PageHeader, { PageHeaderProps } from './PageHeader';

interface PageContainerProps extends Omit<PageHeaderProps, 'className'> {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  showHeader?: boolean;
  fullWidth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = '',
  containerClassName = '',
  showHeader = true,
  fullWidth = false,
  ...pageHeaderProps
}) => {
  return (
    <div className={`bg-theme-bg-secondary ${className}`}>
      {/* Page Header */}
      {showHeader && <PageHeader {...pageHeaderProps} />}
      
      {/* Page Content */}
      <div className={`${fullWidth ? '' : 'max-w-7xl mx-auto'} px-4 sm:px-6 lg:px-8 py-6 ${containerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 