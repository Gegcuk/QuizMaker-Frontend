import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components';
import type { QuestionForAttemptDto } from '@/types';

interface HotspotAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: number | null;
  onAnswerChange: (answer: number | null) => void;
  disabled?: boolean;
  className?: string;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: {
    regionId?: number;
    correctRegionId?: number;
  } | null;
}

interface HotspotRegion {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const normalizeRegionId = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const HotspotAnswer: React.FC<HotspotAnswerProps> = ({
  question,
  currentAnswer = null,
  onAnswerChange,
  disabled = false,
  className = '',
  showFeedback = false,
  isCorrect,
  correctAnswer = null,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(
    normalizeRegionId(currentAnswer),
  );
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl =
    typeof question.safeContent?.imageUrl === 'string'
      ? question.safeContent.imageUrl
      : '';
  const regions = useMemo<HotspotRegion[]>(() => {
    if (!Array.isArray(question.safeContent?.regions)) {
      return [];
    }

    return question.safeContent.regions.filter((region: unknown): region is HotspotRegion => {
      if (!region || typeof region !== 'object') {
        return false;
      }

      const candidate = region as Partial<HotspotRegion>;
      return [
        candidate.id,
        candidate.x,
        candidate.y,
        candidate.width,
        candidate.height,
      ].every((value) => typeof value === 'number' && Number.isFinite(value));
    });
  }, [question.safeContent?.regions]);

  const correctRegionId = normalizeRegionId(
    correctAnswer?.regionId ?? correctAnswer?.correctRegionId,
  );

  useEffect(() => {
    setSelectedRegionId(normalizeRegionId(currentAnswer));
  }, [currentAnswer]);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const handleRegionSelect = (regionId: number) => {
    if (disabled) {
      return;
    }

    setSelectedRegionId(regionId);
    onAnswerChange(regionId);
  };

  const handleClearSelection = () => {
    setSelectedRegionId(null);
    onAnswerChange(null);
  };

  if (regions.length === 0) {
    return (
      <div
        className={`rounded-md border border-theme-border-primary bg-theme-bg-secondary p-4 text-center text-theme-text-tertiary ${className}`}
      >
        No regions available
      </div>
    );
  }

  const showImage = imageUrl.length > 0 && !imageFailed;

  return (
    <div className={`space-y-4 ${className}`}>
      <p className="text-sm text-theme-text-secondary">
        Select one region on the image.
      </p>

      <div
        className={`relative w-full max-w-3xl overflow-hidden rounded-lg border border-theme-border-primary bg-theme-bg-secondary ${
          showImage ? '' : 'aspect-[3/2]'
        }`}
      >
        {showImage ? (
          <img
            src={imageUrl}
            alt="Hotspot question"
            className="block h-auto w-full"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-theme-text-tertiary">
            Image unavailable
          </div>
        )}

        {regions.map((region) => {
          const isSelected = selectedRegionId === region.id;
          const isCorrectRegion = showFeedback && correctRegionId === region.id;
          const isIncorrectSelection =
            showFeedback && isCorrect === false && isSelected && !isCorrectRegion;

          let regionClasses =
            'border-theme-border-secondary bg-transparent hover:border-theme-interactive-primary';
          let badgeClasses =
            'border-theme-border-primary bg-theme-bg-primary text-theme-text-secondary';

          if (isCorrectRegion) {
            regionClasses = 'border-theme-interactive-success bg-theme-bg-success';
            badgeClasses =
              'border-theme-interactive-success bg-theme-interactive-success text-theme-text-inverse';
          } else if (isIncorrectSelection) {
            regionClasses = 'border-theme-interactive-danger bg-theme-bg-danger';
            badgeClasses =
              'border-theme-interactive-danger bg-theme-interactive-danger text-theme-text-inverse';
          } else if (isSelected) {
            regionClasses = 'border-theme-interactive-primary bg-theme-bg-info';
            badgeClasses =
              'border-theme-interactive-primary bg-theme-interactive-primary text-theme-text-inverse';
          }

          return (
            <button
              key={region.id}
              type="button"
              onClick={() => handleRegionSelect(region.id)}
              disabled={disabled}
              aria-label={`Select region ${region.id}`}
              aria-pressed={isSelected}
              className={`absolute border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-interactive-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${regionClasses}`}
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
              }}
            >
              <span
                className={`absolute left-1 top-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-xs font-semibold ${badgeClasses}`}
              >
                {region.id}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-theme-text-secondary">
          {selectedRegionId === null
            ? 'No region selected'
            : `Region ${selectedRegionId} selected`}
        </p>
        {selectedRegionId !== null && (
          <Button
            type="button"
            onClick={handleClearSelection}
            disabled={disabled}
            variant="ghost"
            size="sm"
          >
            Clear Selection
          </Button>
        )}
      </div>
    </div>
  );
};

export default HotspotAnswer;
