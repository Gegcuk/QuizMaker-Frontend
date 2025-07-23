// src/components/document/DocumentProcessor.tsx
// ---------------------------------------------------------------------------
// Component for displaying document processing status and progress
// Shows real-time updates, processing stages, and completion status
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useRef } from 'react';
import { DocumentService } from '../../api/document.service';
import { DocumentDto, DocumentStatus } from '../../types/document.types';
import api from '../../api/axiosInstance';

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
        return 'text-blue-600 bg-blue-100';
      case 'PROCESSING':
        return 'text-yellow-600 bg-yellow-100';
      case 'PROCESSED':
        return 'text-green-600 bg-green-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Processing</h2>
        <p className="text-gray-600">Processing your document for quiz generation</p>
      </div>

      {/* Document Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{document.originalFilename}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(document.fileSize)} • {document.contentType}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
            {getStatusIcon(document.status)} {document.status}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Uploaded:</span>
            <div className="text-gray-900">{formatDate(document.uploadedAt)}</div>
          </div>
          {document.processedAt && (
            <div>
              <span className="font-medium text-gray-700">Processed:</span>
              <div className="text-gray-900">{formatDate(document.processedAt)}</div>
            </div>
          )}
          {document.totalPages && (
            <div>
              <span className="font-medium text-gray-700">Pages:</span>
              <div className="text-gray-900">{document.totalPages}</div>
            </div>
          )}
          {document.totalChunks && (
            <div>
              <span className="font-medium text-gray-700">Chunks:</span>
              <div className="text-gray-900">{document.totalChunks}</div>
            </div>
          )}
        </div>
      </div>

      {/* Processing Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Processing Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              document.status === 'FAILED' ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="text-sm text-gray-600">
          {processingStage}
          {isPolling && (
            <span className="ml-2 inline-block animate-pulse">🔄</span>
          )}
        </div>
      </div>

      {/* Processing Stages */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Processing Stages</h3>
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            document.status !== 'FAILED' ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-green-600">✅</span>
            <div>
              <div className="font-medium text-gray-900">Document Upload</div>
              <div className="text-sm text-gray-600">File uploaded and validated</div>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            ['PROCESSING', 'PROCESSED'].includes(document.status) 
              ? 'bg-blue-50 border border-blue-200' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className={['PROCESSING', 'PROCESSED'].includes(document.status) ? 'text-blue-600' : 'text-gray-400'}>
              {document.status === 'PROCESSING' ? '⚙️' : '✅'}
            </span>
            <div>
              <div className="font-medium text-gray-900">Content Processing</div>
              <div className="text-sm text-gray-600">
                {document.status === 'PROCESSING' ? 'Extracting and analyzing content...' : 'Content processed successfully'}
              </div>
            </div>
          </div>
          
          <div className={`flex items-center space-x-3 p-3 rounded-lg ${
            document.status === 'PROCESSED' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className={document.status === 'PROCESSED' ? 'text-green-600' : 'text-gray-400'}>
              {document.status === 'PROCESSED' ? '✅' : '⏳'}
            </span>
            <div>
              <div className="font-medium text-gray-900">Chunk Generation</div>
              <div className="text-sm text-gray-600">
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
          <div className="space-y-1 text-sm text-blue-700">
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