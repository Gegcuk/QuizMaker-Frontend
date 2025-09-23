// src/features/document/components/DocumentProcessUpload.tsx
// ---------------------------------------------------------------------------
// Component for uploading documents to the document process API
// Supports both file upload and text input with drag-and-drop functionality
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef } from 'react';
import { DocumentProcessService } from '@/services';
import { DocumentProcessDto, DocumentProcessViewDto } from '@/types';
import { api } from '@/services';
import { Button, Alert, Badge, Card, CardContent, CardHeader, CardTitle } from '@/components';
import { 
  DocumentArrowUpIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentProcessUploadProps {
  onUploadSuccess?: (document: DocumentProcessViewDto) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

const DocumentProcessUpload: React.FC<DocumentProcessUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [error, setError] = useState<string | null>(null);
  const [uploadedDocument, setUploadedDocument] = useState<DocumentProcessDto | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentProcessService = new DocumentProcessService(api);

  const validateFile = (file: File): string | null => {
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit
    const supportedTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
      'text/plain'
    ];
    
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`;
    }
    
    // Check file type
    if (!supportedTypes.includes(file.type)) {
      return 'Unsupported file type. Please upload PDF, DOCX, or TXT files only.';
    }
    
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (uploadMode === 'text' && !textInput.trim()) {
      setError('Please enter text content');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let document: DocumentProcessDto;

      if (uploadMode === 'file' && selectedFile) {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        document = await documentProcessService.uploadDocumentFile({
          file: selectedFile,
          originalName: selectedFile.name
        });

        clearInterval(progressInterval);
      } else {
        // Text upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        document = await documentProcessService.uploadDocumentText({
          text: textInput,
          language: language,
          originalName: 'text-input'
        });

        clearInterval(progressInterval);
      }

      setUploadProgress(100);
      setUploadedDocument(document);
      
             if (onUploadSuccess) {
         // Convert DocumentProcessDto to DocumentProcessViewDto for the list
         const documentView: DocumentProcessViewDto = {
           id: document.id,
           name: document.name,
           charCount: document.charCount,
           status: document.status
         };
         onUploadSuccess(documentView);
       }

      // Reset form
      setTimeout(() => {
        setSelectedFile(null);
        setTextInput('');
        setUploadedDocument(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Upload failed');
      if (onUploadError) {
        onUploadError(err.message || 'Upload failed');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Mode Toggle */}
      <div className="flex space-x-4">
        <Button
          variant={uploadMode === 'file' ? 'primary' : 'outline'}
          onClick={() => setUploadMode('file')}
          className="flex items-center space-x-2"
        >
          <DocumentArrowUpIcon className="h-5 w-5" />
          <span>File Upload</span>
        </Button>
        <Button
          variant={uploadMode === 'text' ? 'primary' : 'outline'}
          onClick={() => setUploadMode('text')}
          className="flex items-center space-x-2"
        >
          <DocumentTextIcon className="h-5 w-5" />
          <span>Text Input</span>
        </Button>
      </div>

      {/* File Upload Section */}
      {uploadMode === 'file' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CloudArrowUpIcon className="h-5 w-5" />
              <span>Upload Document File</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-theme-border-info bg-theme-bg-info'
                  : 'border-theme-border-primary hover:border-theme-border-secondary'
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-2">
                    <DocumentTextIcon className="h-8 w-8 text-theme-interactive-success" />
                    <span className="font-medium">{selectedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-theme-interactive-danger hover:text-theme-interactive-danger"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-theme-text-tertiary">
                    Size: {formatFileSize(selectedFile.size)}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
                  <div>
                    <p className="text-lg font-medium text-theme-text-primary">
                      Drop your document here
                    </p>
                    <p className="text-sm text-theme-text-tertiary">
                      or click to browse files
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="text-sm text-theme-text-tertiary">
              <p>Supported formats: PDF, DOCX, TXT</p>
              <p>Maximum file size: 50 MB</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text Input Section */}
      {uploadMode === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5" />
              <span>Enter Document Text</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="language" className="block text-sm font-medium text-theme-text-secondary">
                Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              >
                <option value="en" className="bg-theme-bg-primary text-theme-text-primary">English</option>
                <option value="es" className="bg-theme-bg-primary text-theme-text-primary">Spanish</option>
                <option value="fr" className="bg-theme-bg-primary text-theme-text-primary">French</option>
                <option value="de" className="bg-theme-bg-primary text-theme-text-primary">German</option>
                <option value="it" className="bg-theme-bg-primary text-theme-text-primary">Italian</option>
                <option value="pt" className="bg-theme-bg-primary text-theme-text-primary">Portuguese</option>
                <option value="ru" className="bg-theme-bg-primary text-theme-text-primary">Russian</option>
                <option value="zh" className="bg-theme-bg-primary text-theme-text-primary">Chinese</option>
                <option value="ja" className="bg-theme-bg-primary text-theme-text-primary">Japanese</option>
                <option value="ko" className="bg-theme-bg-primary text-theme-text-primary">Korean</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="textInput" className="block text-sm font-medium text-theme-text-secondary">
                Document Content
              </label>
              <textarea
                id="textInput"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste or type your document content here..."
                rows={10}
                className="w-full px-3 py-2 border border-theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:border-transparent resize-vertical bg-theme-bg-primary text-theme-text-primary bg-theme-bg-primary text-theme-text-primary"
              />
            </div>

            <div className="text-sm text-theme-text-tertiary">
              <p>Character count: {textInput.length.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                <div
                  className="bg-theme-interactive-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

             {/* Success Message */}
       {uploadedDocument && (
         <Alert className="border-theme-border-success bg-theme-bg-success">
           <CheckCircleIcon className="h-5 w-5 text-theme-interactive-success" />
           <div>
             <h3 className="text-sm font-medium text-theme-interactive-success">
               Document uploaded successfully!
             </h3>
             <div className="mt-2 text-sm text-theme-interactive-success">
               <p>Document ID: {uploadedDocument.id}</p>
               {uploadedDocument.name && <p>Name: {uploadedDocument.name}</p>}
               {uploadedDocument.charCount && (
                 <p>Character count: {uploadedDocument.charCount.toLocaleString()}</p>
               )}
               <div className="mt-2">
                 <Badge variant="outline" className="text-theme-interactive-success border-theme-border-success">
                   {uploadedDocument.status}
                 </Badge>
               </div>
             </div>
           </div>
         </Alert>
       )}

      {/* Error Message */}
      {error && (
        <Alert type="error">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-medium">Upload Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUpload}
          disabled={isUploading || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'text' && !textInput.trim())}
          className="flex items-center space-x-2"
        >
          <CloudArrowUpIcon className="h-5 w-5" />
          <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
        </Button>
      </div>
    </div>
  );
};

export default DocumentProcessUpload;
