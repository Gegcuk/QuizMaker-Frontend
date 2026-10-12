import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import { generationOperations } from '../services/generationOperations';
import { establishSession } from '@/features/auth/services/sessionLifecycle';
import { QueryProvider } from '@/providers/QueryProvider';
import type { QuizGenerationStatus } from '@/types';
import { GenerationObserverProvider } from './GenerationObserverProvider';
import { GenerationJobBlock } from '../components/GenerationJobBlock';

const mock = vi.hoisted(() => ({ auth: { user: { id: 'account-a' }, isLoading: false }, jobs: vi.fn(), status: vi.fn() }));
vi.mock('@/features/auth', () => ({ useAuth: () => mock.auth }));
vi.mock('../services/quiz.service', () => ({ QuizService: class { getGenerationJobs = mock.jobs; getGenerationStatus = mock.status; } }));
const page = (content: QuizGenerationStatus[]) => ({ content, number: 0, size: 20, totalPages: content.length ? 1 : 0, totalElements: content.length, last: true, numberOfElements: content.length });
beforeEach(() => { mock.auth = { user: { id: 'account-a' }, isLoading: false }; vi.clearAllMocks(); });

function Session() { return <QueryProvider><GenerationObserverProvider><GenerationJobBlock showEmpty /></GenerationObserverProvider></QueryProvider>; }

describe('generation observer session boundary', () => {
  it('does not render old account jobs after account replacement or a late old response', async () => {
    let resolveA!: (value: ReturnType<typeof page>) => void;
    mock.jobs.mockImplementationOnce(() => new Promise(resolve => { resolveA = resolve; })).mockResolvedValue(page([{ jobId: 'job-b', status: 'PENDING' }]));
    const view = renderWithProviders(<Session />, { withAuthProvider: false });
    await waitFor(() => expect(mock.jobs).toHaveBeenCalledTimes(1));
    act(() => { mock.auth = { user: { id: 'account-b' }, isLoading: false }; establishSession('test-b', 'refresh-b', 'account-switch'); });
    view.rerender(<Session />);
    await screen.findByText('PENDING');
    await act(async () => { resolveA(page([{ jobId: 'job-a', status: 'PROCESSING', progressPercentage: 77 }])); });
    expect(screen.queryByText('PROCESSING')).not.toBeInTheDocument(); expect(screen.queryByText('77%')).not.toBeInTheDocument();
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
});
