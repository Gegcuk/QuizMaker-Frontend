import { isAxiosError, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { DOCUMENT_PROCESS_ENDPOINTS } from './documentProcess.endpoints';
import { 
  DocumentProcessDto,
  DocumentProcessViewDto,
  IngestRequestDto,
  IngestResponseDto,
  TextSliceResponseDto,
  StructureTreeResponseDto,
  StructureFlatResponseDto,
  StructureBuildResponseDto,
  ExtractResponseDto,
  StructureFormat
} from '@/types';
import { getErrorMessage } from '@/utils/errorUtils';

type DocumentProcessServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

type FileUploadConfig = AxiosRequestConfig & {
  _isFileUpload: true;
};

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
   * Ingest text content
   * POST /v1/documentProcess/documents (application/json)
   */
  async ingestText(data: IngestRequestDto): Promise<IngestResponseDto> {
    try {
      const response = await this.axiosInstance.post<IngestResponseDto>(
        DOCUMENT_PROCESS_ENDPOINTS.INGEST,
        data
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
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

      const config: FileUploadConfig = {
        _isFileUpload: true,
        params: data.originalName ? { originalName: data.originalName } : undefined,
      };

      const response = await this.axiosInstance.post<DocumentProcessDto>(
        DOCUMENT_PROCESS_ENDPOINTS.INGEST,
        formData,
        config
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
    language?: string;
    originalName?: string;
  }): Promise<DocumentProcessDto> {
    try {
      const requestData: IngestRequestDto = {
        text: data.text,
        ...(data.language ? { language: data.language } : {}),
      };

      const params = data.originalName ? { originalName: data.originalName } : undefined;

      const response = await this.axiosInstance.post<DocumentProcessDto>(
        DOCUMENT_PROCESS_ENDPOINTS.INGEST,
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
  } = {}): Promise<TextSliceResponseDto> {
    try {
      const response = await this.axiosInstance.get<TextSliceResponseDto>(
        DOCUMENT_PROCESS_ENDPOINTS.TEXT_SLICE(id),
        {
          params: {
            start: params.start ?? 0,
            ...(typeof params.end === 'number' ? { end: params.end } : {}),
          },
        }
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
  async buildDocumentStructure(id: string): Promise<StructureBuildResponseDto> {
    try {
      const response = await this.axiosInstance.post<StructureBuildResponseDto>(
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
  private handleError(error: unknown): DocumentProcessServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const documentError: DocumentProcessServiceError = new Error(message);
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
          documentError.message = 'Insufficient permissions to process this document';
          break;
        case 404:
          documentError.message = 'Document or structure node not found';
          break;
        case 413:
          documentError.message = 'File size exceeds maximum allowed size';
          break;
        case 415:
          documentError.message = `Unsupported document format: ${message}`;
          break;
        case 422:
          documentError.message = `Document normalization failed: ${message}`;
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
          documentError.message = message || 'Document process operation failed';
      }

      return documentError;
    }

    return new Error(error instanceof Error ? error.message : 'Document process operation failed');
  }
}
