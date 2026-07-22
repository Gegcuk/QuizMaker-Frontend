import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { DocumentDto } from '@/types';
import DocumentList from './DocumentList';

const documentServiceMocks = vi.hoisted(() => ({
  deleteDocument: vi.fn(),
  getDocuments: vi.fn(),
  reprocessDocument: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    deleteDocument = documentServiceMocks.deleteDocument;
    getDocuments = documentServiceMocks.getDocuments;
    reprocessDocument = documentServiceMocks.reprocessDocument;
  },
}));

const documents: DocumentDto[] = [
  {
    id: 'failed-document',
    originalFilename: 'failed-import.pdf',
    contentType: 'application/pdf',
    fileSize: 2048,
    status: 'FAILED',
    uploadedAt: '2026-07-17T10:00:00Z',
    processedAt: null,
    totalPages: 2,
    totalChunks: 0,
  },
  {
    id: 'processed-document',
    originalFilename: 'architecture.txt',
    contentType: 'text/plain',
    fileSize: 1024,
    status: 'PROCESSED',
    uploadedAt: '2026-07-17T10:00:00Z',
    processedAt: '2026-07-17T10:01:00Z',
    totalPages: 1,
    totalChunks: 3,
  },
];

const page = {
  content: documents,
  pageable: { pageNumber: 0, pageSize: 1000 },
  totalElements: documents.length,
  totalPages: 1,
  last: true,
  size: 1000,
  number: 0,
  sort: { sorted: false, unsorted: true, empty: true },
  first: true,
  numberOfElements: documents.length,
  empty: false,
};

describe('DocumentList', () => {
  beforeEach(() => {
    documentServiceMocks.deleteDocument.mockReset();
    documentServiceMocks.getDocuments.mockReset();
    documentServiceMocks.reprocessDocument.mockReset();
  });

  it('loads documents, filters by filename, and reprocesses failed documents', async () => {
    documentServiceMocks.getDocuments.mockResolvedValue(page);
    documentServiceMocks.reprocessDocument.mockResolvedValue({ ...documents[0], status: 'PROCESSING' });
    const { user } = renderWithProviders(<DocumentList />, { withAuthProvider: false });

    expect(await screen.findByText('failed-import.pdf')).toBeInTheDocument();
    expect(screen.getByText('architecture.txt')).toBeInTheDocument();
    expect(documentServiceMocks.getDocuments).toHaveBeenCalledWith({ page: 0, size: 1000 });

    await user.type(screen.getByPlaceholderText('Search documents...'), 'failed');
    expect(screen.getByText('failed-import.pdf')).toBeInTheDocument();
    expect(screen.queryByText('architecture.txt')).not.toBeInTheDocument();

    await user.click(screen.getByTitle('Reprocess document'));
    await waitFor(() => {
      expect(documentServiceMocks.reprocessDocument).toHaveBeenCalledWith('failed-document', {
        chunkingStrategy: 'AUTO',
        maxChunkSize: 5000,
        storeChunks: true,
      });
    });
  });

  it('reports a document-list load failure', async () => {
    documentServiceMocks.getDocuments.mockRejectedValue(new Error('Network unavailable.'));

    renderWithProviders(<DocumentList />, { withAuthProvider: false });

    expect(await screen.findByText('Failed to load documents')).toBeInTheDocument();
    expect(screen.getByText('No documents found')).toBeInTheDocument();
  });
});
