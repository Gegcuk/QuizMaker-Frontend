// ---------------------------------------------------------------------------
// Token Estimation Display Component
// Shows estimated token usage for quiz generation
// ---------------------------------------------------------------------------

import React from 'react';
import { TokenEstimationResult } from '@/services';

export interface TokenEstimationDisplayProps {
  /** Token estimation result */
  estimation: TokenEstimationResult | null;
  /** Optional custom className */
  className?: string;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
}

export const TokenEstimationDisplay: React.FC<TokenEstimationDisplayProps> = ({
  estimation,
  className = '',
  showBreakdown = false,
}) => {
  if (!estimation) {
    return (
      <div className={`p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-theme-text-tertiary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-theme-text-secondary">Enter content (at least 10 characters) and select at least one question type to see token estimation</span>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  return (
    <div className={`p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-theme-interactive-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-medium text-theme-text-primary">Estimated Token Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-semibold text-theme-interactive-primary">
            {formatNumber(estimation.estimatedBillingTokens)}
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div className="mt-4 pt-4 border-t border-theme-border-primary">
          <div className="space-y-2 text-xs text-theme-text-secondary">
            <div className="flex justify-between">
              <span>Input Tokens:</span>
              <span className="font-medium">{formatNumber(estimation.inputTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span>Completion Tokens:</span>
              <span className="font-medium">{formatNumber(estimation.completionTokens)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total (before safety factor):</span>
              <span className="font-medium">
                {formatNumber(estimation.inputTokens + estimation.completionTokens)}
              </span>
            </div>
            <div className="flex justify-between text-theme-text-primary">
              <span>With safety factor (20%):</span>
              <span className="font-semibold">{formatNumber(estimation.estimatedLlmTokens)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

