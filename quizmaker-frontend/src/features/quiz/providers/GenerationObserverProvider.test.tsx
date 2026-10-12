import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import { GenerationOperations, generationOperations } from '../services/generationOperations';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { QueryProvider } from '@/providers/QueryProvider';
import type { QuizGenerationStatus } from '@/types';
import { GenerationObserverProvider } from './GenerationObserverProvider';
import { GenerationJobBlock } from '../components/GenerationJobBlock';
import { QuizGenerationStatus as GenerationStatusView } from '../components/QuizGenerationStatus';
import { useGenerationObservation } from '../hooks/useGenerationObservation';
import { generationStatusKey, ownedQuizzesKey, type GenerationObserver } from '../services/generationObserver';

const mock = vi.hoisted(() => {
  const auth: { user: { id: string } | null; isLoading: boolean } = { user: { id: 'account-a' }, isLoading: false };
  return { auth, jobs: vi.fn(), status: vi.fn(), cancel: vi.fn() };
});
vi.mock('@/features/auth', () => ({ useAuth: () => mock.auth }));
vi.mock('../services/quiz.service', () => ({ QuizService: class { getGenerationJobs = mock.jobs; getGenerationStatus = mock.status; cancelGenerationJob = mock.cancel; } }));
const page = (content: QuizGenerationStatus[]) => ({ content, number: 0, size: 20, totalPages: content.length ? 1 : 0, totalElements: content.length, last: true, numberOfElements: content.length });
beforeEach(() => { mock.auth = { user: { id: 'account-a' }, isLoading: false }; vi.clearAllMocks(); });

function Session() { return <QueryProvider><GenerationObserverProvider><GenerationJobBlock showEmpty /></GenerationObserverProvider></QueryProvider>; }
type SessionScope = { observer: GenerationObserver; client: QueryClient };
function Probe({ scopes }: { scopes: Map<string, SessionScope> }) {
  const { observer } = useGenerationObservation();
  const client = useQueryClient();
  if (observer) scopes.set(observer.accountId, { observer, client });
  return <GenerationJobBlock />;
}
function ObservedSession({ scopes }: { scopes: Map<string, SessionScope> }) {
  return <QueryProvider><GenerationObserverProvider><Probe scopes={scopes} /></GenerationObserverProvider></QueryProvider>;
}
function scopeFor(scopes: Map<string, SessionScope>, accountId: string) {
  const scope = scopes.get(accountId);
  if (!scope) throw new Error(`Session scope was not mounted: ${accountId}`);
  return scope;
}

