import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentProcessor from './DocumentProcessor';

const documentMocks = vi.hoisted(() => ({
  getDocumentStatus: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentStatus = documentMocks.getDocumentStatus;
  },
}));

const processedDocument = {
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

describe('DocumentProcessor', () => {
  beforeEach(() => {
    documentMocks.getDocumentStatus.mockReset();
  });

  it('reports an already processed document as complete without polling', async () => {
    documentMocks.getDocumentStatus.mockResolvedValue(processedDocument);
    const onProcessingComplete = vi.fn();

    renderWithProviders(
      <DocumentProcessor documentId="document-1" onProcessingComplete={onProcessingComplete} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(onProcessingComplete).toHaveBeenCalledWith(processedDocument);
    });
    expect(screen.getByText('Processing completed successfully!')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(documentMocks.getDocumentStatus).toHaveBeenCalledTimes(1);
  });

  it('exposes the backend processing error to the caller and the user', async () => {
    documentMocks.getDocumentStatus.mockResolvedValue({
      ...processedDocument,
      status: 'FAILED',
      processingError: 'Text extraction failed.',
    });
    const onProcessingError = vi.fn();

    renderWithProviders(
      <DocumentProcessor documentId="document-1" onProcessingError={onProcessingError} />,
      { withAuthProvider: false },
    );

    expect(await screen.findByText('Text extraction failed.')).toBeInTheDocument();
    expect(onProcessingError).toHaveBeenCalledWith('Text extraction failed.');
  });
});
