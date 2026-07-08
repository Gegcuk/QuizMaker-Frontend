import { isAxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { DOCUMENT_ENDPOINTS } from './document.endpoints';
import { 
  DocumentDto,
  DocumentChunkDto,
  ProcessDocumentRequest,
  DocumentConfigDto,
} from '@/types';
import type { Page } from '../types/document.types';
import { getErrorMessage } from '@/utils/errorUtils';

type DocumentServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

type FileUploadConfig = AxiosRequestConfig & {
  _isFileUpload: true;
};

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
      const params: Record<string, string | number> = {};
      if (data.chunkingStrategy) {
        params.chunkingStrategy = data.chunkingStrategy;
      }
      if (typeof data.maxChunkSize === 'number') {
        params.maxChunkSize = data.maxChunkSize;
      }

      const config: FileUploadConfig = {
        _isFileUpload: true,
        params: Object.keys(params).length ? params : undefined,
      };
      const response = await this.axiosInstance.post<DocumentDto>(DOCUMENT_ENDPOINTS.UPLOAD, formData, config);
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
  async getDocuments(params: {
    page?: number;
    size?: number;
  } = {}): Promise<Page<DocumentDto>> {
    try {
      const response = await this.axiosInstance.get<Page<DocumentDto>>(DOCUMENT_ENDPOINTS.DOCUMENTS, {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 10,
        }
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
  private handleDocumentError(error: unknown): DocumentServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const documentError: DocumentServiceError = new Error(message);
      documentError.status = status;
      documentError.response = error.response;

      switch (status) {
        case 400:
          documentError.message = `Validation error: ${message}`;
          break;
        case 401:
          documentError.message = 'Authentication required';
          break;
        case 403:
          documentError.message = 'Insufficient permissions - only the document uploader may access this document';
          break;
        case 404:
          documentError.message = 'Document not found';
          break;
        case 413:
          documentError.message = 'File size exceeds maximum allowed size';
          break;
        case 415:
          documentError.message = `Unsupported document format: ${message}`;
          break;
        case 422:
          documentError.message = `Document processing failed: ${message}`;
          break;
        case 429:
          documentError.message = 'Too many document requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          documentError.message = 'Server error occurred while processing the document';
          break;
        default:
          documentError.message = message || 'Document operation failed';
      }

      return documentError;
    }

    return new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}
