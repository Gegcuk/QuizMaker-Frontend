import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { QuizGenerationResponse, QuizGenerationStatus } from '@/types';
import { ApplicationError } from '@/utils/applicationError';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { generationOperations } from './generationOperations';
import { discoverActiveGeneration, readGenerationPage, type GenerationJobPage } from './generationJobs';
import { GenerationObserver, generationStatusKey, ownedQuizzesKey } from './generationObserver';

const pending: QuizGenerationStatus = { jobId: 'job-1', status: 'PROCESSING', progressPercentage: 35 };
const accepted: QuizGenerationResponse = { jobId: 'job-1', status: 'PENDING', message: 'queued', estimatedTimeSeconds: 10 };
const complete: QuizGenerationStatus = { jobId: 'job-1', status: 'COMPLETED', generatedQuizId: 'quiz-1', progressPercentage: 100 };
function page(content: QuizGenerationStatus[], number = 0, totalElements = content.length, size = 20): GenerationJobPage {
  return { content, number, size, totalElements, totalPages: Math.ceil(totalElements / size), last: totalElements === 0 || number === Math.ceil(totalElements / size) - 1, numberOfElements: content.length };
}
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
const observers: GenerationObserver[] = [];
const clients: QueryClient[] = [];
const setup = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const service = { getGenerationJobs: vi.fn().mockResolvedValue(page([pending])), getGenerationStatus: vi.fn().mockResolvedValue(pending), cancelGenerationJob: vi.fn().mockResolvedValue({ ...pending, status: 'CANCELLED' }) };
  const observer = new GenerationObserver('account-a', client, service);
  clients.push(client); observers.push(observer);
  return { client, service, observer, job: () => client.getQueryData<QuizGenerationStatus>(generationStatusKey('account-a', observer.getSnapshot().jobId)) };
};
async function tick(ms = 0) { await vi.advanceTimersByTimeAsync(ms); }
function visibility(value: string) { vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value as DocumentVisibilityState); document.dispatchEvent(new Event('visibilitychange')); }
function online(value: boolean) { vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value); window.dispatchEvent(new Event(value ? 'online' : 'offline')); }

