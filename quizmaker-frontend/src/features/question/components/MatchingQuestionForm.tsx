// ---------------------------------------------------------------------------
// MatchingQuestionForm.tsx - Matching question editor
// Based on MATCHING content from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components';
import { MediaPicker } from '@/features/media';
import type { MatchingContent, MatchingItem, MediaRefDto } from '@/types';

type MatchingLeftItem = MatchingItem & { matchId: number };
type MatchingRightItem = MatchingItem;

const MIN_MATCHING_PAIRS = 4;
const FIRST_RIGHT_ITEM_ID = 10;

const getMediaUrl = (media?: MatchingItem['media']) =>
  media && 'cdnUrl' in media ? media.cdnUrl : undefined;

const createBlankPair = (leftId: number, rightId: number) => ({
  left: { id: leftId, text: '', matchId: rightId } as MatchingLeftItem,
  right: { id: rightId, text: '' } as MatchingRightItem,
});

const normalizeMatchingContent = (content: MatchingContent): {
  left: MatchingLeftItem[];
  right: MatchingRightItem[];
} => {
  const left: MatchingLeftItem[] = (content.left || []).map((item) => ({
    ...item,
    text: item.text || '',
    matchId: item.matchId ?? FIRST_RIGHT_ITEM_ID + item.id - 1,
  }));
  const right: MatchingRightItem[] = (content.right || []).map((item) => ({ ...item, text: item.text || '' }));

  while (left.length < MIN_MATCHING_PAIRS) {
    const nextLeftId = Math.max(...left.map((item) => item.id), 0) + 1;
    const nextRightId = Math.max(...right.map((item) => item.id), FIRST_RIGHT_ITEM_ID - 1) + 1;
    const pair = createBlankPair(nextLeftId, nextRightId);
    left.push(pair.left);
    right.push(pair.right);
  }

  return { left, right };
};

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
  const initialContent = normalizeMatchingContent(content);
  const [leftItems, setLeftItems] = useState<MatchingLeftItem[]>(initialContent.left);
  const [rightItems, setRightItems] = useState<MatchingRightItem[]>(initialContent.right);

  // Update parent when content changes
  useEffect(() => {
    onChange({ left: leftItems, right: rightItems });
  }, [leftItems, rightItems, onChange]);

  const addPair = () => {
    const newLeftId = Math.max(...leftItems.map(item => item.id), 0) + 1;
    const newMatchId = Math.max(...rightItems.map(item => item.id), FIRST_RIGHT_ITEM_ID - 1) + 1;
    const pair = createBlankPair(newLeftId, newMatchId);

    setLeftItems([...leftItems, pair.left]);
    setRightItems([...rightItems, pair.right]);
  };

  const removePair = (leftId: number) => {
    if (leftItems.length > MIN_MATCHING_PAIRS) {
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

  const updateLeftMedia = (id: number, media: MediaRefDto | null) => {
    setLeftItems(leftItems.map(item =>
      item.id === id ? { ...item, media: media ?? undefined } : item
    ));
  };

  const updateRightMedia = (id: number, media: MediaRefDto | null) => {
    setRightItems(rightItems.map(item =>
      item.id === id ? { ...item, media: media ?? undefined } : item
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
                {leftItems.length > MIN_MATCHING_PAIRS && (
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
                    value={leftItem.text || ''}
                    onChange={(e) => updateLeftItem(leftItem.id, 'text', e.target.value)}
                    placeholder="Enter left item..."
                    className="w-full"
                  />
                  <MediaPicker
                    value={(leftItem.media as MediaRefDto | undefined) || null}
                    onChange={(media) => updateLeftMedia(leftItem.id, media)}
                    label="Left image"
                    helperText="Optional. An image can replace the left-item text."
                    uploadLabel="Upload image"
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
                  <MediaPicker
                    value={(rightItem?.media as MediaRefDto | undefined) || null}
                    onChange={(media) => updateRightMedia(leftItem.matchId, media)}
                    label="Right image"
                    helperText="Optional. An image can replace the right-item text."
                    uploadLabel="Upload image"
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
                    <div className="space-y-2">
                      {getMediaUrl(item.media) && (
                        <img
                          src={getMediaUrl(item.media)}
                          alt={`Left item ${item.id} media`}
                          className="h-10 w-auto rounded-md border border-theme-border-primary"
                        />
                      )}
                      {!getMediaUrl(item.media) && item.media?.assetId && !item.text?.trim() && (
                        <span className="text-theme-text-tertiary">Image unavailable.</span>
                      )}
                      <span>{item.text || (getMediaUrl(item.media) ? 'Image item' : `Item ${item.id}`)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5 className="text-xs font-medium text-theme-text-secondary mb-2">Right Column</h5>
              <div className="space-y-1">
                {rightItems.map(item => (
                  <div key={item.id} className="text-sm bg-theme-bg-primary p-2 rounded border">
                    <div className="space-y-2">
                      {getMediaUrl(item.media) && (
                        <img
                          src={getMediaUrl(item.media)}
                          alt={`Right item ${item.id} media`}
                          className="h-10 w-auto rounded-md border border-theme-border-primary"
                        />
                      )}
                      {!getMediaUrl(item.media) && item.media?.assetId && !item.text?.trim() && (
                        <span className="text-theme-text-tertiary">Image unavailable.</span>
                      )}
                      <span>{item.text || (getMediaUrl(item.media) ? 'Image item' : `Match ${item.id}`)}</span>
                    </div>
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
