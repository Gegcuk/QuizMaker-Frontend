import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { FastDocumentPreviewModal } from './FastDocumentPreviewModal';

const createTextFile = () => {
  const file = new File(['Architecture decisions are explicit.'], 'notes.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'text', {
    value: vi.fn().mockResolvedValue('Architecture decisions are explicit.'),
  });
  return file;
};

describe('FastDocumentPreviewModal', () => {
  it('selects all text sections and returns their ordered content on confirmation', async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <FastDocumentPreviewModal file={createTextFile()} onCancel={vi.fn()} onConfirm={onConfirm} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirm Selection (0)' })).toBeDisabled();
    });
    await user.click(screen.getByRole('button', { name: 'All' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Selection (1)' }));

    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      selectedPageNumbers: [1],
      selectedContent: 'Architecture decisions are explicit.',
      pages: [expect.objectContaining({ pageNum: 1, type: 'text' })],
    }));
  });

  it('allows the user to cancel without confirming a selection', async () => {
    const onCancel = vi.fn();
    const { user } = renderWithProviders(
      <FastDocumentPreviewModal file={createTextFile()} onCancel={onCancel} onConfirm={vi.fn()} />,
      { withAuthProvider: false },
    );

    await screen.findByText('notes.txt');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
