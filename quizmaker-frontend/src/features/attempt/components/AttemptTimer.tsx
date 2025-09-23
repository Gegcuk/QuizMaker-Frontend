// src/components/attempt/AttemptTimer.tsx
// ---------------------------------------------------------------------------
// Component for displaying countdown timer during timed quiz attempts
// Shows remaining time with warnings and auto-submission capability
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';

interface AttemptTimerProps {
  durationMinutes: number;
  onTimeUp: () => void;
  onWarning?: (remainingMinutes: number) => void;
  isPaused?: boolean;
  className?: string;
}

const AttemptTimer: React.FC<AttemptTimerProps> = ({
  durationMinutes,
  onTimeUp,
  onWarning,
  isPaused = false,
  className = ''
}) => {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60); // Convert to seconds
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  // Warning thresholds (in minutes)
  const WARNING_THRESHOLD = 5; // 5 minutes remaining
  const CRITICAL_THRESHOLD = 1; // 1 minute remaining

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = (): string => {
    if (isCritical) return 'text-theme-interactive-danger bg-theme-bg-tertiary border-theme-border-primary';
    if (isWarning) return 'text-theme-interactive-warning bg-theme-bg-tertiary border-theme-border-primary';
    return 'text-theme-text-secondary bg-theme-bg-tertiary border-theme-border-primary';
  };

  const getTimerIcon = (): string => {
    if (isCritical) return '⏰';
    if (isWarning) return '⚠️';
    return '⏱️';
  };

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        
        // Check for warnings
        const remainingMinutes = Math.ceil(newTime / 60);
        
        if (remainingMinutes <= CRITICAL_THRESHOLD && !isCritical) {
          setIsCritical(true);
          setIsWarning(false);
          if (onWarning) onWarning(remainingMinutes);
        } else if (remainingMinutes <= WARNING_THRESHOLD && !isWarning && !isCritical) {
          setIsWarning(true);
          if (onWarning) onWarning(remainingMinutes);
        }

        // Time's up
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, onTimeUp, onWarning, isCritical, isWarning]);

  // Reset timer state when duration changes
  useEffect(() => {
    setTimeRemaining(durationMinutes * 60);
    setIsWarning(false);
    setIsCritical(false);
  }, [durationMinutes]);

  return (
    <div className={`border rounded-lg p-3 ${getTimerColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTimerIcon()}</span>
          <span className="text-sm font-medium">
            {isPaused ? 'Paused' : 'Time Remaining'}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-xl font-bold font-mono">
            {formatTime(timeRemaining)}
          </div>
          {isPaused && (
            <div className="text-xs text-theme-text-tertiary">Timer paused</div>
          )}
        </div>
      </div>

      {/* Warning messages */}
      {isCritical && (
        <div className="mt-2 p-2 bg-theme-bg-danger border border-theme-border-danger rounded text-sm text-red-700">
          ⚠️ Less than 1 minute remaining! Please submit your answers soon.
        </div>
      )}
      
      {isWarning && !isCritical && (
        <div className="mt-2 p-2 bg-theme-bg-warning border border-theme-border-warning rounded text-sm text-yellow-700">
          ⚠️ Less than 5 minutes remaining. Please review your answers.
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-2 w-full bg-theme-bg-tertiary rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-1000 ${
            isCritical ? 'bg-theme-interactive-danger' : isWarning ? 'bg-theme-interactive-warning' : 'bg-theme-interactive-info'
          }`}
          style={{ 
            width: `${Math.max(0, (timeRemaining / (durationMinutes * 60)) * 100)}%` 
          }}
        />
      </div>
    </div>
  );
};

export default AttemptTimer; 