describe('generation observer session boundary', () => {
  it.each(['visibility', 'reconnect'] as const)('updates the full progress screen and compact block together when %s discovers another tab\'s job', async trigger => {
    vi.useFakeTimers();
    const visible = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const connected = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    try {
      const oldJob: QuizGenerationStatus = { jobId: 'old-job', status: 'PROCESSING', progressPercentage: 35 };
      const newJob: QuizGenerationStatus = { jobId: 'new-job', status: 'PROCESSING', progressPercentage: 77 };
      mock.jobs.mockResolvedValueOnce(page([oldJob])).mockResolvedValue(page([newJob]));
      mock.status.mockImplementation(async jobId => jobId === newJob.jobId ? newJob : { ...oldJob, status: 'COMPLETED' });
      const root = renderWithProviders(<QueryProvider><GenerationObserverProvider>
        <GenerationStatusView jobId={oldJob.jobId} /><GenerationJobBlock />
      </GenerationObserverProvider></QueryProvider>, { withAuthProvider: false });
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(screen.getAllByText('35%')).toHaveLength(2);
      act(() => {
        if (trigger === 'visibility') { visible.mockReturnValue('hidden'); fireEvent(document, new Event('visibilitychange')); }
        else { connected.mockReturnValue(false); fireEvent(window, new Event('offline')); }
      });
      const otherTab = new GenerationOperations();
      const post = vi.fn().mockResolvedValue({ jobId: newJob.jobId, status: 'PENDING', message: 'queued', estimatedTimeSeconds: 10 });
      await act(async () => { await otherTab.start('account-a', 'upload-tab', 'upload', post); });
      act(() => {
        if (trigger === 'visibility') { visible.mockReturnValue('visible'); fireEvent(document, new Event('visibilitychange')); }
        else { connected.mockReturnValue(true); fireEvent(window, new Event('online')); }
      });
      await act(async () => { await vi.advanceTimersByTimeAsync(0); });
      expect(screen.getAllByText('77%')).toHaveLength(2);
      expect(screen.queryByText('35%')).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Generating Your Quiz' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'AI quiz generation' })).toBeInTheDocument();
      expect(mock.jobs).toHaveBeenCalledTimes(2);
      expect(mock.status).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledTimes(1);
      root.unmount();
    } finally { vi.useRealTimers(); vi.restoreAllMocks(); }
  });
  it('does not render old account jobs after account replacement or a late old response', async () => {
    let resolveA!: (value: ReturnType<typeof page>) => void;
    mock.jobs.mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; })).mockResolvedValue(page([{ jobId: 'job-b', status: 'PENDING' }]));
    const view = renderWithProviders(<Session />, { withAuthProvider: false });
    await waitFor(() => expect(mock.jobs).toHaveBeenCalledTimes(1));
    act(() => { mock.auth = { user: { id: 'account-b' }, isLoading: false }; establishSession('test-b', 'refresh-b', 'account-switch'); });
    view.rerender(<Session />);
    await screen.findByText('Queued');
    await act(async () => { resolveA(page([{ jobId: 'job-a', status: 'PROCESSING', progressPercentage: 77 }])); });
    expect(screen.queryByText('Generating your quiz')).not.toBeInTheDocument(); expect(screen.queryByText('77%')).not.toBeInTheDocument();
    expect(mock.jobs).toHaveBeenCalledTimes(2);
  });
  it('offers an explicit retry after failed discovery instead of declaring no active job', async () => {
    mock.jobs.mockRejectedValueOnce({ response: { status: 503 } }).mockResolvedValue(page([]));
    renderWithProviders(<GenerationObserverProvider><GenerationJobBlock showEmpty /></GenerationObserverProvider>, { withAuthProvider: false });
    await screen.findByText('Generation jobs are unavailable');
    expect(screen.queryByText('No active generation found')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh status' })).toBeEnabled();
  });
  it('does not claim absence before discovery or after an uncertain start recovery read fails', async () => {
    mock.jobs.mockResolvedValueOnce(page([])).mockRejectedValue({ response: { status: 503 } });
    renderWithProviders(<GenerationObserverProvider><GenerationJobBlock showEmpty /></GenerationObserverProvider>, { withAuthProvider: false });
    expect(screen.queryByText('No active generation found')).not.toBeInTheDocument();
    await screen.findByText('No active generation found');
    await act(async () => { await generationOperations.start('account-a', 'text-tab', 'text', async () => { throw { response: { status: 503 } }; }).catch(() => undefined); });
    await screen.findByText('Generation jobs are unavailable');
    expect(screen.queryByText('No active generation found')).not.toBeInTheDocument();
    expect(screen.queryByText(/No active job was found/)).not.toBeInTheDocument();
  });
  it('removes all browser event listeners on unmount', async () => {
    mock.jobs.mockResolvedValue(page([]));
    const view = renderWithProviders(<GenerationObserverProvider><GenerationJobBlock /></GenerationObserverProvider>, { withAuthProvider: false });
    await waitFor(() => expect(mock.jobs).toHaveBeenCalledTimes(1)); view.unmount();
    fireEvent(window, new Event('online')); fireEvent(document, new Event('visibilitychange'));
    expect(mock.jobs).toHaveBeenCalledTimes(1);
  });
  it.each(['status', 'cancel'] as const)('clears the old cache and ignores late %s data, errors and queued recovery after account replacement', async operation => {
    establishSession('test-a', 'refresh-a');
    mock.jobs.mockResolvedValueOnce(page([{ jobId: 'same-fixture-id', status: 'PROCESSING', progressPercentage: 77 }]))
      .mockResolvedValue(page([{ jobId: 'same-fixture-id', status: 'PROCESSING', progressPercentage: 7 }]));
    const scopes = new Map<string, SessionScope>();
    const root = renderWithProviders(<ObservedSession scopes={scopes} />, { withAuthProvider: false });
    await screen.findByText('77%');
    const a = scopeFor(scopes, 'account-a');
    act(() => { a.client.setQueryData(ownedQuizzesKey('account-a'), { content: [{ id: 'private-result-a', title: 'Private title A' }] }); });
    let reply: (job: QuizGenerationStatus) => void = () => { throw new Error('Request was not started'); };
    const late = new Promise<QuizGenerationStatus>(resolve => { reply = resolve; });
    if (operation === 'status') mock.status.mockReturnValueOnce(late); else mock.cancel.mockReturnValueOnce(late);
    let reading = Promise.resolve();
    await act(async () => { reading = operation === 'status' ? a.observer.refresh() : a.observer.cancel(); });
    await act(async () => {
      await generationOperations.start('account-a', 'upload-tab', 'upload', async () => { throw { response: { status: 503 } }; }).catch(() => undefined);
    });
    const signal = (operation === 'status' ? mock.status : mock.cancel).mock.calls[0]?.[1];
    act(() => { mock.auth.user = { id: 'account-b' }; establishSession('test-b', 'refresh-b', 'account-switch'); });
    root.rerender(<ObservedSession scopes={scopes} />);
    await screen.findByText('7%');
    expect(signal?.aborted).toBe(true);
    await act(async () => { reply({ jobId: 'same-fixture-id', status: 'COMPLETED', generatedQuizId: 'private-result-a', progressPercentage: 100 }); await reading; });
    const b = scopeFor(scopes, 'account-b');
    expect(b.client).not.toBe(a.client);
    expect(a.client.getQueryCache().getAll()).toHaveLength(0);
    expect(b.client.getQueryData(generationStatusKey('account-a', 'same-fixture-id'))).toBeUndefined();
    expect(b.client.getQueryData(ownedQuizzesKey('account-a'))).toBeUndefined();
    expect(b.observer.getSnapshot()).toMatchObject({ newQuizIds: [], error: null, cancelError: null, recoveryNotice: false });
    expect(screen.queryByText('Private title A')).not.toBeInTheDocument();
    expect(screen.queryByText('77%')).not.toBeInTheDocument();
    expect(screen.queryByText('Quiz ready')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel Generation' })).toBeEnabled();
    expect(mock.jobs).toHaveBeenCalledTimes(2);
  });
  it('clears a completed result title and its in-memory new marker when the account changes', async () => {
    establishSession('test-a', 'refresh-a');
    mock.jobs.mockResolvedValueOnce(page([{ jobId: 'job-1', status: 'PROCESSING' }]))
      .mockResolvedValue(page([{ jobId: 'job-1', status: 'PROCESSING', progressPercentage: 7 }]));
    mock.status.mockResolvedValue({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'private-result-a' });
    const scopes = new Map<string, SessionScope>();
    const root = renderWithProviders(<ObservedSession scopes={scopes} />, { withAuthProvider: false });
    await screen.findByText('Generating your quiz');
    const a = scopeFor(scopes, 'account-a');
    act(() => { a.client.setQueryData(ownedQuizzesKey('account-a'), { content: [{ id: 'private-result-a', title: 'Private title A' }] }); });
    await act(async () => { await a.observer.refresh(); });
    await screen.findByText('Private title A');
    expect(a.observer.getSnapshot().newQuizIds).toEqual(['private-result-a']);
    act(() => { mock.auth.user = { id: 'account-b' }; establishSession('test-b', 'refresh-b', 'account-switch'); });
    root.rerender(<ObservedSession scopes={scopes} />);
    await screen.findByText('7%');
    expect(screen.queryByText('Private title A')).not.toBeInTheDocument();
    expect(scopeFor(scopes, 'account-b').observer.getSnapshot().newQuizIds).toEqual([]);
    expect(a.client.getQueryCache().getAll()).toHaveLength(0);
  });
  it('removes observation on logout and cannot restore it from a late response or queued recovery', async () => {
    establishSession('test-a', 'refresh-a');
    mock.jobs.mockResolvedValue(page([{ jobId: 'job-1', status: 'PROCESSING', progressPercentage: 77 }]));
    const scopes = new Map<string, SessionScope>();
    const root = renderWithProviders(<ObservedSession scopes={scopes} />, { withAuthProvider: false });
    await screen.findByText('77%');
    const a = scopeFor(scopes, 'account-a');
    let reply: (job: QuizGenerationStatus) => void = () => { throw new Error('Request was not started'); };
    mock.status.mockReturnValueOnce(new Promise<QuizGenerationStatus>(resolve => { reply = resolve; }));
    let reading = Promise.resolve();
    await act(async () => { reading = a.observer.refresh(); });
    await act(async () => { await generationOperations.start('account-a', 'text-tab', 'text', async () => { throw { response: { status: 503 } }; }).catch(() => undefined); });
    act(() => { mock.auth.user = null; terminateSession('logout'); });
    root.rerender(<ObservedSession scopes={scopes} />);
    await act(async () => { reply({ jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'private-result-a' }); await reading; });
    fireEvent(window, new Event('online')); fireEvent(document, new Event('visibilitychange'));
    expect(screen.queryByRole('region', { name: 'AI quiz generation' })).not.toBeInTheDocument();
    expect(a.client.getQueryCache().getAll()).toHaveLength(0);
    expect(mock.status.mock.calls[0]?.[1].aborted).toBe(true);
    expect(mock.jobs).toHaveBeenCalledTimes(1);
  });
});
