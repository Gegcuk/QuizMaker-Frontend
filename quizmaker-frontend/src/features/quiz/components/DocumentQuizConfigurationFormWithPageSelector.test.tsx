import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import DocumentQuizConfigurationFormWithPageSelector from './DocumentQuizConfigurationFormWithPageSelector';

const tokenEstimationService = vi.hoisted(() => ({ estimateFromText: vi.fn().mockReturnValue(null) }));

vi.mock('@/services', () => ({ tokenEstimationService }));
vi.mock('@/features/ai', () => ({ TokenEstimationDisplay: () => null }));
vi.mock('@/features/document', () => ({
  DocumentPageSelector: ({
    onSelectionComplete,
  }: {
    onSelectionComplete: (selection: {
      documentId: string;
      selectedChunkIndices: number[];
      chunks: Array<{ title: string; chapterTitle?: string }>;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onSelectionComplete({
        documentId: 'document-1',
        selectedChunkIndices: [0, 2],
        chunks: [
          { title: 'Introduction', chapterTitle: 'Architecture' },
          { title: 'Decisions' },
        ],
      })}
    >
      Complete page selection
    </button>
  ),
}));

describe('DocumentQuizConfigurationFormWithPageSelector', () => {
  it('moves from page selection to configuration and submits selected chunks', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <DocumentQuizConfigurationFormWithPageSelector
        quizData={{}}
        onDataChange={onDataChange}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Select Pages for Quiz Generation' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Complete page selection' }));

    expect(screen.getByText('Selected Pages: 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Architecture Quiz')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Generate Quiz from Selected Pages' }));

    await waitFor(() => {
      expect(onCreateQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Architecture Quiz',
        generationRequest: expect.objectContaining({
          documentId: 'document-1',
          chunkIndices: [0, 2],
          quizScope: 'SPECIFIC_CHUNKS',
        }),
      }));
    });
    expect(onDataChange).toHaveBeenCalledOnce();
  });
});
