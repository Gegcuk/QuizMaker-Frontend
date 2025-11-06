// src/features/document/components/DocumentViewer.tsx
// ---------------------------------------------------------------------------
// Component for viewing document content with navigation and search
// Displays document chunks with pagination and content highlighting
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentChunkDto } from '@/types';
import { api } from '@/services';
import { Button, Dropdown, Input, Card } from '@/components/ui';

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

  const escapeHtml = (text: string): string => {
    const div = window.document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const highlightSearchTerm = (text: string): string => {
    if (!searchTerm) return escapeHtml(text);
    
    const escapedText = escapeHtml(text);
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return escapedText.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
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
      <Card className={className}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div className="text-center">
          <div className="text-theme-interactive-danger text-2xl mb-2">❌</div>
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
      </Card>
    );
  }

  if (!document || chunks.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center">
          <p className="text-theme-text-secondary">No document content available</p>
        </div>
      </Card>
    );
  }

  const currentChunk = chunks[currentChunkIndex];

  return (
    <Card className={className}>
      {/* Document Info and Search */}
      <div className="p-6 border-b border-theme-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-theme-text-secondary">
            {chunks.length} chunks • Viewing chunk {currentChunkIndex + 1} of {chunks.length}
          </div>
          <div className="text-right text-sm text-theme-text-secondary">
            Uploaded: {formatDate(document.uploadedAt)}
            {document.processedAt && <> • Processed: {formatDate(document.processedAt)}</>}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search document content..."
            />
            {searchTerm && (
              <div className="absolute right-2 top-2 text-sm text-theme-text-tertiary">
                {searchResults.length} results
              </div>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={navigateToPreviousSearchResult}
                title="Previous result"
              >
                ↑
              </Button>
              <span className="text-sm text-theme-text-secondary">
                {currentSearchIndex + 1} of {searchResults.length}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={navigateToNextSearchResult}
                title="Next result"
              >
                ↓
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigateToChunk(currentChunkIndex - 1)}
              disabled={currentChunkIndex === 0}
              title="Previous chunk"
            >
              ← Previous
            </Button>
            
            <Dropdown
              options={chunks.map((chunk, index) => ({
                value: index.toString(),
                label: `Chunk ${index + 1}: ${chunk.title}`
              }))}
              value={currentChunkIndex.toString()}
              onChange={(value) => navigateToChunk(parseInt(value as string))}
              size="md"
              className="min-w-[200px]"
            />
            
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => navigateToChunk(currentChunkIndex + 1)}
              disabled={currentChunkIndex === chunks.length - 1}
              title="Next chunk"
            >
              Next →
            </Button>
          </div>
          
          <div className="text-sm text-theme-text-secondary">
            {currentChunk.startPage !== null && currentChunk.endPage !== null && (
              <>Page {currentChunk.startPage}-{currentChunk.endPage}</>
            )}
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
              {currentChunk.wordCount !== null && <>{currentChunk.wordCount} words</>}
              {currentChunk.wordCount !== null && currentChunk.characterCount !== null && <> • </>}
              {currentChunk.characterCount !== null && <>{currentChunk.characterCount} characters</>}
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
              {currentChunk.startPage !== null && currentChunk.endPage !== null && (
                <>Pages {currentChunk.startPage}-{currentChunk.endPage}</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Navigation Sidebar */}
      <div className="border-t border-theme-border-primary p-4 bg-theme-bg-secondary">
        <h4 className="text-sm font-medium text-theme-text-primary mb-3">All Chunks</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
          {chunks.map((chunk, index) => (
            <Button
              key={chunk.id}
              type="button"
              onClick={() => navigateToChunk(index)}
              variant="ghost"
              size="sm"
              className={`p-2 text-left justify-start h-auto ${
                index === currentChunkIndex
                  ? 'bg-theme-bg-info text-theme-interactive-info border border-theme-border-info'
                  : 'hover:bg-theme-bg-tertiary text-theme-text-secondary'
              }`}
            >
              <div className="w-full">
                <div className="font-medium truncate">{chunk.title}</div>
                <div className="text-xs text-theme-text-tertiary">
                  {chunk.wordCount !== null && <>{chunk.wordCount} words</>}
                  {chunk.wordCount !== null && chunk.startPage !== null && chunk.endPage !== null && <> • </>}
                  {chunk.startPage !== null && chunk.endPage !== null && <>Pages {chunk.startPage}-{chunk.endPage}</>}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default DocumentViewer; 