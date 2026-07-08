import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  DocumentProcessDto,
  DocumentProcessViewDto,
  ExtractResponseDto,
  StructureBuildResponseDto,
  StructureFlatResponseDto,
  StructureTreeResponseDto,
  TextSliceResponseDto,
} from '@/types';
import { DOCUMENT_PROCESS_ENDPOINTS } from './documentProcess.endpoints';
import { DocumentProcessService } from './documentProcess.service';

const documentId = '11111111-1111-1111-1111-111111111111';
const nodeId = '22222222-2222-2222-2222-222222222222';

const ingestResponse: DocumentProcessDto = {
  id: documentId,
  status: 'NORMALIZED',
};

const documentView: DocumentProcessViewDto = {
  id: documentId,
  originalName: 'architecture.txt',
  mime: 'text/plain',
  source: 'TEXT',
  charCount: 1200,
  language: 'en',
  status: 'NORMALIZED',
  createdAt: '2026-07-08T10:00:00Z',
  updatedAt: '2026-07-08T10:01:00Z',
};

const textSlice: TextSliceResponseDto = {
  documentId,
  start: 0,
  end: 100,
  text: 'Architecture content',
};

const structureNode = {
  id: nodeId,
  title: 'Introduction',
  type: 'CHAPTER' as const,
  depth: 0,
  startOffset: 0,
  endOffset: 100,
  aiConfidence: 0.95,
};

const treeStructure: StructureTreeResponseDto = {
  documentId,
  structure: [structureNode],
};

const flatStructure: StructureFlatResponseDto = {
  documentId,
  nodes: [structureNode],
};

const buildResponse: StructureBuildResponseDto = {
  status: 'STRUCTURED',
  message: 'Structure built successfully',
};

const extractResponse: ExtractResponseDto = {
  documentId,
  nodeId,
  title: 'Introduction',
  start: 0,
  end: 100,
  text: 'Architecture content',
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/document-processing-failed',
      title: 'Document processing failed',
      status,
      detail,
    },
  },
});

describe('document-process endpoint helpers', () => {
  it('matches every deployed document-process OpenAPI path', () => {
    expect(DOCUMENT_PROCESS_ENDPOINTS.INGEST).toBe('/v1/documentProcess/documents');
    expect(DOCUMENT_PROCESS_ENDPOINTS.DOCUMENT_BY_ID(documentId)).toBe(`/v1/documentProcess/documents/${documentId}`);
    expect(DOCUMENT_PROCESS_ENDPOINTS.DOCUMENT_HEAD(documentId)).toBe(`/v1/documentProcess/documents/${documentId}/head`);
    expect(DOCUMENT_PROCESS_ENDPOINTS.TEXT_SLICE(documentId)).toBe(`/v1/documentProcess/documents/${documentId}/text`);
    expect(DOCUMENT_PROCESS_ENDPOINTS.STRUCTURE(documentId)).toBe(`/v1/documentProcess/documents/${documentId}/structure`);
    expect(DOCUMENT_PROCESS_ENDPOINTS.BUILD_STRUCTURE(documentId)).toBe(`/v1/documentProcess/documents/${documentId}/structure`);
    expect(DOCUMENT_PROCESS_ENDPOINTS.EXTRACT_CONTENT(documentId)).toBe(`/v1/documentProcess/documents/${documentId}/extract`);
  });
});

