import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentReprocess from './DocumentReprocess';

const documentMocks = vi.hoisted(() => ({
  getDocumentById: vi.fn(),
  getDocumentConfig: vi.fn(),
  reprocessDocument: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentById = documentMocks.getDocumentById;
    getDocumentConfig = documentMocks.getDocumentConfig;
    reprocessDocument = documentMocks.reprocessDocument;
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
  totalPages: 4,
  totalChunks: 3,
};

describe('DocumentReprocess', () => {
  beforeEach(() => {
    documentMocks.getDocumentById.mockReset();
    documentMocks.getDocumentConfig.mockReset();
    documentMocks.reprocessDocument.mockReset();
    documentMocks.getDocumentById.mockResolvedValue(document);
    documentMocks.getDocumentConfig.mockResolvedValue({
      defaultStrategy: 'PAGE_BASED',
      defaultMaxChunkSize: 2400,
    });
  });

  it('reprocesses with loaded defaults and user-adjusted advanced settings', async () => {
    documentMocks.reprocessDocument.mockResolvedValue({ ...document, status: 'PROCESSING' });
    const onReprocessSuccess = vi.fn();
    const { user } = renderWithProviders(
      <DocumentReprocess documentId="document-1" onReprocessSuccess={onReprocessSuccess} />,
      { withAuthProvider: false },
    );

    expect(await screen.findByRole('heading', { name: 'Reprocess Document' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show Advanced Options' }));
    fireEvent.change(screen.getByLabelText('Maximum Chunk Size (characters)'), {
      target: { value: '3200' },
    });
    await user.click(screen.getByRole('button', { name: 'Reprocess Document' }));

    await waitFor(() => {
      expect(documentMocks.reprocessDocument).toHaveBeenCalledWith('document-1', {
        chunkingStrategy: 'PAGE_BASED',
        maxChunkSize: 3200,
        storeChunks: true,
      });
    });
    expect(onReprocessSuccess).toHaveBeenCalledWith(expect.objectContaining({ status: 'PROCESSING' }));
  });

  it('shows and reports reprocessing failures', async () => {
    documentMocks.reprocessDocument.mockRejectedValue(new Error('Reprocessing failed.'));
    const onReprocessError = vi.fn();
    const { user } = renderWithProviders(
      <DocumentReprocess documentId="document-1" onReprocessError={onReprocessError} />,
      { withAuthProvider: false },
    );

    await screen.findByRole('heading', { name: 'Reprocess Document' });
    await user.click(screen.getByRole('button', { name: 'Reprocess Document' }));

    expect(await screen.findByText('Reprocessing failed.')).toBeInTheDocument();
    expect(onReprocessError).toHaveBeenCalledWith('Reprocessing failed.');
  });
});
