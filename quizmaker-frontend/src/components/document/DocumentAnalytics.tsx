// src/components/document/DocumentAnalytics.tsx
// ---------------------------------------------------------------------------
// Component for displaying document analytics and statistics
// Shows content analysis, chunk distribution, and processing metrics
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '../../api/document.service';
import { DocumentDto, DocumentChunkDto, ChunkType } from '../../types/document.types';
import api from '../../api/axiosInstance';

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
        return 'text-blue-600 bg-blue-100';
      case 'SECTION':
        return 'text-green-600 bg-green-100';
      case 'PAGE_BASED':
        return 'text-purple-600 bg-purple-100';
      case 'SIZE_BASED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateAnalytics = () => {
    if (!document || chunks.length === 0) return null;

    const totalWords = chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characterCount, 0);
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
      pages: chunk.endPage - chunk.startPage + 1
    }));
    const totalPagesCovered = pageRanges.reduce((sum, range) => sum + range.pages, 0);
    const averagePagesPerChunk = Math.round(totalPagesCovered / chunks.length);

    // Word count distribution
    const wordCountRanges = {
      small: chunks.filter(chunk => chunk.wordCount < 100).length,
      medium: chunks.filter(chunk => chunk.wordCount >= 100 && chunk.wordCount < 500).length,
      large: chunks.filter(chunk => chunk.wordCount >= 500).length
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
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-2">❌</div>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!document || chunks.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-gray-600">No document data available for analytics</p>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();
  if (!analytics) return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Analytics</h2>
        <p className="text-gray-600">Comprehensive analysis of document content and structure</p>
      </div>

      {/* Document Overview */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Document Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{chunks.length}</div>
            <div className="text-sm text-blue-700">Total Chunks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.totalWords.toLocaleString()}</div>
            <div className="text-sm text-green-700">Total Words</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.totalCharacters.toLocaleString()}</div>
            <div className="text-sm text-purple-700">Total Characters</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{analytics.totalPagesCovered}</div>
            <div className="text-sm text-orange-700">Pages Covered</div>
          </div>
        </div>
      </div>

      {/* Content Statistics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Average Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Words per chunk:</span>
                <span className="font-medium">{analytics.averageWordsPerChunk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Characters per chunk:</span>
                <span className="font-medium">{analytics.averageCharactersPerChunk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pages per chunk:</span>
                <span className="font-medium">{analytics.averagePagesPerChunk}</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Word Count Distribution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Small chunks (&lt;100 words):</span>
                <span className="font-medium text-blue-600">{analytics.wordCountRanges.small}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Medium chunks (100-500 words):</span>
                <span className="font-medium text-green-600">{analytics.wordCountRanges.medium}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Large chunks (&gt;500 words):</span>
                <span className="font-medium text-purple-600">{analytics.wordCountRanges.large}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Type Distribution */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Chunk Type Distribution</h3>
        <div className="space-y-3">
          {Object.entries(analytics.chunkTypeStats).map(([type, count]) => {
            const percentage = Math.round((count / chunks.length) * 100);
            const color = getChunkTypeColor(type as ChunkType);
            
            return (
              <div key={type} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChunkTypeIcon(type as ChunkType)}</span>
                    <span className="font-medium text-gray-900">{type.replace('_', ' ')}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {count} chunks
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Processing Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-3">Processing Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-700">Uploaded:</span>
            <div className="text-blue-900">{formatDate(document.uploadedAt)}</div>
          </div>
          {document.processedAt && (
            <div>
              <span className="font-medium text-blue-700">Processed:</span>
              <div className="text-blue-900">{formatDate(document.processedAt)}</div>
            </div>
          )}
          <div>
            <span className="font-medium text-blue-700">File Size:</span>
            <div className="text-blue-900">{formatFileSize(document.fileSize)}</div>
          </div>
          {analytics.processingTime > 0 && (
            <div>
              <span className="font-medium text-blue-700">Processing Time:</span>
              <div className="text-blue-900">{Math.round(analytics.processingTime / 1000)}s</div>
            </div>
          )}
        </div>
      </div>

      {/* Document Metadata */}
      {(document.title || document.author) && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-sm font-medium text-green-900 mb-2">Document Metadata</h3>
          <div className="space-y-1 text-sm text-green-700">
            {document.title && <div><strong>Title:</strong> {document.title}</div>}
            {document.author && <div><strong>Author:</strong> {document.author}</div>}
            {document.totalPages && <div><strong>Total Pages:</strong> {document.totalPages}</div>}
          </div>
        </div>
      )}

      {/* Content Quality Insights */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Content Quality Insights</h3>
        <div className="space-y-1 text-sm text-yellow-700">
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