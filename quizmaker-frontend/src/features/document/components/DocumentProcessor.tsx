// src/features/document/components/DocumentProcessor.tsx
// ---------------------------------------------------------------------------
// Component for displaying document processing status and progress
// Shows real-time updates, processing stages, and completion status
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentStatus } from '@/types';
import { api } from '@/services';

interface DocumentProcessorProps {
  documentId: string;
  onProcessingComplete?: (document: DocumentDto) => void;
  onProcessingError?: (error: string) => void;
  className?: string;
}

const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  documentId,
  onProcessingComplete,
  onProcessingError,
  className = ''
}) => {
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const documentService = new DocumentService(api);
  const pollingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (documentId) {
      startProcessing();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [documentId]);

  const startProcessing = async () => {
    setIsPolling(true);
    setError(null);
    
    try {
      // Get initial document status
      const doc = await documentService.getDocumentStatus(documentId);
      setDocument(doc);
      
      if (doc.status === 'PROCESSED') {
        handleProcessingComplete(doc);
        return;
      }
      
      if (doc.status === 'FAILED') {
        handleProcessingError(doc.processingError || 'Processing failed');
        return;
      }
      
      // Start polling for status updates
      startPolling();
    } catch (err: any) {
      handleProcessingError(err.message || 'Failed to start processing');
    }
  };

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const doc = await documentService.getDocumentStatus(documentId);
        setDocument(doc);
        
        // Update processing stage based on status
        updateProcessingStage(doc.status);
        
        if (doc.status === 'PROCESSED') {
          handleProcessingComplete(doc);
        } else if (doc.status === 'FAILED') {
          handleProcessingError(doc.processingError || 'Processing failed');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const updateProcessingStage = (status: DocumentStatus) => {
    switch (status) {
      case 'UPLOADED':
        setProcessingStage('Document uploaded, preparing for processing...');
        setProgress(10);
        break;
      case 'PROCESSING':
        setProcessingStage('Processing document content...');
        setProgress(50);
        break;
      case 'PROCESSED':
        setProcessingStage('Processing completed successfully!');
        setProgress(100);
        break;
      case 'FAILED':
        setProcessingStage('Processing failed');
        setProgress(0);
        break;
      default:
        setProcessingStage('Unknown status');
        setProgress(0);
    }
  };

  const handleProcessingComplete = (doc: DocumentDto) => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setProgress(100);
    setProcessingStage('Processing completed successfully!');
    onProcessingComplete?.(doc);
  };

  const handleProcessingError = (errorMessage: string) => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    setError(errorMessage);
    setProgress(0);
    setProcessingStage('Processing failed');
    onProcessingError?.(errorMessage);
  };

  const getStatusIcon = (status: DocumentStatus): string => {
    switch (status) {
      case 'UPLOADED':
        return '📤';
      case 'PROCESSING':
        return '⚙️';
      case 'PROCESSED':
        return '✅';
      case 'FAILED':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: DocumentStatus): string => {
    switch (status) {
      case 'UPLOADED':
        return 'text-theme-interactive-primary bg-blue-100';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-theme-text-secondary bg-theme-bg-tertiary';
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

  if (!document) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Document Processing</h2>
        <p className="text-theme-text-secondary">Processing your document for quiz generation</p>
      </div>

      {/* Document Info */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="text-lg font-semibold text-theme-text-primary">{document.originalFilename}</h3>
              <p className="text-sm text-theme-text-secondary">
                {formatFileSize(document.fileSize ?? 0)} • {document.contentType}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
            {getStatusIcon(document.status)} {document.status}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-theme-text-secondary">Uploaded:</span>
            <div className="text-theme-text-primary">{formatDate(document.uploadedAt)}</div>
          </div>
          {document.processedAt && (
            <div>
              <span className="font-medium text-theme-text-secondary">Processed:</span>
              <div className="text-theme-text-primary">{formatDate(document.processedAt)}</div>
            </div>
          )}
          {document.totalPages && (
            <div>
              <span className="font-medium text-theme-text-secondary">Pages:</span>
              <div className="text-theme-text-primary">{document.totalPages}</div>
            </div>
          )}
          {document.totalChunks && (
            <div>
              <span className="font-medium text-theme-text-secondary">Chunks:</span>
              <div className="text-theme-text-primary">{document.totalChunks}</div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-theme-text-secondary">Processing Progress</span>
          <span className="text-sm text-theme-text-secondary">{progress}%</span>
        </div>
        
        <div className="w-full bg-theme-bg-tertiary rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              document.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-theme-text-secondary">
          {processingStage}
          {isPolling && (
            <span className="ml-2 inline-block animate-pulse">🔄</span>
          )}
        </div>
      </div>

      {/* Processing Stages */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Processing Stages</h3>
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            document.status !== 'FAILED' ? 'bg-green-50 border border-green-200' : 'bg-theme-bg-secondary border border-theme-border-primary'
          }`}>
            <span className="text-green-600">✅</span>
            <div>
              <div className="font-medium text-theme-text-primary">Document Upload</div>
              <div className="text-sm text-theme-text-secondary">File uploaded and validated</div>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            ['PROCESSING', 'PROCESSED'].includes(document.status) 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-theme-bg-secondary border border-theme-border-primary'
          }`}>
            <span className={['PROCESSING', 'PROCESSED'].includes(document.status) ? 'text-theme-interactive-primary' : 'text-theme-text-tertiary'}>
              {document.status === 'PROCESSING' ? '⚙️' : '✅'}
            </span>
            <div>
              <div className="font-medium text-theme-text-primary">Content Processing</div>
              <div className="text-sm text-theme-text-secondary">
                {document.status === 'PROCESSING' ? 'Extracting and analyzing content...' : 'Content processed successfully'}
              </div>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            document.status === 'PROCESSED' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-theme-bg-secondary border border-theme-border-primary'
          }`}>
            <span className={document.status === 'PROCESSED' ? 'text-green-600' : 'text-theme-text-tertiary'}>
              {document.status === 'PROCESSED' ? '✅' : '⏳'}
            </span>
            <div>
              <div className="font-medium text-theme-text-primary">Chunk Generation</div>
              <div className="text-sm text-theme-text-secondary">
                {document.status === 'PROCESSED' 
                  ? `Generated ${document.totalChunks} chunks` 
                  : 'Preparing content chunks...'
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <div>
              <div className="font-medium text-red-800">Processing Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Document Metadata */}
      {(document.title || document.author) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Document Information</h3>
          <div className="space-y-1 text-sm text-theme-interactive-primary">
            {document.title && <div><strong>Title:</strong> {document.title}</div>}
            {document.author && <div><strong>Author:</strong> {document.author}</div>}
          </div>
        </div>
      )}

      {/* Processing Tips */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 mb-2">Processing Information:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Processing time depends on document size and complexity</li>
          <li>• Large documents may take several minutes to process</li>
          <li>• You can leave this page and return later to check status</li>
          <li>• Once processed, you can generate quizzes from the document</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentProcessor; 