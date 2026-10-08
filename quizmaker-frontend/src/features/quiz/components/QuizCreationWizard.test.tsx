import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor, within } from '@/test/render';
import QuizCreationWizard from './QuizCreationWizard';
import { toApplicationError } from '@/utils/applicationError';

const quizService = vi.hoisted(() => ({ createQuiz: vi.fn(), generateFromText: vi.fn() }));

vi.mock('@/services', () => ({ api: {}, createQuiz: quizService.createQuiz, tokenEstimationService: { estimateFromText: () => null } }));
vi.mock('@/features/ai', () => ({ TokenEstimationDisplay: () => null }));
vi.mock('../services/quiz.service', () => ({ QuizService: class { generateQuizFromText = quizService.generateFromText; } }));
vi.mock('./QuizCreationMethodSelector', () => ({
  QuizCreationMethodSelector: ({ onMethodSelect }: { onMethodSelect: (method: 'manual' | 'text') => void }) => (
    <>
      <button type="button" onClick={() => onMethodSelect('manual')}>Choose manual</button>
      <button type="button" onClick={() => onMethodSelect('text')}>Choose text</button>
    </>
  ),
}));
vi.mock('./ManualQuizConfigurationForm', () => ({
  ManualQuizConfigurationForm: ({ onCreateQuiz, onDataChange }: { onCreateQuiz: (data: { title: string; estimatedTime: number }) => void; onDataChange: (data: { title: string }) => void }) => (
    <>
    <button type="button" onClick={() => onDataChange({ title: 'Unsaved wizard title' })}>Edit wizard title</button>
    <button type="button" onClick={() => onCreateQuiz({ title: 'Architecture quiz', estimatedTime: 30 })}>
      Create manual quiz
    </button>
    </>
  ),
}));

vi.mock('./DocumentQuizConfigurationForm', () => ({ DocumentQuizConfigurationForm: () => <div>Document configuration</div> }));
vi.mock('./QuizQuestionManager', () => ({
  QuizQuestionManager: ({ onComplete }: { onComplete: () => void }) => (
    <button type="button" onClick={onComplete}>Complete questions</button>
  ),
}));
vi.mock('./QuizAIGenerationStep', () => ({ QuizAIGenerationStep: () => <div>AI generation</div> }));
vi.mock('./QuizGenerationStatus', () => ({ QuizGenerationStatus: () => <div>Generation status</div> }));

describe('QuizCreationWizard', () => {
  it('creates a manual quiz and progresses through question completion', async () => {
    quizService.createQuiz.mockResolvedValue({ quizId: 'quiz-1' });
    const { user } = renderWithProviders(<QuizCreationWizard />, { withAuthProvider: false });

    expect(screen.getByText('Choose Creation Method')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Choose manual' }));
    await user.click(screen.getByRole('button', { name: 'Create manual quiz' }));

    await waitFor(() => {
      expect(quizService.createQuiz).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Architecture quiz',
        estimatedTime: 30,
      }));
    });
    expect(screen.getByRole('button', { name: 'Complete questions' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Complete questions' }));

    expect(screen.getByText('Quiz Created Successfully!')).toBeInTheDocument();
    expect(screen.getByText(/Your quiz "Architecture quiz" has been created/)).toBeInTheDocument();
  });
});

it('protects unsaved manual wizard input after failure and clears after successful creation', async () => {
  quizService.createQuiz.mockRejectedValueOnce(new Error('Creation failed'));
  quizService.createQuiz.mockResolvedValueOnce({ quizId: 'saved-quiz' });
  const { user } = renderWithProviders(<QuizCreationWizard />, { withAuthProvider: false });
  const blocked = () => {
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  };
  expect(blocked()).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Choose manual' }));
  await user.click(screen.getByRole('button', { name: 'Edit wizard title' }));
  expect(blocked()).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Create manual quiz' }));
  expect((await screen.findAllByText(/An unexpected error occurred/)).length).toBeGreaterThan(0);
  expect(blocked()).toBe(true);
  await user.click(screen.getByRole('button', { name: 'Create manual quiz' }));
  expect(await screen.findByRole('button', { name: 'Complete questions' })).toBeInTheDocument();
  expect(blocked()).toBe(false);
});

it('guards losing local wizard text on Back, preserves it on Stay, and clears discarded failed-submission state', async () => {
  quizService.generateFromText.mockRejectedValueOnce(new Error('Generation failed'));
  const { user } = renderWithProviders(<QuizCreationWizard />, { withAuthProvider: false });
  await user.click(screen.getByRole('button', { name: 'Choose text' }));
  await user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Unsaved source quiz');
  const source = 'A local source passage about photosynthesis and cellular respiration. '.repeat(6);
  await user.type(screen.getByLabelText('Text Content *'), source);
  await user.click(screen.getByRole('button', { name: 'Generate Quiz from Text' }));
  expect((await screen.findAllByText(/An unexpected error occurred/)).length).toBeGreaterThan(0);
  await user.click(screen.getAllByRole('button', { name: '← Back' })[0]);
  await user.click(screen.getByRole('button', { name: 'Stay' }));
  expect(screen.getByLabelText('Text Content *')).toHaveValue(source);
  await user.click(screen.getAllByRole('button', { name: '← Back' })[0]);
  await user.click(screen.getByRole('button', { name: 'Leave without saving' }));
  expect(screen.getByRole('button', { name: 'Choose text' })).toBeInTheDocument();
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(false);
});

it('renders a generation API quizTitle error beside the real title control and preserves entered text', async () => {
  quizService.generateFromText.mockRejectedValueOnce(toApplicationError({ response: { status: 422, data: {
    errors: { quizTitle: ['seeded-private-backend-value'], quizDescription: ['seeded-private-backend-value'], text: ['seeded-private-backend-value'], language: ['seeded-private-backend-value'] },
  } } }));
  const { user } = renderWithProviders(<QuizCreationWizard />, { withAuthProvider: false });
  await user.click(screen.getByRole('button', { name: 'Choose text' }));
  const title = screen.getByPlaceholderText('Enter quiz title...');
  await user.type(title, 'My generation quiz');
  const text = 'A source passage about photosynthesis and cellular respiration. '.repeat(6);
  await user.type(screen.getByLabelText('Text Content *'), text);
  await user.click(screen.getByRole('button', { name: 'Generate Quiz from Text' }));
  const titleGroup = title.closest('[data-field="title"]');
  expect(titleGroup).not.toBeNull();
  expect(await within(titleGroup as HTMLElement).findByText('Check this field and try again.')).toBeInTheDocument();
  const description = screen.getByPlaceholderText('Brief description...');
  expect(description).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByLabelText('Text Content *')).toHaveAttribute('aria-invalid', 'true');
  expect(title).toHaveValue('My generation quiz');
  expect(screen.getByLabelText('Text Content *')).toHaveValue(text);
  expect(document.body).not.toHaveTextContent('seeded-private-backend-value');
});
