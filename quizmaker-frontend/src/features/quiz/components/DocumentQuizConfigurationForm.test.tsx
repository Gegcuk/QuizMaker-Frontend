import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { DocumentQuizConfigurationForm } from './DocumentQuizConfigurationForm';

const tokenEstimationService = vi.hoisted(() => ({ estimateFromText: vi.fn().mockReturnValue(null) }));

vi.mock('@/services', () => ({ tokenEstimationService }));
vi.mock('@/features/ai', () => ({ TokenEstimationDisplay: () => null }));
vi.mock('@/features/document', () => ({
  FastDocumentPreviewModal: ({
    onConfirm,
  }: {
    onConfirm: (selection: { selectedPageNumbers: number[]; selectedContent: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onConfirm({ selectedPageNumbers: [1, 2], selectedContent: 'Selected document content.' })}
    >
      Confirm page selection
    </button>
  ),
}));

describe('DocumentQuizConfigurationForm', () => {
  it('opens page selection after upload and submits the selected document content', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <DocumentQuizConfigurationForm
        quizData={{}}
        onDataChange={onDataChange}
        errors={{}}
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );
    const file = new File(['Architecture content'], 'architecture.txt', { type: 'text/plain' });
    const upload = document.getElementById('document-upload') as HTMLInputElement;

    expect(screen.getByRole('button', { name: 'Generate Quiz from Document' })).toBeDisabled();

    await user.upload(upload, file);
    await user.click(screen.getByRole('button', { name: 'Confirm page selection' }));

    expect(screen.getByDisplayValue('architecture')).toBeInTheDocument();
    expect(screen.getAllByText('2 pages selected')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Generate Quiz from Document' }));

    await waitFor(() => {
      expect(onCreateQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'architecture',
        generationConfig: expect.objectContaining({ file }),
        generationRequest: expect.any(FormData),
      }));
    });
    expect(onDataChange).toHaveBeenCalledOnce();
  });
});
