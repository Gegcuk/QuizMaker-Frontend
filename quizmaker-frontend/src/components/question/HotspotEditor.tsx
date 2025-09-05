// ---------------------------------------------------------------------------
// HotspotEditor.tsx - Hotspot question editor
// Based on HotspotContent from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { HotspotContent, HotspotRegion } from '../../types/question.types';

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
          <h4 className="text-lg font-medium text-gray-900">Hotspot Question</h4>
          <p className="text-sm text-gray-500">Click on correct areas in an image</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {regions.length} region{regions.length !== 1 ? 's' : ''}
          </span>
          {getCorrectRegions().length === 0 && regions.length > 0 && (
            <span className="text-xs text-red-500">No correct regions</span>
          )}
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="hotspot-image" className="block text-sm font-medium text-gray-700 mb-2">
              Image <span className="text-red-600">*</span>
            </label>
            <input
              id="hotspot-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Provide a URL to the image that students will interact with.
            </p>
          </div>

          {/* Image Preview */}
          {showPreview && imageUrl && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Image Preview</h5>
              <div className="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Hotspot question image"
                  className="max-w-full h-auto border border-gray-300 rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden bg-gray-100 border border-gray-300 rounded p-8 text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium text-gray-700">Hotspot Regions</h5>
            <button
              type="button"
              onClick={addRegion}
              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Region
            </button>
          </div>

          {regions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`p-4 border rounded-lg bg-white cursor-pointer transition-colors ${
                    selectedRegion === region.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRegion(region.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        region.correct ? 'bg-green-500 border-green-500' : 'bg-red-500 border-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-gray-900">
                        Region {region.id}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        region.correct 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
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
                        className="text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded"
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
                        className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
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
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">X Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={region.x}
                            onChange={(e) => updateRegion(region.id, { x: parseInt(e.target.value) })}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Y Position (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={region.y}
                            onChange={(e) => updateRegion(region.id, { y: parseInt(e.target.value) })}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Width (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={region.width}
                            onChange={(e) => updateRegion(region.id, { width: parseInt(e.target.value) })}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Height (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={region.height}
                            onChange={(e) => updateRegion(region.id, { height: parseInt(e.target.value) })}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-xs"
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
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Instructions</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Upload an image that students will interact with</li>
                <li>Add regions to mark clickable areas</li>
                <li>Mark regions as correct or incorrect</li>
                <li>Adjust region position and size as needed</li>
                <li>Students will click on areas they believe are correct</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Preview</h5>
          <div className="text-sm text-gray-600">
            <p>Students will see:</p>
            <div className="mt-2">
              {imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Hotspot question preview"
                    className="max-w-full h-auto border border-gray-300 rounded"
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
                        borderColor: region.correct ? '#10B981' : '#EF4444'
                      }}
                      title={`Region ${region.id} (${region.correct ? 'Correct' : 'Incorrect'})`}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 border border-gray-300 rounded p-8 text-center text-gray-500">
                  <p>No image provided</p>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Students will click on the marked areas to answer the question.
            </p>
          </div>
        </div>
      )}

      {/* Region Summary */}
      {regions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h5 className="text-sm font-medium text-green-800 mb-2">Region Summary</h5>
          <div className="text-sm text-green-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h6 className="font-medium text-green-800">Correct Regions:</h6>
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
                <h6 className="font-medium text-red-800">Incorrect Regions:</h6>
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
