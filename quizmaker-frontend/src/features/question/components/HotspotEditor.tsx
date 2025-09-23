// ---------------------------------------------------------------------------
// HotspotEditor.tsx - Hotspot question editor
// Based on HotspotContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { HotspotContent, HotspotRegion } from '@/types';
import { InstructionsModal } from '@/components';
import { useTheme } from '@/context/ThemeContext';

interface HotspotEditorProps {
  content: HotspotContent;
  onChange: (content: HotspotContent) => void;
  className?: string;
  showPreview?: boolean;
}

const HotspotEditor: React.FC<HotspotEditorProps> = ({
  content,
  onChange,
  className = '',
  showPreview = true
}) => {
  const [imageUrl, setImageUrl] = useState<string>(content.imageUrl || '');
  const [regions, setRegions] = useState<HotspotRegion[]>(content.regions || []);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const { currentPalette } = useTheme();

  // Update parent when content changes
  useEffect(() => {
    onChange({ imageUrl, regions });
  }, [imageUrl, regions, onChange]);

  const addRegion = () => {
    const newId = regions.length + 1;
    const newRegion: HotspotRegion = {
      id: newId,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      correct: true
    };
    setRegions(prev => [...prev, newRegion]);
    setSelectedRegion(newId);
  };

  const removeRegion = (id: number) => {
    setRegions(prev => prev.filter(region => region.id !== id));
    if (selectedRegion === id) {
      setSelectedRegion(null);
    }
  };

  const updateRegion = (id: number, updates: Partial<HotspotRegion>) => {
    setRegions(prev => prev.map(region => 
      region.id === id ? { ...region, ...updates } : region
    ));
  };

  const toggleRegionCorrect = (id: number) => {
    updateRegion(id, { correct: !regions.find(r => r.id === id)?.correct });
  };

  const getCorrectRegions = () => regions.filter(r => r.correct);
  const getIncorrectRegions = () => regions.filter(r => !r.correct);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-medium text-theme-text-primary">Hotspot Question</h4>
          <p className="text-sm text-theme-text-tertiary">Click on correct areas in an image</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-theme-text-tertiary">
            {regions.length} region{regions.length !== 1 ? 's' : ''}
          </span>
          {getCorrectRegions().length === 0 && regions.length > 0 && (
            <span className="text-xs text-theme-text-danger">No correct regions</span>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="hotspot-image" className="block text-sm font-medium text-theme-text-secondary mb-2">
              Image <span className="text-theme-text-danger">*</span>
            </label>
            <input
              id="hotspot-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              required
            />
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Provide a URL to the image that students will interact with.
            </p>
          </div>

          {/* Image Preview */}
          {showPreview && imageUrl && (
            <div className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary bg-theme-bg-primary text-theme-text-primary">
              <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Image Preview</h5>
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Hotspot question image"
                  className="max-w-full h-auto border border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden bg-theme-bg-tertiary border border-theme-border-primary rounded p-8 text-center text-theme-text-tertiary bg-theme-bg-primary text-theme-text-primary">
                  <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm">Image not available</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Regions Management */}
      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-theme-text-secondary">Hotspot Regions</h5>
            <button
              type="button"
              onClick={addRegion}
              className="inline-flex items-center px-3 py-1 border border-theme-border-primary rounded-md shadow-sm text-xs font-medium text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary bg-theme-bg-primary text-theme-text-primary"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Region
            </button>
          </div>

          {regions.length === 0 ? (
            <div className="text-center py-8 text-theme-text-tertiary">
              <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm">No regions defined</p>
              <p className="text-xs">Add regions to mark clickable areas on the image</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regions.map((region) => (
                <div
                  key={region.id}
                  className={`p-4 border rounded-lg bg-theme-bg-primary cursor-pointer transition-colors ${
                    selectedRegion === region.id ? 'border-theme-interactive-primary bg-theme-bg-tertiary' : 'border-theme-border-primary hover:border-theme-border-primary'
                  }`}
                  onClick={() => setSelectedRegion(region.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        region.correct ? 'bg-theme-interactive-success border-theme-interactive-success' : 'bg-theme-interactive-danger border-theme-interactive-danger'
                      }`}></div>
                      <span className="text-sm font-medium text-theme-text-primary">
                        Region {region.id}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        region.correct 
                          ? 'bg-theme-bg-tertiary text-theme-text-primary' 
                          : 'bg-theme-bg-tertiary text-theme-text-danger'
                      }`}>
                        {region.correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRegionCorrect(region.id);
                        }}
                        className="text-sm text-theme-text-secondary hover:text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-primary rounded"
                        aria-label={`Toggle region ${region.id} correctness`}
                        title={`Toggle region ${region.id} correctness`}
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRegion(region.id);
                        }}
                        className="text-theme-text-danger hover:text-theme-text-danger focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-interactive-danger rounded"
                        title="Remove region"
                        aria-label={`Remove region ${region.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Region Properties */}
                  {selectedRegion === region.id && (
                    <div className="mt-3 pt-3 border-t border-theme-border-primary bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">X Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={region.x}
                            onChange={(e) => updateRegion(region.id, { x: parseInt(e.target.value) })}
                            className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary text-xs bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Y Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={region.y}
                            onChange={(e) => updateRegion(region.id, { y: parseInt(e.target.value) })}
                            className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary text-xs bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Width (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={region.width}
                            onChange={(e) => updateRegion(region.id, { width: parseInt(e.target.value) })}
                            className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary text-xs bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-theme-text-secondary mb-1">Height (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={region.height}
                            onChange={(e) => updateRegion(region.id, { height: parseInt(e.target.value) })}
                            className="block w-full border-theme-border-primary rounded-md shadow-sm focus:ring-theme-interactive-primary focus:border-theme-interactive-primary text-xs bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <InstructionsModal title="Instructions">
        <ul className="list-disc list-inside space-y-1">
          <li>Upload an image that students will interact with</li>
          <li>Add regions to mark clickable areas</li>
          <li>Mark regions as correct or incorrect</li>
          <li>Adjust region position and size as needed</li>
          <li>Students will click on areas they believe are correct</li>
        </ul>
      </InstructionsModal>

      {/* Preview */}
      {showPreview && (
        <div className="bg-theme-bg-secondary border border-theme-border-primary rounded-lg p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-secondary mb-2">Preview</h5>
          <div className="text-sm text-theme-text-secondary">
            <p>Students will see:</p>
            <div className="mt-2">
              {imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Hotspot question preview"
                    className="max-w-full h-auto border border-theme-border-primary rounded bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
                  />
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      className="absolute border-2 border-dashed cursor-pointer"
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                        borderColor: region.correct ? currentPalette.colors.interactive.success : currentPalette.colors.interactive.danger
                      }}
                      title={`Region ${region.id} (${region.correct ? 'Correct' : 'Incorrect'})`}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded p-8 text-center text-theme-text-tertiary bg-theme-bg-primary text-theme-text-primary">
                  <p>No image provided</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-theme-text-tertiary">
              Students will click on the marked areas to answer the question.
            </p>
          </div>
        </div>
      )}

      {/* Region Summary */}
      {regions.length > 0 && (
        <div className="bg-theme-bg-tertiary border border-theme-border-primary rounded-md p-4 bg-theme-bg-primary text-theme-text-primary">
          <h5 className="text-sm font-medium text-theme-text-primary mb-2">Region Summary</h5>
          <div className="text-sm text-theme-text-secondary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-theme-text-primary">Correct Regions:</h6>
                <div className="mt-1 space-y-1">
                  {getCorrectRegions().map((region) => (
                    <div key={region.id} className="flex items-center space-x-2">
                      <span className="font-medium">Region {region.id}:</span>
                      <span className="text-xs">
                        ({region.x}%, {region.y}%) {region.width}×{region.height}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h6 className="font-medium text-theme-text-danger">Incorrect Regions:</h6>
                <div className="mt-1 space-y-1">
                  {getIncorrectRegions().map((region) => (
                    <div key={region.id} className="flex items-center space-x-2">
                      <span className="font-medium">Region {region.id}:</span>
                      <span className="text-xs">
                        ({region.x}%, {region.y}%) {region.width}×{region.height}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotEditor; 
