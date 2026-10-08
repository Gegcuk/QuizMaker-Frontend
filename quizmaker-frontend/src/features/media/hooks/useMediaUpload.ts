import { useCallback, useState } from 'react';
import type { MediaAssetType, MediaRefDto } from '../types/media.types';
import { mediaService } from '../services/media.service';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';
import { diagnostics } from '@/features/diagnostics/reporter';

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

export type MediaUploadResult = MediaRefDto;

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
      reject(new ApplicationError({ category: 'validation', localMediaValidation: { reason: 'image-unreadable' } }));
    };

    img.src = url;
  });

export const useMediaUpload = (options: MediaUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileValidationError = useCallback(
    (file: File): ApplicationError | null => {
      const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
      const allowedMimeTypes =
        options.allowedMimeTypes ??
        ((options.type ?? 'IMAGE') === 'IMAGE' ? DEFAULT_IMAGE_MIME_TYPES : []);

      if (!file) {
        return new ApplicationError({ category: 'validation', localMediaValidation: { reason: 'no-file' } });
      }

      if (file.size <= 0) {
        return new ApplicationError({ category: 'validation', localMediaValidation: { reason: 'empty-file' } });
      }

      if (maxSize && file.size > maxSize) {
        return new ApplicationError({ category: 'validation', localMediaValidation: { reason: 'file-too-large', maxSizeBytes: maxSize } });
      }

      if (allowedMimeTypes.length > 0) {
        if (!file.type || !allowedMimeTypes.includes(file.type)) {
          return new ApplicationError({ category: 'validation', localMediaValidation: { reason: 'unsupported-file-type', allowedMimeTypes } });
        }
      }

      return null;
    },
    [options.allowedMimeTypes, options.maxSizeBytes, options.type]
  );

  const validateFile = useCallback(
    (file: File): string | null => getFileValidationError(file)?.message ?? null,
    [getFileValidationError],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const uploadMedia = useCallback(
    async (file: File): Promise<MediaUploadResult> => {
      setError(null);
      setIsUploading(true);

      try {
        const validationError = getFileValidationError(file);
        if (validationError) {
          throw validationError;
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
          throw toApplicationError({ status: response.status });
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
      } catch (err: unknown) {
        const safe = toApplicationError(err);
        setError(safe.message);
        diagnostics.report(safe, 'application');
        throw safe;
      } finally {
        setIsUploading(false);
      }
    },
    [options.articleId, options.type, getFileValidationError]
  );

  return {
    isUploading,
    error,
    uploadMedia,
    validateFile,
    clearError,
  };
};
