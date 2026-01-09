// src/features/auth/components/OAuthButton.tsx
// ---------------------------------------------------------------------------
// OAuth provider button component
// Renders a branded button for each OAuth provider with appropriate styling
// Uses theme-aware colors and proper component library
// ---------------------------------------------------------------------------

import React from 'react';
import type { OAuthProvider } from '../types/auth.types';
import { authService } from '../services/auth.service';

interface OAuthButtonProps {
  provider: OAuthProvider;
  fullWidth?: boolean;
  disabled?: boolean;
  actionText?: string; // Custom action text prefix (e.g., "Register with", "Continue with")
}

// Provider-specific configuration
const providerConfig: Record<OAuthProvider, {
  name: string;
  // Note: Provider buttons use subtle theme-aware backgrounds for better integration
  bgClass: string;
  textClass: string;
  icon: React.ReactNode;
}> = {
  GOOGLE: {
    name: 'Google',
    // Use theme-bg-secondary for subtle contrast that works in all themes
    bgClass: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary',
    textClass: 'text-theme-text-primary',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  GITHUB: {
    name: 'GitHub',
    bgClass: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary',
    textClass: 'text-theme-text-primary',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  FACEBOOK: {
    name: 'Facebook',
    bgClass: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary',
    textClass: 'text-theme-text-primary',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  MICROSOFT: {
    name: 'Microsoft',
    bgClass: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary',
    textClass: 'text-theme-text-primary',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path fill="#f25022" d="M0 0h11.377v11.372H0z"/>
        <path fill="#00a4ef" d="M12.623 0H24v11.372H12.623z"/>
        <path fill="#7fba00" d="M0 12.628h11.377V24H0z"/>
        <path fill="#ffb900" d="M12.623 12.628H24V24H12.623z"/>
      </svg>
    ),
  },
  APPLE: {
    name: 'Apple',
    bgClass: 'bg-theme-bg-secondary hover:bg-theme-bg-tertiary',
    textClass: 'text-theme-text-primary',
    icon: (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
      </svg>
    ),
  },
};

const OAuthButton: React.FC<OAuthButtonProps> = ({
  provider,
  fullWidth = true,
  disabled = false,
  actionText = 'Continue with', // Default to "Continue with" for backward compatibility
}) => {
  const config = providerConfig[provider];

  const handleOAuthLogin = () => {
    // Redirect directly to the OAuth authorization endpoint
    // Spring Security OAuth2 expects a browser redirect, not an API call
    // Note: OAuth endpoints are at /oauth2/authorization/{provider}, NOT under /api
    window.location.href = `/oauth2/authorization/${provider.toLowerCase()}`;
  };

  const buttonText = `${actionText} ${config.name}`;

  return (
    <button
      type="button"
      onClick={handleOAuthLogin}
      disabled={disabled}
      className={`
        ${config.bgClass}
        ${config.textClass}
        ${fullWidth ? 'w-full' : 'w-14 h-14 sm:w-full sm:h-auto'}
        flex items-center justify-center gap-3
        sm:py-2.5 sm:px-4
        border border-theme-border-primary
        rounded-lg
        font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      aria-label={buttonText}
      title={buttonText}
    >
      {config.icon}
      {/* Show full text on tablet and up (sm breakpoint), hide on mobile */}
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  );
};

export default OAuthButton;
