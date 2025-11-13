// src/features/document/components/DocumentPageSelectorModal.tsx
// Modal popup for visual page selection with zoom and preview

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentChunkDto } from '@/types';
import { api } from '@/services';
import { Button, Input, Badge, Alert, useToast } from '@/components';
import { 
  XMarkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface DocumentPageSelectorModalProps {
  documentId?: string;
  uploadedDocument?: DocumentDto | null;
  onConfirm: (data: {
    documentId: string;
    selectedChunkIndices: number[];
    chunks: DocumentChunkDto[];
  }) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const DocumentPageSelectorModal: React.FC<DocumentPageSelectorModalProps> = ({
  documentId: externalDocId,
  uploadedDocument: externalDoc,
  onConfirm,
  onCancel,
  isOpen
}) => {
  const { addToast } = useToast();
  const documentService = new DocumentService(api);
  
  const [documentId, setDocumentId] = useState<string | null>(externalDocId || externalDoc?.id || null);
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100); // 100 = normal, 150 = 1.5x, etc.
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isOpen && documentId) {
      loadChunks();
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (externalDocId) setDocumentId(externalDocId);
    if (externalDoc?.id) setDocumentId(externalDoc.id);
  }, [externalDocId, externalDoc]);

  const loadChunks = async () => {
    if (!documentId) return;

    setIsLoadingChunks(true);
    try {
      const documentChunks = await documentService.getDocumentChunks(documentId);
      setChunks(documentChunks);
      
      // Select all by default
      const allChunkIds = new Set(documentChunks.map(chunk => chunk.id));
      setSelectedChunkIds(allChunkIds);
      
      addToast({ 
        type: 'success', 
        message: `Loaded ${documentChunks.length} pages. All selected by default.` 
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to load chunks' });
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const toggleChunkSelection = (chunkId: string) => {
    const newSelection = new Set(selectedChunkIds);
    if (newSelection.has(chunkId)) {
      newSelection.delete(chunkId);
    } else {
      newSelection.add(chunkId);
    }
    setSelectedChunkIds(newSelection);
  };

  const selectAllChunks = () => {
    const allChunkIds = new Set(chunks.map(chunk => chunk.id));
    setSelectedChunkIds(allChunkIds);
  };

  const deselectAllChunks = () => {
    setSelectedChunkIds(new Set());
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleConfirm = () => {
    if (selectedChunkIds.size === 0) {
      addToast({ type: 'error', message: 'Please select at least one page' });
      return;
    }

    if (!documentId) return;

    const selectedChunks = chunks.filter(chunk => selectedChunkIds.has(chunk.id));
    const selectedChunkIndices = selectedChunks
      .map(chunk => chunk.chunkIndex)
      .sort((a, b) => a - b);

    onConfirm({
      documentId,
      selectedChunkIndices,
      chunks: selectedChunks
    });
  };

  const handleSavePages = () => {
    const selectedChunks = chunks.filter(chunk => selectedChunkIds.has(chunk.id));
    
    if (selectedChunks.length === 0) {
      addToast({ type: 'error', message: 'No pages selected to save' });
      return;
    }

    const content = selectedChunks.map((chunk, idx) => {
      return `
=================================================
PAGE ${idx + 1}: ${chunk.title}
=================================================
Chunk Index: ${chunk.chunkIndex}
Pages: ${chunk.startPage}-${chunk.endPage}
Type: ${chunk.chunkType}
Word Count: ${chunk.wordCount}
Characters: ${chunk.characterCount}
${chunk.chapterTitle ? `Chapter: ${chunk.chapterTitle}` : ''}

CONTENT:
-------------------------------------------------
${chunk.content}

`;
    }).join('\n\n');

    const metadata = {
      documentId,
      selectedChunkCount: selectedChunks.length,
      selectedChunkIndices: selectedChunks.map(c => c.chunkIndex).sort((a, b) => a - b),
      timestamp: new Date().toISOString()
    };

    const fullContent = `DOCUMENT METADATA\n${JSON.stringify(metadata, null, 2)}\n\n${content}`;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-pages-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({ type: 'success', message: `Downloaded ${selectedChunks.length} pages` });
  };

  const getFilteredChunks = () => {
    if (!searchTerm) return chunks;
    const term = searchTerm.toLowerCase();
    return chunks.filter(chunk => 
      chunk.title.toLowerCase().includes(term) ||
      chunk.content.toLowerCase().includes(term)
    );
  };

  const formatWordCount = (count: number): string => {
    if (count < 1000) return `${count} words`;
    return `${(count / 1000).toFixed(1)}k words`;
  };

  if (!isOpen) return null;

  const filteredChunks = getFilteredChunks();
  const cardScale = zoomLevel / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-bg-primary rounded-xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-theme-border-primary flex items-center justify-between bg-theme-bg-secondary rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-theme-text-primary">Select Pages</h2>
            <p className="text-sm text-theme-text-secondary mt-1">
              Click on pages to select/deselect • {selectedChunkIds.size} of {chunks.length} selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-theme-border-primary bg-theme-bg-primary flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search pages..."
              className="w-full"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-theme-bg-secondary px-3 py-2 rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-theme-text-primary min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>

          {/* Selection Buttons */}
          <Button type="button" variant="secondary" size="sm" onClick={selectAllChunks}>
            Select All
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={deselectAllChunks}>
            Deselect All
          </Button>

          {/* Save Pages */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSavePages}
            disabled={selectedChunkIds.size === 0}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Save ({selectedChunkIds.size})
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-theme-bg-primary">
          {isLoadingChunks ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-theme-interactive-primary mx-auto mb-4"></div>
                <p className="text-theme-text-secondary text-lg">Loading pages...</p>
              </div>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Alert type="info">No pages match your search</Alert>
            </div>
          ) : viewMode === 'grid' ? (
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${200 * cardScale}px, 1fr))`
              }}
            >
              {filteredChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  onClick={() => toggleChunkSelection(chunk.id)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 transition-all duration-200
                    ${selectedChunkIds.has(chunk.id)
                      ? 'border-theme-interactive-primary bg-theme-bg-info shadow-lg scale-105'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:shadow-md'
                    }
                  `}
                  style={{
                    transform: selectedChunkIds.has(chunk.id) ? `scale(${1.05 * cardScale})` : `scale(${cardScale})`,
                    transformOrigin: 'center'
                  }}
                >
                  {/* Selection Indicator */}
                  {selectedChunkIds.has(chunk.id) && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircleIcon className="h-8 w-8 text-theme-interactive-success bg-white rounded-full" />
                    </div>
                  )}

                  {/* Page Preview */}
                  <div className="aspect-[8.5/11] bg-white rounded-t-lg p-4 overflow-hidden relative">
                    {/* Page number badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="info" size="sm">
                        {chunk.startPage !== null ? `Page ${chunk.startPage}` : `#${chunk.chunkIndex + 1}`}
                      </Badge>
                    </div>

                    {/* Content preview - simulating page appearance */}
                    <div className="text-gray-800 text-xs leading-relaxed overflow-hidden h-full pt-8">
                      <div className="font-bold text-sm mb-2 text-gray-900">
                        {chunk.title || `Chunk ${chunk.chunkIndex + 1}`}
                      </div>
                      <div className="text-[10px] opacity-75 line-clamp-[20]">
                        {chunk.content.substring(0, 500)}
                      </div>
                    </div>
                  </div>

                  {/* Page Info */}
                  <div className="p-3 bg-theme-bg-secondary rounded-b-lg">
                    <div className="text-xs font-medium text-theme-text-primary truncate mb-1">
                      {chunk.title || `Chunk ${chunk.chunkIndex + 1}`}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-theme-text-tertiary">
                      <span>{formatWordCount(chunk.wordCount ?? 0)}</span>
                      <Badge variant="info" size="sm">
                        {chunk.chunkType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredChunks.map((chunk) => (
                <div
                  key={chunk.id}
                  onClick={() => toggleChunkSelection(chunk.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4
                    ${selectedChunkIds.has(chunk.id)
                      ? 'border-theme-interactive-primary bg-theme-bg-info'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:bg-theme-bg-secondary'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  <div className="flex-shrink-0">
                    <CheckCircleIcon 
                      className={`h-6 w-6 ${
                        selectedChunkIds.has(chunk.id) 
                          ? 'text-theme-interactive-success' 
                          : 'text-theme-text-tertiary'
                      }`}
                    />
                  </div>

                  {/* Page preview thumbnail */}
                  <div className="w-16 h-20 bg-white rounded border border-gray-300 flex-shrink-0 p-1 overflow-hidden">
                    <div className="text-[6px] text-gray-700 leading-tight">
                      {chunk.content.substring(0, 100)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-theme-text-primary truncate">
                        {chunk.title || `Chunk ${chunk.chunkIndex + 1}`}
                      </h4>
                      <Badge variant="info" size="sm">
                        {chunk.startPage !== null ? `Page ${chunk.startPage}-${chunk.endPage}` : `#${chunk.chunkIndex}`}
                      </Badge>
                    </div>
                    <div className="text-xs text-theme-text-secondary truncate">
                      {formatWordCount(chunk.wordCount ?? 0)} • {chunk.chunkType.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-theme-border-primary bg-theme-bg-secondary rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-theme-text-secondary">
            <span className="font-semibold text-theme-text-primary">{selectedChunkIds.size}</span> of{' '}
            <span className="font-semibold text-theme-text-primary">{chunks.length}</span> pages selected
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirm}
              disabled={selectedChunkIds.size === 0}
            >
              Confirm Selection ({selectedChunkIds.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPageSelectorModal;

