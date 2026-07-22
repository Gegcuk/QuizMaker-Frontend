import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { RawDocumentPageSelector } from './RawDocumentPageSelector';

const createTextFile = () => new File([
  `${'First section '.repeat(120)}\n\n${'Second section '.repeat(120)}`,
], 'notes.txt', { type: 'text/plain' });

describe('RawDocumentPageSelector', () => {
  it('stays unmounted until opened', () => {
    renderWithProviders(
      <RawDocumentPageSelector file={createTextFile()} isOpen={false} onCancel={vi.fn()} onConfirm={vi.fn()} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByText('Select Document Sections')).not.toBeInTheDocument();
  });

  it('loads text sections, requires a selection, and confirms the selected pages', async () => {
    const onConfirm = vi.fn();
    const { user } = renderWithProviders(
      <RawDocumentPageSelector file={createTextFile()} isOpen onCancel={vi.fn()} onConfirm={onConfirm} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Confirm Selection (2)' })).toBeEnabled();
    });

    await user.click(screen.getByRole('button', { name: 'Deselect All' }));
    expect(screen.getByRole('button', { name: 'Confirm Selection (0)' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Select All' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Selection (2)' }));

    expect(onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ index: 0, content: expect.stringContaining('First section') }),
      expect.objectContaining({ index: 1, content: expect.stringContaining('Second section') }),
    ]);
  });
});
