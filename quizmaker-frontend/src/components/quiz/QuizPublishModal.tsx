// src/components/QuizPublishModal.tsx
// ---------------------------------------------------------------------------
// Confirmation modal for publishing based on QuizStatus
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuizStatus, QuizDto } from '../../types/quiz.types';

interface QuizPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: QuizStatus) => Promise<void>;
  quiz: QuizDto;
  className?: string;
}

const QuizPublishModal: React.FC<QuizPublishModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quiz,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('PUBLISHED');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('ARCHIVED');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDraft = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onConfirm('DRAFT');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save as draft');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Quiz Status Management
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Choose what you want to do with <strong>"{quiz.title}"</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Current status */}
            <div className="mt-4 bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  quiz.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
                  quiz.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {quiz.status}
                </span>
                <span className="text-sm text-gray-600">
                  {quiz.status === 'PUBLISHED' && 'This quiz is live and visible to users'}
                  {quiz.status === 'DRAFT' && 'This quiz is saved but not published'}
                  {quiz.status === 'ARCHIVED' && 'This quiz is archived and not visible'}
                </span>
              </div>
            </div>

            {/* Action options */}
            <div className="mt-4 space-y-3">
              {quiz.status !== 'PUBLISHED' && (
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Publishing...' : 'Publish Quiz'}
                </button>
              )}
              
              {quiz.status !== 'DRAFT' && (
                <button
                  onClick={handleDraft}
                  disabled={isLoading}
                  className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save as Draft'}
                </button>
              )}
              
              {quiz.status !== 'ARCHIVED' && (
                <button
                  onClick={handleArchive}
                  disabled={isLoading}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Archiving...' : 'Archive Quiz'}
                </button>
              )}
            </div>

            {/* Status descriptions */}
            <div className="mt-4 text-xs text-gray-500 space-y-1">
              <p><strong>Published:</strong> Quiz is live and visible to users</p>
              <p><strong>Draft:</strong> Quiz is saved but not visible to users</p>
              <p><strong>Archived:</strong> Quiz is hidden and not accessible</p>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPublishModal; 