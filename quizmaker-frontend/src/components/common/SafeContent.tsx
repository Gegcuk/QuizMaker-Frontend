import React from 'react';
import { sanitizeForDisplay, sanitizeUrl } from '@/utils';

interface SafeContentProps {
  content: string;
  allowHtml?: boolean;
  className?: string;
}

/**
 * Component that safely renders user content to prevent XSS attacks
 */
const SafeContent: React.FC<SafeContentProps> = ({ 
  content, 
  allowHtml = false, 
  className = '' 
}) => {
  const sanitizedContent = sanitizeForDisplay(content, allowHtml);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Component that safely renders links with sanitized URLs
 */
export const SafeLink: React.FC<SafeLinkProps> = ({ 
  href, 
  children, 
  className = '' 
}) => {
  const sanitizedHref = sanitizeUrl(href);
  
  if (!sanitizedHref) {
    return <span className={className}>{children}</span>;
  }
  
  return (
    <a 
      href={sanitizedHref}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
};

export default SafeContent;