describe('DocumentProcessService', () => {
  let axios: AxiosMock;
  let service: DocumentProcessService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new DocumentProcessService(axios.instance);
  });

  it('ingests text using the deployed JSON request shape', async () => {
    const payload = { text: 'Architecture content', language: 'en' };
    axios.post.mockResolvedValue({ data: ingestResponse });

    await expect(service.ingestText(payload)).resolves.toBe(ingestResponse);

    expect(axios.post).toHaveBeenCalledWith('/v1/documentProcess/documents', payload);
  });

  it('uploads a file with originalName as a query parameter rather than a multipart field', async () => {
    const file = new File(['content'], 'architecture.txt', { type: 'text/plain' });
    axios.post.mockResolvedValue({ data: ingestResponse });

    await expect(service.uploadDocumentFile({
      file,
      originalName: 'source-architecture.txt',
    })).resolves.toBe(ingestResponse);

    const [url, body, requestConfig] = axios.post.mock.calls[0];
    expect(url).toBe('/v1/documentProcess/documents');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);
    expect((body as FormData).get('originalName')).toBeNull();
    expect(requestConfig).toEqual({
      _isFileUpload: true,
      params: { originalName: 'source-architecture.txt' },
    });
  });

  it('uploads text with optional language and originalName query metadata', async () => {
    axios.post.mockResolvedValue({ data: ingestResponse });

    await expect(service.uploadDocumentText({
      text: 'Architecture content',
      language: 'en',
      originalName: 'architecture.txt',
    })).resolves.toBe(ingestResponse);

    expect(axios.post).toHaveBeenCalledWith(
      '/v1/documentProcess/documents',
      { text: 'Architecture content', language: 'en' },
      {
        headers: { 'Content-Type': 'application/json' },
        params: { originalName: 'architecture.txt' },
      },
    );
  });

  it('reads document metadata and lightweight head metadata', async () => {
    axios.get.mockResolvedValue({ data: documentView });

    await expect(service.getDocumentById(documentId)).resolves.toBe(documentView);
    await expect(service.getDocumentHead(documentId)).resolves.toBe(documentView);

    expect(axios.get).toHaveBeenNthCalledWith(1, `/v1/documentProcess/documents/${documentId}`);
    expect(axios.get).toHaveBeenNthCalledWith(2, `/v1/documentProcess/documents/${documentId}/head`);
  });

  it('requests text slices with the deployed default and explicit offsets', async () => {
    axios.get.mockResolvedValue({ data: textSlice });

    await expect(service.getTextSlice(documentId)).resolves.toBe(textSlice);
    await service.getTextSlice(documentId, { start: 25, end: 75 });

    expect(axios.get).toHaveBeenNthCalledWith(1, `/v1/documentProcess/documents/${documentId}/text`, {
      params: { start: 0 },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, `/v1/documentProcess/documents/${documentId}/text`, {
      params: { start: 25, end: 75 },
    });
  });

  it('gets tree and flat structures using the documented format parameter', async () => {
    axios.get
      .mockResolvedValueOnce({ data: treeStructure })
      .mockResolvedValueOnce({ data: flatStructure });

    await expect(service.getDocumentStructure(documentId)).resolves.toBe(treeStructure);
    await expect(service.getDocumentStructure(documentId, 'flat')).resolves.toBe(flatStructure);

    expect(axios.get).toHaveBeenNthCalledWith(1, `/v1/documentProcess/documents/${documentId}/structure`, {
      params: { format: 'tree' },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, `/v1/documentProcess/documents/${documentId}/structure`, {
      params: { format: 'flat' },
    });
  });

  it('builds structure and extracts node content with typed responses', async () => {
    axios.post.mockResolvedValue({ data: buildResponse });
    axios.get.mockResolvedValue({ data: extractResponse });

    await expect(service.buildDocumentStructure(documentId)).resolves.toBe(buildResponse);
    await expect(service.extractContent(documentId, nodeId)).resolves.toBe(extractResponse);

    expect(axios.post).toHaveBeenCalledWith(`/v1/documentProcess/documents/${documentId}/structure`);
    expect(axios.get).toHaveBeenCalledWith(`/v1/documentProcess/documents/${documentId}/extract`, {
      params: { nodeId },
    });
  });

  it('preserves ProblemDetail detail for validation and normalization failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Text must not be blank.'))
      .mockRejectedValueOnce(problemError(422, 'Document normalization failed.'));

    await expect(service.ingestText({ text: '' })).rejects.toThrow(
      'Validation error: Text must not be blank.',
    );
    await expect(service.ingestText({ text: 'content' })).rejects.toThrow(
      'Document normalization failed: Document normalization failed.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions to process this document'],
    [404, 'Document or structure node not found'],
    [413, 'File size exceeds maximum allowed size'],
    [415, 'Unsupported document format: Only text files are supported.'],
    [429, 'Too many document requests. Please try again later.'],
    [500, 'Server error occurred while processing the document'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Only text files are supported.'));

    await expect(service.getDocumentById(documentId)).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.get
      .mockRejectedValueOnce(problemError(404, 'Document does not exist.'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.getDocumentById(documentId)).rejects.toMatchObject({ status: 404 });
    await expect(service.getDocumentById(documentId)).rejects.toThrow('Network unavailable');
  });
});
