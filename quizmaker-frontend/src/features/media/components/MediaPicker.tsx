import React, { useRef } from 'react';
import { Button } from '@/components';
import type { MediaRefDto } from '../types/media.types';
import { useMediaUpload, type MediaUploadOptions } from '../hooks/useMediaUpload';

export interface MediaPickerProps {
  value?: MediaRefDto | null;
  onChange: (value: MediaRefDto | null) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  allowRemove?: boolean;
  showPreview?: boolean;
  uploadLabel?: string;
  removeLabel?: string;
  accept?: string;
  options?: MediaUploadOptions;
  className?: string;
}

const MediaPicker: React.FC<MediaPickerProps> = ({
  value = null,
  onChange,
  label = 'Upload image',
  helperText,
  disabled = false,
  allowRemove = true,
  showPreview = true,
  uploadLabel = 'Upload image',
  removeLabel = 'Remove',
  accept,
  options,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMedia, isUploading, error, clearError } = useMediaUpload(options);

  const acceptAttr =
    accept ?? (options?.allowedMimeTypes?.length ? options.allowedMimeTypes.join(',') : 'image/*');

  const handleSelectClick = () => {
    if (disabled) return;
    clearError();
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (disabled) return;
    clearError();
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearError();

    try {
      const result = await uploadMedia(file);
      onChange(result);
    } catch {
      // Error state is managed by the upload hook.
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        {label && (
          <label className="block text-sm font-medium text-theme-text-secondary mb-1">
            {label}
          </label>
        )}
        {helperText && (
          <p className="text-xs text-theme-text-tertiary">{helperText}</p>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleSelectClick}
          loading={isUploading}
          disabled={disabled}
        >
          {isUploading ? 'Uploading...' : uploadLabel}
        </Button>
        {allowRemove && value && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleRemove}
            disabled={disabled}
          >
            {removeLabel}
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-theme-interactive-danger">{error}</p>
      )}

      {showPreview && value && (
        <div className="p-3 border border-theme-border-primary rounded-lg bg-theme-bg-secondary">
          {value.cdnUrl ? (
            <img
              src={value.cdnUrl}
              alt="Uploaded media preview"
              className="max-w-full h-auto rounded-md border border-theme-border-primary"
              {...(value.width ? { width: value.width } : {})}
              {...(value.height ? { height: value.height } : {})}
            />
          ) : (
            <div className="text-xs text-theme-text-tertiary">
              Asset ID: {value.assetId}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MediaPicker;
