import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { DocumentProcessViewDto } from '@/types';
import DocumentProcessList from './DocumentProcessList';

const documentProcessMocks = vi.hoisted(() => ({
  buildDocumentStructure: vi.fn(),
  getDocumentById: vi.fn(),
  getDocumentStructure: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentProcessService: class {
    buildDocumentStructure = documentProcessMocks.buildDocumentStructure;
    getDocumentById = documentProcessMocks.getDocumentById;
    getDocumentStructure = documentProcessMocks.getDocumentStructure;
  },
}));

const pendingDocument: DocumentProcessViewDto = {
  id: 'document-1',
  originalName: 'lecture-notes.txt',
  source: 'UPLOAD',
  charCount: 2048,
  language: 'en',
  status: 'PENDING',
};

describe('DocumentProcessList', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    documentProcessMocks.buildDocumentStructure.mockReset();
    documentProcessMocks.getDocumentById.mockReset();
    documentProcessMocks.getDocumentStructure.mockReset();
  });

  it('renders loading, error, and empty states without calling process actions', () => {
    const { rerender } = renderWithProviders(
      <DocumentProcessList documents={[]} isLoading />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Loading documents...')).toBeInTheDocument();

    rerender(<DocumentProcessList documents={[]} error="Process API unavailable." />);
    expect(screen.getByText('Process API unavailable.')).toBeInTheDocument();

    rerender(<DocumentProcessList documents={[]} />);
    expect(screen.getByText('No documents yet')).toBeInTheDocument();
  });

  it('builds a pending document structure and reports the refreshed document', async () => {
    const updatedDocument = { ...pendingDocument, status: 'STRUCTURED' as const };
    documentProcessMocks.buildDocumentStructure.mockResolvedValue({ status: 'STRUCTURED', message: 'Built.' });
    documentProcessMocks.getDocumentById.mockResolvedValue(updatedDocument);
    documentProcessMocks.getDocumentStructure.mockResolvedValue({ structure: [] });
    const onDocumentUpdated = vi.fn();
    const { user } = renderWithProviders(
      <DocumentProcessList documents={[pendingDocument]} onDocumentUpdated={onDocumentUpdated} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('lecture-notes.txt')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Build Structure' }));

    await waitFor(() => {
      expect(documentProcessMocks.buildDocumentStructure).toHaveBeenCalledWith('document-1');
      expect(onDocumentUpdated).toHaveBeenCalledWith(updatedDocument);
      expect(documentProcessMocks.getDocumentStructure).toHaveBeenCalledWith('document-1', 'tree');
    });
  });
});
