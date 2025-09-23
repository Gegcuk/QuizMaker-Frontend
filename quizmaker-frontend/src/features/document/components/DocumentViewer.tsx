// src/features/document/components/DocumentViewer.tsx
// ---------------------------------------------------------------------------
// Component for viewing document content with navigation and search
// Displays document chunks with pagination and content highlighting
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentChunkDto } from '@/types';
import { api } from '@/services';

interface DocumentViewerProps {
  documentId: string;
  className?: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  className = ''
}) => {
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const documentService = new DocumentService(api);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  useEffect(() => {
    if (searchTerm) {
      performSearch();
    } else {
      setSearchResults([]);
      setCurrentSearchIndex(0);
    }
  }, [searchTerm, chunks]);

  const loadDocument = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [doc, documentChunks] = await Promise.all([
        documentService.getDocumentById(documentId),
        documentService.getDocumentChunks(documentId)
      ]);
      
      setDocument(doc);
      setChunks(documentChunks);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = () => {
    const results: number[] = [];
    const term = searchTerm.toLowerCase();
    
    chunks.forEach((chunk, index) => {
      if (chunk.content.toLowerCase().includes(term) || 
          chunk.title.toLowerCase().includes(term)) {
        results.push(index);
      }
    });
    
    setSearchResults(results);
    setCurrentSearchIndex(0);
    
    if (results.length > 0) {
      setCurrentChunkIndex(results[0]);
    }
  };

  const navigateToChunk = (index: number) => {
    if (index >= 0 && index < chunks.length) {
      setCurrentChunkIndex(index);
    }
  };

  const navigateToNextSearchResult = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      setCurrentChunkIndex(searchResults[nextIndex]);
    }
  };

  const navigateToPreviousSearchResult = () => {
    if (searchResults.length > 0) {
      const prevIndex = currentSearchIndex === 0 
        ? searchResults.length - 1 
        : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      setCurrentChunkIndex(searchResults[prevIndex]);
    }
  };

  const highlightSearchTerm = (text: string): string => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getChunkTypeIcon = (chunkType: string): string => {
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

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document...</p>
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

  if (!document || chunks.length === 0) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-theme-text-secondary">No document content available</p>
        </div>
      </div>
    );
  }

  const currentChunk = chunks[currentChunkIndex];

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-theme-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-theme-text-primary">{document.originalFilename}</h2>
            <p className="text-theme-text-secondary">
              {chunks.length} chunks • {currentChunkIndex + 1} of {chunks.length}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-theme-text-secondary">
              Uploaded: {formatDate(document.uploadedAt)}
            </div>
            {document.processedAt && (
              <div className="text-sm text-theme-text-secondary">
                Processed: {formatDate(document.processedAt)}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search document content..."
              className="w-full px-4 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
            />
            {searchTerm && (
              <div className="absolute right-2 top-2 text-sm text-theme-text-tertiary">
                {searchResults.length} results
              </div>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={navigateToPreviousSearchResult}
                className="px-3 py-2 text-sm bg-theme-bg-tertiary text-theme-text-secondary rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ↑
              </button>
              <span className="text-sm text-theme-text-secondary">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <button
                onClick={navigateToNextSearchResult}
                className="px-3 py-2 text-sm bg-theme-bg-tertiary text-theme-text-secondary rounded-md hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ↓
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateToChunk(currentChunkIndex - 1)}
              disabled={currentChunkIndex === 0}
              className="px-4 py-2 text-sm bg-theme-interactive-primary text-white rounded-md hover:bg-theme-interactive-primary disabled:bg-theme-bg-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
            >
              ← Previous
            </button>
            
            <select
              value={currentChunkIndex}
              onChange={(e) => navigateToChunk(parseInt(e.target.value))}
              className="px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
            >
              {chunks.map((chunk, index) => (
                <option key={chunk.id} value={index}>
                  Chunk {index + 1}: {chunk.title}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => navigateToChunk(currentChunkIndex + 1)}
              disabled={currentChunkIndex === chunks.length - 1}
              className="px-4 py-2 text-sm bg-theme-interactive-primary text-white rounded-md hover:bg-theme-interactive-primary disabled:bg-theme-bg-tertiary disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary"
            >
              Next →
            </button>
          </div>
          
          <div className="text-sm text-theme-text-secondary">
            Page {currentChunk.startPage}-{currentChunk.endPage}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Chunk Header */}
        <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getChunkTypeIcon(currentChunk.chunkType)}</span>
              <h3 className="text-lg font-semibold text-theme-text-primary">{currentChunk.title}</h3>
            </div>
            <div className="text-sm text-theme-text-secondary">
              {currentChunk.wordCount} words • {currentChunk.characterCount} characters
            </div>
          </div>
          
          {(currentChunk.chapterTitle || currentChunk.sectionTitle) && (
            <div className="text-sm text-theme-text-secondary">
              {currentChunk.chapterTitle && (
                <span className="mr-4">Chapter: {currentChunk.chapterTitle}</span>
              )}
              {currentChunk.sectionTitle && (
                <span>Section: {currentChunk.sectionTitle}</span>
              )}
            </div>
          )}
        </div>

        {/* Chunk Content */}
        <div className="prose max-w-none">
          <div
            className="text-theme-text-primary leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: highlightSearchTerm(currentChunk.content)
            }}
          />
        </div>

        {/* Chunk Footer */}
        <div className="mt-6 pt-4 border-t border-theme-border-primary">
          <div className="flex items-center justify-between text-sm text-theme-text-secondary">
            <div>
              Chunk {currentChunkIndex + 1} of {chunks.length}
            </div>
            <div>
              Pages {currentChunk.startPage}-{currentChunk.endPage}
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Navigation Sidebar */}
      <div className="border-t border-theme-border-primary p-4 bg-theme-bg-secondary">
        <h4 className="text-sm font-medium text-theme-text-primary mb-3">All Chunks</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {chunks.map((chunk, index) => (
            <button
              key={chunk.id}
              onClick={() => navigateToChunk(index)}
              className={`p-2 text-left rounded-md text-sm transition-colors ${
                index === currentChunkIndex
                  ? 'bg-theme-bg-info text-theme-interactive-info border border-theme-border-info'
                  : 'hover:bg-theme-bg-tertiary text-theme-text-secondary'
              }`}
            >
              <div className="font-medium truncate">{chunk.title}</div>
              <div className="text-xs text-theme-text-tertiary">
                {chunk.wordCount} words • Pages {chunk.startPage}-{chunk.endPage}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 