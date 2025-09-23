// ---------------------------------------------------------------------------
// OrderingEditor.tsx - Ordering question editor
// Based on OrderingContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { OrderingContent, OrderingItem } from '@/types';
import { InstructionsModal, QuestionEditorHeader, AddItemButton, QuestionPreviewSection, ItemManagementContainer } from '@/components';

interface OrderingEditorProps {
  content: OrderingContent;
  onChange: (content: OrderingContent) => void;
  className?: string;
  showPreview?: boolean;
}

const OrderingEditor: React.FC<OrderingEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [items, setItems] = useState<OrderingItem[]>(
    content.items || [
      { id: 1, text: '' },
      { id: 2, text: '' },
      { id: 3, text: '' }
    ]
  );

  // Update parent when items change
  useEffect(() => {
    onChange({ items });
  }, [items, onChange]);

  const addItem = () => {
    const newId = items.length + 1;
    setItems(prev => [...prev, { id: newId, text: '' }]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 2) return; // Minimum 2 items required
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItemText = (id: number, text: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const getEmptyItems = () => items.filter(item => !item.text.trim());

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <QuestionEditorHeader
        title="Ordering Question"
        description="Arrange items in the correct order"
        itemCount={items.length}
        itemType="item"
        emptyCount={getEmptyItems().length}
      />

      {/* Items */}
      <ItemManagementContainer
        title="Items to Order"
        helperText="Drag to reorder items"
      >
        <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-3 p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary">
                {/* Drag Handle */}
                <div className="flex-shrink-0 mt-2 cursor-move">
                  <svg className="w-4 h-4 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                  </svg>
                </div>

                {/* Order Number */}
                <div className="flex-shrink-0 mt-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
                    {index + 1}
                  </span>
                </div>

                {/* Item Text */}
                <div className="flex-1">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItemText(item.id, e.target.value)}
                    placeholder={`Item ${index + 1}...`}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-indigo-500 sm:text-sm resize-none"
                    rows={2}
                  />
                </div>

                {/* Move Buttons */}
                <div className="flex-shrink-0 mt-2 flex flex-col space-y-1">
                  <button
                    type="button"
                    onClick={() => moveItem(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="text-theme-text-secondary hover:text-theme-text-primary disabled:text-theme-text-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary rounded"
                    title="Move up"
                    aria-label={`Move item ${index + 1} up`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, Math.min(items.length - 1, index + 1))}
                    disabled={index === items.length - 1}
                    className="text-theme-text-secondary hover:text-theme-text-primary disabled:text-theme-text-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary rounded"
                    title="Move down"
                    aria-label={`Move item ${index + 1} down`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0 mt-2">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 2}
                    className="text-theme-text-danger hover:text-theme-text-danger disabled:text-theme-text-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger rounded"
                    title="Remove item"
                    aria-label={`Remove item ${index + 1}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <AddItemButton onClick={addItem} itemType="Item" />
      </ItemManagementContainer>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Enter the items that students need to order</li>
          <li>Arrange them in the correct order using drag handles or arrow buttons</li>
          <li>Students will drag items to arrange them in the correct sequence</li>
          <li>Minimum 2 items required</li>
        </ul>
      </InstructionsModal>

      <QuestionPreviewSection showPreview={showPreview}>
        <p>Students will see:</p>
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border border-theme-border-primary rounded bg-theme-bg-primary">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <span className="text-sm">
                  {item.text || `Item ${index + 1}`}
                </span>
              </div>
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-theme-text-tertiary">
          Students will drag items to arrange them in the correct order.
        </p>
      </QuestionPreviewSection>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4">
          <h5 className="text-sm font-medium text-theme-text-primary mb-2">Correct Order</h5>
          <div className="text-sm text-theme-text-secondary">
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span className={item.text ? 'text-theme-text-primary' : 'text-red-600'}>
                    {item.text || 'No text provided'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderingEditor; 
