import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentUpload from './DocumentUpload';

const serviceMocks = vi.hoisted(() => ({
  getDocumentConfig: vi.fn(),
  uploadDocument: vi.fn(),
  generateQuizFromDocument: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentConfig = serviceMocks.getDocumentConfig;
    uploadDocument = serviceMocks.uploadDocument;
  },
  QuizService: class {
    generateQuizFromDocument = serviceMocks.generateQuizFromDocument;
  },
}));

const uploadedDocument = {
  id: 'document-1',
  originalFilename: 'architecture.txt',
  contentType: 'text/plain',
  fileSize: 18,
  status: 'UPLOADED' as const,
  uploadedAt: '2026-01-01T10:00:00Z',
  processedAt: null,
};

describe('DocumentUpload', () => {
  beforeEach(() => {
    serviceMocks.getDocumentConfig.mockReset();
    serviceMocks.uploadDocument.mockReset();
    serviceMocks.generateQuizFromDocument.mockReset();
    serviceMocks.getDocumentConfig.mockResolvedValue({
      defaultStrategy: 'PAGE_BASED',
      defaultMaxChunkSize: 2400,
    });
  });

  it('rejects unsupported files after the document configuration loads', async () => {
    const { container } = renderWithProviders(<DocumentUpload />, { withAuthProvider: false });
    await waitFor(() => expect(serviceMocks.getDocumentConfig).toHaveBeenCalled());

    fireEvent.change(container.querySelector('input[type="file"]') as HTMLInputElement, {
      target: { files: [new File(['image'], 'diagram.png', { type: 'image/png' })] },
    });

    expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
    expect(serviceMocks.uploadDocument).not.toHaveBeenCalled();
  });

  it('uploads a supported document with the configured chunking defaults', async () => {
    serviceMocks.uploadDocument.mockResolvedValue(uploadedDocument);
    const onUploadSuccess = vi.fn();
    const { container, user } = renderWithProviders(
      <DocumentUpload onUploadSuccess={onUploadSuccess} />,
      { withAuthProvider: false },
    );
    await waitFor(() => expect(serviceMocks.getDocumentConfig).toHaveBeenCalled());

    const file = new File(['Architecture notes'], 'architecture.txt', { type: 'text/plain' });
    await user.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file);
    await user.click(screen.getByRole('button', { name: 'Upload Document' }));

    await waitFor(() => {
      expect(serviceMocks.uploadDocument).toHaveBeenCalledWith({
        file,
        chunkingStrategy: 'PAGE_BASED',
        maxChunkSize: 2400,
      });
    });
    expect(onUploadSuccess).toHaveBeenCalledWith(uploadedDocument);
    expect(screen.getByRole('button', { name: 'Generate Quiz from Document' })).toBeInTheDocument();
  });
});
