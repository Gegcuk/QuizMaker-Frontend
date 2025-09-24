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
  successBg: 'bg-theme-status-success-bg',
  warningBg: 'bg-theme-status-warning-bg',
  dangerBg: 'bg-theme-status-danger-bg',
  infoBg: 'bg-theme-status-info-bg',
  
  // Border colors
  successBorder: 'border-theme-border-primary',
  warningBorder: 'border-theme-border-primary',
  dangerBorder: 'border-theme-border-primary',
  infoBorder: 'border-theme-border-primary',
  
  // Combined alert styles
  successAlert: 'bg-theme-status-success-bg border border-theme-border-primary text-theme-interactive-success',
  warningAlert: 'bg-theme-status-warning-bg border border-theme-border-primary text-theme-interactive-warning',
  dangerAlert: 'bg-theme-status-danger-bg border border-theme-border-primary text-theme-interactive-danger',
  infoAlert: 'bg-theme-status-info-bg border border-theme-border-primary text-theme-interactive-info',
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
  if (score >= 80) return 'bg-theme-status-success-bg';
  if (score >= 60) return 'bg-theme-status-warning-bg';
  return 'bg-theme-status-danger-bg';
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
  return 'bg-theme-status-danger-bg border border-theme-border-primary text-theme-interactive-danger';
};

/**
 * Success state helpers
 */
export const getSuccessAlertClasses = (): string => {
  return 'bg-theme-status-success-bg border border-theme-border-primary text-theme-interactive-success';
};

/**
 * Warning state helpers
 */
export const getWarningAlertClasses = (): string => {
  return 'bg-theme-status-warning-bg border border-theme-border-primary text-theme-interactive-warning';
};

/**
 * Info state helpers
 */
export const getInfoAlertClasses = (): string => {
  return 'bg-theme-status-info-bg border border-theme-border-primary text-theme-interactive-info';
};

/**
 * Difficulty level helpers
 */
export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty.toUpperCase()) {
    case 'EASY':
      return 'text-theme-interactive-success bg-theme-status-success-bg';
    case 'MEDIUM':
      return 'text-theme-interactive-warning bg-theme-status-warning-bg';
    case 'HARD':
      return 'text-theme-interactive-danger bg-theme-status-danger-bg';
    default:
      return 'text-theme-text-secondary bg-theme-bg-tertiary';
  }
};

/**
 * Difficulty badge variant for Badge component
 */
export const getDifficultyBadgeVariant = (difficulty: string): string => {
  switch (difficulty.toUpperCase()) {
    case 'EASY':
      return 'success';
    case 'MEDIUM':
      return 'warning';
    case 'HARD':
      return 'danger';
    default:
      return 'neutral';
  }
};

/**
 * Answer status helpers
 */
export const getAnswerStatusText = (isCorrect: boolean): string => {
  return isCorrect ? 'Correct' : 'Incorrect';
};

export const getAnswerStatusColor = (isCorrect: boolean): string => {
  return isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger';
};

export const getAnswerStatusIcon = (isCorrect: boolean): string => {
  return isCorrect ? '✅' : '❌';
};

/**
 * Performance color based on percentage
 */
export const getPerformanceColor = (percentage: number): string => {
  if (percentage >= 80) return 'text-theme-interactive-success bg-theme-status-success-bg';
  if (percentage >= 60) return 'text-theme-interactive-warning bg-theme-status-warning-bg';
  return 'text-theme-interactive-danger bg-theme-status-danger-bg';
};

/**
 * Generation status helpers
 */
export const getGenerationStatusVariant = (status: string): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'neutral' => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'success';
    case 'processing':
    case 'in_progress':
      return 'info';
    case 'failed':
    case 'error':
      return 'danger';
    case 'pending':
    case 'queued':
      return 'warning';
    default:
      return 'neutral';
  }
};
