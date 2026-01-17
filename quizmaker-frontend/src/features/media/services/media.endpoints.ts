/**
 * Media library endpoints
 */
export const MEDIA_ENDPOINTS = {
  CREATE_UPLOAD_INTENT: '/v1/media/uploads',
  FINALIZE_UPLOAD: (assetId: string) => `/v1/media/uploads/${assetId}/complete`,
  SEARCH: '/v1/media',
  GET: (assetId: string) => `/v1/media/${assetId}`,
  DELETE: (assetId: string) => `/v1/media/${assetId}`,
} as const;
