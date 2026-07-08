import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  DocumentChunkDto,
  DocumentConfigDto,
  DocumentDto,
  ProcessDocumentRequest,
} from '@/types';
import type { Page } from '../types/document.types';
import { DOCUMENT_ENDPOINTS } from './document.endpoints';
import { DocumentService } from './document.service';

const documentId = '11111111-1111-1111-1111-111111111111';

const chunk: DocumentChunkDto = {
  id: '22222222-2222-2222-2222-222222222222',
  chunkIndex: 0,
  title: 'Introduction',
  content: 'Document content',
  startPage: 1,
  endPage: 2,
  wordCount: 25,
  characterCount: 180,
  createdAt: '2026-07-08T10:00:00Z',
  chunkType: 'PAGE_BASED',
};

const documentDto: DocumentDto = {
  id: documentId,
  originalFilename: 'architecture.pdf',
  contentType: 'application/pdf',
  fileSize: 4096,
  status: 'PROCESSED',
  uploadedAt: '2026-07-08T10:00:00Z',
  processedAt: '2026-07-08T10:01:00Z',
  totalPages: 2,
  totalChunks: 1,
  chunks: [chunk],
};

const documentPage: Page<DocumentDto> = {
  content: [documentDto],
  pageable: { pageNumber: 0, pageSize: 10 },
  totalElements: 1,
  totalPages: 1,
  last: true,
  size: 10,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  first: true,
  numberOfElements: 1,
  empty: false,
};

const config: DocumentConfigDto = {
  defaultMaxChunkSize: 50000,
  defaultStrategy: 'CHAPTER_BASED',
};

const reprocessRequest: ProcessDocumentRequest = {
  chunkingStrategy: 'SIZE_BASED',
  maxChunkSize: 12000,
  minChunkSize: 500,
  aggressiveCombinationThreshold: 2500,
  storeChunks: true,
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/document-processing-failed',
      title: 'Document request failed',
      status,
      detail,
    },
  },
});

describe('document endpoint helpers', () => {
  it('matches every deployed legacy document OpenAPI path', () => {
    expect(DOCUMENT_ENDPOINTS.UPLOAD).toBe('/documents/upload');
    expect(DOCUMENT_ENDPOINTS.CONFIG).toBe('/documents/config');
    expect(DOCUMENT_ENDPOINTS.DOCUMENTS).toBe('/documents');
    expect(DOCUMENT_ENDPOINTS.DOCUMENT_BY_ID(documentId)).toBe(`/documents/${documentId}`);
    expect(DOCUMENT_ENDPOINTS.CHUNKS(documentId)).toBe(`/documents/${documentId}/chunks`);
    expect(DOCUMENT_ENDPOINTS.CHUNK_BY_INDEX(documentId, 3)).toBe(`/documents/${documentId}/chunks/3`);
    expect(DOCUMENT_ENDPOINTS.STATUS(documentId)).toBe(`/documents/${documentId}/status`);
    expect(DOCUMENT_ENDPOINTS.REPROCESS(documentId)).toBe(`/documents/${documentId}/reprocess`);
  });
});

describe('DocumentService', () => {
  let axios: AxiosMock;
  let service: DocumentService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new DocumentService(axios.instance);
  });

  it('uploads a file with deployed query parameters and multipart configuration', async () => {
    const file = new File(['pdf'], 'architecture.pdf', { type: 'application/pdf' });
    axios.post.mockResolvedValue({ data: documentDto });

    await expect(service.uploadDocument({
      file,
      chunkingStrategy: 'PAGE_BASED',
      maxChunkSize: 24000,
    })).resolves.toBe(documentDto);

    const [url, body, requestConfig] = axios.post.mock.calls[0];
    expect(url).toBe('/documents/upload');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect(requestConfig).toEqual({
      _isFileUpload: true,
      params: { chunkingStrategy: 'PAGE_BASED', maxChunkSize: 24000 },
    });
  });

  it('omits optional upload query parameters when defaults are requested', async () => {
    const file = new File(['text'], 'notes.txt', { type: 'text/plain' });
    axios.post.mockResolvedValue({ data: documentDto });

    await service.uploadDocument({ file });

    expect(axios.post.mock.calls[0][2]).toEqual({
      _isFileUpload: true,
      params: undefined,
    });
  });

  it('lists documents with deployed pagination defaults and caller values', async () => {
    axios.get.mockResolvedValue({ data: documentPage });

    await expect(service.getDocuments()).resolves.toBe(documentPage);
    await service.getDocuments({ page: 3, size: 25 });

    expect(axios.get).toHaveBeenNthCalledWith(1, '/documents', {
      params: { page: 0, size: 10 },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/documents', {
      params: { page: 3, size: 25 },
    });
  });

  it('covers read, chunk, status, configuration, reprocess, and delete operations', async () => {
    axios.get
      .mockResolvedValueOnce({ data: documentDto })
      .mockResolvedValueOnce({ data: [chunk] })
      .mockResolvedValueOnce({ data: chunk })
      .mockResolvedValueOnce({ data: documentDto })
      .mockResolvedValueOnce({ data: config });
    axios.post.mockResolvedValue({ data: documentDto });
    axios.delete.mockResolvedValue({});

    await expect(service.getDocumentById(documentId)).resolves.toBe(documentDto);
    await expect(service.getDocumentChunks(documentId)).resolves.toEqual([chunk]);
    await expect(service.getChunkByIndex(documentId, 0)).resolves.toBe(chunk);
    await expect(service.getDocumentStatus(documentId)).resolves.toBe(documentDto);
    await expect(service.getDocumentConfig()).resolves.toBe(config);
    await expect(service.reprocessDocument(documentId, reprocessRequest)).resolves.toBe(documentDto);
    await expect(service.deleteDocument(documentId)).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenNthCalledWith(1, `/documents/${documentId}`);
    expect(axios.get).toHaveBeenNthCalledWith(2, `/documents/${documentId}/chunks`);
    expect(axios.get).toHaveBeenNthCalledWith(3, `/documents/${documentId}/chunks/0`);
    expect(axios.get).toHaveBeenNthCalledWith(4, `/documents/${documentId}/status`);
    expect(axios.get).toHaveBeenNthCalledWith(5, '/documents/config');
    expect(axios.post).toHaveBeenCalledWith(`/documents/${documentId}/reprocess`, reprocessRequest);
    expect(axios.delete).toHaveBeenCalledWith(`/documents/${documentId}`);
  });

  it('preserves ProblemDetail detail for validation and processing failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Chunk size must be positive.'))
      .mockRejectedValueOnce(problemError(422, 'PDF text extraction failed.'));

    await expect(service.reprocessDocument(documentId, reprocessRequest)).rejects.toThrow(
      'Validation error: Chunk size must be positive.',
    );
    await expect(service.reprocessDocument(documentId, reprocessRequest)).rejects.toThrow(
      'Document processing failed: PDF text extraction failed.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions - only the document uploader may access this document'],
    [404, 'Document not found'],
    [413, 'File size exceeds maximum allowed size'],
    [415, 'Unsupported document format: Unsupported MIME type.'],
    [429, 'Too many document requests. Please try again later.'],
    [500, 'Server error occurred while processing the document'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Unsupported MIME type.'));

    await expect(service.getDocumentById(documentId)).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.delete
      .mockRejectedValueOnce(problemError(403, 'Owner access required.'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.deleteDocument(documentId)).rejects.toMatchObject({ status: 403 });
    await expect(service.deleteDocument(documentId)).rejects.toThrow('Network unavailable');
  });
});
