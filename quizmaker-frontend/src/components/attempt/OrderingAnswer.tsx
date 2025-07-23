// src/components/attempt/OrderingAnswer.tsx
// ---------------------------------------------------------------------------
// Component for ordering question answers
// Handles drag-and-drop reordering of items
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuestionForAttemptDto } from '../../types/attempt.types';

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
    if (currentAnswer.length > 0) {
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
      // Initialize with original order
      setOrderedItems([...originalItems]);
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
    onAnswerChange(newOrder.map(item => item.id));
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
    onAnswerChange(newOrder.map(item => item.id));
  };

  const handleMoveDown = (index: number) => {
    if (disabled || index === orderedItems.length - 1) return;
    
    const newOrder = [...orderedItems];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    
    setOrderedItems(newOrder);
    onAnswerChange(newOrder.map(item => item.id));
  };

  const handleReset = () => {
    setOrderedItems([...originalItems]);
    onAnswerChange([]);
  };

  if (originalItems.length === 0) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-md ${className}`}>
        <div className="text-gray-500 text-center">No items available for ordering</div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        Arrange the items in the correct order by dragging and dropping:
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {orderedItems.length} items to arrange
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          Reset Order
        </button>
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
            className={`flex items-center p-4 border rounded-lg transition-colors ${
              draggedItem?.id === item.id
                ? 'border-indigo-500 bg-indigo-50 opacity-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
          >
            {/* Drag Handle */}
            <div className="mr-3 text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
              </svg>
            </div>

            {/* Position Number */}
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full text-sm font-medium mr-3">
              {index + 1}
            </div>

            {/* Item Text */}
            <div className="flex-1 text-gray-900">
              {item.text}
            </div>

            {/* Move Controls */}
            <div className="flex space-x-1 ml-3">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={disabled || index === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={disabled || index === orderedItems.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-700">
          <strong>Instructions:</strong> Drag and drop items to arrange them in the correct order. You can also use the up/down arrows to move items.
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-700">
          <strong>Tips:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Read all items before starting to arrange them</li>
            <li>Look for logical sequences or chronological order</li>
            <li>Use the position numbers to track your progress</li>
            <li>You can reset the order if you need to start over</li>
          </ul>
        </div>
      </div>

      {/* Current Order Summary */}
      {orderedItems.length > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <div className="text-sm text-indigo-700">
            <strong>Current Order:</strong> {orderedItems.map((item, index) => `${index + 1}. ${item.text.substring(0, 30)}${item.text.length > 30 ? '...' : ''}`).join(' → ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderingAnswer; 