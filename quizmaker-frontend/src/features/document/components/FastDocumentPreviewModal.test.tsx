import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { FastDocumentPreviewModal } from './FastDocumentPreviewModal';

vi.mock('../utils/documentPreviewLibraries', () => ({ loadDocumentPreviewLibrary: vi.fn().mockResolvedValue(undefined) }));

const createTextFile = () => {
  const file = new File(['Architecture decisions are explicit.'], 'notes.txt', { type: 'text/plain' });
  Object.defineProperty(file, 'text', {
    value: vi.fn().mockResolvedValue('Architecture decisions are explicit.'),
  });
  return file;
};

describe('FastDocumentPreviewModal', () => {
  it('replaces rejected PDF control glyphs with spaces and preserves text, page order, and the confirmation payload', async () => {
    const controls = String.fromCharCode(0, 1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31);
    const unicode = 'Текст café 🎮 e\u0301\u00a0\u200b\u007f\u0085';
    const pageItems = [
      ['Предисловие', '\u0002', `${unicode}\tстрока\nновая\r\nстрока\v\f`],
      [`До\u0002после${controls}конец`],
      ['Unselected page'],
    ];
    vi.stubGlobal('pdfjsLib', {
      getDocument: () => ({ promise: Promise.resolve({ numPages: 3, getPage: async (pageNum: number) => ({
        getViewport: () => ({ width: 100, height: 100 }),
        render: () => ({ promise: Promise.resolve() }),
        getTextContent: async () => ({ items: pageItems[pageNum - 1].map(str => ({ str })) }),
      }) }) }),
    });
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const image = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,fixture');
    try {
      const file = new File([], 'preface.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'arrayBuffer', { value: vi.fn().mockResolvedValue(new ArrayBuffer(0)) });
      const confirm = vi.fn();
      const { user } = renderWithProviders(<FastDocumentPreviewModal file={file} onCancel={vi.fn()} onConfirm={confirm} />, { withAuthProvider: false });
      await user.click(await screen.findByRole('img', { name: 'Page 2' }));
      await user.click(screen.getByRole('img', { name: 'Page 1' }));
      await user.click(screen.getByRole('button', { name: 'Confirm Selection (2)' }));
      const first = `Предисловие   ${unicode}\tстрока\nновая\r\nстрока\v\f`;
      const second = `До после${' '.repeat(27)}конец`;
      expect(confirm).toHaveBeenCalledWith({
        selectedPageNumbers: [1, 2], selectedContent: `${first}\n\n${second}`,
        pages: [
          { pageNum: 1, content: 'data:image/png;base64,fixture', textContent: first, type: 'image' },
          { pageNum: 2, content: 'data:image/png;base64,fixture', textContent: second, type: 'image' },
        ],
      });
    } finally {
      context.mockRestore();
      image.mockRestore();
      vi.unstubAllGlobals();
    }
  });

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