beforeEach(() => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(0.5); vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible'); vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true); });
afterEach(() => { observers.splice(0).forEach(observer => observer.destroy()); clients.splice(0).forEach(client => client.clear()); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('account generation observer', () => {
  it('discovers once and sends no periodic requests when there is no active job', async () => {
    const { service, observer } = setup(); service.getGenerationJobs.mockResolvedValue(page([])); observer.start(); await tick(120_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1); expect(service.getGenerationStatus).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange')); await tick();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
  });
  it('discovers newer active work on reload even when an older accepted receipt exists', async () => {
    await generationOperations.start('account-a', 'wizard', 'text', async () => accepted);
    const { observer, service } = setup();
    service.getGenerationJobs.mockResolvedValue(page([{ ...pending, jobId: 'new-job' }]));
    observer.start(); await tick();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1); expect(observer.getSnapshot().jobId).toBe('new-job');
    expect(generationOperations.getSnapshot().pending.wizard?.jobId).toBe('job-1');
  });
  it('shares an in-flight read and continues independently of consumer subscriptions', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    const off = observer.subscribe(vi.fn()); const off2 = observer.subscribe(vi.fn());
    const reply = deferred<QuizGenerationStatus>(); service.getGenerationStatus.mockReturnValueOnce(reply.promise);
    await tick(5_000); const a = observer.refresh(); const b = observer.refresh(); expect(a).toBe(b);
    off(); off2(); await tick(30_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    reply.resolve(pending); await tick(); await tick(5_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
  });
  it('finds active work beyond the first page and rejects incomplete absence', async () => {
    const terminal = { ...complete, jobId: 'old' };
    const read = vi.fn().mockResolvedValueOnce(page([terminal], 0, 2, 1)).mockResolvedValueOnce(page([pending], 1, 2, 1));
    expect(await discoverActiveGeneration(read)).toEqual(pending); expect(read).toHaveBeenCalledTimes(2);
    await expect(discoverActiveGeneration(async () => page([], 0, 2, 1))).rejects.toBeInstanceOf(ApplicationError);
    const duplicate = vi.fn().mockResolvedValueOnce(page([terminal], 0, 2, 1)).mockResolvedValueOnce(page([terminal], 1, 2, 1));
    await expect(discoverActiveGeneration(duplicate)).rejects.toBeInstanceOf(ApplicationError);
    expect(() => readGenerationPage({ ...page([]), totalElements: undefined }, 0)).toThrow();
  });
  it('discovers a lost start response without source input or another POST and does not link an unknown key', async () => {
    const { observer, service } = setup(); service.getGenerationJobs.mockResolvedValueOnce(page([])).mockResolvedValue(page([pending])); observer.start(); await tick();
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await expect(generationOperations.start('account-a', 'upload-tab', 'upload', post)).rejects.toBeInstanceOf(ApplicationError); await tick();
    expect(observer.getSnapshot().jobId).toBe('job-1'); expect(generationOperations.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
    await tick(60_000); expect(post).toHaveBeenCalledTimes(1);
  });
  it('does not use a pre-start discovery response to resolve a lost start response', async () => {
    const { observer, service } = setup();
    const oldRead = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(oldRead.promise).mockResolvedValue(page([pending]));
    observer.start();
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await expect(generationOperations.start('account-a', 'upload-tab', 'upload', post)).rejects.toThrow();
    oldRead.resolve(page([])); await tick();
    expect(observer.getSnapshot().jobId).toBe('job-1'); expect(service.getGenerationJobs).toHaveBeenCalledTimes(2); expect(post).toHaveBeenCalledTimes(1);
  });
  it('refreshes the quiz list when an uncertain start has no active job, without claiming failure', async () => {
    const { client, observer, service } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    const invalidate = vi.spyOn(client, 'invalidateQueries'); observer.start(); await tick();
    await expect(generationOperations.start('account-a', 'text-tab', 'text', async () => { throw new ApplicationError({ category: 'network' }); })).rejects.toThrow(); await tick();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ownedQuizzesKey('account-a') });
    expect(observer.getSnapshot()).toMatchObject({ jobId: null, recoveryNotice: true, error: null });
  });
  it('hands a successful start directly to observation even if receipt persistence fails', async () => {
    const { observer, service } = setup(); service.getGenerationJobs.mockResolvedValue(page([])); observer.start(); await tick();
    await generationOperations.start('account-a', 'wizard', 'text', async () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); }); return accepted;
    }).catch(() => undefined); await tick();
    expect(observer.getSnapshot().jobId).toBe('job-1'); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it('backs off 10/20/40/60 seconds, keeps confirmed progress and returns to five seconds on success', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'server', status: 503 }));
    await tick(5_000); expect(job()).toEqual(pending); expect(observer.getSnapshot().error).toBeTruthy();
    for (const [interval, count] of [[10_000, 2], [20_000, 3], [40_000, 4], [60_000, 5]]) {
      await tick(interval - 1); expect(service.getGenerationStatus).toHaveBeenCalledTimes(count - 1);
      await tick(1); expect(service.getGenerationStatus).toHaveBeenCalledTimes(count);
    }
    service.getGenerationStatus.mockResolvedValue(pending); await tick(60_000); expect(observer.getSnapshot().error).toBeNull(); await tick(5_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(7);
  });
  it('honours Retry-After through hidden/offline transitions and resumes after the deadline', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 }));
    await tick(5_000); visibility('hidden'); online(false); await tick(30_000); visibility('visible'); online(true); await tick(89_999);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1); await tick(1); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    visibility('hidden'); await tick(20_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2); visibility('visible'); await tick(); expect(service.getGenerationStatus).toHaveBeenCalledTimes(3);
    online(false); await tick(20_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(3); online(true); await tick(); expect(service.getGenerationStatus).toHaveBeenCalledTimes(4);
  });
  it.each(['COMPLETED', 'FAILED', 'CANCELLED'] as const)('stops polling after %s', async status => {
    const { observer, service } = setup(); observer.start(); await tick(); service.getGenerationStatus.mockResolvedValue({ ...complete, status });
    await tick(5_000); await tick(120_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 404])('stops retries and resume events after HTTP %s', async status => {
    const { observer, service } = setup(); observer.start(); await tick(); service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'authentication', status }));
    await tick(5_000); window.dispatchEvent(new Event('online')); await tick(120_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1); expect(observer.getSnapshot().accessStopped).toBe(true);
  });
  it('applies a confirmed cancellation without fabricating state or repeating DELETE', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick(); await observer.cancel(); await tick(120_000);
    expect(job()?.status).toBe('CANCELLED'); expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1); expect(service.getGenerationStatus).not.toHaveBeenCalled();
  });
  it('re-reads a server-confirmed completion returned by cancellation instead of fabricating CANCELLED', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.cancelGenerationJob.mockResolvedValue(complete); service.getGenerationStatus.mockResolvedValue(complete);
    await observer.cancel();
    expect(job()?.status).toBe('COMPLETED'); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('serializes cancellation behind a read and reconciles completion winning the race', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const read = deferred<QuizGenerationStatus>(); service.getGenerationStatus.mockReturnValueOnce(read.promise).mockResolvedValue(complete);
    service.cancelGenerationJob.mockRejectedValue(new ApplicationError({ category: 'validation', status: 400 }));
    await tick(5_000); const cancel = observer.cancel(); const secondCancel = observer.cancel(); expect(cancel).toBe(secondCancel);
    expect(service.cancelGenerationJob).not.toHaveBeenCalled(); read.resolve(pending); await tick(); await cancel;
    expect(job()).toEqual(complete); expect(observer.getSnapshot().cancelError).toBeNull();
    expect(observer.getSnapshot().newQuizIds).toEqual(['quiz-1']); expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('does not turn a failed cancellation or a failed read into CANCELLED/FAILED', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick(); service.cancelGenerationJob.mockRejectedValue(new ApplicationError({ category: 'server', status: 503 })); service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'network' }));
    await observer.cancel(); expect(job()?.status).toBe('PROCESSING'); expect(observer.getSnapshot().cancelError).toBeTruthy(); await tick(120_000); expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('invalidates owned quizzes once per completion and acknowledges only observed successes in memory', async () => {
    const { observer, service, client } = setup(); const invalidate = vi.spyOn(client, 'invalidateQueries'); observer.start(); await tick(); service.getGenerationStatus.mockResolvedValue(complete); await tick(5_000); await observer.refresh();
    expect(invalidate).toHaveBeenCalledTimes(1); expect(observer.getSnapshot().newQuizIds).toEqual(['quiz-1']); observer.acknowledge('quiz-1'); expect(observer.getSnapshot().newQuizIds).toEqual([]);
  });
  it.each(['logout', 'account-switch', 'destroy'] as const)('ignores a late response after %s and stops work', async transition => {
    establishSession('test-a', 'refresh-a');
    const { observer, service } = setup(); const late = deferred<GenerationJobPage>(); service.getGenerationJobs.mockReturnValue(late.promise); observer.start();
    if (transition === 'logout') terminateSession('logout'); else if (transition === 'account-switch') establishSession('test-b', 'refresh-b', 'account-switch'); else observer.destroy();
    late.resolve(page([pending])); await tick(120_000); expect(observer.getSnapshot().jobId).toBeNull(); expect(service.getGenerationStatus).not.toHaveBeenCalled();
  });
  it.each(['status', 'cancel'] as const)('does not apply a late %s result after account replacement', async operation => {
    const { observer, service, client } = setup(); observer.start(); await tick();
    const late = deferred<QuizGenerationStatus>();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    let read: Promise<void>;
    if (operation === 'status') { service.getGenerationStatus.mockReturnValueOnce(late.promise); read = observer.refresh(); }
    else { service.cancelGenerationJob.mockReturnValueOnce(late.promise); read = observer.cancel(); }
    await tick();
    establishSession('test-b', 'refresh-b', 'account-switch');
    late.resolve(complete); await read; await tick();
    expect(observer.getSnapshot().newQuizIds).toEqual([]); expect(invalidate).not.toHaveBeenCalled();
  });
  it('discards late discovery when a confirmed new start supplies the exact job', async () => {
    const { observer, service, job } = setup(); const late = deferred<GenerationJobPage>(); service.getGenerationJobs.mockReturnValue(late.promise); observer.start(); observer.accept(accepted); late.resolve(page([{ ...pending, jobId: 'old-job' }])); await tick();
    expect(job()).toEqual(pending); expect(observer.getSnapshot().jobId).toBe('job-1'); expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
});
