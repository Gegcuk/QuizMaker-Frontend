import { Link } from 'react-router-dom';
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

    const generateButton = screen.getByRole('button', { name: 'Generate Quiz from Document' });
    expect(generateButton).not.toBeDisabled();
    expect(generateButton).toHaveAttribute('aria-disabled', 'true');
    expect(generateButton).toHaveAccessibleDescription(expect.stringContaining('Document file is required'));
    await user.click(generateButton);
    expect(onCreateQuiz).not.toHaveBeenCalled();

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

it('protects local document selection before the parent receives a submission', async () => {
  const onDataChange = vi.fn();
  const { user } = renderWithProviders(<>
    <DocumentQuizConfigurationForm quizData={{}} onDataChange={onDataChange} errors={{}} onCreateQuiz={vi.fn()} isCreating={false} />
    <Link to="/other">Leave wizard</Link>
  </>, { route: '/quizzes/create', withAuthProvider: false });
    const upload = document.getElementById('document-upload');
    if (!(upload instanceof HTMLInputElement)) throw new Error('Upload control is missing');
    await user.upload(upload, new File(['Unsaved document'], 'draft.txt', { type: 'text/plain' }));
  expect(onDataChange).not.toHaveBeenCalled();
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  await user.click(screen.getByRole('link', { name: 'Leave wizard' }));
  await user.click(screen.getByRole('button', { name: 'Stay' }));
  expect(upload.files?.[0]?.name).toBe('draft.txt');
});

it('freezes submitted generation inputs until the wizard can advance safely', () => {
  renderWithProviders(<DocumentQuizConfigurationForm quizData={{}} onDataChange={vi.fn()} errors={{}} onCreateQuiz={vi.fn()} isCreating={true} />, { withAuthProvider: false });
  expect(document.getElementById('document-upload')).toBeDisabled();
  expect(screen.getByPlaceholderText('Title is auto-generated from filename if empty')).toBeDisabled();
});
