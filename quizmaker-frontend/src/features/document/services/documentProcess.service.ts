import type { AxiosInstance } from 'axios';
import { DOCUMENT_PROCESS_ENDPOINTS } from './documentProcess.endpoints';
import { 
  DocumentProcessDto,
  DocumentProcessViewDto,
  IngestRequestDto,
  TextSliceResponseDto,
  StructureTreeResponseDto,
  StructureFlatResponseDto,
  ExtractResponseDto,
  StructureFormat
} from '@/types';
import { BaseService } from '@/services';

/**
 * Document Process service for handling document processing operations
 * Implements all endpoints from the DocumentProcess API documentation
 */
export class DocumentProcessService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Upload document (File)
   * POST /v1/documentProcess/documents (multipart/form-data)
   */
  async uploadDocumentFile(data: {
    file: File;
    originalName?: string;
  }): Promise<DocumentProcessDto> {
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      
      if (data.originalName) {
        formData.append('originalName', data.originalName);
      }

      const response = await this.axiosInstance.post<DocumentProcessDto>(
        '/v1/documentProcess/documents', 
        formData, 
        {
          _isFileUpload: true,  // Flag for request interceptor to handle Content-Type
        } as any
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload document (JSON Text)
   * POST /v1/documentProcess/documents (application/json)
   */
  async uploadDocumentText(data: {
    text: string;
    language: string;
    originalName?: string;
  }): Promise<DocumentProcessDto> {
    try {
      const requestData: IngestRequestDto = {
        text: data.text,
        language: data.language
      };

      const params = data.originalName ? { originalName: data.originalName } : undefined;

      const response = await this.axiosInstance.post<DocumentProcessDto>(
        '/v1/documentProcess/documents', 
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get document metadata by ID
   * GET /v1/documentProcess/documents/{id}
   */
  async getDocumentById(id: string): Promise<DocumentProcessViewDto> {
    try {
      const response = await this.axiosInstance.get<DocumentProcessViewDto>(
        DOCUMENT_PROCESS_ENDPOINTS.DOCUMENT_BY_ID(id)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get document head (lightweight info)
   * GET /v1/documentProcess/documents/{id}/head
   */
  async getDocumentHead(id: string): Promise<DocumentProcessViewDto> {
    try {
      const response = await this.axiosInstance.get<DocumentProcessViewDto>(
        DOCUMENT_PROCESS_ENDPOINTS.DOCUMENT_HEAD(id)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get text slice from document
   * GET /v1/documentProcess/documents/{id}/text
   */
  async getTextSlice(id: string, params: {
    start?: number;
    end?: number;
  }): Promise<TextSliceResponseDto> {
    try {
      const response = await this.axiosInstance.get<TextSliceResponseDto>(
        DOCUMENT_PROCESS_ENDPOINTS.TEXT_SLICE(id),
        { params }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get document structure
   * GET /v1/documentProcess/documents/{id}/structure
   */
  async getDocumentStructure(id: string, format: StructureFormat = 'tree'): Promise<StructureTreeResponseDto | StructureFlatResponseDto> {
    try {
      const response = await this.axiosInstance.get(
        DOCUMENT_PROCESS_ENDPOINTS.STRUCTURE(id),
        { 
          params: { format } 
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Build document structure (trigger AI processing)
   * POST /v1/documentProcess/documents/{id}/structure
   */
  async buildDocumentStructure(id: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post(
        DOCUMENT_PROCESS_ENDPOINTS.BUILD_STRUCTURE(id)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Extract content by node
   * GET /v1/documentProcess/documents/{id}/extract
   */
  async extractContent(id: string, nodeId: string): Promise<ExtractResponseDto> {
    try {
      const response = await this.axiosInstance.get<ExtractResponseDto>(
        DOCUMENT_PROCESS_ENDPOINTS.EXTRACT_CONTENT(id),
        { 
          params: { nodeId } 
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle document process specific errors
   */
  private handleError(error: any): Error {
    if (error.response?.data) {
      const { message, errorCode } = error.response.data;
      return new Error(`${errorCode || 'DOCUMENT_PROCESS_ERROR'}: ${message || 'Unknown error'}`);
    }
    return new Error(error.message || 'Document process operation failed');
  }
}
