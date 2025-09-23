// ---------------------------------------------------------------------------
// HotspotQuestion.tsx - Hotspot question display
// Based on HotspotContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { QuestionDto, HotspotContent, HotspotRegion } from '@/types';

interface HotspotQuestionProps {
  question: QuestionDto;
  onAnswerChange?: (clickedRegions: number[]) => void;
  currentAnswer?: number[];
  showCorrectAnswer?: boolean;
  disabled?: boolean;
}

const HotspotQuestion: React.FC<HotspotQuestionProps> = ({
  question,
  onAnswerChange,
  currentAnswer = [],
  showCorrectAnswer = false,
  disabled = false
}) => {
  const content = question.content as HotspotContent;
  const { imageUrl, regions } = content;
  const [clickedRegions, setClickedRegions] = useState<number[]>(currentAnswer);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !regions) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Find which region was clicked
    const clickedRegion = regions.find(region => 
      x >= region.x && x <= region.x + region.width &&
      y >= region.y && y <= region.y + region.height
    );

    if (clickedRegion) {
      const newClickedRegions = clickedRegions.includes(clickedRegion.id)
        ? clickedRegions.filter(id => id !== clickedRegion.id)
        : [...clickedRegions, clickedRegion.id];
      
      setClickedRegions(newClickedRegions);
      onAnswerChange?.(newClickedRegions);
    }
  };

  const getRegionStatus = (region: HotspotRegion) => {
    if (!showCorrectAnswer) return 'normal';
    
    const isClicked = clickedRegions.includes(region.id);
    if (region.correct) return 'correct';
    if (isClicked && !region.correct) return 'incorrect';
    return 'normal';
  };

  const getCorrectClicksCount = () => {
    return regions?.filter(region => 
      region.correct && clickedRegions.includes(region.id)
    ).length || 0;
  };

  const getIncorrectClicksCount = () => {
    return clickedRegions.filter(id => 
      !regions?.find(r => r.id === id)?.correct
    ).length;
  };

  const getTotalCorrectRegions = () => {
    return regions?.filter(r => r.correct).length || 0;
  };

  return (
    <div className="hotspot-question">
      {/* Instructions */}
      <div className="mb-4 text-sm text-theme-text-secondary">
        <p>Click on the areas in the image that you believe are correct.</p>
      </div>

      {/* Image with Hotspots */}
      <div className="space-y-4">
        {imageUrl ? (
          <div className="relative inline-block border border-theme-border-primary rounded-lg overflow-hidden">
            <div
              className="relative cursor-pointer"
              onClick={handleImageClick}
              style={{ minHeight: '300px' }}
            >
              <img
                src={imageUrl}
                alt="Hotspot question image"
                className="max-w-full h-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden absolute inset-0 bg-theme-bg-tertiary flex items-center justify-center">
                <div className="text-center text-theme-text-tertiary">
                  <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm">Image not available</p>
                </div>
              </div>

              {/* Region Overlays */}
              {regions?.map((region) => {
                const status = getRegionStatus(region);
                const isClicked = clickedRegions.includes(region.id);
                
                return (
                  <div
                    key={region.id}
                    className={`absolute border-2 transition-all duration-200 ${
                      status === 'correct'
                        ? 'border-green-500 bg-theme-bg-success0 bg-opacity-20'
                        : status === 'incorrect'
                        ? 'border-red-500 bg-theme-bg-danger0 bg-opacity-20'
                        : isClicked
                        ? 'border-indigo-500 bg-theme-bg-primary0 bg-opacity-20'
                        : 'border-transparent hover:border-theme-border-secondary hover:bg-theme-bg-tertiary hover:bg-opacity-10'
                    }`}
                    style={{
                      left: `${region.x}%`,
                      top: `${region.y}%`,
                      width: `${region.width}%`,
                      height: `${region.height}%`
                    }}
                    title={`Region ${region.id}${showCorrectAnswer ? ` (${region.correct ? 'Correct' : 'Incorrect'})` : ''}`}
                  >
                    {/* Region Label */}
                    <div className={`absolute -top-2 -left-2 px-2 py-1 text-xs font-medium rounded ${
                      status === 'correct'
                        ? 'bg-theme-bg-success0 text-white'
                        : status === 'incorrect'
                        ? 'bg-theme-bg-danger0 text-white'
                        : isClicked
                        ? 'bg-theme-bg-primary0 text-white'
                        : 'bg-theme-bg-secondary0 text-white'
                    }`}>
                      {region.id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border border-theme-border-primary rounded-lg p-8 text-center text-theme-text-tertiary">
            <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm">No image provided</p>
          </div>
        )}
      </div>

      {/* Click Summary */}
      {regions && regions.length > 0 && (
        <div className="mt-4 p-3 bg-theme-bg-secondary border border-theme-border-primary rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-theme-text-secondary">Clicks Summary</span>
            <span className="text-sm text-theme-text-secondary">
              {clickedRegions.length} region{clickedRegions.length !== 1 ? 's' : ''} clicked
            </span>
          </div>
          <div className="mt-2 w-full bg-theme-bg-tertiary rounded-full h-2">
            <div 
              className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(clickedRegions.length / regions.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Answer Summary */}
      {showCorrectAnswer && regions && regions.length > 0 && (
        <div className="mt-6 p-4 bg-theme-bg-success border border-green-200 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-success mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-success">Hotspot Analysis</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-green-700">Correctly clicked regions:</span>
                  <span className="font-medium text-theme-interactive-success">{getCorrectClicksCount()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-red-700">Incorrectly clicked regions:</span>
                  <span className="font-medium text-theme-interactive-danger">{getIncorrectClicksCount()}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-theme-interactive-primary">Total correct regions:</span>
                  <span className="font-medium text-theme-interactive-info">{getTotalCorrectRegions()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Correct Regions */}
      {showCorrectAnswer && regions && (
        <div className="mt-4 p-4 bg-theme-bg-info border border-theme-border-info rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-info">Correct Regions</p>
              <div className="mt-2 space-y-1">
                {regions.filter(r => r.correct).map((region) => (
                  <div key={region.id} className="flex items-center space-x-2 text-sm">
                    <span className="font-medium text-theme-interactive-primary">Region {region.id}:</span>
                    <span className="text-theme-interactive-info">
                      ({region.x}%, {region.y}%) {region.width}×{region.height}
                    </span>
                    {clickedRegions.includes(region.id) && (
                      <svg className="w-4 h-4 text-theme-interactive-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Your Clicks */}
      {showCorrectAnswer && clickedRegions.length > 0 && (
        <div className="mt-4 p-4 bg-theme-bg-warning border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-theme-interactive-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-theme-interactive-warning">Your Clicks</p>
              <div className="mt-2 space-y-1">
                {clickedRegions.map((regionId) => {
                  const region = regions?.find(r => r.id === regionId);
                  const isCorrect = region?.correct;
                  
                  return (
                    <div key={regionId} className="flex items-center space-x-2 text-sm">
                      <span className="font-medium text-yellow-700">Region {regionId}:</span>
                      <span className={isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger'}>
                        {region ? `(${region.x}%, ${region.y}%) ${region.width}×${region.height}` : 'Unknown region'}
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

export default HotspotQuestion; 