// src/components/attempt/AttemptStart.tsx
// ---------------------------------------------------------------------------
// Component for starting a new quiz attempt
// Handles attempt initialization with different modes and error handling
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner } from '../ui';
import { AttemptService } from '../../api/attempt.service';
import { StartAttemptRequest, AttemptMode } from '../../types/attempt.types';
import api from '../../api/axiosInstance';

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
  const [error, setError] = useState<string | null>(null);

  const attemptService = new AttemptService(api);

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
      navigate(`/quizzes/${quizId}/attempt?attemptId=${response.attemptId}`);
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

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Start {quizTitle}
        </h2>
        <p className="text-gray-600">
          Choose your attempt mode and begin the quiz
        </p>
      </div>

      {/* Attempt Mode Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Attempt Mode
        </label>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="attemptMode"
              value="ONE_BY_ONE"
              checked={selectedMode === 'ONE_BY_ONE'}
              onChange={() => handleModeChange('ONE_BY_ONE')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">One by One</div>
              <div className="text-sm text-gray-500">
                Questions are presented one at a time with immediate feedback
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="attemptMode"
              value="ALL_AT_ONCE"
              checked={selectedMode === 'ALL_AT_ONCE'}
              onChange={() => handleModeChange('ALL_AT_ONCE')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">All at Once</div>
              <div className="text-sm text-gray-500">
                All questions are visible, submit everything at once
              </div>
            </div>
          </label>

          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="attemptMode"
              value="TIMED"
              checked={selectedMode === 'TIMED'}
              onChange={() => handleModeChange('TIMED')}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">Timed</div>
              <div className="text-sm text-gray-500">
                Timed attempt with countdown timer
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <div className="flex justify-center">
        <button
          onClick={handleStartAttempt}
          disabled={isStarting}
          className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStarting ? (
            <div className="flex items-center">
              <Spinner />
              <span className="ml-2">Starting...</span>
            </div>
          ) : (
            'Start Quiz'
          )}
        </button>
      </div>

      {/* Mode-specific instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-1">
          {selectedMode === 'ONE_BY_ONE' && 'One by One Mode'}
          {selectedMode === 'ALL_AT_ONCE' && 'All at Once Mode'}
          {selectedMode === 'TIMED' && 'Timed Mode'}
        </h4>
        <p className="text-sm text-blue-700">
          {selectedMode === 'ONE_BY_ONE' && 
            'You will see one question at a time. Answer each question to proceed to the next.'}
          {selectedMode === 'ALL_AT_ONCE' && 
            'All questions will be displayed on a single page. Review and answer all questions before submitting.'}
          {selectedMode === 'TIMED' && 
            'You will have a limited time to complete the quiz. The timer will be visible throughout the attempt.'}
        </p>
      </div>
    </div>
  );
};

export default AttemptStart; 