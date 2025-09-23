import React, { useState } from 'react';

export interface RatingProps {
  value: number;
  max?: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  showLabel?: boolean;
  className?: string;
  icon?: 'star' | 'heart' | 'thumbs' | 'custom';
  customIcon?: React.ReactNode;
  halfRatings?: boolean;
  clearable?: boolean;
}

const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
  showLabel = false,
  className = '',
  icon = 'star',
  customIcon,
  halfRatings = false,
  clearable = false
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const getIcon = (filled: boolean, halfFilled: boolean = false) => {
    const baseClasses = `${sizeClasses[size]} ${
      filled ? 'text-yellow-400' : 'text-gray-300'
    } ${!readOnly ? 'cursor-pointer hover:text-yellow-500' : ''}`;

    if (icon === 'star') {
      return (
        <svg
          className={baseClasses}
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      );
    }

    if (icon === 'heart') {
      return (
        <svg
          className={baseClasses}
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      );
    }

    if (icon === 'thumbs') {
      return (
        <svg
          className={baseClasses}
          fill={filled ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      );
    }

    if (icon === 'custom' && customIcon) {
      return (
        <div className={baseClasses}>
          {customIcon}
        </div>
      );
    }

    return null;
  };

  const getRatingLabel = (rating: number) => {
    const labels = {
      0: 'No rating',
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating as keyof typeof labels] || `Rating ${rating}`;
  };

  const handleClick = (clickedValue: number) => {
    if (readOnly) return;

    if (clearable && clickedValue === value) {
      onChange?.(0);
    } else {
      onChange?.(clickedValue);
    }
  };

  const handleMouseEnter = (hoverValue: number) => {
    if (readOnly) return;
    setHoverValue(hoverValue);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(null);
    setIsHovering(false);
  };

  const displayValue = isHovering ? hoverValue : value;

  return (
    <div className={`flex items-center ${className}`}>
      <div
        className="flex items-center"
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: max }, (_, index) => {
          const starValue = index + 1;
          const isFilled = displayValue !== null && starValue <= displayValue;
          const isHalfFilled = halfRatings && displayValue !== null && 
            starValue - 0.5 <= displayValue && displayValue < starValue;

          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => handleMouseEnter(starValue)}
              onClick={() => handleClick(starValue)}
            >
              {getIcon(isFilled, isHalfFilled)}
              {halfRatings && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isHalfFilled ? '50%' : '0%' }}
                >
                  {getIcon(true)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(showValue || showLabel) && (
        <div className="ml-2">
          {showValue && (
            <span className={`font-medium text-theme-text-primary ${textSizeClasses[size]}`}>
              {displayValue || 0}
            </span>
          )}
          {showLabel && (
            <span className={`text-theme-text-tertiary ${textSizeClasses[size]} ml-1`}>
              {getRatingLabel(displayValue || 0)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Rating; 