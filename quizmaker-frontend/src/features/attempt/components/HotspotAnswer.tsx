// src/components/attempt/HotspotAnswer.tsx
// ---------------------------------------------------------------------------
// Component for hotspot question answers
// Handles image region selection for hotspot questions
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { QuestionForAttemptDto } from '@/types';

interface HotspotAnswerProps {
  question: QuestionForAttemptDto;
  currentAnswer?: { x: number; y: number; width: number; height: number };
  onAnswerChange: (answer: { x: number; y: number; width: number; height: number }) => void;
  disabled?: boolean;
  className?: string;
}

interface HotspotRegion {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const HotspotAnswer: React.FC<HotspotAnswerProps> = ({
  question,
  currentAnswer,
  onAnswerChange,
  disabled = false,
  className = ''
}) => {
  const [selectedRegion, setSelectedRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(currentAnswer || null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Extract image and regions from safe content
  const imageUrl = question.safeContent?.imageUrl || '';
  const regions: HotspotRegion[] = question.safeContent?.regions || [];
  const effectiveImageUrl = imageUrl;

  useEffect(() => {
    setSelectedRegion(currentAnswer || null);
  }, [currentAnswer]);

  useEffect(() => {
    drawCanvas();
  }, [selectedRegion, mousePosition, isDrawing, startPoint]);

  // Ensure canvas is drawn on mount and when image changes
  useEffect(() => {
    const timer = setTimeout(() => {
      drawCanvas();
    }, 100);
    return () => clearTimeout(timer);
  }, [imageUrl]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const image = imageRef.current;

    if (!canvas || !ctx) return;
    
    // If no image is loaded or image is broken, draw a simple placeholder directly on canvas
    if (!image || !image.complete || image.naturalWidth === 0) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw placeholder background
      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw border
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Hotspot Question', canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = '16px Arial';
      ctx.fillText('No image provided', canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText('Click and drag to select regions', canvas.width / 2, canvas.height / 2 + 35);
      
      // Draw sample regions
      const sampleRegions = [
        { x: 50, y: 80, width: 120, height: 80 },
        { x: 200, y: 120, width: 150, height: 100 },
        { x: 400, y: 60, width: 100, height: 120 }
      ];
      
      sampleRegions.forEach(region => {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(region.x, region.y, region.width, region.height);
        ctx.setLineDash([]);
      });
      
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw predefined regions (for reference, semi-transparent)
    regions.forEach(region => {
      const x = (region.x / 100) * canvas.width;
      const y = (region.y / 100) * canvas.height;
      const width = (region.width / 100) * canvas.width;
      const height = (region.height / 100) * canvas.height;

      ctx.strokeStyle = 'rgba(0, 0, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    });

    // Draw current selection
    if (selectedRegion) {
      const x = (selectedRegion.x / 100) * canvas.width;
      const y = (selectedRegion.y / 100) * canvas.height;
      const width = (selectedRegion.width / 100) * canvas.width;
      const height = (selectedRegion.height / 100) * canvas.height;

      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
    }

    // Draw selection in progress
    if (isDrawing && startPoint && mousePosition) {
      const x = Math.min(startPoint.x, mousePosition.x);
      const y = Math.min(startPoint.y, mousePosition.y);
      const width = Math.abs(mousePosition.x - startPoint.x);
      const height = Math.abs(mousePosition.y - startPoint.y);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getPercentageCoordinates = (x: number, y: number, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };

    return {
      x: (x / canvas.width) * 100,
      y: (y / canvas.height) * 100,
      width: (width / canvas.width) * 100,
      height: (height / canvas.height) * 100
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const coords = getCanvasCoordinates(e);
    setStartPoint(coords);
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (disabled) return;
    
    const coords = getCanvasCoordinates(e);
    setMousePosition(coords);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (disabled || !isDrawing || !startPoint) return;
    
    const coords = getCanvasCoordinates(e);
    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    // Minimum selection size
    if (width > 10 && height > 10) {
      const percentageCoords = getPercentageCoordinates(x, y, width, height);
      setSelectedRegion(percentageCoords);
      onAnswerChange(percentageCoords);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setMousePosition(null);
  };

  const handleClearSelection = () => {
    setSelectedRegion(null);
    onAnswerChange({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handleImageLoad = () => {
    drawCanvas();
  };

  const handleImageError = () => {
    drawCanvas();
  };

  const handlePlaceholderLoad = () => {
    // Force canvas redraw when placeholder is created
    setTimeout(() => {
      drawCanvas();
    }, 100);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 mb-4">
        {imageUrl ? (
          <>Click and drag on the image to select the correct region:</>
        ) : (
          <>
            <div className="text-amber-600 font-medium mb-2">⚠️ No image provided</div>
            <div>This is a placeholder. You can still practice selecting regions by clicking and dragging:</div>
          </>
        )}
      </div>

      {/* Image Container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`w-full h-auto cursor-crosshair ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        />
        {imageUrl && (
          <img
            ref={imageRef}
            src={effectiveImageUrl}
            alt="Hotspot question"
            onLoad={handleImageLoad}
            onError={handleImageError}
            className="hidden"
          />
        )}
        
        {/* Overlay Instructions removed to allow full canvas interaction */}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedRegion ? 'Region selected' : 'No region selected'}
        </div>
        {selectedRegion && (
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={disabled}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Selection Details */}
      {selectedRegion && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-md">
          <div className="text-sm text-indigo-700">
            <strong>Selected Region:</strong>
            <div className="mt-1 text-xs">
              X: {selectedRegion.x.toFixed(1)}%, Y: {selectedRegion.y.toFixed(1)}%
              <br />
              Width: {selectedRegion.width.toFixed(1)}%, Height: {selectedRegion.height.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="text-sm text-blue-700">
          <strong>Instructions:</strong> {imageUrl ? (
            <>Click and drag on the image to create a selection box around the correct area. The blue dashed lines show predefined regions for reference.</>
          ) : (
            <>This is a practice hotspot question. Click and drag to create selection boxes. The blue dashed lines show sample regions for reference.</>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="text-sm text-gray-700">
          <strong>Tips:</strong>
          <ul className="mt-1 ml-4 list-disc">
            <li>Make sure your selection covers the entire target area</li>
            <li>You can adjust your selection by clicking and dragging again</li>
            <li>The blue dashed lines show predefined regions for reference</li>
            <li>Use the clear button to start over if needed</li>
          </ul>
        </div>
      </div>

      {/* No Selection Warning */}
      {!selectedRegion && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-700">
            Please select a region on the image to continue.
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotAnswer; 
