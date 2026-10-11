import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizCreationWizard from './QuizCreationWizard';
import QuizFromSelectedPagesPage from '@/pages/QuizFromSelectedPagesPage';
import { toApplicationError } from '@/utils/applicationError';

const mocks = vi.hoisted(() => ({ text: vi.fn(), upload: vi.fn(), document: vi.fn() }));
vi.mock('@/features/auth', async original => ({ ...await original<typeof import('@/features/auth')>(), useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
vi.mock('@/services', () => ({ api: {}, createQuiz: vi.fn(), QuizService: class { generateQuizFromDocument = mocks.document; }, tokenEstimationService: { estimateFromText: () => null } }));
vi.mock('../services/quiz.service', () => ({ QuizService: class {
  generateQuizFromText = mocks.text; generateQuizFromUpload = mocks.upload; generateQuizFromDocument = mocks.document;
} }));
const text = { text: 'Original source', questionsPerType: { TRUE_FALSE: 2 } };
const documentRequest = { documentId: 'document-1', quizScope: 'SPECIFIC_CHUNKS', chunkIndices: [1, 3], questionsPerType: { TRUE_FALSE: 2 } };
vi.mock('./QuizCreationMethodSelector', () => ({ QuizCreationMethodSelector: ({ onMethodSelect }: { onMethodSelect: (value: string) => void }) => <>
  <button onClick={() => onMethodSelect('text')}>Choose text</button><button onClick={() => onMethodSelect('document')}>Choose upload</button>
</> }));
vi.mock('./TextQuizConfigurationForm', () => ({ TextQuizConfigurationForm: ({ onCreateQuiz, isCreating }: { onCreateQuiz: (data: unknown) => void; isCreating: boolean }) =>
  <button disabled={isCreating} onClick={() => onCreateQuiz({ title: 'Original quiz', estimatedTime: 30, generationRequest: text })}>Submit text fixture</button> }));
vi.mock('./DocumentQuizConfigurationForm', () => ({ DocumentQuizConfigurationForm: ({ onCreateQuiz, isCreating }: { onCreateQuiz: (data: unknown) => void; isCreating: boolean }) =>
  <button disabled={isCreating} onClick={() => {
    const data = new FormData(); data.append('file', new File(['original bytes'], 'original.txt')); data.append('questionsPerType', '{"TRUE_FALSE":2}');
    onCreateQuiz({ title: 'Original quiz', estimatedTime: 30, generationRequest: data });
  }}>Submit upload fixture</button> }));
vi.mock('@/features/quiz', () => ({ DocumentQuizConfigurationFormWithPageSelector: ({ onCreateQuiz, isCreating }: { onCreateQuiz: (data: unknown) => void; isCreating: boolean }) =>
  <button disabled={isCreating} onClick={() => onCreateQuiz({ title: 'Original quiz', generationRequest: documentRequest })}>Submit document fixture</button> }));
vi.mock('./QuizGenerationStatus', () => ({ QuizGenerationStatus: ({ jobId }: { jobId: string }) => <div>Recovered job: {jobId}</div> }));
vi.mock('@/features/ai', () => ({ GenerationProgress: ({ jobId }: { jobId: string }) => <div>Recovered job: {jobId}</div>, TokenEstimationDisplay: () => null }));
afterEach(() => vi.clearAllMocks());

describe('additional generation callers use the shared recovery lifecycle', () => {
  it.each(['text', 'upload', 'document'] as const)('wires %s submission, manual retry and remount to the same key/job', async source => {
    const send = mocks[source];
    send.mockRejectedValueOnce(toApplicationError({ isAxiosError: true, code: 'ERR_NETWORK' }))
      .mockResolvedValueOnce({ jobId: 'same-job', status: 'PENDING', message: 'queued', estimatedTimeSeconds: 10 });
    const Component = source === 'document' ? QuizFromSelectedPagesPage : QuizCreationWizard;
    let view = renderWithProviders(<Component />, { withAuthProvider: false });
    if (source !== 'document') await view.user.click(screen.getByRole('button', { name: source === 'text' ? 'Choose text' : 'Choose upload' }));
    const submitName = `Submit ${source} fixture`;
    await view.user.click(screen.getByRole('button', { name: submitName }));
    expect((await screen.findAllByText(/Network error occurred/)).length).toBeGreaterThan(0);
    const key = send.mock.calls[0][1];
    view.unmount();
    view = renderWithProviders(<Component />, { withAuthProvider: false });
    await screen.findByText(/pending generation operation was restored|pending document generation was restored/i);
    expect(send).toHaveBeenCalledOnce();
    await view.user.click(screen.getByRole('button', { name: submitName }));
    expect(await screen.findByText('Recovered job: same-job')).toBeInTheDocument();
    expect(send.mock.calls[1][1]).toBe(key);
    expect(send).toHaveBeenCalledTimes(2);
    if (source !== 'upload') expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
  });
});
