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
const setup = (accountId = 'account-a') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const service = { getGenerationJobs: vi.fn().mockResolvedValue(page([pending])), getGenerationStatus: vi.fn().mockResolvedValue(pending), cancelGenerationJob: vi.fn().mockResolvedValue({ ...pending, status: 'CANCELLED' }) };
  const observer = new GenerationObserver(accountId, client, service);
  clients.push(client); observers.push(observer);
  return { client, service, observer, job: () => client.getQueryData<QuizGenerationStatus>(generationStatusKey(accountId, observer.getSnapshot().jobId)) };
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
  it('marks a result whose ID is supplied by cancellation reconciliation and does not restore an acknowledged marker on another read', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    service.cancelGenerationJob.mockResolvedValue({ ...complete, generatedQuizId: null });
    service.getGenerationStatus.mockResolvedValue(complete);
    await observer.cancel();
    expect(observer.getSnapshot().newQuizIds).toEqual(['quiz-1']);
    observer.acknowledge('quiz-1'); await observer.refresh();
    expect(observer.getSnapshot().newQuizIds).toEqual([]);
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
  it('releases cancellation when a new accepted job replaces the job whose status is still being read', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    const oldRead = deferred<QuizGenerationStatus>();
    service.getGenerationStatus.mockReturnValueOnce(oldRead.promise).mockResolvedValue({ ...pending, jobId: 'new-job' });
    const reading = observer.refresh(); const cancelling = observer.cancel();
    observer.accept({ ...accepted, jobId: 'new-job' });
    oldRead.resolve(complete); await reading; await cancelling; await tick(30_000);
    expect(observer.getSnapshot().cancelling).toBe(false);
    expect(service.getGenerationStatus).toHaveBeenCalledWith('new-job', expect.any(AbortSignal));
    expect(service.cancelGenerationJob).not.toHaveBeenCalled();
  });
  it('retains recovery discovery through a status Retry-After deadline instead of polling the old job', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 })).mockResolvedValue(complete);
    await observer.refresh();
    service.getGenerationJobs.mockResolvedValue(page([{ ...pending, jobId: 'new-job' }]));
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    await tick(119_999); expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot().jobId).toBe('new-job');
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each(['before-discovery', 'after-discovery'] as const)('retains newer lost-start recovery when an old start receipt arrives %s', async receiptTiming => {
    const oldResponse = deferred<QuizGenerationResponse>();
    const oldPost = vi.fn().mockReturnValue(oldResponse.promise);
    const oldStarting = generationOperations.start('account-a', 'wizard', 'text', oldPost);
    const { observer, service, job } = setup(); observer.start(); await tick();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job', progressPercentage: 12 };
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 }))
      .mockImplementation(async jobId => jobId === newerJob.jobId ? newerJob : complete);
    await observer.refresh();
    // The server finishes job-1 before accepting new-job. Only the old POST's
    // response is delayed; losing the new POST's response requires discovery.
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    const newPost = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', newPost).catch(() => undefined);
    await tick(119_999); expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    if (receiptTiming === 'after-discovery') await tick(1);
    oldResponse.resolve(accepted); await oldStarting;
    if (receiptTiming === 'before-discovery') await tick(1);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, discovered: true, error: null });
    expect(job()).toEqual(newerJob);
    await tick(5_000);
    expect(service.getGenerationStatus).toHaveBeenLastCalledWith(newerJob.jobId, expect.any(AbortSignal));
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(oldPost).toHaveBeenCalledTimes(1); expect(newPost).toHaveBeenCalledTimes(1);
    expect(generationOperations.getSnapshot().pending.wizard?.jobId).toBe('job-1');
    expect(generationOperations.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
  });
  it('observes a newer accepted start even while the cached earlier job still appears active', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    // The previous job has finished on the server, but its next status read has
    // not happened yet when the user explicitly starts another generation.
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationStatus.mockResolvedValue(newerJob);
    const post = vi.fn().mockResolvedValue({ ...accepted, jobId: newerJob.jobId });
    await generationOperations.start('account-a', 'upload-tab', 'upload', post); await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationStatus.mock.calls.every(call => call[0] === newerJob.jobId)).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('keeps observing a delayed accepted start when a later command fails before dispatch', async () => {
    const { observer, service, job } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Unavailable'); });
    const blockedPost = vi.fn();
    await expect(generationOperations.start('account-a', 'upload-tab', 'upload', blockedPost)).rejects.toThrow('Cannot save');
    write.mockRestore();
    response.resolve(accepted); await starting; await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe(accepted.jobId);
    expect(job()).toEqual(pending);
    expect(service.getGenerationStatus).toHaveBeenCalledWith(accepted.jobId, expect.any(AbortSignal));
    expect(post).toHaveBeenCalledTimes(1); expect(blockedPost).not.toHaveBeenCalled();
  });
  it.each(['before-discovery', 'after-discovery'] as const)('keeps newer recovery when an uncached old start receipt arrives %s', async receiptTiming => {
    const { observer, service, client, job } = setup();
    service.getGenerationJobs.mockResolvedValueOnce(page([]));
    observer.start(); await tick();
    const oldResponse = deferred<QuizGenerationResponse>();
    const oldPost = vi.fn().mockReturnValue(oldResponse.promise);
    const oldStarting = generationOperations.start('account-a', 'wizard', 'text', oldPost);
    // The old job completes on the server before the second start is accepted,
    // but no response or list read has introduced that old job to this client.
    const oldCompleted: QuizGenerationStatus = { ...complete, jobId: 'old-job', generatedQuizId: 'old-quiz' };
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job', progressPercentage: 12 };
    const discovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise);
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newerJob.jobId ? newerJob : oldCompleted);
    const newPost = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', newPost).catch(() => undefined);
    await tick();
    if (receiptTiming === 'after-discovery') {
      discovery.resolve(page([newerJob])); await observer.refresh();
    }
    expect(client.getQueryData(generationStatusKey('account-a', 'old-job'))).toBeUndefined();
    oldResponse.resolve({ ...accepted, jobId: 'old-job', status: 'PROCESSING' });
    await oldStarting; await tick();
    expect(observer.getSnapshot().jobId).toBe(receiptTiming === 'after-discovery' ? newerJob.jobId : null);
    if (receiptTiming === 'before-discovery') {
      discovery.resolve(page([newerJob])); await observer.refresh();
    }
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, discovered: true, error: null });
    expect(job()).toEqual(newerJob);
    await tick(5_000);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(newerJob.jobId, expect.any(AbortSignal));
    const newerCompleted: QuizGenerationStatus = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted);
    await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    expect(observer.getSnapshot().newQuizIds).toEqual(['new-quiz']);
    await tick(120_000);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(oldPost).toHaveBeenCalledTimes(1); expect(newPost).toHaveBeenCalledTimes(1);
    expect(generationOperations.getSnapshot().pending.wizard?.jobId).toBe('old-job');
    expect(generationOperations.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
  });
  it.each(['hidden', 'offline'] as const)('suspends a multi-page discovery when the tab becomes %s and restarts on resume', async mode => {
    const { observer, service } = setup();
    const firstPage = deferred<GenerationJobPage>();
    const oldComplete = { ...complete, jobId: 'old-job' };
    service.getGenerationJobs.mockReturnValueOnce(firstPage.promise)
      .mockResolvedValueOnce(page([oldComplete], 0, 2, 1)).mockResolvedValueOnce(page([pending], 1, 2, 1));
    observer.start(); const discovering = observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    firstPage.resolve(page([oldComplete], 0, 2, 1)); await discovering; await tick(30_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(observer.getSnapshot()).toMatchObject({ paused: true, discovered: false, error: null });
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick();
    expect(service.getGenerationJobs.mock.calls.map(call => call[0])).toEqual([0, 0, 1]);
    expect(observer.getSnapshot().jobId).toBe('job-1');
  });
  it('retries discovery after Retry-After when visibility resumes before the deadline', async () => {
    const { observer, service } = setup();
    service.getGenerationJobs.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 60 })).mockResolvedValue(page([]));
    observer.start(); await tick();
    visibility('hidden'); visibility('visible'); await tick(59_999);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    await tick(1); expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    await tick(120_000); expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot()).toMatchObject({ discovered: true, jobId: null, error: null });
  });
  it('applies a terminal same-key replay before a delayed old status response can reach the cache', async () => {
    await generationOperations.start('account-a', 'wizard', 'text', async () => { throw new ApplicationError({ category: 'network' }); }).catch(() => undefined);
    const originalKey = generationOperations.getSnapshot().pending.wizard?.key;
    const { observer, service, client } = setup(); observer.start(); await tick();
    const oldRead = deferred<QuizGenerationStatus>();
    service.getGenerationStatus.mockReturnValueOnce(oldRead.promise).mockResolvedValue({ ...pending, status: 'FAILED' });
    const reading = observer.refresh();
    const replay = vi.fn(async () => ({ ...accepted, status: 'FAILED' as const }));
    await generationOperations.start('account-a', 'wizard', 'text', replay);
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toMatchObject({ status: 'FAILED' });
    const cachedStatuses: string[] = [];
    const off = client.getQueryCache().subscribe(() => {
      const job = client.getQueryData<QuizGenerationStatus>(generationStatusKey('account-a', 'job-1'));
      if (job) cachedStatuses.push(job.status);
    });
    oldRead.resolve(pending); await reading; await tick(120_000); off();
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toMatchObject({ status: 'FAILED' });
    expect(cachedStatuses).not.toContain('PROCESSING');
    expect(replay).toHaveBeenCalledExactlyOnceWith(originalKey);
    expect(generationOperations.getSnapshot().pending.wizard?.jobStatus).toBe('FAILED');
  });
  it.each(['COMPLETED', 'FAILED', 'CANCELLED'] as const)('preserves %s when an old GET and a terminal replay settle together, even if reconciliation fails', async status => {
    await generationOperations.start('account-a', 'wizard', 'text', async () => { throw new ApplicationError({ category: 'network' }); }).catch(() => undefined);
    const originalKey = generationOperations.getSnapshot().pending.wizard?.key;
    const { observer, service, client, job } = setup(); observer.start(); await tick();
    const oldRead = deferred<QuizGenerationStatus>();
    const replayResponse = deferred<QuizGenerationResponse>();
    service.getGenerationStatus.mockReturnValueOnce(oldRead.promise).mockRejectedValue(new ApplicationError({ category: 'server', status: 503 }));
    const reading = observer.refresh();
    const replay = vi.fn().mockReturnValue(replayResponse.promise);
    const replaying = generationOperations.start('account-a', 'wizard', 'text', replay);
    let terminalReceived = false;
    const cachedStatuses: string[] = [];
    const off = client.getQueryCache().subscribe(() => {
      const cached = client.getQueryData<QuizGenerationStatus>(generationStatusKey('account-a', 'job-1'));
      if (cached?.status === status) terminalReceived = true;
      if (terminalReceived && cached) cachedStatuses.push(cached.status);
    });
    // Resolve GET first: its queryFn resumes before the command receipt, but
    // TanStack Query commits that result after the receipt has reached the cache.
    oldRead.resolve(pending);
    replayResponse.resolve({ ...accepted, status });
    await Promise.all([reading, replaying]); await tick();
    expect(job()).toMatchObject({ status });
    expect(observer.getSnapshot().error?.status).toBe(503);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    await tick(120_000); off();
    expect(cachedStatuses).toContain(status);
    expect(cachedStatuses).not.toContain('PROCESSING');
    expect(job()).toMatchObject({ status });
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(replay).toHaveBeenCalledExactlyOnceWith(originalKey);
    expect(generationOperations.getSnapshot().pending.wizard?.jobStatus).toBe(status);
    expect(service.cancelGenerationJob).not.toHaveBeenCalled();
  });
  it('retains recovery discovery while a previous cancellation awaits its response', async () => {
    const { observer, service, client } = setup(); observer.start(); await tick();
    const deletion = deferred<QuizGenerationStatus>(); service.cancelGenerationJob.mockReturnValueOnce(deletion.promise);
    const cancelling = observer.cancel(); await tick();
    service.getGenerationJobs.mockResolvedValue(page([{ ...pending, jobId: 'new-job' }]));
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    deletion.resolve({ ...pending, status: 'CANCELLED' }); await cancelling; await tick();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot()).toMatchObject({ jobId: 'new-job', cancelling: false });
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toMatchObject({ status: 'CANCELLED' });
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('does not discard an explicitly requested cancellation when unrelated recovery invalidates its preceding status read', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    const status = deferred<QuizGenerationStatus>(); service.getGenerationStatus.mockReturnValueOnce(status.promise);
    const reading = observer.refresh(); const cancelling = observer.cancel();
    service.getGenerationJobs.mockResolvedValue(page([{ ...pending, jobId: 'new-job' }]));
    await generationOperations.start('account-a', 'upload-tab', 'upload', async () => { throw new ApplicationError({ category: 'network' }); }).catch(() => undefined);
    status.resolve(pending); await reading; await cancelling; await tick();
    expect(service.cancelGenerationJob).toHaveBeenCalledExactlyOnceWith('job-1', expect.any(AbortSignal));
    expect(observer.getSnapshot()).toMatchObject({ jobId: 'new-job', cancelling: false });
  });
  it('keeps a status Retry-After deadline for recovery discovery even when cancellation succeeds', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 }));
    await observer.refresh();
    const deletion = deferred<QuizGenerationStatus>(); service.cancelGenerationJob.mockReturnValueOnce(deletion.promise);
    const cancelling = observer.cancel(); await tick();
    service.getGenerationJobs.mockResolvedValue(page([{ ...pending, jobId: 'new-job' }]));
    await generationOperations.start('account-a', 'upload-tab', 'upload', async () => { throw new ApplicationError({ category: 'network' }); }).catch(() => undefined);
    deletion.resolve({ ...pending, status: 'CANCELLED' }); await cancelling; await tick(119_999);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot().jobId).toBe('new-job');
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('reconciles completion returned by cancellation after the existing status Retry-After expires', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 })).mockResolvedValue(complete);
    await observer.refresh(); service.cancelGenerationJob.mockResolvedValue(complete);
    await observer.cancel(); await tick(119_999);
    expect(job()).toEqual(complete);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    await tick(1); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    await tick(120_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('does not send cancellation if the outstanding status read confirms completion first', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const read = deferred<QuizGenerationStatus>(); service.getGenerationStatus.mockReturnValueOnce(read.promise);
    const reading = observer.refresh(); const cancelling = observer.cancel();
    read.resolve(complete); await reading; await cancelling; await tick(120_000);
    expect(job()).toEqual(complete);
    expect(observer.getSnapshot().cancelling).toBe(false);
    expect(service.cancelGenerationJob).not.toHaveBeenCalled();
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it('ignores the response of an old cancellation after a new accepted job replaces it', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const deletion = deferred<QuizGenerationStatus>(); service.cancelGenerationJob.mockReturnValueOnce(deletion.promise);
    const cancelling = observer.cancel(); await tick();
    service.getGenerationStatus.mockResolvedValue({ ...pending, jobId: 'new-job' });
    observer.accept({ ...accepted, jobId: 'new-job' });
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
    deletion.resolve(complete); await cancelling; await tick();
    expect(job()).toMatchObject({ jobId: 'new-job', status: 'PROCESSING' });
    expect(observer.getSnapshot()).toMatchObject({ cancelling: false, newQuizIds: [], cancelError: null });
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith('new-job', expect.any(AbortSignal));
  });
  it('preserves a terminal replay received while DELETE is awaiting its response', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const deletion = deferred<QuizGenerationStatus>(); service.cancelGenerationJob.mockReturnValueOnce(deletion.promise);
    const cancelling = observer.cancel(); await tick();
    service.getGenerationStatus.mockResolvedValue(complete);
    observer.accept({ ...accepted, status: 'COMPLETED' });
    expect(job()?.status).toBe('COMPLETED');
    deletion.resolve({ ...pending, status: 'CANCELLED' }); await cancelling; await tick();
    expect(job()).toEqual(complete);
    expect(observer.getSnapshot()).toMatchObject({ cancelling: false, newQuizIds: ['quiz-1'] });
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
  });
  it('does not downgrade a terminal receipt even if the following exact-job read still reports PROCESSING', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    observer.accept({ ...accepted, status: 'FAILED' }); await tick(120_000);
    expect(job()?.status).toBe('FAILED');
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it.each(['COMPLETED', 'FAILED', 'CANCELLED'] as const)('does not start a retry loop for a confirmed %s receipt if reconciliation fails', async status => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'server', status: 503 }));
    observer.accept({ ...accepted, status }); await tick(120_000);
    expect(job()?.status).toBe(status);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it('refreshes owned quizzes as soon as a terminal start receipt confirms completion, without waiting for reconnect', async () => {
    const { observer, service, client } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    observer.start(); await tick(); online(false);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    observer.accept({ ...accepted, status: 'COMPLETED' }); await tick();
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ownedQuizzesKey('account-a') });
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
    expect(observer.getSnapshot().newQuizIds).toEqual([]);
  });
  it('continues discovery beyond a stale active row whose job already has a confirmed terminal result', async () => {
    const { observer, service, client } = setup();
    client.setQueryData(generationStatusKey('account-a', 'job-1'), complete);
    service.getGenerationJobs.mockResolvedValueOnce(page([pending], 0, 2, 1))
      .mockResolvedValueOnce(page([{ ...pending, jobId: 'new-job' }], 1, 2, 1));
    observer.start(); await tick();
    expect(service.getGenerationJobs.mock.calls.map(call => call[0])).toEqual([0, 1]);
    expect(observer.getSnapshot().jobId).toBe('new-job');
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toEqual(complete);
  });
  it('does not let an old terminal replay displace a different active job', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    observer.accept({ ...accepted, jobId: 'old-job', status: 'FAILED' }); await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe('job-1');
    expect(job()?.status).toBe('PROCESSING');
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith('job-1', expect.any(AbortSignal));
  });
  it('does not let an earlier active receipt of a cached terminal job displace the current active job', async () => {
    const { observer, service, client } = setup();
    client.setQueryData(generationStatusKey('account-a', 'old-job'), { ...complete, jobId: 'old-job' });
    observer.start(); await tick(); observer.accept({ ...accepted, jobId: 'old-job' }); await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe('job-1');
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith('job-1', expect.any(AbortSignal));
  });
  it.each(['hidden', 'offline'] as const)('does not start the known-job fallback of an empty discovery while %s', async mode => {
    await generationOperations.start('account-a', 'wizard', 'text', async () => accepted);
    const { observer, service } = setup(); const discovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise);
    service.getGenerationStatus.mockResolvedValue(complete);
    observer.start(); const discovering = observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    discovery.resolve(page([])); await discovering; await tick(30_000);
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick();
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(observer.getSnapshot().newQuizIds).toEqual(['quiz-1']);
  });
  it('retains discovery of a lost start until reconnect without another generation POST', async () => {
    const { observer, service } = setup(); service.getGenerationJobs.mockResolvedValueOnce(page([]));
    observer.start(); await tick(); online(false);
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    await tick(120_000); expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    online(true); await tick();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(observer.getSnapshot().jobId).toBe('job-1');
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each(['status', 'cancel'] as const)('drops queued recovery and a late %s response when another account starts observing the same fixture ID', async operation => {
    establishSession('test-a', 'refresh-a');
    const a = setup(); a.observer.start(); await tick();
    const late = deferred<QuizGenerationStatus>();
    const invalidateA = vi.spyOn(a.client, 'invalidateQueries');
    if (operation === 'status') a.service.getGenerationStatus.mockReturnValueOnce(late.promise);
    else a.service.cancelGenerationJob.mockReturnValueOnce(late.promise);
    const reading = operation === 'status' ? a.observer.refresh() : a.observer.cancel(); await tick();
    await generationOperations.start('account-a', 'upload-tab', 'upload', async () => { throw new ApplicationError({ category: 'network' }); }).catch(() => undefined);
    establishSession('test-b', 'refresh-b', 'account-switch');
    const b = setup('account-b'); b.observer.start(); await tick();
    late.resolve(complete); await reading; await tick(120_000);
    expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(invalidateA).not.toHaveBeenCalled();
    expect(b.job()).toEqual(pending);
    expect(b.observer.getSnapshot().newQuizIds).toEqual([]);
    expect(b.client.getQueryData(generationStatusKey('account-a', 'job-1'))).toBeUndefined();
    expect(generationOperations.getSnapshot().pending['upload-tab']).toBeUndefined();
  });
});
