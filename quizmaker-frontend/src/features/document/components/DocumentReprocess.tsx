import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { api } from '@/services';
import { 
  DocumentDto, 
  ProcessDocumentRequest, 
  DocumentConfigDto,
  ChunkingStrategy 
} from '@/types';
import { Button, Input, Dropdown, Checkbox, Alert } from '@/components';

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
      case 'PROCESSED': return 'text-theme-interactive-success bg-theme-bg-success';
      case 'PROCESSING': return 'text-theme-interactive-primary bg-theme-bg-info';
      case 'FAILED': return 'text-theme-interactive-danger bg-theme-bg-danger';
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
          <div className="h-4 bg-theme-bg-tertiary rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-theme-bg-tertiary rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-theme-bg-tertiary rounded w-3/4"></div>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>

        <div className="space-y-4">
          {/* Chunking Strategy */}
          <div>
            <Dropdown
              label="Chunking Strategy"
              value={reprocessConfig.chunkingStrategy}
              onChange={(value) => setReprocessConfig(prev => ({
                ...prev,
                chunkingStrategy: value as ChunkingStrategy
              }))}
              options={[
                { label: 'Auto (Recommended)', value: 'AUTO' },
                { label: 'Chapter-based', value: 'CHAPTER_BASED' },
                { label: 'Section-based', value: 'SECTION_BASED' },
                { label: 'Size-based', value: 'SIZE_BASED' },
                { label: 'Page-based', value: 'PAGE_BASED' }
              ]}
              helperText="Determines how the document will be split into chunks"
              fullWidth
            />
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 border-t pt-4">
              {/* Max Chunk Size */}
              <div>
                <Input
                  type="number"
                  min={100}
                  max={10000}
                  value={reprocessConfig.maxChunkSize}
                  onChange={(e) => setReprocessConfig(prev => ({
                    ...prev,
                    maxChunkSize: parseInt(e.target.value) || 1000
                  }))}
                  label="Maximum Chunk Size (characters)"
                  helperText="Maximum number of characters per chunk (100-10,000)"
                  fullWidth
                />
              </div>

              {/* Store Chunks */}
              <Checkbox
                id="storeChunks"
                checked={reprocessConfig.storeChunks ?? true}
                onChange={(checked) => setReprocessConfig(prev => ({
                  ...prev,
                  storeChunks: checked
                }))}
                label="Store chunks in database"
              />
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-theme-text-secondary">
          {document.processingError && (
            <p className="text-theme-interactive-danger">
              Previous error: {document.processingError}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={loadDocument}
            disabled={isLoading}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={handleReprocess}
            disabled={isReprocessing || document.status === 'PROCESSING'}
            loading={isReprocessing}
          >
            Reprocess Document
          </Button>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-theme-bg-warning border border-theme-border-warning rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-theme-text-tertiary" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-theme-interactive-warning">
              <strong>Warning:</strong> Reprocessing will replace all existing chunks and may take several minutes depending on document size.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentReprocess; 