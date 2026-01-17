import type { AxiosInstance } from 'axios';
import { MEDIA_ENDPOINTS } from './media.endpoints';
import {
  MediaAssetListResponse,
  MediaAssetResponse,
  MediaSearchParams,
  MediaSearchResponse,
  MediaUploadCompleteRequest,
  MediaUploadRequest,
  MediaUploadResponse,
} from '../types/media.types';
import api from '@/api/axiosInstance';

/**
 * Media library service for presigned uploads and asset management
 * Implements endpoints from the media API group
 */
export class MediaService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Create a presigned upload intent
   * POST /api/v1/media/uploads
   */
  async createUploadIntent(payload: MediaUploadRequest): Promise<MediaUploadResponse> {
    try {
      const response = await this.axiosInstance.post<MediaUploadResponse>(
        MEDIA_ENDPOINTS.CREATE_UPLOAD_INTENT,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleMediaError(error);
    }
  }

  /**
   * Finalize an upload after the binary PUT completes
   * POST /api/v1/media/uploads/{assetId}/complete
   */
  async finalizeUpload(assetId: string, payload: MediaUploadCompleteRequest): Promise<MediaAssetResponse> {
    try {
      const response = await this.axiosInstance.post<MediaAssetResponse>(
        MEDIA_ENDPOINTS.FINALIZE_UPLOAD(assetId),
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleMediaError(error);
    }
  }

  /**
   * Search media assets
   * GET /api/v1/media
   */
  async searchAssets(params: MediaSearchParams = {}): Promise<MediaAssetListResponse> {
    try {
      const response = await this.axiosInstance.get<MediaSearchResponse>(MEDIA_ENDPOINTS.SEARCH, {
        params: {
          page: params.page ?? 0,
          limit: params.limit ?? 50,
          ...(params.type ? { type: params.type } : {}),
          ...(params.query ? { query: params.query } : {}),
        },
      });

      return this.normalizeSearchResponse(response.data);
    } catch (error) {
      throw this.handleMediaError(error);
    }
  }

  /**
   * Fetch a single media asset
   * GET /api/v1/media/{assetId}
   */
  async getAsset(assetId: string): Promise<MediaAssetResponse> {
    try {
      const response = await this.axiosInstance.get<MediaAssetResponse>(MEDIA_ENDPOINTS.GET(assetId));
      return response.data;
    } catch (error) {
      throw this.handleMediaError(error);
    }
  }

  /**
   * Delete or retire a media asset
   * DELETE /api/v1/media/{assetId}
   */
  async deleteAsset(assetId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(MEDIA_ENDPOINTS.DELETE(assetId));
    } catch (error) {
      throw this.handleMediaError(error);
    }
  }

  /**
   * Normalize the API search response into a predictable structure
   */
  private normalizeSearchResponse(data: MediaSearchResponse): MediaAssetListResponse {
    if (Array.isArray(data)) {
      return { items: data };
    }

    if (data && typeof data === 'object') {
      const candidate = data as Record<string, any>;
      const items =
        (Array.isArray(candidate.items) ? candidate.items : undefined) ??
        (Array.isArray(candidate.content) ? candidate.content : undefined) ??
        (this.isMediaAssetResponse(candidate) ? [candidate as MediaAssetResponse] : []);

      const total =
        typeof candidate.total === 'number'
          ? candidate.total
          : typeof candidate.totalElements === 'number'
            ? candidate.totalElements
            : undefined;

      const page =
        typeof candidate.page === 'number'
          ? candidate.page
          : typeof candidate.number === 'number'
            ? candidate.number
            : undefined;

      const limit =
        typeof candidate.limit === 'number'
          ? candidate.limit
          : typeof candidate.size === 'number'
            ? candidate.size
            : undefined;

      return { items, total, page, limit };
    }

    return { items: [] };
  }

  private isMediaAssetResponse(value: unknown): value is MediaAssetResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }
    const candidate = value as Record<string, unknown>;
    return (
      typeof candidate.assetId === 'string' &&
      typeof candidate.type === 'string' &&
      typeof candidate.status === 'string'
    );
  }

  /**
   * Handle media-specific API errors
   */
  private handleMediaError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.response?.data?.detail || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions to manage media assets');
        case 404:
          return new Error('Media asset not found');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred while managing media assets');
        default:
          return new Error(message || 'Media operation failed');
      }
    }

    return new Error(error?.message || 'Network error occurred');
  }
}

// Default instance using the shared axios client
export const mediaService = new MediaService(api);
