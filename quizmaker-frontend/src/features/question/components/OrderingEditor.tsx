// ---------------------------------------------------------------------------
// OrderingEditor.tsx - Ordering question editor
// Based on OrderingContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { MediaRefDto, OrderingContent, OrderingItem } from '@/types';
import { InstructionsModal, AddItemButton, QuestionPreviewSection, ItemManagementContainer, Textarea, Button } from '@/components';
import { MediaPicker } from '@/features/media';

const MIN_ORDERING_ITEMS = 3;
const MAX_ORDERING_ITEMS = 10;

const getMediaUrl = (media?: OrderingItem['media']) =>
  media && 'cdnUrl' in media ? media.cdnUrl : undefined;

interface OrderingEditorProps {
  content: OrderingContent;
  onChange: (content: OrderingContent) => void;
  className?: string;
  showPreview?: boolean;
}

const createBlankItem = (index: number): OrderingItem => ({
  id: index + 1,
  text: '',
});

const normalizeOrderingItems = (items: OrderingItem[] | undefined): OrderingItem[] => {
  const normalized: OrderingItem[] = (items || [])
    .slice(0, MAX_ORDERING_ITEMS)
    .map((item, index) => ({
      ...item,
      id: index + 1,
      text: item.text || '',
    }));

  while (normalized.length < MIN_ORDERING_ITEMS) {
    normalized.push(createBlankItem(normalized.length));
  }

  return normalized;
};

const OrderingEditor: React.FC<OrderingEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [items, setItems] = useState<OrderingItem[]>(
    () => normalizeOrderingItems(content.items)
  );
  const canAddItem = items.length < MAX_ORDERING_ITEMS;
  const canRemoveItem = items.length > MIN_ORDERING_ITEMS;

  // Update parent when items change
  useEffect(() => {
    onChange({ items });
  }, [items, onChange]);

  // Auto-resize all textareas on mount and when items change
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea[data-ordering-item]');
    textareas.forEach((textarea) => {
      const element = textarea as HTMLTextAreaElement;
      element.style.height = 'auto';
      element.style.height = element.scrollHeight + 'px';
    });
  }, [items]);

  const addItem = () => {
    if (!canAddItem) return;
    setItems(prev => normalizeOrderingItems([...prev, createBlankItem(prev.length)]));
  };

  const removeItem = (id: number) => {
    if (!canRemoveItem) return;
    setItems(prev => normalizeOrderingItems(prev.filter(item => item.id !== id)));
  };

  const updateItemText = (id: number, text: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const updateItemMedia = (id: number, media: MediaRefDto | null) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, media: media ?? undefined } : item
    ));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(normalizeOrderingItems(newItems));
  };

  const getEmptyItems = () => items.filter(item => !item.text?.trim() && !item.media?.assetId);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-theme-text-tertiary">Arrange items in the correct order</p>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
          {getEmptyItems().length > 0 && (
            <span className="text-xs text-theme-text-danger">
              {getEmptyItems().length} empty item{getEmptyItems().length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      <ItemManagementContainer
        title="Items to Order"
        helperText="Add items in the correct sequence"
      >
        <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start space-x-3 p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
                {/* Item Text */}
                <div className="flex-1">
                  <Textarea
                    data-ordering-item
                    value={item.text || ''}
                    onChange={(e) => {
                      updateItemText(item.id, e.target.value);
                    }}
                    placeholder="Enter item text..."
                    rows={1}
                    fullWidth
                    className="!min-h-[38px]"
                  />
                  <MediaPicker
                    value={(item.media as MediaRefDto | undefined) || null}
                    onChange={(media) => updateItemMedia(item.id, media)}
                    label="Item image"
                    helperText="Optional. An image can be used instead of item text."
                    uploadLabel="Upload image"
                  />
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0 mt-2">
                  <Button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={!canRemoveItem}
                    variant="ghost"
                    size="sm"
                    className="!p-1 !min-w-0 !text-theme-interactive-danger hover:!text-theme-interactive-danger disabled:!text-theme-text-tertiary"
                    title="Remove item"
                    aria-label={`Remove item ${item.id}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Item Button */}
          <AddItemButton onClick={addItem} itemType="Item" disabled={!canAddItem} />
      </ItemManagementContainer>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Enter items in the correct order from top to bottom</li>
          <li>Minimum 3 items required</li>
          <li>Maximum 10 items allowed</li>
        </ul>
      </InstructionsModal>

      <QuestionPreviewSection showPreview={showPreview}>
        <p>How it will appear:</p>
        <div className="mt-2 space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 border border-theme-border-primary rounded bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
              <div className="flex-shrink-0">
                <span className="inline-flex items-center justify-center w-6 h-6 text-sm font-medium text-theme-text-secondary bg-theme-bg-tertiary rounded-full">
                  {index + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="space-y-2 text-sm">
                  {getMediaUrl(item.media) && (
                    <img
                      src={getMediaUrl(item.media)}
                      alt={`Ordering item ${index + 1} media`}
                      className="h-10 w-auto rounded-md border border-theme-border-primary"
                    />
                  )}
                  {!getMediaUrl(item.media) && item.media?.assetId && !item.text?.trim() && (
                    <span className="text-theme-text-tertiary">Image unavailable.</span>
                  )}
                  <span>{item.text || (getMediaUrl(item.media) ? 'Image item' : `Item ${index + 1}`)}</span>
                </div>
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
          Items will appear in random order to be arranged.
        </p>
      </QuestionPreviewSection>

      {/* Order Summary */}
      {items.length > 0 && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-primary mb-2">Correct Order</h5>
          <div className="text-sm text-theme-text-secondary">
            <div className="space-y-1">
              {items.map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span className={item.text || item.media?.assetId ? 'text-theme-text-primary' : 'text-theme-interactive-danger'}>
                    {item.text || (getMediaUrl(item.media) ? 'Image item' : item.media?.assetId ? 'Image unavailable' : 'No text provided')}
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
