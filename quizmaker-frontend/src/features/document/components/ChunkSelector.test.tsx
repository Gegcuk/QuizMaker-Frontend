import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { DocumentChunkDto } from '@/types';
import ChunkSelector from './ChunkSelector';

const documentServiceMocks = vi.hoisted(() => ({
  getDocumentChunks: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentChunks = documentServiceMocks.getDocumentChunks;
  },
  tokenEstimationService: { estimateFromChunks: vi.fn() },
}));

vi.mock('@/features/ai', () => ({
  TokenEstimationDisplay: () => null,
}));

const chunks: DocumentChunkDto[] = [
  {
    id: 'chapter-1',
    chunkIndex: 0,
    title: 'Architecture overview',
    content: 'An overview of the architecture.',
    startPage: 1,
    endPage: 2,
    wordCount: 140,
    characterCount: 900,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'CHAPTER',
  },
  {
    id: 'section-1',
    chunkIndex: 1,
    title: 'Design decisions',
    content: 'The key design decisions.',
    startPage: 3,
    endPage: 3,
    wordCount: 80,
    characterCount: 500,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'SECTION',
  },
];

describe('ChunkSelector', () => {
  beforeEach(() => {
    documentServiceMocks.getDocumentChunks.mockReset();
  });

  it('loads chunks, updates selected IDs through bulk actions, and filters the list', async () => {
    documentServiceMocks.getDocumentChunks.mockResolvedValue(chunks);
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <ChunkSelector
        documentId="document-1"
        initialSelection={['section-1']}
        onSelectionChange={onSelectionChange}
      />,
      { withAuthProvider: false },
    );

    expect(await screen.findByText('Architecture overview')).toBeInTheDocument();
    expect(screen.getByText('Design decisions')).toBeInTheDocument();
    expect(documentServiceMocks.getDocumentChunks).toHaveBeenCalledWith('document-1');

    await user.click(screen.getByRole('button', { name: 'Deselect All' }));
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });

    await user.click(screen.getByRole('button', { name: 'Select Chapters' }));
    await waitFor(() => {
      expect(onSelectionChange).toHaveBeenLastCalledWith(['chapter-1']);
    });

    await user.type(screen.getByPlaceholderText('Search chunks by title or content...'), 'missing');

    expect(screen.getByText('No chunks match your current filter')).toBeInTheDocument();
  });

  it('shows the document-service error instead of an empty selector', async () => {
    documentServiceMocks.getDocumentChunks.mockRejectedValue(new Error('Chunks are unavailable.'));

    renderWithProviders(<ChunkSelector documentId="document-1" />, { withAuthProvider: false });

    expect(await screen.findByText('Chunks are unavailable.')).toBeInTheDocument();
    expect(screen.queryByText('No chunks match your current filter')).not.toBeInTheDocument();
  });
});
