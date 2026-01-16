import { useCallback, useState } from 'react';
import type { MediaAssetType, MediaRefDto } from '../types/media.types';
import { mediaService } from '../services/media.service';
import { logger } from '@/utils';

const DEFAULT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export interface MediaUploadOptions {
  type?: MediaAssetType;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
  articleId?: string;
}

export interface MediaUploadResult extends MediaRefDto {}

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image dimensions.'));
    };

    img.src = url;
  });

const formatBytes = (value: number): string => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export const useMediaUpload = (options: MediaUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
      const allowedMimeTypes = options.allowedMimeTypes ?? DEFAULT_IMAGE_MIME_TYPES;

      if (!file) {
        return 'No file selected.';
      }

      if (file.size <= 0) {
        return 'File is empty.';
      }

      if (maxSize && file.size > maxSize) {
        return `File is too large. Max size is ${formatBytes(maxSize)}.`;
      }

      if (allowedMimeTypes.length > 0) {
        if (!file.type || !allowedMimeTypes.includes(file.type)) {
          return `Unsupported file type. Allowed: ${allowedMimeTypes.join(', ')}.`;
        }
      }

      return null;
    },
    [options.allowedMimeTypes, options.maxSizeBytes]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadMedia = useCallback(
    async (file: File): Promise<MediaUploadResult> => {
      setError(null);
      setIsUploading(true);

      try {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(validationError);
        }

        const type = options.type ?? 'IMAGE';
        const needsDimensions = type === 'IMAGE';
        let width: number | undefined;
        let height: number | undefined;

        if (needsDimensions) {
          const dimensions = await getImageDimensions(file);
          width = dimensions.width;
          height = dimensions.height;
        }

        const uploadIntent = await mediaService.createUploadIntent({
          type,
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          ...(options.articleId ? { articleId: options.articleId } : {}),
        });

        const response = await fetch(uploadIntent.upload.url, {
          method: uploadIntent.upload.method,
          headers: uploadIntent.upload.headers || {},
          body: file,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload file: ${response.statusText}`);
        }

        const asset = await mediaService.finalizeUpload(uploadIntent.assetId, {
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        });

        return {
          assetId: asset.assetId,
          cdnUrl: asset.cdnUrl,
          width: asset.width,
          height: asset.height,
          mimeType: asset.mimeType,
        };
      } catch (err: any) {
        const message = err?.message || 'Failed to upload media.';
        setError(message);
        logger.error(message, 'useMediaUpload');
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [options.articleId, options.type, validateFile]
  );

  return {
    isUploading,
    error,
    uploadMedia,
    validateFile,
    clearError,
  };
};
