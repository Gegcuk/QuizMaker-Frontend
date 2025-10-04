// src/features/document/components/DocumentAnalytics.tsx
// ---------------------------------------------------------------------------
// Component for displaying document analytics and statistics
// Shows content analysis, chunk distribution, and processing metrics
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentChunkDto, ChunkType } from '@/types';
import { api } from '@/services';

interface DocumentAnalyticsProps {
  documentId: string;
  className?: string;
}

const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({
  documentId,
  className = ''
}) => {
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const documentService = new DocumentService(api);

  useEffect(() => {
    if (documentId) {
      loadAnalytics();
    }
  }, [documentId]);

  const loadAnalytics = async () => {
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
      setError(err.message || 'Failed to load document analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
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

  const calculateAnalytics = () => {
    if (!document || chunks.length === 0) return null;

    const totalWords = chunks.reduce((sum, chunk) => sum + (chunk.wordCount ?? 0), 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + (chunk.characterCount ?? 0), 0);
    const averageWordsPerChunk = Math.round(totalWords / chunks.length);
    const averageCharactersPerChunk = Math.round(totalCharacters / chunks.length);
    
    // Chunk type distribution
    const chunkTypeStats = chunks.reduce((acc, chunk) => {
      acc[chunk.chunkType] = (acc[chunk.chunkType] || 0) + 1;
      return acc;
    }, {} as Record<ChunkType, number>);

    // Page coverage
    const pageRanges = chunks.map(chunk => ({
      start: chunk.startPage,
      end: chunk.endPage,
      pages: (chunk.endPage ?? 0) - (chunk.startPage ?? 0) + 1
    }));
    const totalPagesCovered = pageRanges.reduce((sum, range) => sum + range.pages, 0);
    const averagePagesPerChunk = Math.round(totalPagesCovered / chunks.length);

    // Word count distribution
    const wordCountRanges = {
      small: chunks.filter(chunk => (chunk.wordCount ?? 0) < 100).length,
      medium: chunks.filter(chunk => (chunk.wordCount ?? 0) >= 100 && (chunk.wordCount ?? 0) < 500).length,
      large: chunks.filter(chunk => (chunk.wordCount ?? 0) >= 500).length
    };

    // Processing time
    const processingTime = document.processedAt 
      ? new Date(document.processedAt).getTime() - new Date(document.uploadedAt).getTime()
      : 0;

    return {
      totalWords,
      totalCharacters,
      averageWordsPerChunk,
      averageCharactersPerChunk,
      chunkTypeStats,
      totalPagesCovered,
      averagePagesPerChunk,
      wordCountRanges,
      processingTime
    };
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document analytics...</p>
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
          <p className="text-theme-text-secondary">No document data available for analytics</p>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();
  if (!analytics) return null;

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Document Analytics</h2>
        <p className="text-theme-text-secondary">Comprehensive analysis of document content and structure</p>
      </div>

      {/* Document Overview */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Document Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-primary">{chunks.length}</div>
            <div className="text-sm text-theme-interactive-primary">Total Chunks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-success">{analytics.totalWords.toLocaleString()}</div>
            <div className="text-sm text-theme-interactive-success">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-primary">{analytics.totalCharacters.toLocaleString()}</div>
            <div className="text-sm text-theme-text-primary">Total Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-warning">{analytics.totalPagesCovered}</div>
            <div className="text-sm text-theme-interactive-warning">Pages Covered</div>
          </div>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Content Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            <h4 className="font-medium text-theme-text-primary mb-3">Average Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Words per chunk:</span>
                <span className="font-medium">{analytics.averageWordsPerChunk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Characters per chunk:</span>
                <span className="font-medium">{analytics.averageCharactersPerChunk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Pages per chunk:</span>
                <span className="font-medium">{analytics.averagePagesPerChunk}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
            <h4 className="font-medium text-theme-text-primary mb-3">Word Count Distribution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Small chunks (&lt;100 words):</span>
                <span className="font-medium text-theme-interactive-primary">{analytics.wordCountRanges.small}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Medium chunks (100-500 words):</span>
                <span className="font-medium text-theme-interactive-success">{analytics.wordCountRanges.medium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-text-secondary">Large chunks (&gt;500 words):</span>
                <span className="font-medium text-theme-interactive-primary">{analytics.wordCountRanges.large}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Type Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Chunk Type Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analytics.chunkTypeStats).map(([type, count]) => {
            const percentage = Math.round((count / chunks.length) * 100);
            const color = getChunkTypeColor(type as ChunkType);
            
            return (
              <div key={type} className="p-4 border border-theme-border-primary rounded-lg bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChunkTypeIcon(type as ChunkType)}</span>
                    <span className="font-medium text-theme-text-primary">{type.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {count} chunks
                    </span>
                  </div>
                  <span className="text-lg font-bold text-theme-text-primary">{percentage}%</span>
                </div>
                <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-theme-bg-info"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Information */}
      <div className="mb-6 p-4 bg-theme-bg-info rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-3">Processing Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-theme-interactive-primary">Uploaded:</span>
            <div className="text-theme-text-primary">{formatDate(document.uploadedAt)}</div>
          </div>
          {document.processedAt && (
            <div>
              <span className="font-medium text-theme-interactive-primary">Processed:</span>
              <div className="text-theme-text-primary">{formatDate(document.processedAt)}</div>
            </div>
          )}
          <div>
            <span className="font-medium text-theme-interactive-primary">File Size:</span>
            <div className="text-theme-text-primary">{formatFileSize(document.fileSize ?? 0)}</div>
          </div>
          {analytics.processingTime > 0 && (
            <div>
              <span className="font-medium text-theme-interactive-primary">Processing Time:</span>
              <div className="text-theme-text-primary">{Math.round(analytics.processingTime / 1000)}s</div>
            </div>
          )}
        </div>
      </div>

      {/* Document Metadata */}
      {(document.title || document.author) && (
        <div className="mb-6 p-4 bg-theme-bg-success rounded-lg">
          <h3 className="text-sm font-medium text-theme-text-primary mb-2">Document Metadata</h3>
          <div className="space-y-1 text-sm text-theme-interactive-success">
            {document.title && <div><strong>Title:</strong> {document.title}</div>}
            {document.author && <div><strong>Author:</strong> {document.author}</div>}
            {document.totalPages && <div><strong>Total Pages:</strong> {document.totalPages}</div>}
          </div>
        </div>
      )}

      {/* Content Quality Insights */}
      <div className="p-4 bg-theme-bg-warning border border-theme-border-warning rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Content Quality Insights</h3>
        <div className="space-y-1 text-sm text-theme-interactive-warning">
          {analytics.averageWordsPerChunk < 50 && (
            <div>• Chunks are quite small - consider adjusting chunking strategy for better quiz generation</div>
          )}
          {analytics.averageWordsPerChunk > 1000 && (
            <div>• Chunks are quite large - consider smaller chunks for more focused questions</div>
          )}
          {analytics.wordCountRanges.large > analytics.wordCountRanges.small + analytics.wordCountRanges.medium && (
            <div>• Document has many large chunks - good for comprehensive quiz coverage</div>
          )}
          {chunks.length < 5 && (
            <div>• Few chunks detected - document may be too short for diverse quiz generation</div>
          )}
          {chunks.length > 50 && (
            <div>• Many chunks available - excellent for generating varied quiz questions</div>
          )}
          <div>• Document appears well-structured for AI-powered quiz generation</div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalytics; 