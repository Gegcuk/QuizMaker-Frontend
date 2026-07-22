import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { DocumentChunkDto } from '@/types';
import { DocumentPageSelectorModal } from './DocumentPageSelectorModal';

const documentServiceMocks = vi.hoisted(() => ({
  getDocumentChunks: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentChunks = documentServiceMocks.getDocumentChunks;
  },
}));

const chunks: DocumentChunkDto[] = [
  {
    id: 'page-1',
    chunkIndex: 4,
    title: 'First page',
    content: 'First page content.',
    startPage: 5,
    endPage: 5,
    wordCount: 125,
    characterCount: 800,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'PAGE_BASED',
  },
  {
    id: 'page-2',
    chunkIndex: 1,
    title: 'Second page',
    content: 'Second page content.',
    startPage: 2,
    endPage: 2,
    wordCount: 90,
    characterCount: 600,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'PAGE_BASED',
  },
];

describe('DocumentPageSelectorModal', () => {
  beforeEach(() => {
    documentServiceMocks.getDocumentChunks.mockReset();
  });

  it('selects loaded pages by default, supports clearing them, and returns sorted indexes', async () => {
    documentServiceMocks.getDocumentChunks.mockResolvedValue(chunks);
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <DocumentPageSelectorModal
        documentId="document-1"
        isOpen
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
      { withAuthProvider: false },
    );

    expect(await screen.findAllByText('First page')).toHaveLength(2);
    expect(screen.getAllByText('Second page')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Confirm Selection (2)' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Deselect All' }));
    expect(screen.getByRole('button', { name: 'Confirm Selection (0)' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select All' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Selection (2)' }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        documentId: 'document-1',
        selectedChunkIndices: [1, 4],
        chunks,
      });
    });
  });

  it('does not fetch pages while closed and reports loading failures when opened', async () => {
    const { rerender } = renderWithProviders(
      <DocumentPageSelectorModal
        documentId="document-1"
        isOpen={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.queryByText('Select Pages')).not.toBeInTheDocument();
    expect(documentServiceMocks.getDocumentChunks).not.toHaveBeenCalled();

    documentServiceMocks.getDocumentChunks.mockRejectedValue(new Error('Unable to load pages.'));
    rerender(
      <DocumentPageSelectorModal
        documentId="document-1"
        isOpen
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(await screen.findByText('Unable to load pages.')).toBeInTheDocument();
  });
});
