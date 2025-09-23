// ---------------------------------------------------------------------------
// MatchingQuestionForm.tsx - Matching question editor
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components';

interface MatchingLeftItem {
  id: number;
  text: string;
  matchId: number;
}

interface MatchingRightItem {
  id: number;
  text: string;
}

interface MatchingContent {
  left: MatchingLeftItem[];
  right: MatchingRightItem[];
}

interface MatchingQuestionFormProps {
  content: MatchingContent;
  onChange: (content: MatchingContent) => void;
  showPreview?: boolean;
  className?: string;
}

export const MatchingQuestionForm: React.FC<MatchingQuestionFormProps> = ({
  content,
  onChange,
  showPreview = false,
  className = ''
}) => {
  const [leftItems, setLeftItems] = useState<MatchingLeftItem[]>(
    content.left || [
      { id: 1, text: '', matchId: 10 },
      { id: 2, text: '', matchId: 11 }
    ]
  );
  const [rightItems, setRightItems] = useState<MatchingRightItem[]>(
    content.right || [
      { id: 10, text: '' },
      { id: 11, text: '' }
    ]
  );

  // Update parent when content changes
  useEffect(() => {
    onChange({ left: leftItems, right: rightItems });
  }, [leftItems, rightItems, onChange]);

  const addPair = () => {
    const newLeftId = Math.max(...leftItems.map(item => item.id), 0) + 1;
    const newMatchId = Math.max(...rightItems.map(item => item.id), 9) + 1;
    
    setLeftItems([...leftItems, { id: newLeftId, text: '', matchId: newMatchId }]);
    setRightItems([...rightItems, { id: newMatchId, text: '' }]);
  };

  const removePair = (leftId: number) => {
    if (leftItems.length > 2) {
      const leftItem = leftItems.find(item => item.id === leftId);
      setLeftItems(leftItems.filter(item => item.id !== leftId));
      if (leftItem) {
        setRightItems(rightItems.filter(item => item.id !== leftItem.matchId));
      }
    }
  };

  const updateLeftItem = (id: number, field: 'text' | 'matchId', value: string | number) => {
    setLeftItems(leftItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const updateRightItem = (id: number, text: string) => {
    setRightItems(rightItems.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-theme-text-secondary">Matching Pairs</h4>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addPair}
        >
          Add Pair
        </Button>
      </div>

      <div className="space-y-3">
        {leftItems.map((leftItem, index) => {
          const rightItem = rightItems.find(item => item.id === leftItem.matchId);
          return (
            <div key={leftItem.id} className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-theme-text-secondary">Pair {index + 1}</span>
                {leftItems.length > 2 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removePair(leftItem.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                    Left Item
                  </label>
                  <Input
                    type="text"
                    value={leftItem.text}
                    onChange={(e) => updateLeftItem(leftItem.id, 'text', e.target.value)}
                    placeholder="Enter left item..."
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-1">
                    Right Item (Match)
                  </label>
                  <Input
                    type="text"
                    value={rightItem?.text || ''}
                    onChange={(e) => updateRightItem(leftItem.matchId, e.target.value)}
                    placeholder="Enter matching right item..."
                    className="w-full"
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {showPreview && (
        <div className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
          <h4 className="text-sm font-medium text-theme-text-secondary mb-3">Preview</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-theme-text-secondary mb-2">Left Column</h5>
              <div className="space-y-1">
                {leftItems.map(item => (
                  <div key={item.id} className="text-sm bg-theme-bg-primary p-2 rounded border">
                    {item.text || `Item ${item.id}`}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-medium text-theme-text-secondary mb-2">Right Column</h5>
              <div className="space-y-1">
                {rightItems.map(item => (
                  <div key={item.id} className="text-sm bg-theme-bg-primary p-2 rounded border">
                    {item.text || `Match ${item.id}`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
