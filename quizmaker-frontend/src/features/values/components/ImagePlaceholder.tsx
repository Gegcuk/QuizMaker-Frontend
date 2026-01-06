import React from 'react';

interface ImagePlaceholderProps {
  name: string;
  width: number;
  height: number;
  description: string;
  className?: string;
  src?: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}

/**
 * Image placeholder component for values page
 * Displays a placeholder with icon and size information
 * 
 * Image size requirements are documented in the component for reference
 */
export const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  name,
  width,
  height,
  description,
  className = '',
  src,
  alt,
  loading = 'lazy',
}) => {
  if (src) {
    const imageClassName = ['block', 'max-w-full', 'h-auto', className]
      .filter(Boolean)
      .join(' ');

    return (
      <img
        src={src}
        alt={alt || name}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        className={imageClassName}
      />
    );
  }

  return (
    <div
      className={`bg-theme-bg-secondary border-2 border-dashed border-theme-border-primary rounded-lg flex flex-col items-center justify-center p-8 ${className}`}
      style={{ 
        maxWidth: '100%',
        width: className.includes('w-full') ? '100%' : `${width}px`,
        height: className.includes('h-auto') ? 'auto' : `${height}px`,
        minHeight: className.includes('h-auto') ? 'auto' : `${height}px`,
        aspectRatio: className.includes('h-auto') ? `${width} / ${height}` : undefined,
      }}
    >
      <div className="text-center space-y-2">
        <div className="text-4xl text-theme-text-tertiary mb-2">🖼️</div>
        <div className="text-sm font-semibold text-theme-text-primary">{name}</div>
        <div className="text-xs text-theme-text-tertiary">{width} × {height}px</div>
        <div className="text-xs text-theme-text-secondary mt-2 max-w-xs">{description}</div>
      </div>
    </div>
  );
};
