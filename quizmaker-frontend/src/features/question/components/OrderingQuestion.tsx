// ---------------------------------------------------------------------------
// OrderingQuestion.tsx - Ordering question display
// Based on OrderingContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionDto, OrderingContent, OrderingItem } from '@/types';

interface OrderingQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (orderedIds: number[]) => void;
  currentAnswer?: number[];
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const OrderingQuestion: React.FC<OrderingQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = [],
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as OrderingContent;
  const items = content.items || [];
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Initialize current answer with original order if empty
  const [orderedItems, setOrderedItems] = useState<number[]>(
    currentAnswer.length > 0 ? currentAnswer : items.map(item => item.id)
  );

  const handleDragStart = (e: React.DragEvent, itemId: number) => {
    if (disabled) return;
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItemId: number) => {
    e.preventDefault();
    if (disabled || !draggedItem || draggedItem === targetItemId) return;

    const draggedIndex = orderedItems.indexOf(draggedItem);
    const targetIndex = orderedItems.indexOf(targetItemId);
    
    const newOrder = [...orderedItems];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    setOrderedItems(newOrder);
    onAnswerChange?.(newOrder);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const getItemStatus = (itemId: number, currentIndex: number) => {
    if (!showCorrectAnswer) return 'normal';
    
    const correctIndex = items.findIndex(item => item.id === itemId);
    if (currentIndex === correctIndex) return 'correct';
    return 'incorrect';
  };

  const getCorrectOrderCount = () => {
    return orderedItems.filter((itemId, index) => {
      const correctIndex = items.findIndex(item => item.id === itemId);
      return index === correctIndex;
    }).length;
  };

  return (
    <div className="ordering-question">
      {/* Instructions */}
      <div className="mb-4 text-sm text-theme-text-secondary">
        <p>Drag and drop the items to arrange them in the correct order.</p>
      </div>

      {/* Ordering Area */}
      <div className="space-y-2">
        {orderedItems.map((itemId, index) => {
          const item = items.find(i => i.id === itemId);
          const status = getItemStatus(itemId, index);
          
          if (!item) return null;

          return (
            <div
              key={itemId}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, itemId)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, itemId)}
              onDragEnd={handleDragEnd}
              className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                status === 'correct'
                  ? 'border-theme-border-success bg-theme-bg-success'
                  : status === 'incorrect'
                  ? 'border-theme-border-danger bg-theme-bg-danger'
                  : draggedItem === itemId
                  ? 'border-theme-interactive-primary bg-theme-bg-primary opacity-50'
                  : 'border-theme-border-primary bg-theme-bg-primary hover:border-theme-border-secondary'
              } ${disabled ? 'cursor-not-allowed' : 'cursor-move'}`}
            >
              {/* Order Number */}
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full ${
                  status === 'correct'
                    ? 'bg-theme-bg-success text-theme-text-primary'
                    : status === 'incorrect'
                    ? 'bg-theme-bg-danger text-theme-text-primary'
                    : 'bg-theme-bg-tertiary text-theme-text-secondary'
                }`}>
                  {index + 1}
                </span>
              </div>

              {/* Drag Handle */}
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                </svg>
              </div>

              {/* Item Text */}
              <div className="flex-1">
                <div 
                  className={`text-sm ${
                    status === 'correct' ? 'text-theme-interactive-success' :
                    status === 'incorrect' ? 'text-theme-interactive-danger' :
                    'text-theme-text-primary'
                  }`}
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </div>

              {/* Status Icons */}
              {showCorrectAnswer && (
                <div className="flex-shrink-0">
                  {status === 'correct' && (
                    <svg className="w-5 h-5 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {status === 'incorrect' && (
                    <svg className="w-5 h-5 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      {items.length > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text-secondary">Order Progress</span>
            <span className="text-sm text-theme-text-secondary">
              {getCorrectOrderCount()} of {items.length} items in correct position
            </span>
          </div>
          <div className="mt-2 w-full bg-theme-bg-tertiary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(getCorrectOrderCount() / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Answer Summary */}
      {showCorrectAnswer && items.length > 0 && (
        <div className="mt-6 p-4 bg-theme-bg-success border border-theme-border-success rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-success">Correct Order</p>
              <div className="mt-2 space-y-1">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-theme-interactive-success">{index + 1}.</span>
                    <span className="text-theme-interactive-success">{item.text}</span>
                    {orderedItems[index] === item.id && (
                      <svg className="w-4 h-4 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-theme-border-success">
                <p className="text-sm text-theme-interactive-success">
                  You have {getCorrectOrderCount()} items in the correct position.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Order */}
      {showCorrectAnswer && (
        <div className="mt-4 p-4 bg-theme-bg-info border border-theme-border-info rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-info">Your Order</p>
              <div className="mt-2 space-y-1">
                {orderedItems.map((itemId, index) => {
                  const item = items.find(i => i.id === itemId);
                  const correctIndex = items.findIndex(i => i.id === itemId);
                  const isCorrect = index === correctIndex;
                  
                  return (
                    <div key={itemId} className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-theme-interactive-primary">{index + 1}.</span>
                      <span className={isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'}>
                        {item?.text}
                      </span>
                      {isCorrect ? (
                        <svg className="w-4 h-4 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-theme-interactive-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderingQuestion; 