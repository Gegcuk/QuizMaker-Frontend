import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  MediaAssetResponse,
  MediaUploadResponse,
} from '../types/media.types';
import { useMediaUpload } from './useMediaUpload';

const mocks = vi.hoisted(() => ({
  createObjectURL: vi.fn(() => 'blob:media'),
  createUploadIntent: vi.fn(),
  finalizeUpload: vi.fn(),
  loggerError: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('../services/media.service', () => ({
  mediaService: {
    createUploadIntent: mocks.createUploadIntent,
    finalizeUpload: mocks.finalizeUpload,
  },
}));

vi.mock('@/utils', () => ({
  getErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'Failed to upload media.',
  logger: { error: mocks.loggerError },
}));

const uploadIntent: MediaUploadResponse = {
  assetId: 'asset-1',
  type: 'IMAGE',
  status: 'UPLOADING',
  key: 'media/asset-1.png',
  cdnUrl: 'https://cdn.quizzence.com/media/asset-1.png',
  mimeType: 'image/png',
  sizeBytes: 100,
  originalFilename: 'diagram.png',
  createdAt: '2026-07-07T12:00:00Z',
  upload: {
    method: 'PUT',
    url: 'https://uploads.example.com/asset-1',
    headers: { 'Content-Type': 'image/png' },
    expiresAt: '2026-07-07T12:15:00Z',
  },
};

const asset: MediaAssetResponse = {
  assetId: 'asset-1',
  type: 'IMAGE',
  status: 'READY',
  key: uploadIntent.key,
  cdnUrl: uploadIntent.cdnUrl,
  mimeType: uploadIntent.mimeType,
  sizeBytes: uploadIntent.sizeBytes,
  width: 640,
  height: 480,
  originalFilename: uploadIntent.originalFilename,
  createdAt: uploadIntent.createdAt,
  updatedAt: '2026-07-07T12:01:00Z',
};

class ImageMock {
  width = 640;
  height = 480;
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.(new Event('load')));
  }
}

describe('useMediaUpload', () => {
  beforeEach(() => {
    class URLMock extends URL {}
    URLMock.createObjectURL = mocks.createObjectURL;
    URLMock.revokeObjectURL = mocks.revokeObjectURL;

    vi.stubGlobal('URL', URLMock);
    vi.stubGlobal('Image', ImageMock);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, statusText: 'OK' }));
    mocks.createUploadIntent.mockResolvedValue(uploadIntent);
    mocks.finalizeUpload.mockResolvedValue(asset);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('validates empty, oversized, and unsupported image files', () => {
    const { result } = renderHook(() => useMediaUpload({ maxSizeBytes: 5 }));

    expect(result.current.validateFile(new File([], 'empty.png', { type: 'image/png' }))).toBe(
      'File is empty.',
    );
    expect(
      result.current.validateFile(
        new File([new Uint8Array(6)], 'large.png', { type: 'image/png' }),
      ),
    ).toBe('File is too large. Max size is 5 B.');
    expect(
      result.current.validateFile(
        new File([new Uint8Array(1)], 'diagram.svg', { type: 'image/svg+xml' }),
      ),
    ).toBe(
      'Unsupported file type. Allowed: image/jpeg, image/png, image/gif, image/webp.',
    );
  });

  it('uploads an image through intent, presigned PUT, and finalization', async () => {
    const file = new File([new Uint8Array(100)], 'diagram.png', { type: 'image/png' });
    const { result } = renderHook(() => useMediaUpload({ articleId: 'article-1' }));
    let uploaded: Awaited<ReturnType<typeof result.current.uploadMedia>> | undefined;

    await act(async () => {
      uploaded = await result.current.uploadMedia(file);
    });

    expect(mocks.createUploadIntent).toHaveBeenCalledWith({
      type: 'IMAGE',
      originalFilename: 'diagram.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      articleId: 'article-1',
    });
    expect(fetch).toHaveBeenCalledWith(uploadIntent.upload.url, {
      method: 'PUT',
      headers: uploadIntent.upload.headers,
      body: file,
    });
    expect(mocks.finalizeUpload).toHaveBeenCalledWith('asset-1', {
      width: 640,
      height: 480,
    });
    expect(uploaded).toEqual({
      assetId: 'asset-1',
      cdnUrl: asset.cdnUrl,
      width: 640,
      height: 480,
      mimeType: 'image/png',
    });
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:media');
    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('allows document MIME types by default and skips image dimensions', async () => {
    const file = new File([new Uint8Array(10)], 'guide.pdf', {
      type: 'application/pdf',
    });
    const documentIntent = {
      ...uploadIntent,
      type: 'DOCUMENT' as const,
      mimeType: 'application/pdf',
      originalFilename: 'guide.pdf',
    };
    const documentAsset = {
      ...asset,
      type: 'DOCUMENT' as const,
      mimeType: 'application/pdf',
      originalFilename: 'guide.pdf',
      width: undefined,
      height: undefined,
    };
    mocks.createUploadIntent.mockResolvedValue(documentIntent);
    mocks.finalizeUpload.mockResolvedValue(documentAsset);
    const { result } = renderHook(() => useMediaUpload({ type: 'DOCUMENT' }));

    await act(async () => {
      await result.current.uploadMedia(file);
    });

    expect(result.current.validateFile(file)).toBeNull();
    expect(mocks.createObjectURL).not.toHaveBeenCalled();
    expect(mocks.createUploadIntent).toHaveBeenCalledWith({
      type: 'DOCUMENT',
      originalFilename: 'guide.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 10,
    });
    expect(mocks.finalizeUpload).toHaveBeenCalledWith('asset-1', {});
  });

  it('exposes loading while an upload intent is pending', async () => {
    const file = new File([new Uint8Array(10)], 'diagram.png', { type: 'image/png' });
    let resolveIntent: ((value: MediaUploadResponse) => void) | undefined;
    mocks.createUploadIntent.mockReturnValue(
      new Promise(resolve => {
        resolveIntent = resolve;
      }),
    );
    const { result } = renderHook(() => useMediaUpload());
    let uploadPromise: Promise<unknown>;

    act(() => {
      uploadPromise = result.current.uploadMedia(file);
    });
    await waitFor(() => expect(mocks.createUploadIntent).toHaveBeenCalled());
    expect(result.current.isUploading).toBe(true);

    resolveIntent?.(uploadIntent);
    await act(async () => uploadPromise);
    expect(result.current.isUploading).toBe(false);
  });

  it('stores upload failures, logs them, and can clear the error', async () => {
    const file = new File([new Uint8Array(10)], 'diagram.png', { type: 'image/png' });
    vi.mocked(fetch).mockResolvedValue({ ok: false, statusText: 'Forbidden' } as Response);
    const { result } = renderHook(() => useMediaUpload());

    let uploadError: unknown;
    await act(async () => {
      try {
        await result.current.uploadMedia(file);
      } catch (error) {
        uploadError = error;
      }
    });

    expect(uploadError).toEqual(
      expect.objectContaining({
        message: 'Failed to upload file: Forbidden',
      }),
    );
    await waitFor(() =>
      expect(result.current.error).toBe('Failed to upload file: Forbidden'),
    );
    expect(result.current.isUploading).toBe(false);
    expect(mocks.finalizeUpload).not.toHaveBeenCalled();
    expect(mocks.loggerError).toHaveBeenCalledWith(
      'Failed to upload file: Forbidden',
      'useMediaUpload',
    );

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
