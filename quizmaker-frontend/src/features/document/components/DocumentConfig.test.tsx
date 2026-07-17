import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import type { DocumentConfigDto } from '@/types';
import DocumentConfig from './DocumentConfig';

const documentServiceMocks = vi.hoisted(() => ({
  getDocumentConfig: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  DocumentService: class {
    getDocumentConfig = documentServiceMocks.getDocumentConfig;
  },
}));

const config: DocumentConfigDto = {
  defaultStrategy: 'PAGE_BASED',
  defaultMaxChunkSize: 5000,
};

describe('DocumentConfig', () => {
  beforeEach(() => {
    documentServiceMocks.getDocumentConfig.mockReset();
  });

  it('loads configuration and emits edited values only after save', async () => {
    documentServiceMocks.getDocumentConfig.mockResolvedValue(config);
    const onConfigChange = vi.fn();
    const { user } = renderWithProviders(
      <DocumentConfig onConfigChange={onConfigChange} />,
      { withAuthProvider: false },
    );

    expect(await screen.findByRole('heading', { name: 'Document Configuration' })).toBeInTheDocument();
    expect(screen.getByText('PAGE BASED')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit Configuration' }));
    const maxChunkSize = screen.getByLabelText('Default Max Chunk Size (characters)');
    fireEvent.change(maxChunkSize, { target: { value: '2400' } });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onConfigChange).toHaveBeenCalledWith({
      defaultStrategy: 'PAGE_BASED',
      defaultMaxChunkSize: 2400,
    });
    expect(screen.queryByRole('button', { name: 'Save Changes' })).not.toBeInTheDocument();
  });

  it('shows a loading failure instead of editable controls', async () => {
    documentServiceMocks.getDocumentConfig.mockRejectedValue(new Error('Configuration is unavailable.'));

    renderWithProviders(<DocumentConfig />, { withAuthProvider: false });

    expect(await screen.findByText('Configuration is unavailable.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Configuration' })).not.toBeInTheDocument();
  });
});
