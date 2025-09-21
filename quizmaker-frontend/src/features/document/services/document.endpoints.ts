/**
 * Document API endpoints
 * Based on DocumentController API documentation
 */
export const DOCUMENT_ENDPOINTS = {
  UPLOAD: '/documents/upload',
  CONFIG: '/documents/config',
  DOCUMENTS: '/documents',
  DOCUMENT_BY_ID: (id: string) => `/documents/${id}`,
  CHUNKS: (id: string) => `/documents/${id}/chunks`,
  CHUNK_BY_INDEX: (id: string, index: number) => `/documents/${id}/chunks/${index}`,
  STATUS: (id: string) => `/documents/${id}/status`,
  REPROCESS: (id: string) => `/documents/${id}/reprocess`,
} as const;
