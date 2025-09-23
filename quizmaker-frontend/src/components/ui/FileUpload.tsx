import React, { useState, useRef, useCallback } from 'react';

export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
  showPreview?: boolean;
  dragAndDrop?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  multiple = false,
  accept,
  maxSize,
  maxFiles = 10,
  disabled = false,
  className = '',
  label = 'Choose files',
  helperText,
  error,
  showPreview = false,
  dragAndDrop = true
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `File ${file.name} is too large. Maximum size is ${formatFileSize(maxSize)}`;
    }

    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileType = file.type;
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileExtension === type.toLowerCase();
        }
        return fileType === type || fileType.startsWith(type.replace('*', ''));
      });

      if (!isAccepted) {
        return `File ${file.name} is not an accepted file type`;
      }
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

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newErrors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (validFiles.length > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} files allowed`);
    }

    setErrors(newErrors);
    
    if (newErrors.length === 0) {
      const updatedFiles = multiple ? [...selectedFiles, ...validFiles] : validFiles;
      setSelectedFiles(updatedFiles);
      onFileSelect(updatedFiles);
    }
  }, [multiple, selectedFiles, maxFiles, onFileSelect]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled || !dragAndDrop) return;

    const files = event.dataTransfer.files;
    if (files) {
      handleFileSelect(files);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFileSelect(updatedFiles);
  };

  const baseClasses = [
    'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200',
    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-theme-border-primary hover:border-theme-border-secondary',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    error ? 'border-red-300 bg-red-50' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-4">
      <div
        className={baseClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-theme-text-tertiary"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          
          <div className="text-sm text-theme-text-secondary">
            <span className="font-medium text-theme-interactive-primary hover:text-blue-500">
              {label}
            </span>
            {dragAndDrop && ' or drag and drop'}
          </div>
          
          {helperText && (
            <p className="text-xs text-theme-text-tertiary">{helperText}</p>
          )}
          
          {accept && (
            <p className="text-xs text-theme-text-tertiary">
              Accepted formats: {accept}
            </p>
          )}
          
          {maxSize && (
            <p className="text-xs text-theme-text-tertiary">
              Maximum file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="text-sm text-red-600">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* File Preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-theme-text-primary">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <svg className="h-5 w-5 text-theme-text-tertiary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-theme-text-primary">{file.name}</p>
                    <p className="text-xs text-theme-text-tertiary">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 