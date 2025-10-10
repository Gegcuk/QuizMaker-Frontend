// src/components/common/InsufficientBalanceModal.tsx
// ---------------------------------------------------------------------------
// Modal to inform users about insufficient balance and guide them to top up
// ---------------------------------------------------------------------------

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from '@/components';

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  requiredTokens?: number;
  currentBalance?: number;
}

const InsufficientBalanceModal: React.FC<InsufficientBalanceModalProps> = ({
  isOpen,
  onClose,
  message,
  requiredTokens,
  currentBalance
}) => {
  const navigate = useNavigate();

  const handleTopUp = () => {
    onClose();
    navigate('/profile');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Insufficient Balance"
      size="md"
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-theme-bg-warning p-3">
            <svg 
              className="h-8 w-8 text-theme-interactive-warning" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-theme-text-primary mb-2">
            {message || "You don't have enough tokens to perform this operation."}
          </p>
          
          {(requiredTokens !== undefined && currentBalance !== undefined) && (
            <div className="bg-theme-bg-tertiary rounded-md p-3 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-theme-text-secondary">Required:</span>
                <span className="font-semibold text-theme-text-primary">{requiredTokens} tokens</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-theme-text-secondary">Current balance:</span>
                <span className="font-semibold text-theme-text-primary">{currentBalance} tokens</span>
              </div>
              <div className="border-t border-theme-border-primary my-2" />
              <div className="flex justify-between items-center">
                <span className="text-theme-text-secondary">Need:</span>
                <span className="font-semibold text-theme-interactive-warning">
                  {requiredTokens - currentBalance} more tokens
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-theme-bg-info border border-theme-border-info rounded-md p-3">
          <p className="text-sm text-theme-text-secondary">
            <strong className="text-theme-text-primary">AI quiz generation</strong> requires tokens to cover the cost of AI processing. 
            Top up your token balance to continue creating AI-generated quizzes.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleTopUp}
            className="flex-1"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Top Up Tokens
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default InsufficientBalanceModal;

