// src/features/document/components/DocumentPageSelector.tsx
// Component for uploading a document and selecting specific pages/chunks for quiz generation

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentDto, DocumentChunkDto } from '@/types';
import { api } from '@/services';
import { Button, Input, Alert, Checkbox, Badge, useToast } from '@/components';
import { 
  DocumentArrowUpIcon,
  CheckCircleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface DocumentPageSelectorProps {
  onSelectionComplete?: (data: {
    documentId: string;
    selectedChunkIndices: number[];
    chunks: DocumentChunkDto[];
  }) => void;
  onCancel?: () => void;
  className?: string;
}

export const DocumentPageSelector: React.FC<DocumentPageSelectorProps> = ({
  onSelectionComplete,
  onCancel,
  className = ''
}) => {
  const { addToast } = useToast();
  const [step, setStep] = useState<'upload' | 'select'>('upload');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [uploadedDocument, setUploadedDocument] = useState<DocumentDto | null>(null);
  const [chunks, setChunks] = useState<DocumentChunkDto[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);
  
  const [selectedChunkIds, setSelectedChunkIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [previewChunk, setPreviewChunk] = useState<DocumentChunkDto | null>(null);
  
  const documentService = new DocumentService(api);

  useEffect(() => {
    if (uploadedDocument && step === 'select') {
      loadChunks();
    }
  }, [uploadedDocument, step]);

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return 'Please upload a PDF, Word document, or text file';
    }

    if (file.size > 150 * 1024 * 1024) {
      return 'File size must be less than 150MB';
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        addToast({ type: 'error', message: error });
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;
    
    try {
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const document = await documentService.uploadDocument({
        file: selectedFile,
        chunkingStrategy: 'AUTO',
        maxChunkSize: 50000
      });

      setUploadProgress(100);
      setUploadedDocument(document);
      
      addToast({ 
        type: 'success', 
        message: 'Document uploaded successfully! Loading pages...' 
      });

      setStep('select');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload document';
      setUploadError(errorMessage);
      addToast({ type: 'error', message: errorMessage });
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setIsUploading(false);
    }
  };

  const loadChunks = async () => {
    if (!uploadedDocument) return;

    setIsLoadingChunks(true);
    try {
      const documentChunks = await documentService.getDocumentChunks(uploadedDocument.id);
      setChunks(documentChunks);
      
      const allChunkIds = new Set(documentChunks.map(chunk => chunk.id));
      setSelectedChunkIds(allChunkIds);
      
      addToast({ 
        type: 'success', 
        message: `Loaded ${documentChunks.length} pages/chunks. All are selected by default.` 
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load document chunks';
      setUploadError(errorMessage);
      addToast({ type: 'error', message: errorMessage });
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

  const handleConfirmSelection = () => {
    if (selectedChunkIds.size === 0) {
      addToast({ type: 'error', message: 'Please select at least one page/chunk' });
      return;
    }

    if (!uploadedDocument) return;

    const selectedChunkIndices = chunks
      .filter(chunk => selectedChunkIds.has(chunk.id))
      .map(chunk => chunk.chunkIndex)
      .sort((a, b) => a - b);

    onSelectionComplete?.({
      documentId: uploadedDocument.id,
      selectedChunkIndices,
      chunks: chunks.filter(chunk => selectedChunkIds.has(chunk.id))
    });
  };

  const getFilteredChunks = () => {
    if (!searchTerm) return chunks;
    
    const term = searchTerm.toLowerCase();
    return chunks.filter(chunk => 
      chunk.title.toLowerCase().includes(term) ||
      chunk.content.toLowerCase().includes(term)
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatWordCount = (count: number): string => {
    if (count < 1000) return `${count} words`;
    return `${(count / 1000).toFixed(1)}k words`;
  };

  if (step === 'upload') {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
            Step 1: Upload Document
          </h3>
          <p className="text-theme-text-secondary">
            Upload a document to preview and select specific pages for quiz generation
          </p>
        </div>

        <div className="mb-6">
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            id="document-page-selector-upload"
          />
          
          <label 
            htmlFor="document-page-selector-upload"
            className="block border-2 border-dashed border-theme-border-primary rounded-lg p-8 text-center cursor-pointer hover:border-theme-interactive-primary transition-colors"
          >
            <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-theme-text-tertiary mb-4" />
            <div className="space-y-2">
              <p className="text-theme-text-primary font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-theme-text-secondary">
                PDF, DOC, DOCX, TXT up to 150MB
              </p>
            </div>
          </label>

          {selectedFile && (
            <div className="mt-4 p-4 bg-theme-bg-info border border-theme-border-primary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-theme-interactive-success" />
                  <div>
                    <p className="text-sm font-medium text-theme-text-primary">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-theme-text-secondary">
                      {formatBytes(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-theme-text-secondary">Uploading...</span>
              <span className="text-sm text-theme-text-secondary">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
              <div 
                className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {uploadError && (
          <Alert type="error" className="mb-6">
            {uploadError}
          </Alert>
        )}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload & Preview Pages'}
          </Button>
        </div>
      </div>
    );
  }

  const filteredChunks = getFilteredChunks();
  const stats = {
    total: chunks.length,
    selected: selectedChunkIds.size,
    filtered: filteredChunks.length
  };

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg ${className}`}>
      <div className="p-6 border-b border-theme-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-theme-text-primary mb-1">
              Step 2: Select Pages
            </h3>
            <p className="text-theme-text-secondary">
              Choose which pages/sections to include in quiz generation
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setStep('upload');
              setUploadedDocument(null);
              setChunks([]);
              setSelectedChunkIds(new Set());
            }}
          >
            Upload Different Document
          </Button>
        </div>

        {uploadedDocument && (
          <div className="p-3 bg-theme-bg-info rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-theme-text-primary">
                  {uploadedDocument.originalFilename}
                </span>
                {uploadedDocument.totalPages && (
                  <span className="text-theme-text-secondary ml-2">
                    • {uploadedDocument.totalPages} pages
                  </span>
                )}
              </div>
              <Badge variant="success" size="sm">
                {uploadedDocument.status}
              </Badge>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-theme-bg-secondary rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-text-primary">{stats.total}</div>
            <div className="text-xs text-theme-text-secondary">Total Chunks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-success">{stats.selected}</div>
            <div className="text-xs text-theme-text-secondary">Selected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-theme-interactive-primary">{stats.filtered}</div>
            <div className="text-xs text-theme-text-secondary">Showing</div>
          </div>
        </div>
      </div>

      <div className="p-6 border-b border-theme-border-primary">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or content..."
              fullWidth
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={selectAllChunks}>
            Select All ({chunks.length})
          </Button>
          <Button variant="secondary" size="sm" onClick={deselectAllChunks}>
            Deselect All
          </Button>
        </div>
      </div>

      <div className="p-6 max-h-[500px] overflow-y-auto">
        {isLoadingChunks ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
            <p className="text-theme-text-secondary">Loading pages...</p>
          </div>
        ) : filteredChunks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-theme-text-secondary">No pages match your search</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChunks.map((chunk) => (
              <div
                key={chunk.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedChunkIds.has(chunk.id)
                    ? 'border-theme-interactive-primary bg-theme-bg-info shadow-sm'
                    : 'border-theme-border-primary hover:border-theme-border-primary hover:bg-theme-bg-secondary'
                }`}
                onClick={() => toggleChunkSelection(chunk.id)}
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={selectedChunkIds.has(chunk.id)}
                    onChange={() => toggleChunkSelection(chunk.id)}
                    className="mt-1"
                    label=""
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <h4 className="text-base font-medium text-theme-text-primary truncate">
                          {chunk.title || `Chunk ${chunk.chunkIndex + 1}`}
                        </h4>
                        <Badge variant="info" size="sm">
                          {chunk.chunkType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-theme-text-secondary ml-2">
                        {formatWordCount(chunk.wordCount ?? 0)}
                      </div>
                    </div>
                    
                    <div className="text-sm text-theme-text-secondary mb-2">
                      {chunk.startPage !== null && chunk.endPage !== null && (
                        <span>Pages {chunk.startPage}-{chunk.endPage}</span>
                      )}
                      <span className="mx-2">•</span>
                      <span>{chunk.characterCount} characters</span>
                      {chunk.chapterTitle && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Chapter: {chunk.chapterTitle}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-sm text-theme-text-secondary line-clamp-2">
                      {chunk.content.substring(0, 150)}...
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewChunk(chunk);
                    }}
                    title="Preview full content"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-theme-border-primary bg-theme-bg-secondary">
        <div className="flex justify-between items-center">
          <p className="text-sm text-theme-text-secondary">
            {selectedChunkIds.size} of {chunks.length} pages selected
          </p>
          <div className="flex space-x-3">
            {onCancel && (
              <Button variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleConfirmSelection}
              disabled={selectedChunkIds.size === 0}
            >
              Continue with {selectedChunkIds.size} Selected
            </Button>
          </div>
        </div>
      </div>

      {previewChunk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-theme-bg-primary rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-xl">
            <div className="p-6 border-b border-theme-border-primary flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-theme-text-primary">
                  {previewChunk.title || `Chunk ${previewChunk.chunkIndex + 1}`}
                </h3>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Pages {previewChunk.startPage}-{previewChunk.endPage} • {formatWordCount(previewChunk.wordCount ?? 0)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPreviewChunk(null)}>
                <XMarkIcon className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
              <div className="prose max-w-none text-theme-text-primary leading-relaxed whitespace-pre-wrap">
                {previewChunk.content}
              </div>
            </div>
            
            <div className="p-6 border-t border-theme-border-primary flex justify-between items-center">
              <div className="text-sm text-theme-text-secondary">
                {previewChunk.chunkType.replace('_', ' ')} • {previewChunk.characterCount} characters
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  toggleChunkSelection(previewChunk.id);
                  setPreviewChunk(null);
                }}
              >
                {selectedChunkIds.has(previewChunk.id) ? 'Deselect' : 'Select'} This Page
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPageSelector;

