// src/components/attempt/AttemptStart.tsx
// ---------------------------------------------------------------------------
// Component for starting a new quiz attempt
// Handles attempt initialization with different modes and error handling
// Integrates with quiz settings to provide appropriate mode options
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Button } from '@/components';
import { AttemptService } from '@/services';
import { QuizService, api } from '@/services';
import { StartAttemptRequest, AttemptMode, QuizDto } from '@/types';

interface AttemptStartProps {
  quizId: string;
  quizTitle?: string;
  onAttemptStarted?: (attemptId: string) => void;
  className?: string;
}

const AttemptStart: React.FC<AttemptStartProps> = ({
  quizId,
  quizTitle = 'Quiz',
  onAttemptStarted,
  className = ''
}) => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState<AttemptMode>('ONE_BY_ONE');
  const [isStarting, setIsStarting] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizDto | null>(null);

  const attemptService = new AttemptService(api);
  const quizService = new QuizService(api);

  // Load quiz details to determine available modes
  useEffect(() => {
    const loadQuizDetails = async () => {
      try {
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
        
        // Set default mode based on quiz settings
        if (quizData.timerEnabled && quizData.timerDuration) {
          setSelectedMode('TIMED');
        } else {
          setSelectedMode('ONE_BY_ONE');
        }
      } catch (error) {
        console.warn('Could not load quiz details:', error);
        // Continue with default mode
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    loadQuizDetails();
  }, [quizId]);

  const handleStartAttempt = async () => {
    setIsStarting(true);
    setError(null);

    try {
      const request: StartAttemptRequest = {
        mode: selectedMode
      };

      const response = await attemptService.startAttempt(quizId, request);
      
      // Call the callback if provided
      if (onAttemptStarted) {
        onAttemptStarted(response.attemptId);
      }

      // Navigate to the attempt page
      navigate(`/quizzes/${quizId}/attempt/start?mode=${selectedMode}&attemptId=${response.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz attempt. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleModeChange = (mode: AttemptMode) => {
    setSelectedMode(mode);
    setError(null);
  };

  const getModeDescription = (mode: AttemptMode) => {
    switch (mode) {
      case 'ONE_BY_ONE':
        return {
          title: 'One by One',
          description: 'Questions are presented one at a time with immediate feedback',
          icon: '📝',
          features: [
            'See one question at a time',
            'Get immediate feedback after each answer',
            'Can review and change answers before proceeding',
            'Best for focused, step-by-step learning'
          ]
        };
      case 'ALL_AT_ONCE':
        return {
          title: 'All at Once',
          description: 'All questions are visible, submit everything at once',
          icon: '📋',
          features: [
            'See all questions on a single page',
            'Navigate between questions freely',
            'Submit all answers together',
            'Best for comprehensive review and planning'
          ]
        };
      case 'TIMED':
        return {
          title: 'Timed',
          description: 'Timed attempt with countdown timer',
          icon: '⏱️',
          features: [
            'Limited time to complete the quiz',
            'Timer visible throughout the attempt',
            'Auto-submit when time expires',
            'Best for time management practice'
          ]
        };
      default:
        return {
          title: 'Unknown Mode',
          description: 'Unknown attempt mode',
          icon: '❓',
          features: []
        };
    }
  };

  const isModeRecommended = (mode: AttemptMode) => {
    if (!quiz) return false;
    
    switch (mode) {
      case 'TIMED':
        return quiz.timerEnabled && quiz.timerDuration;
      case 'ONE_BY_ONE':
        return !quiz.timerEnabled;
      case 'ALL_AT_ONCE':
        return true; // Always available
      default:
        return false;
    }
  };

  const getModeAvailability = (mode: AttemptMode) => {
    if (!quiz) return { available: true, reason: '' };
    
    switch (mode) {
      case 'TIMED':
        return {
          available: quiz.timerEnabled && quiz.timerDuration,
          reason: quiz.timerEnabled && quiz.timerDuration 
            ? `Timer set to ${quiz.timerDuration} minutes`
            : 'Quiz does not have timer enabled'
        };
      default:
        return { available: true, reason: '' };
    }
  };

  if (isLoadingQuiz) {
    return (
      <div className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <Spinner size="lg" />
          <span className="ml-3 text-theme-text-secondary">Loading quiz details...</span>
        </div>
      </div>
    );
  }

  const modeInfo = getModeDescription(selectedMode);

  return (
    <div className={`bg-theme-bg-primary rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
          Start {quizTitle}
        </h2>
        <p className="text-theme-text-secondary">
          Choose your attempt mode and begin the quiz
        </p>
      </div>

      {/* Quiz Information */}
      {quiz && (
        <div className="mb-6 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Quiz Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-theme-interactive-info">
            <div>
              <span className="font-medium">Difficulty:</span> {quiz.difficulty}
            </div>
            <div>
              <span className="font-medium">Estimated Time:</span> {quiz.estimatedTime} min
            </div>
            {quiz.timerEnabled && quiz.timerDuration && (
              <div className="col-span-2">
                <span className="font-medium">Timer:</span> {quiz.timerDuration} minutes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attempt Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-theme-text-secondary mb-3">
          Attempt Mode
        </label>
        <div className="space-y-3">
          {(['ONE_BY_ONE', 'ALL_AT_ONCE', 'TIMED'] as AttemptMode[]).map((mode) => {
            const modeData = getModeDescription(mode);
            const availability = getModeAvailability(mode);
            const isRecommended = isModeRecommended(mode);
            const isSelected = selectedMode === mode;

            return (
              <label
                key={mode}
                className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-theme-interactive-primary bg-theme-bg-tertiary'
                    : 'border-theme-border-primary hover:border-theme-border-secondary hover:bg-theme-bg-secondary'
                } ${!availability.available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="attemptMode"
                  value={mode}
                  checked={isSelected}
                  onChange={() => handleModeChange(mode)}
                  disabled={!availability.available}
                  className="mt-1 h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{modeData.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-theme-text-primary">
                          {modeData.title}
                          {isRecommended && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-theme-bg-success text-theme-interactive-success">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-theme-text-tertiary">
                          {modeData.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="mt-3">
                    <ul className="text-xs text-theme-text-secondary space-y-1">
                      {modeData.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <span className="mr-2">•</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Availability Info */}
                  {!availability.available && (
                    <div className="mt-2 text-xs text-theme-text-tertiary">
                      {availability.reason}
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Selected Mode Details */}
      <div className="mb-6 p-4 bg-theme-bg-primary border border-theme-border-primary rounded-lg">
        <h4 className="text-sm font-medium text-indigo-900 mb-2">
          {modeInfo.icon} {modeInfo.title} Mode
        </h4>
        <p className="text-sm text-theme-interactive-primary mb-3">
          {modeInfo.description}
        </p>
        <div className="text-xs text-theme-interactive-primary">
          <strong>What to expect:</strong>
          <ul className="mt-1 ml-4 list-disc">
            {modeInfo.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-theme-bg-danger border border-red-200 rounded-md">
          <p className="text-sm text-theme-interactive-danger">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartAttempt}
          disabled={isStarting || !getModeAvailability(selectedMode).available}
          variant="primary"
          size="md"
          loading={isStarting}
        >
          {isStarting ? 'Starting...' : `Start ${modeInfo.title} Attempt`}
        </Button>
      </div>

      {/* Important Notes */}
      <div className="mt-6 p-4 bg-theme-bg-warning border border-yellow-200 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-theme-interactive-warning space-y-1">
          <li>• You can pause and resume your attempt at any time</li>
          <li>• Your progress is automatically saved</li>
          <li>• You cannot change attempt mode once started</li>
          <li>• Make sure you have a stable internet connection</li>
        </ul>
      </div>
    </div>
  );
};

export default AttemptStart; 
