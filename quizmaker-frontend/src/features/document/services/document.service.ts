import type { AxiosInstance } from 'axios';
import { DOCUMENT_ENDPOINTS } from './document.endpoints';
import { 
  DocumentDto,
  DocumentChunkDto,
  ProcessDocumentRequest,
  DocumentConfigDto,
  Page
} from '@/types';
import { BaseService } from '@/services';

/**
 * Document service for handling document operations
 * Implements all endpoints from the DocumentController API documentation
 */
export class DocumentService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Upload document
   * POST /api/documents/upload
   */
  async uploadDocument(data: {
    file: File;
    chunkingStrategy?: string;
    maxChunkSize?: number;
  }): Promise<DocumentDto> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      
      if (data.chunkingStrategy) {
        formData.append('chunkingStrategy', data.chunkingStrategy);
      }
      
      if (data.maxChunkSize) {
        formData.append('maxChunkSize', data.maxChunkSize.toString());
      }

      const response = await this.axiosInstance.post<DocumentDto>(DOCUMENT_ENDPOINTS.UPLOAD, formData, {
        _isFileUpload: true,  // Flag for request interceptor to handle Content-Type
      } as any);
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get document by ID
   * GET /api/documents/{documentId}
   */
  async getDocumentById(documentId: string): Promise<DocumentDto> {
    try {
      const response = await this.axiosInstance.get<DocumentDto>(DOCUMENT_ENDPOINTS.DOCUMENT_BY_ID(documentId));
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get user documents with pagination
   * GET /api/documents
   */
  async getDocuments(params?: {
    page?: number;
    size?: number;
  }): Promise<Page<DocumentDto>> {
    try {
      const response = await this.axiosInstance.get<Page<DocumentDto>>(DOCUMENT_ENDPOINTS.DOCUMENTS, {
        params
      });
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get document chunks
   * GET /api/documents/{documentId}/chunks
   */
  async getDocumentChunks(documentId: string): Promise<DocumentChunkDto[]> {
    try {
      const response = await this.axiosInstance.get<DocumentChunkDto[]>(DOCUMENT_ENDPOINTS.CHUNKS(documentId));
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get specific chunk by index
   * GET /api/documents/{documentId}/chunks/{chunkIndex}
   */
  async getChunkByIndex(documentId: string, chunkIndex: number): Promise<DocumentChunkDto> {
    try {
      const response = await this.axiosInstance.get<DocumentChunkDto>(DOCUMENT_ENDPOINTS.CHUNK_BY_INDEX(documentId, chunkIndex));
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Delete document
   * DELETE /api/documents/{documentId}
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.axiosInstance.delete(DOCUMENT_ENDPOINTS.DOCUMENT_BY_ID(documentId));
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Reprocess document
   * POST /api/documents/{documentId}/reprocess
   */
  async reprocessDocument(documentId: string, data: ProcessDocumentRequest): Promise<DocumentDto> {
    try {
      const response = await this.axiosInstance.post<DocumentDto>(DOCUMENT_ENDPOINTS.REPROCESS(documentId), data);
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get document status
   * GET /api/documents/{documentId}/status
   */
  async getDocumentStatus(documentId: string): Promise<DocumentDto> {
    try {
      const response = await this.axiosInstance.get<DocumentDto>(DOCUMENT_ENDPOINTS.STATUS(documentId));
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Get document configuration
   * GET /api/documents/config
   */
  async getDocumentConfig(): Promise<DocumentConfigDto> {
    try {
      const response = await this.axiosInstance.get<DocumentConfigDto>(DOCUMENT_ENDPOINTS.CONFIG);
      return response.data;
    } catch (error) {
      throw this.handleDocumentError(error);
    }
  }

  /**
   * Handle document-specific errors
   */
  private handleDocumentError(error: any): Error {
    if (error && typeof error === 'object' && 'isAxiosError' in error && error.isAxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 400:
          return new Error(`Validation error: ${message}`);
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Insufficient permissions - only the document uploader may access this document');
        case 404:
          return new Error('Document not found');
        case 413:
          return new Error('File size exceeds maximum allowed size (150MB)');
        case 500:
        case 502:
        case 503:
        case 504:
          return new Error('Server error occurred');
        default:
          return new Error(message || 'Document operation failed');
      }
    }

    return new Error(error.message || 'Network error occurred');
  }
}
