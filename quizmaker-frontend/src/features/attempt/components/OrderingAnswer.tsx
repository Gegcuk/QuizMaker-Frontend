// src/components/attempt/OrderingAnswer.tsx
// ---------------------------------------------------------------------------
// Component for ordering question answers
// Handles drag-and-drop reordering of items
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '@/types';
import { Button } from '@/components';

interface OrderingAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: number[];
  onAnswerChange: (answer: number[]) => void;
  disabled?: boolean;
  className?: string;
}

interface OrderingItem {
  id: number;
  text: string;
}

const OrderingAnswer: React.FC<OrderingAnswerProps> = ({
  question,
  currentAnswer = [],
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [orderedItems, setOrderedItems] = useState<OrderingItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<OrderingItem | null>(null);

  // Extract items from safe content
  const originalItems: OrderingItem[] = question.safeContent?.items || [];

  useEffect(() => {
    console.log("OrderingAnswer useEffect:", {
      currentAnswer,
      originalItems: originalItems.length,
      hasCurrentAnswer: currentAnswer && currentAnswer.length > 0
    });

    if (currentAnswer && currentAnswer.length > 0) {
      // Reconstruct order from current answer
      const ordered = currentAnswer.map(id => 
        originalItems.find(item => item.id === id)
      ).filter(Boolean) as OrderingItem[];
      
      // Add any missing items
      const missingItems = originalItems.filter(item => 
        !currentAnswer.includes(item.id)
      );
      
      setOrderedItems([...ordered, ...missingItems]);
    } else {
      // Initialize with original order and set it as the initial answer
      const initialOrder = [...originalItems];
      setOrderedItems(initialOrder);
      
      // Set the initial order as the answer so submit button is enabled
      if (initialOrder.length > 0) {
        const initialAnswer = initialOrder.map(item => item.id);
        onAnswerChange(initialAnswer);
      }
    }
  }, [currentAnswer, originalItems]);

  const handleDragStart = (e: React.DragEvent, item: OrderingItem) => {
    if (disabled) return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetItem: OrderingItem) => {
    if (disabled || !draggedItem || draggedItem.id === targetItem.id) return;
    e.preventDefault();

    const draggedIndex = orderedItems.findIndex(item => item.id === draggedItem.id);
    const targetIndex = orderedItems.findIndex(item => item.id === targetItem.id);

    const newOrder = [...orderedItems];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    setOrderedItems(newOrder);
    const newAnswer = newOrder.map(item => item.id);
    console.log("OrderingAnswer onAnswerChange:", newAnswer);
    onAnswerChange(newAnswer);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleMoveUp = (index: number) => {
    if (disabled || index === 0) return;
    
    const newOrder = [...orderedItems];
    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    
    setOrderedItems(newOrder);
    const newAnswer = newOrder.map(item => item.id);
    console.log("OrderingAnswer moveUp onAnswerChange:", newAnswer);
    onAnswerChange(newAnswer);
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === orderedItems.length - 1) return;
    
    const newOrder = [...orderedItems];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    setOrderedItems(newOrder);
    const newAnswer = newOrder.map(item => item.id);
    console.log("OrderingAnswer moveDown onAnswerChange:", newAnswer);
    onAnswerChange(newAnswer);
  };

  const handleReset = () => {
    const resetOrder = [...originalItems];
    setOrderedItems(resetOrder);
    const resetAnswer = resetOrder.map(item => item.id);
    console.log("OrderingAnswer reset onAnswerChange:", resetAnswer);
    onAnswerChange(resetAnswer);
  };

  if (originalItems.length === 0) {
    return (
      <div className={`p-4 bg-theme-bg-secondary border border-theme-border-primary rounded-md ${className}`}>
        <div className="text-theme-text-tertiary text-center">No items available for ordering</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-theme-text-secondary mb-4">
        <p className="font-medium mb-2">Arrange the items in the correct order:</p>
        <p className="text-xs text-theme-text-tertiary">Drag and drop items to reorder them, or use the arrow buttons to move items up and down.</p>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          variant="outline"
          size="sm"
        >
          Reset Order
        </Button>
      </div>

      {/* Ordering List */}
      <div className="space-y-2">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item)}
            onDragEnd={handleDragEnd}
            className={`flex items-center p-4 border rounded-lg transition-all duration-200 ${
              draggedItem?.id === item.id
                ? 'border-theme-interactive-primary bg-theme-bg-tertiary opacity-50 shadow-lg'
                : 'border-theme-border-primary hover:border-theme-border-secondary bg-theme-bg-primary'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
          >
            {/* Position Number */}
            <div className="flex items-center justify-center w-8 h-8 bg-theme-bg-tertiary text-theme-interactive-primary rounded-full text-sm font-medium mr-3 flex-shrink-0">
              {index + 1}
            </div>

            {/* Drag Handle */}
            <div className="mr-3 text-theme-text-tertiary flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
              </svg>
            </div>

            {/* Item Text */}
            <div className="flex-1 text-theme-text-primary">
              {item.text}
            </div>

            {/* Move Controls */}
            <div className="flex space-x-1 ml-3 flex-shrink-0">
              <Button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={disabled || index === 0}
                variant="ghost"
                size="sm"
                className="!p-1 !min-w-0"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Button>
              <Button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={disabled || index === orderedItems.length - 1}
                variant="ghost"
                size="sm"
                className="!p-1 !min-w-0"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md bg-theme-bg-primary text-theme-text-primary">
        <div className="text-sm text-theme-text-secondary">
          <strong>Current Order:</strong> {orderedItems.map((item, index) => 
            `${index + 1}. ${item.text.substring(0, 30)}${item.text.length > 30 ? '...' : ''}`
          ).join(' → ')}
        </div>
      </div>
    </div>
  );
};

export default OrderingAnswer; 
