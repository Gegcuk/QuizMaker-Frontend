import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentProcessUpload from './DocumentProcessUpload';

const documentProcessMocks = vi.hoisted(() => ({
  uploadDocumentFile: vi.fn(),
  uploadDocumentText: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentProcessService: class {
    uploadDocumentFile = documentProcessMocks.uploadDocumentFile;
    uploadDocumentText = documentProcessMocks.uploadDocumentText;
  },
}));

describe('DocumentProcessUpload', () => {
  beforeEach(() => {
    documentProcessMocks.uploadDocumentFile.mockReset();
    documentProcessMocks.uploadDocumentText.mockReset();
  });

  it('rejects unsupported file uploads before sending them to the service', async () => {
    const { container } = renderWithProviders(<DocumentProcessUpload />, { withAuthProvider: false });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [new File(['image'], 'diagram.png', { type: 'image/png' })] } });

    expect(screen.getByText('Unsupported file type. Please upload PDF, DOCX, or TXT files only.')).toBeInTheDocument();
    expect(documentProcessMocks.uploadDocumentFile).not.toHaveBeenCalled();
  });

  it('uploads text input and reports a normalized document view to the caller', async () => {
    documentProcessMocks.uploadDocumentText.mockResolvedValue({ id: 'document-1', status: 'PENDING' });
    const onUploadSuccess = vi.fn();
    const { user } = renderWithProviders(
      <DocumentProcessUpload onUploadSuccess={onUploadSuccess} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.type(screen.getByLabelText('Document Content'), 'Architecture notes');
    await user.click(screen.getByRole('button', { name: 'Upload Document' }));

    await waitFor(() => {
      expect(documentProcessMocks.uploadDocumentText).toHaveBeenCalledWith({
        text: 'Architecture notes',
        language: 'en',
        originalName: 'text-input',
      });
    });
    expect(onUploadSuccess).toHaveBeenCalledWith({
      id: 'document-1',
      originalName: 'text-input',
      source: 'TEXT',
      charCount: 18,
      language: 'en',
      status: 'PENDING',
    });
    expect(screen.getByText('Document uploaded successfully!')).toBeInTheDocument();
  });

  it('surfaces text-upload failures through the provided error callback', async () => {
    documentProcessMocks.uploadDocumentText.mockRejectedValue(new Error('Text ingestion failed.'));
    const onUploadError = vi.fn();
    const { user } = renderWithProviders(
      <DocumentProcessUpload onUploadError={onUploadError} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.type(screen.getByLabelText('Document Content'), 'Architecture notes');
    await user.click(screen.getByRole('button', { name: 'Upload Document' }));

    expect(await screen.findByText('Text ingestion failed.')).toBeInTheDocument();
    expect(onUploadError).toHaveBeenCalledWith('Text ingestion failed.');
  });
});
