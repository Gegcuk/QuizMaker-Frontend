import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentViewer from './DocumentViewer';

const documentMocks = vi.hoisted(() => ({
  getDocumentById: vi.fn(),
  getDocumentChunks: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentById = documentMocks.getDocumentById;
    getDocumentChunks = documentMocks.getDocumentChunks;
  },
}));

const document = {
  id: 'document-1',
  originalFilename: 'architecture.pdf',
  contentType: 'application/pdf',
  fileSize: 2048,
  status: 'PROCESSED' as const,
  uploadedAt: '2026-01-01T10:00:00Z',
  processedAt: '2026-01-01T10:01:00Z',
};

const chunks = [
  {
    id: 'chunk-1',
    chunkIndex: 0,
    title: 'Introduction',
    content: 'Initial architecture overview.',
    startPage: 1,
    endPage: 1,
    wordCount: 3,
    characterCount: 30,
    createdAt: '2026-01-01T10:01:00Z',
    chunkType: 'SECTION' as const,
  },
  {
    id: 'chunk-2',
    chunkIndex: 1,
    title: 'Architecture principles',
    content: 'Architecture decisions should be explicit.',
    startPage: 2,
    endPage: 2,
    wordCount: 5,
    characterCount: 42,
    createdAt: '2026-01-01T10:01:00Z',
    chunkType: 'SECTION' as const,
  },
];

describe('DocumentViewer', () => {
  beforeEach(() => {
    documentMocks.getDocumentById.mockReset();
    documentMocks.getDocumentChunks.mockReset();
    documentMocks.getDocumentById.mockResolvedValue(document);
    documentMocks.getDocumentChunks.mockResolvedValue(chunks);
  });

  it('searches chunk content and opens the first matching chunk', async () => {
    const { user } = renderWithProviders(<DocumentViewer documentId="document-1" />, {
      withAuthProvider: false,
    });

    expect(await screen.findByRole('heading', { name: 'Introduction' })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Search document content...'), 'principles');

    expect(await screen.findByText('1 results')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Architecture principles' })).toBeInTheDocument();
    expect(screen.getByText('Architecture decisions should be explicit.')).toBeInTheDocument();
  });

  it('shows the service failure instead of an empty document state', async () => {
    documentMocks.getDocumentById.mockRejectedValue(new Error('Document unavailable.'));

    renderWithProviders(<DocumentViewer documentId="document-1" />, { withAuthProvider: false });

    expect(await screen.findByText('Document unavailable.')).toBeInTheDocument();
  });
});
