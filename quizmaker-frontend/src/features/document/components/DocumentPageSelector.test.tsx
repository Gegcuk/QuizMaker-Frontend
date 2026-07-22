import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { DocumentChunkDto, DocumentDto } from '@/types';
import { DocumentPageSelector } from './DocumentPageSelector';

const documentServiceMocks = vi.hoisted(() => ({
  getDocumentChunks: vi.fn(),
  uploadDocument: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentChunks = documentServiceMocks.getDocumentChunks;
    uploadDocument = documentServiceMocks.uploadDocument;
  },
}));

const document: DocumentDto = {
  id: 'document-1',
  originalFilename: 'notes.txt',
  contentType: 'text/plain',
  fileSize: 1024,
  status: 'PROCESSED',
  uploadedAt: '2026-07-17T10:00:00Z',
  processedAt: '2026-07-17T10:01:00Z',
  totalPages: 2,
  totalChunks: 2,
};

const chunks: DocumentChunkDto[] = [
  {
    id: 'chunk-1',
    chunkIndex: 3,
    title: 'First section',
    content: 'First section content.',
    startPage: 1,
    endPage: 1,
    wordCount: 100,
    characterCount: 700,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'PAGE_BASED',
  },
  {
    id: 'chunk-2',
    chunkIndex: 1,
    title: 'Second section',
    content: 'Second section content.',
    startPage: 2,
    endPage: 2,
    wordCount: 80,
    characterCount: 500,
    createdAt: '2026-07-17T10:00:00Z',
    chunkType: 'PAGE_BASED',
  },
];

describe('DocumentPageSelector', () => {
  beforeEach(() => {
    documentServiceMocks.getDocumentChunks.mockReset();
    documentServiceMocks.uploadDocument.mockReset();
  });

  it('rejects unsupported files before calling the upload service', async () => {
    const { container } = renderWithProviders(<DocumentPageSelector />, { withAuthProvider: false });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File(['image'], 'diagram.png', { type: 'image/png' })] } });

    expect(screen.getAllByText('Please upload a PDF, Word document, or text file')).toHaveLength(2);
    expect(documentServiceMocks.uploadDocument).not.toHaveBeenCalled();
  });

  it('uploads a document, requires a non-empty selection, and returns sorted chunk indexes', async () => {
    documentServiceMocks.uploadDocument.mockResolvedValue(document);
    documentServiceMocks.getDocumentChunks.mockResolvedValue(chunks);
    const onSelectionComplete = vi.fn();
    const { container, user } = renderWithProviders(
      <DocumentPageSelector onSelectionComplete={onSelectionComplete} />,
      { withAuthProvider: false },
    );
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['notes'], 'notes.txt', { type: 'text/plain' });

    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Upload & Preview Pages' }));

    expect(await screen.findByText('First section')).toBeInTheDocument();
    expect(documentServiceMocks.uploadDocument).toHaveBeenCalledWith({
      file,
      chunkingStrategy: 'AUTO',
      maxChunkSize: 50000,
    });

    await user.click(screen.getByRole('button', { name: 'Deselect All' }));
    expect(screen.getByRole('button', { name: 'Continue with 0 Selected' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select All (2)' }));
    await user.click(screen.getByRole('button', { name: 'Continue with 2 Selected' }));

    await waitFor(() => {
      expect(onSelectionComplete).toHaveBeenCalledWith({
        documentId: 'document-1',
        selectedChunkIndices: [1, 3],
        chunks,
      });
    });
  });
});
