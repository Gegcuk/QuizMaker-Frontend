import { expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { DocumentQuizConfigurationForm } from './DocumentQuizConfigurationForm';

vi.mock('@/features/ai', () => ({ TokenEstimationDisplay: () => null }));
vi.mock('../../document/utils/documentPreviewLibraries', () => ({ loadDocumentPreviewLibrary: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/services', async importOriginal => {
  const original = await importOriginal<typeof import('@/services')>();
  return { ...original, tokenEstimationService: { estimateFromText: vi.fn().mockReturnValue(null) } };
});

it('submits cleaned selected PDF text in the existing TXT file and preserves generation metadata', async () => {
  const pageItems = [['Предисловие', '\u0002', 'Текст\tс переносом\nстроки.'], ['Unselected page']];
  vi.stubGlobal('pdfjsLib', {
    getDocument: () => ({ promise: Promise.resolve({ numPages: 2, getPage: async (pageNum: number) => ({
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
    const create = vi.fn();
    const { user } = renderWithProviders(<DocumentQuizConfigurationForm quizData={{}} errors={{}}
      onDataChange={vi.fn()} onCreateQuiz={create} isCreating={false} />, { withAuthProvider: false });
    const input = document.getElementById('document-upload');
    if (!(input instanceof HTMLInputElement)) throw new Error('Missing upload');
    await user.upload(input, file);
    await user.click(await screen.findByRole('img', { name: 'Page 1' }));
    await user.click(screen.getByRole('button', { name: 'Confirm Selection (1)' }));
    await user.click(screen.getByRole('button', { name: 'Generate Quiz from Document' }));
    const submitted = create.mock.calls[0]?.[0];
    const selectedFile = submitted.generationRequest.get('file');
    expect(selectedFile.name).toBe('selected-preface.pdf.txt');
    expect(selectedFile.type).toBe('text/plain');
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(selectedFile);
    });
    expect(content).toBe('Предисловие   Текст\tс переносом\nстроки.');
    expect(submitted.generationConfig.file).toBe(file);
    expect(submitted.generationRequest.get('quizScope')).toBe('ENTIRE_DOCUMENT');
    expect(submitted.generationRequest.get('chunkingStrategy')).toBe('SIZE_BASED');
    expect(submitted.generationRequest.get('maxChunkSize')).toBe('100000');
  } finally {
    context.mockRestore();
    image.mockRestore();
    vi.unstubAllGlobals();
  }
});
