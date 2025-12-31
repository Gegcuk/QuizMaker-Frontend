// Media library DTOs
// Derived from the media API group specification (presigned uploads + library search)

/**
 * Media asset types
 */
export type MediaAssetType = 'IMAGE' | 'DOCUMENT';

/**
 * Media asset lifecycle status
 */
export type MediaAssetStatus = 'UPLOADING' | 'READY' | 'FAILED' | 'DELETED';

/**
 * Upload target information for presigned uploads
 */
export interface UploadTargetDto {
  method: string;
  url: string;
  headers?: Record<string, string>;
  expiresAt: string;
}

/**
 * Request payload to create a presigned upload
 */
export interface MediaUploadRequest {
  type: MediaAssetType;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  articleId?: string;
}

/**
 * Response payload after creating an upload intent
 */
export interface MediaUploadResponse {
  assetId: string;
  type: MediaAssetType;
  status: MediaAssetStatus;
  key: string;
  cdnUrl: string;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  articleId?: string;
  createdBy?: string;
  createdAt: string;
  upload: UploadTargetDto;
}

/**
 * Payload to finalize an upload after the PUT completes
 */
export interface MediaUploadCompleteRequest {
  width?: number;
  height?: number;
  sha256?: string;
}

/**
 * Media asset metadata returned after finalization or lookup
 */
export interface MediaAssetResponse {
  assetId: string;
  type: MediaAssetType;
  status: MediaAssetStatus;
  key: string;
  cdnUrl: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  originalFilename: string;
  sha256?: string;
  articleId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Search parameters for the media library
 */
export interface MediaSearchParams {
  type?: MediaAssetType;
  query?: string;
  page?: number;
  limit?: number;
}

/**
 * Search response for the media library
 * OpenAPI lists a single MediaAssetResponse, but the endpoint is described as a search.
 * This union captures possible shapes so callers can normalize as needed.
 */
export type MediaSearchResponse =
  | MediaAssetResponse
 | MediaAssetResponse[]
  | {
      items?: MediaAssetResponse[];
      content?: MediaAssetResponse[];
      total?: number;
      totalElements?: number;
      page?: number;
      limit?: number;
      size?: number;
      number?: number;
    };

/**
 * Normalized media search result for consumers
 */
export interface MediaAssetListResponse {
  items: MediaAssetResponse[];
  total?: number;
  page?: number;
  limit?: number;
}
