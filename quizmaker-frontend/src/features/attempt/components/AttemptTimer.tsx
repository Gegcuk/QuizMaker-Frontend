// src/components/attempt/AttemptTimer.tsx
// ---------------------------------------------------------------------------
// Component for displaying countdown timer during timed quiz attempts
// Shows remaining time with warnings and auto-submission capability
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
  const durationSeconds = Math.max(0, Math.round(durationMinutes * 60));
  const [timeRemaining, setTimeRemaining] = useState(durationSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  const onWarningRef = useRef(onWarning);
  const timeUpFiredRef = useRef(false);
  const warningLevelRef = useRef<'none' | 'warning' | 'critical'>('none');
  const previousDurationRef = useRef(durationSeconds);

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

  const remainingMinutes = Math.ceil(timeRemaining / 60);
  const warningLevel = remainingMinutes <= CRITICAL_THRESHOLD
    ? 'critical'
    : remainingMinutes <= WARNING_THRESHOLD
      ? 'warning'
      : 'none';
  const isCritical = warningLevel === 'critical';
  const isWarning = warningLevel === 'warning';
  const hasExpired = timeRemaining <= 0;

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
    onTimeUpRef.current = onTimeUp;
    onWarningRef.current = onWarning;
  }, [onTimeUp, onWarning]);

  useEffect(() => {
    if (isPaused || hasExpired) return undefined;

    const interval = setInterval(() => {
      setTimeRemaining((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [hasExpired, isPaused]);

  useEffect(() => {
    if (warningLevel === warningLevelRef.current) return;
    warningLevelRef.current = warningLevel;
    if (warningLevel !== 'none') {
      onWarningRef.current?.(remainingMinutes);
    }
  }, [remainingMinutes, warningLevel]);

  useEffect(() => {
    if (timeRemaining > 0 || timeUpFiredRef.current) return;
    timeUpFiredRef.current = true;
    onTimeUpRef.current();
  }, [timeRemaining]);

  // Reset timer state when duration changes
  useEffect(() => {
    if (previousDurationRef.current === durationSeconds) return;
    previousDurationRef.current = durationSeconds;
    setTimeRemaining(durationSeconds);
    timeUpFiredRef.current = false;
    warningLevelRef.current = 'none';
  }, [durationSeconds]);

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
        <div className="mt-2 p-2 bg-theme-bg-danger border border-theme-border-danger rounded text-sm text-theme-interactive-danger">
          ⚠️ Less than 1 minute remaining! Please submit your answers soon.
        </div>
      )}
      
      {isWarning && !isCritical && (
        <div className="mt-2 p-2 bg-theme-bg-warning border border-theme-border-warning rounded text-sm text-theme-interactive-warning">
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
            width: `${durationSeconds > 0 ? Math.max(0, (timeRemaining / durationSeconds) * 100) : 0}%`
          }}
        />
      </div>
    </div>
  );
};

export default AttemptTimer; 
