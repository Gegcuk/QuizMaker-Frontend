// src/features/document/components/ChunkSelector.tsx
// ---------------------------------------------------------------------------
// Component for selecting document chunks for quiz generation
// Provides multi-select interface with chunk preview and filtering
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentChunkDto, ChunkType } from '@/types';
import { api } from '@/services';

interface ChunkSelectorProps {
  documentId: string;
  onSelectionChange?: (selectedChunkIds: string[]) => void;
  initialSelection?: string[];
  className?: string;
}

const ChunkSelector: React.FC<ChunkSelectorProps> = ({
  documentId,
  onSelectionChange,
  initialSelection = [],
  className = ''
}) => {
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<Set<string>>(new Set(initialSelection));
  const [filterType, setFilterType] = useState<ChunkType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewChunk, setPreviewChunk] = useState<DocumentChunkDto | null>(null);
  
  const documentService = new DocumentService(api);

  useEffect(() => {
    if (documentId) {
      loadChunks();
    }
  }, [documentId]);

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedChunks));
  }, [selectedChunks, onSelectionChange]);

  const loadChunks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const documentChunks = await documentService.getDocumentChunks(documentId);
      setChunks(documentChunks);
    } catch (err: any) {
      setError(err.message || 'Failed to load document chunks');
    } finally {
      setLoading(false);
    }
  };

  const toggleChunkSelection = (chunkId: string) => {
    const newSelection = new Set(selectedChunks);
    if (newSelection.has(chunkId)) {
      newSelection.delete(chunkId);
    } else {
      newSelection.add(chunkId);
    }
    setSelectedChunks(newSelection);
  };

  const selectAllChunks = () => {
    const allChunkIds = chunks.map(chunk => chunk.id);
    setSelectedChunks(new Set(allChunkIds));
  };

  const deselectAllChunks = () => {
    setSelectedChunks(new Set());
  };

  const selectChunksByType = (type: ChunkType) => {
    const typeChunkIds = chunks
      .filter(chunk => chunk.chunkType === type)
      .map(chunk => chunk.id);
    setSelectedChunks(new Set(typeChunkIds));
  };

  const getFilteredChunks = () => {
    return chunks.filter(chunk => {
      const matchesType = filterType === 'ALL' || chunk.chunkType === filterType;
      const matchesSearch = searchTerm === '' || 
        chunk.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chunk.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const getChunkTypeIcon = (chunkType: ChunkType): string => {
    switch (chunkType) {
      case 'CHAPTER':
        return '📖';
      case 'SECTION':
        return '📋';
      case 'PAGE_BASED':
        return '📄';
      case 'SIZE_BASED':
        return '📏';
      default:
        return '📝';
    }
  };

  const getChunkTypeColor = (chunkType: ChunkType): string => {
    switch (chunkType) {
      case 'CHAPTER':
        return 'text-theme-interactive-primary bg-theme-bg-info';
      case 'SECTION':
        return 'text-theme-interactive-success bg-theme-bg-success';
      case 'PAGE_BASED':
        return 'text-theme-interactive-primary bg-theme-bg-primary';
      case 'SIZE_BASED':
        return 'text-theme-interactive-warning bg-theme-bg-warning';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
    }
  };

  const formatWordCount = (count: number): string => {
    if (count < 1000) return `${count} words`;
    return `${(count / 1000).toFixed(1)}k words`;
  };

  const getSelectionStats = () => {
    const filteredChunks = getFilteredChunks();
    const selectedInFilter = filteredChunks.filter(chunk => selectedChunks.has(chunk.id));
    
    return {
      total: chunks.length,
      selected: selectedChunks.size,
      filtered: filteredChunks.length,
      selectedInFilter: selectedInFilter.length
    };
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document chunks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-theme-interactive-danger text-2xl mb-2">❌</div>
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
      </div>
    );
  }

  const stats = getSelectionStats();
  const filteredChunks = getFilteredChunks();

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-theme-border-primary">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Select Document Chunks</h2>
        <p className="text-theme-text-secondary">Choose which parts of the document to use for quiz generation</p>
        
        {/* Selection Stats */}
        <div className="mt-4 p-3 bg-theme-bg-info rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-blue-900">{stats.total}</div>
              <div className="text-theme-interactive-primary">Total Chunks</div>
            </div>
            <div>
              <div className="font-medium text-theme-interactive-success">{stats.selected}</div>
              <div className="text-green-700">Selected</div>
            </div>
            <div>
              <div className="font-medium text-theme-interactive-primary">{stats.filtered}</div>
              <div className="text-purple-700">Filtered</div>
            </div>
            <div>
              <div className="font-medium text-theme-interactive-warning">{stats.selectedInFilter}</div>
              <div className="text-orange-700">Selected in Filter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-theme-border-primary">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search chunks by title or content..."
              className="w-full px-4 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-theme-text-secondary">Filter by type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ChunkType | 'ALL')}
              className="px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
            >
              <option value="ALL">All Types</option>
              <option value="CHAPTER">Chapters</option>
              <option value="SECTION">Sections</option>
              <option value="PAGE_BASED">Page Based</option>
              <option value="SIZE_BASED">Size Based</option>
            </select>
          </div>
        </div>

        {/* Selection Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={selectAllChunks}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Select All
          </button>
          <button
            onClick={deselectAllChunks}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Deselect All
          </button>
          <button
            onClick={() => selectChunksByType('CHAPTER')}
            className="px-3 py-1 text-sm bg-theme-interactive-primary text-white rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
          >
            Select Chapters
          </button>
          <button
            onClick={() => selectChunksByType('SECTION')}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Select Sections
          </button>
        </div>
      </div>

      {/* Chunks List */}
      <div className="p-6">
        {filteredChunks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-theme-text-tertiary text-4xl mb-4">📝</div>
            <p className="text-theme-text-secondary">No chunks match your current filter</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedChunks.has(chunk.id)
                    ? 'border-theme-interactive-primary bg-theme-bg-info'
                    : 'border-theme-border-primary hover:border-theme-border-primary hover:bg-theme-bg-secondary'
                }`}
                onClick={() => toggleChunkSelection(chunk.id)}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedChunks.has(chunk.id)}
                    onChange={() => toggleChunkSelection(chunk.id)}
                    className="mt-1 h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded"
                  />
                  
                  {/* Chunk Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getChunkTypeIcon(chunk.chunkType)}</span>
                        <h3 className="text-lg font-medium text-theme-text-primary truncate">
                          {chunk.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChunkTypeColor(chunk.chunkType)}`}>
                          {chunk.chunkType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm text-theme-text-secondary">
                        {formatWordCount(chunk.wordCount ?? 0)}
                      </div>
                    </div>
                    
                    {/* Chunk Details */}
                    <div className="text-sm text-theme-text-secondary mb-2">
                      Pages {chunk.startPage}-{chunk.endPage} • {chunk.characterCount} characters
                      {chunk.chapterTitle && (
                        <span className="ml-2">• Chapter: {chunk.chapterTitle}</span>
                      )}
                      {chunk.sectionTitle && (
                        <span className="ml-2">• Section: {chunk.sectionTitle}</span>
                      )}
                    </div>
                    
                    {/* Content Preview */}
                    <div className="text-sm text-theme-text-secondary line-clamp-2">
                      {chunk.content.substring(0, 200)}...
                    </div>
                  </div>
                  
                  {/* Preview Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewChunk(chunk);
                    }}
                    className="px-3 py-1 text-sm bg-theme-bg-tertiary text-theme-text-secondary rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chunk Preview Modal */}
      {previewChunk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-bg-primary rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-theme-border-primary">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-theme-text-primary">{previewChunk.title}</h3>
                <button
                  onClick={() => setPreviewChunk(null)}
                  className="text-theme-text-tertiary hover:text-theme-text-secondary"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <div className="text-theme-text-primary leading-relaxed whitespace-pre-wrap">
                  {previewChunk.content}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-theme-border-primary bg-theme-bg-secondary">
              <div className="flex items-center justify-between text-sm text-theme-text-secondary">
                <div>
                  {formatWordCount(previewChunk.wordCount ?? 0)} • Pages {previewChunk.startPage}-{previewChunk.endPage}
                </div>
                <div>
                  {previewChunk.chunkType.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkSelector; 