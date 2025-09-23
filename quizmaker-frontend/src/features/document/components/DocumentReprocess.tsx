import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { api } from '@/services';
import { 
  DocumentDto, 
  ProcessDocumentRequest, 
  DocumentConfigDto,
  ChunkingStrategy 
} from '@/types';

interface DocumentReprocessProps {
  documentId: string;
  onReprocessSuccess?: (document: DocumentDto) => void;
  onReprocessError?: (error: string) => void;
  className?: string;
}

const DocumentReprocess: React.FC<DocumentReprocessProps> = ({ 
  documentId, 
  onReprocessSuccess, 
  onReprocessError, 
  className = '' 
}) => {
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [config, setConfig] = useState<DocumentConfigDto | null>(null);
  const [reprocessConfig, setReprocessConfig] = useState<ProcessDocumentRequest>({
    chunkingStrategy: 'AUTO',
    maxChunkSize: 1000,
    storeChunks: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const documentService = new DocumentService(api);

  useEffect(() => {
    if (documentId) {
      loadDocument();
      loadConfig();
    }
  }, [documentId]);

  const loadDocument = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const doc = await documentService.getDocumentById(documentId);
      setDocument(doc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
      setError(errorMessage);
      onReprocessError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const docConfig = await documentService.getDocumentConfig();
      setConfig(docConfig);
      setReprocessConfig(prev => ({
        ...prev,
        chunkingStrategy: docConfig.defaultStrategy as ChunkingStrategy,
        maxChunkSize: docConfig.defaultMaxChunkSize
      }));
    } catch (err) {
      console.error('Failed to load document config:', err);
    }
  };

  const handleReprocess = async () => {
    if (!document) return;

    try {
      setIsReprocessing(true);
      setError(null);
      
      const reprocessedDoc = await documentService.reprocessDocument(documentId, reprocessConfig);
      setDocument(reprocessedDoc);
      onReprocessSuccess?.(reprocessedDoc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reprocess document';
      setError(errorMessage);
      onReprocessError?.(errorMessage);
    } finally {
      setIsReprocessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED': return 'text-green-600 bg-green-50';
      case 'PROCESSING': return 'text-theme-interactive-primary bg-blue-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      default: return 'text-theme-text-secondary bg-theme-bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED': return '✓';
      case 'PROCESSING': return '⟳';
      case 'FAILED': return '✗';
      default: return '○';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center text-theme-text-tertiary">
          <p>Document not found or failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-theme-text-primary">Reprocess Document</h3>
          <p className="text-sm text-theme-text-secondary mt-1">
            Reprocess this document with different settings
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
          <span className="mr-1">{getStatusIcon(document.status)}</span>
          {document.status}
        </div>
      </div>

      {/* Document Info */}
      <div className="bg-theme-bg-secondary rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-theme-text-primary mb-2">Document Details</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {document.originalFilename}</p>
              <p><span className="font-medium">Size:</span> {document.fileSize ? (document.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}</p>
              <p><span className="font-medium">Type:</span> {document.contentType}</p>
              {document.title && <p><span className="font-medium">Title:</span> {document.title}</p>}
              {document.author && <p><span className="font-medium">Author:</span> {document.author}</p>}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-theme-text-primary mb-2">Processing Info</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Uploaded:</span> {new Date(document.uploadedAt).toLocaleDateString()}</p>
              {document.processedAt && (
                <p><span className="font-medium">Processed:</span> {new Date(document.processedAt).toLocaleDateString()}</p>
              )}
              {document.totalPages && <p><span className="font-medium">Pages:</span> {document.totalPages}</p>}
              {document.totalChunks && <p><span className="font-medium">Chunks:</span> {document.totalChunks}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Reprocess Configuration */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-theme-text-primary">Reprocess Configuration</h4>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-theme-interactive-primary hover:text-blue-800"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        <div className="space-y-4">
          {/* Chunking Strategy */}
          <div>
            <label className="block text-sm font-medium text-theme-text-secondary mb-2">
              Chunking Strategy
            </label>
            <select
              value={reprocessConfig.chunkingStrategy}
              onChange={(e) => setReprocessConfig(prev => ({
                ...prev,
                chunkingStrategy: e.target.value as ChunkingStrategy
              }))}
              className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
            >
              <option value="AUTO">Auto (Recommended)</option>
              <option value="CHAPTER_BASED">Chapter-based</option>
              <option value="SECTION_BASED">Section-based</option>
              <option value="SIZE_BASED">Size-based</option>
              <option value="PAGE_BASED">Page-based</option>
            </select>
            <p className="text-xs text-theme-text-tertiary mt-1">
              Determines how the document will be split into chunks
            </p>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              {/* Max Chunk Size */}
              <div>
                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                  Maximum Chunk Size (characters)
                </label>
                <input
                  type="number"
                  min="100"
                  max="10000"
                  value={reprocessConfig.maxChunkSize}
                  onChange={(e) => setReprocessConfig(prev => ({
                    ...prev,
                    maxChunkSize: parseInt(e.target.value) || 1000
                  }))}
                  className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-theme-interactive-primary"
                />
                <p className="text-xs text-theme-text-tertiary mt-1">
                  Maximum number of characters per chunk (100-10,000)
                </p>
              </div>

              {/* Store Chunks */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="storeChunks"
                  checked={reprocessConfig.storeChunks}
                  onChange={(e) => setReprocessConfig(prev => ({
                    ...prev,
                    storeChunks: e.target.checked
                  }))}
                  className="h-4 w-4 text-theme-interactive-primary focus:ring-theme-interactive-primary border-theme-border-primary rounded"
                />
                <label htmlFor="storeChunks" className="ml-2 block text-sm text-theme-text-secondary">
                  Store chunks in database
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-theme-text-secondary">
          {document.processingError && (
            <p className="text-red-600">
              Previous error: {document.processingError}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={loadDocument}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-theme-text-secondary bg-theme-bg-primary border border-theme-border-primary rounded-md hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleReprocess}
            disabled={isReprocessing || document.status === 'PROCESSING'}
            className="px-4 py-2 text-sm font-medium text-white bg-theme-interactive-primary border border-transparent rounded-md hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReprocessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Reprocessing...
              </>
            ) : (
              'Reprocess Document'
            )}
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> Reprocessing will replace all existing chunks and may take several minutes depending on document size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReprocess; 