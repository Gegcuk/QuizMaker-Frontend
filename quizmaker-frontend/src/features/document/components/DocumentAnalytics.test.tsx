import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { DocumentChunkDto, DocumentDto } from '@/types';
import DocumentAnalytics from './DocumentAnalytics';

const documentServiceMocks = vi.hoisted(() => ({
  getDocumentById: vi.fn(),
  getDocumentChunks: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentById = documentServiceMocks.getDocumentById;
    getDocumentChunks = documentServiceMocks.getDocumentChunks;
  },
}));

const document: DocumentDto = {
  id: 'document-1',
  originalFilename: 'architecture.pdf',
  contentType: 'application/pdf',
  fileSize: 4096,
  status: 'PROCESSED',
  uploadedAt: '2026-07-17T10:00:00Z',
  processedAt: '2026-07-17T10:01:00Z',
  totalPages: 3,
  totalChunks: 2,
};

const chunks: DocumentChunkDto[] = [
  {
    id: 'chapter-1',
    chunkIndex: 0,
    title: 'Overview',
    content: 'Overview content.',
    startPage: 1,
    endPage: 1,
    wordCount: 80,
    characterCount: 400,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'CHAPTER',
  },
  {
    id: 'section-1',
    chunkIndex: 1,
    title: 'Details',
    content: 'Detailed content.',
    startPage: 2,
    endPage: 3,
    wordCount: 220,
    characterCount: 1200,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'SECTION',
  },
];

describe('DocumentAnalytics', () => {
  beforeEach(() => {
    documentServiceMocks.getDocumentById.mockReset();
    documentServiceMocks.getDocumentChunks.mockReset();
  });

  it('shows calculated document and chunk metrics from loaded data', async () => {
    documentServiceMocks.getDocumentById.mockResolvedValue(document);
    documentServiceMocks.getDocumentChunks.mockResolvedValue(chunks);

    renderWithProviders(<DocumentAnalytics documentId="document-1" />, { withAuthProvider: false });

    expect(await screen.findByRole('heading', { name: 'Document Analytics' })).toBeInTheDocument();
    expect(screen.getByText('Total Chunks')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('1,600')).toBeInTheDocument();
    expect(screen.getByText('CHAPTER')).toBeInTheDocument();
    expect(screen.getByText('SECTION')).toBeInTheDocument();
    expect(documentServiceMocks.getDocumentById).toHaveBeenCalledWith('document-1');
    expect(documentServiceMocks.getDocumentChunks).toHaveBeenCalledWith('document-1');
  });

  it('distinguishes empty analytics data from loading failures', async () => {
    documentServiceMocks.getDocumentById.mockResolvedValue(document);
    documentServiceMocks.getDocumentChunks.mockResolvedValue([]);

    const { rerender } = renderWithProviders(<DocumentAnalytics documentId="document-1" />, { withAuthProvider: false });

    expect(await screen.findByText('No document data available for analytics')).toBeInTheDocument();

    documentServiceMocks.getDocumentById.mockRejectedValue(new Error('Analytics are unavailable.'));
    rerender(<DocumentAnalytics documentId="document-2" />);

    expect(await screen.findByText('Analytics are unavailable.')).toBeInTheDocument();
  });
});
