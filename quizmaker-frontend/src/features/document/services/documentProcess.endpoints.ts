/**
 * Document Process API endpoints
 * Based on DocumentProcessController API documentation
 */
export const DOCUMENT_PROCESS_ENDPOINTS = {
  DOCUMENT_BY_ID: (id: string) => `/v1/documentProcess/documents/${id}`,
  DOCUMENT_HEAD: (id: string) => `/v1/documentProcess/documents/${id}/head`,
  TEXT_SLICE: (id: string) => `/v1/documentProcess/documents/${id}/text`,
  STRUCTURE: (id: string) => `/v1/documentProcess/documents/${id}/structure`,
  BUILD_STRUCTURE: (id: string) => `/v1/documentProcess/documents/${id}/structure`,
  EXTRACT_CONTENT: (id: string) => `/v1/documentProcess/documents/${id}/extract`,
} as const;
