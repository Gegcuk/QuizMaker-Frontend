import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  MediaAssetResponse,
  MediaUploadResponse,
} from '../types/media.types';
import { MediaService } from './media.service';

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

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 409 ? 'Conflict' : 'Validation Failed',
      status,
      detail,
    },
  },
});

describe('MediaService', () => {
  let axios: AxiosMock;
  let service: MediaService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new MediaService(axios.instance);
  });

  it('creates an upload intent with the deployed request payload', async () => {
    const request = {
      type: 'IMAGE' as const,
      originalFilename: 'diagram.png',
      mimeType: 'image/png',
      sizeBytes: 100,
      articleId: 'article-1',
    };
    axios.post.mockResolvedValue({ data: uploadIntent });

    await expect(service.createUploadIntent(request)).resolves.toBe(uploadIntent);
    expect(axios.post).toHaveBeenCalledWith('/v1/media/uploads', request);
  });

  it('finalizes an upload with image metadata', async () => {
    const request = { width: 640, height: 480, sha256: 'checksum' };
    axios.post.mockResolvedValue({ data: asset });

    await expect(service.finalizeUpload('asset-1', request)).resolves.toBe(asset);
    expect(axios.post).toHaveBeenCalledWith(
      '/v1/media/uploads/asset-1/complete',
      request,
    );
  });

  it('applies deployed media search defaults and optional filters', async () => {
    axios.get
      .mockResolvedValueOnce({ data: asset })
      .mockResolvedValueOnce({ data: { items: [asset], total: 1, page: 2, limit: 10 } });

    await expect(service.searchAssets()).resolves.toEqual({ items: [asset] });
    await expect(
      service.searchAssets({ type: 'IMAGE', query: 'diagram', page: 2, limit: 10 }),
    ).resolves.toEqual({ items: [asset], total: 1, page: 2, limit: 10 });

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/media', {
      params: { page: 0, limit: 50 },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/media', {
      params: { page: 2, limit: 10, type: 'IMAGE', query: 'diagram' },
    });
  });

  it.each([
    [[asset], { items: [asset] }],
    [{ content: [asset], totalElements: 1, number: 3, size: 5 }, {
      items: [asset], total: 1, page: 3, limit: 5,
    }],
    [{ items: [{ invalid: true }], total: 1 }, { items: [], total: 1 }],
    [null, { items: [] }],
  ])('normalizes compatible search response shape %#', async (response, expected) => {
    axios.get.mockResolvedValue({ data: response });

    await expect(service.searchAssets()).resolves.toEqual(expected);
  });

  it('supports compatibility lookup and deployed asset deletion paths', async () => {
    axios.get.mockResolvedValue({ data: asset });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getAsset('asset-1')).resolves.toBe(asset);
    await expect(service.deleteAsset('asset-1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenCalledWith('/v1/media/asset-1');
    expect(axios.delete).toHaveBeenCalledWith('/v1/media/asset-1');
  });

  it('preserves live ProblemDetail detail for validation and conflict errors', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'File size must be greater than zero.'))
      .mockRejectedValueOnce(problemError(409, 'Asset is already finalized.'));

    await expect(
      service.createUploadIntent({
        type: 'IMAGE',
        originalFilename: 'empty.png',
        mimeType: 'image/png',
        sizeBytes: 0,
      }),
    ).rejects.toThrow('Validation error: File size must be greater than zero.');
    await expect(service.finalizeUpload('asset-1', {})).rejects.toThrow(
      'Conflict: Asset is already finalized.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Media asset not found'],
    [429, 'Too many requests'],
    [500, 'Server error occurred while managing media assets'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getAsset('asset-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.delete
      .mockRejectedValueOnce(problemError(403, 'Forbidden'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.deleteAsset('asset-1')).rejects.toMatchObject({ status: 403 });
    await expect(service.deleteAsset('asset-1')).rejects.toThrow('Network unavailable');
  });
});
