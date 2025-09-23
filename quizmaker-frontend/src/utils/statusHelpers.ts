// ---------------------------------------------------------------------------
// statusHelpers.ts - Centralized status color helpers
// Provides semantic status colors based on current theme palette
// ---------------------------------------------------------------------------

import { ColorPalette } from '@/context/ColorPalettes';

/**
 * Status helper functions that return theme-aware CSS classes
 * for common status indicators (success, warning, danger, info)
 */

export interface StatusHelpers {
  // Text colors
  success: string;
  warning: string;
  danger: string;
  info: string;
  
  // Background colors
  successBg: string;
  warningBg: string;
  dangerBg: string;
  infoBg: string;
  
  // Border colors
  successBorder: string;
  warningBorder: string;
  dangerBorder: string;
  infoBorder: string;
  
  // Combined styles for common patterns
  successAlert: string;
  warningAlert: string;
  dangerAlert: string;
  infoAlert: string;
}

/**
 * Generate status helpers based on current palette
 */
export const getStatusHelpers = (palette: ColorPalette): StatusHelpers => ({
  // Text colors
  success: 'text-theme-interactive-success',
  warning: 'text-theme-interactive-warning',
  danger: 'text-theme-interactive-danger',
  info: 'text-theme-interactive-info',
  
  // Background colors
  successBg: 'bg-theme-bg-tertiary',
  warningBg: 'bg-theme-bg-tertiary',
  dangerBg: 'bg-theme-bg-tertiary',
  infoBg: 'bg-theme-bg-tertiary',
  
  // Border colors
  successBorder: 'border-theme-border-primary',
  warningBorder: 'border-theme-border-primary',
  dangerBorder: 'border-theme-border-primary',
  infoBorder: 'border-theme-border-primary',
  
  // Combined alert styles
  successAlert: 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-success',
  warningAlert: 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-warning',
  dangerAlert: 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-danger',
  infoAlert: 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-info',
});

/**
 * Score-based status helpers
 */
export const getScoreStatus = (score: number): string => {
  if (score >= 80) return 'text-theme-interactive-success';
  if (score >= 60) return 'text-theme-interactive-warning';
  return 'text-theme-interactive-danger';
};

export const getScoreBgStatus = (score: number): string => {
  if (score >= 80) return 'bg-theme-bg-tertiary';
  if (score >= 60) return 'bg-theme-bg-tertiary';
  return 'bg-theme-bg-tertiary';
};

/**
 * Progress bar color based on percentage
 */
export const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return 'bg-theme-interactive-success';
  if (percentage >= 60) return 'bg-theme-interactive-warning';
  return 'bg-theme-interactive-danger';
};

/**
 * Quiz status helpers
 */
export const getQuizStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'published':
      return 'text-theme-interactive-success';
    case 'draft':
      return 'text-theme-interactive-warning';
    case 'archived':
      return 'text-theme-interactive-danger';
    default:
      return 'text-theme-text-secondary';
  }
};

/**
 * Error state helpers
 */
export const getErrorAlertClasses = (): string => {
  return 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-danger';
};

/**
 * Success state helpers
 */
export const getSuccessAlertClasses = (): string => {
  return 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-success';
};

/**
 * Warning state helpers
 */
export const getWarningAlertClasses = (): string => {
  return 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-warning';
};

/**
 * Info state helpers
 */
export const getInfoAlertClasses = (): string => {
  return 'bg-theme-bg-tertiary border border-theme-border-primary text-theme-interactive-info';
};
