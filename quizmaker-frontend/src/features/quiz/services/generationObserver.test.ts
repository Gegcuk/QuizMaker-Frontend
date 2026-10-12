import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { QuizGenerationResponse, QuizGenerationStatus } from '@/types';
import { ApplicationError } from '@/utils/applicationError';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { GenerationOperations, generationOperations } from './generationOperations';
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
  it.each(['hidden', 'offline'] as const)('discovers newer work from another tab when returning from %s with a stale active job', async mode => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    // The server finishes job-1, then the other tab starts new-job. Its command
    // owner does not share this observer's events or local dispatch counter.
    const otherTab = new GenerationOperations();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job', progressPercentage: 12 };
    const post = vi.fn().mockResolvedValue({ ...accepted, jobId: newerJob.jobId });
    await otherTab.start('account-a', 'upload-tab', 'upload', post);
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newerJob.jobId ? newerJob : complete);
    await tick(60_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick();
    expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    await tick(5_000);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(newerJob.jobId, expect.any(AbortSignal));
    const newerCompleted = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted); await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    expect(observer.getSnapshot().newQuizIds).toEqual(['new-quiz']);
    await tick(120_000);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(post).toHaveBeenCalledTimes(1);
    expect(service.cancelGenerationJob).not.toHaveBeenCalled();
  });
  it.each(['hidden', 'offline'] as const)('discards a pre-pause status response before discovering work on return from %s', async mode => {
    const { observer, service, client, job } = setup(); observer.start(); await tick();
    const oldRead = deferred<QuizGenerationStatus>();
    service.getGenerationStatus.mockReturnValueOnce(oldRead.promise);
    const reading = observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    if (mode === 'hidden') visibility('visible'); else online(true);
    // Additional signals while the lane is busy must join the queued traversal.
    window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange'));
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    oldRead.resolve(complete); await reading; await tick();
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, error: null, newQuizIds: [] });
    expect(job()).toEqual(newerJob);
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toEqual(pending);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    await tick(5_000);
    expect(service.getGenerationStatus.mock.calls.map(call => call[0])).toEqual(['job-1', 'new-job']);
  });
  it('does not let a pre-resume collection snapshot satisfy fresh discovery or duplicate simultaneous resume events', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const oldDiscovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(oldDiscovery.promise);
    const discovering = observer.refresh(true);
    visibility('hidden'); online(false); visibility('visible');
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    online(true); window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange'));
    oldDiscovery.resolve(page([])); await discovering; await tick();
    expect(job()).toEqual(newerJob);
    expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(3);
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
  });
  it.each(['hidden', 'offline'] as const)('discovers new work on return from %s after the old exact job returned 404', async mode => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick();
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null });
    expect(job()).toEqual(newerJob);
    await tick(5_000);
    expect(service.getGenerationStatus.mock.calls.map(call => call[0])).toEqual(['job-1', 'new-job']);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
  });
  it.each(['hidden', 'offline'] as const)('keeps Retry-After before discovering another tab\'s work on return from %s', async mode => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 }));
    await observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick(119_999);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(job()).toEqual(newerJob);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, error: null });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it.each(['hidden', 'offline'] as const)('reconciles the old completed result once when resume from %s finds no active work', async mode => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    service.getGenerationJobs.mockResolvedValue(page([]));
    service.getGenerationStatus.mockResolvedValue(complete);
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick(120_000);
    expect(job()).toEqual(complete);
    expect(observer.getSnapshot().newQuizIds).toEqual(['quiz-1']);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
  });
  it.each(['hidden', 'offline'] as const)('rejects a late resume discovery after account replacement on return from %s', async mode => {
    establishSession('test-a', 'refresh-a');
    const a = setup(); a.observer.start(); await tick();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const discovery = deferred<GenerationJobPage>();
    a.service.getGenerationJobs.mockReturnValueOnce(discovery.promise);
    if (mode === 'hidden') visibility('visible'); else online(true);
    await tick();
    expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(2);
    establishSession('test-b', 'refresh-b', 'account-switch');
    const b = setup('account-b'); b.observer.start(); await tick();
    discovery.resolve(page([{ ...pending, jobId: 'private-job-a', progressPercentage: 91 }])); await tick();
    expect(a.client.getQueryData(generationStatusKey('account-a', 'private-job-a'))).toBeUndefined();
    expect(b.client.getQueryData(generationStatusKey('account-a', 'private-job-a'))).toBeUndefined();
    expect(b.job()).toEqual(pending);
    expect(b.observer.getSnapshot()).toMatchObject({ newQuizIds: [], error: null, cancelError: null });
    expect(a.service.getGenerationStatus).not.toHaveBeenCalled();
  });
  it.each(['hidden', 'offline'] as const)('retains mandatory resume discovery when the old start receipt matches the stale selected job on return from %s', async mode => {
    const { observer, service, job } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    observer.start(); await tick();
    const receipt = deferred<QuizGenerationResponse>();
    const oldPost = vi.fn().mockReturnValue(receipt.promise);
    const oldStarting = generationOperations.start('account-a', 'wizard', 'text', oldPost);
    await tick();
    // Owned discovery confirms job-1 before its original POST response arrives.
    service.getGenerationJobs.mockResolvedValue(page([pending]));
    window.dispatchEvent(new Event('online')); await tick();
    const status = deferred<QuizGenerationStatus>();
    service.getGenerationStatus.mockReturnValueOnce(status.promise);
    const reading = observer.refresh();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const otherTab = new GenerationOperations();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    const newPost = vi.fn().mockResolvedValue({ ...accepted, jobId: newerJob.jobId });
    await otherTab.start('account-a', 'upload-tab', 'upload', newPost);
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newerJob.jobId ? newerJob : complete);
    if (mode === 'hidden') visibility('visible'); else online(true);
    // This older receipt is still the latest local dispatch, but another tab
    // has newer work. It must not satisfy the queued post-resume collection read.
    receipt.resolve(accepted); await oldStarting;
    status.resolve(complete); await reading; await tick();
    expect(job()).toEqual(newerJob);
    expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(3);
    await tick(5_000);
    expect(service.getGenerationStatus.mock.calls.map(call => call[0])).toEqual(['job-1', 'new-job']);
    expect(oldPost).toHaveBeenCalledTimes(1); expect(newPost).toHaveBeenCalledTimes(1);
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
  it.each(['hidden', 'offline'] as const)('keeps resume discovery after a late old cancellation 404 on return from %s', async mode => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    let rejectCancellation!: (error: unknown) => void;
    service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
    const cancelling = observer.cancel(); await tick();
    if (mode === 'hidden') visibility('hidden'); else online(false);
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    if (mode === 'hidden') visibility('visible'); else online(true);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 })); await cancelling; await tick();
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null, cancelError: null, cancelling: false });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.cancelGenerationJob).toHaveBeenCalledExactlyOnceWith('job-1', expect.any(AbortSignal));
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
  });
  it.each([401, 403, 404])('keeps collection HTTP %s stopped after resume replaces an old exact-job 404', async status => {
    const { observer, service } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh(); visibility('hidden');
    service.getGenerationJobs.mockRejectedValueOnce(new ApplicationError({ category: status === 404 ? 'not-found' : status === 401 ? 'authentication' : 'authorization', status }));
    visibility('visible'); await tick();
    expect(observer.getSnapshot().error?.status).toBe(status);
    expect(observer.getSnapshot().accessStopped).toBe(true);
    visibility('hidden'); visibility('visible'); online(false); online(true); await tick(120_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
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
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    await tick(1); expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    visibility('hidden'); await tick(20_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    visibility('visible'); await tick(); expect(service.getGenerationJobs).toHaveBeenCalledTimes(3);
    online(false); await tick(20_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(3);
    online(true); await tick(); expect(service.getGenerationJobs).toHaveBeenCalledTimes(4);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    await tick(5_000); expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(4);
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
  it.each([
    ['before-observer', 'before-discovery'], ['before-observer', 'after-discovery'],
    ['after-observer', 'before-discovery'], ['after-observer', 'after-discovery'],
  ] as const)('keeps another tab\'s active job when an old POST dispatched %s replies %s', async (dispatchTiming, receiptTiming) => {
    const { observer, service, client, job } = setup();
    service.getGenerationJobs.mockResolvedValue(page([]));
    if (dispatchTiming === 'after-observer') { observer.start(); await tick(); }
    const oldResponse = deferred<QuizGenerationResponse>();
    const oldPost = vi.fn().mockReturnValue(oldResponse.promise);
    const oldStarting = generationOperations.start('account-a', 'wizard', 'text', oldPost);
    if (dispatchTiming === 'before-observer') { observer.start(); await tick(); }
    // Each browser tab has its own command owner and dispatch counter. The old
    // job has finished before the other tab's explicit start is accepted.
    const otherTab = new GenerationOperations();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job', progressPercentage: 12 };
    const newPost = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await otherTab.start('account-a', 'upload-tab', 'upload', newPost).catch(() => undefined);
    const discovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise).mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newerJob.jobId ? newerJob : { ...complete, jobId: 'old-job', generatedQuizId: 'old-quiz' });
    window.dispatchEvent(new Event('online')); await tick();
    if (receiptTiming === 'after-discovery') {
      discovery.resolve(page([newerJob])); await observer.refresh();
      expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    }
    expect(client.getQueryData(generationStatusKey('account-a', 'old-job'))).toBeUndefined();
    oldResponse.resolve({ ...accepted, jobId: 'old-job', status: 'PROCESSING' });
    await oldStarting; await tick();
    expect(observer.getSnapshot().jobId).toBe(receiptTiming === 'after-discovery' ? newerJob.jobId : null);
    if (receiptTiming === 'before-discovery') { discovery.resolve(page([newerJob])); await tick(); }
    await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe(newerJob.jobId);
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(newerJob.jobId, expect.any(AbortSignal));
    const newerCompleted = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted);
    await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    expect(observer.getSnapshot().newQuizIds).toEqual(['new-quiz']);
    await tick(120_000);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(2);
    expect(oldPost).toHaveBeenCalledTimes(1); expect(newPost).toHaveBeenCalledTimes(1);
    expect(generationOperations.getSnapshot().pending.wizard?.jobId).toBe('old-job');
    expect(otherTab.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
  });
  it('reconciles the sole completed receipt during discovery when its dispatch predates the observer', async () => {
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    const { observer, service, job } = setup();
    const discovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise).mockResolvedValue(page([]));
    service.getGenerationStatus.mockResolvedValue(complete);
    observer.start(); await tick();
    response.resolve({ ...accepted, status: 'COMPLETED' }); await starting;
    discovery.resolve(page([])); await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: complete.jobId, newQuizIds: [complete.generatedQuizId] });
    expect(job()).toEqual(complete);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(complete.jobId, expect.any(AbortSignal));
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each(['PROCESSING', 'COMPLETED'] as const)('reconciles a delayed POST that really becomes the newest job even if it is already %s on discovery', async status => {
    const { observer, service, job } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    const otherTab = new GenerationOperations();
    const otherJob: QuizGenerationStatus = { ...pending, jobId: 'other-tab-job' };
    await otherTab.start('account-a', 'upload-tab', 'upload', async () => ({ ...accepted, jobId: otherJob.jobId }));
    service.getGenerationJobs.mockResolvedValue(page([otherJob]));
    await observer.refresh(true);
    expect(observer.getSnapshot().jobId).toBe(otherJob.jobId);
    // This POST reached the server later: the discovered job is now finished,
    // and the server confirms the received job is the actual current work.
    const newestJob: QuizGenerationStatus = { ...pending, jobId: 'delayed-new-job', status,
      ...(status === 'COMPLETED' ? { generatedQuizId: 'delayed-new-quiz', progressPercentage: 100 } : {}) };
    service.getGenerationJobs.mockResolvedValue(page(status === 'PROCESSING' ? [newestJob] : []));
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newestJob.jobId
      ? newestJob : { ...complete, jobId: otherJob.jobId, generatedQuizId: 'other-quiz' });
    response.resolve({ ...accepted, jobId: newestJob.jobId }); await starting; await tick(5_000);
    expect(observer.getSnapshot().jobId).toBe(newestJob.jobId);
    expect(job()).toEqual(newestJob);
    expect(service.getGenerationStatus).toHaveBeenCalledWith(newestJob.jobId, expect.any(AbortSignal));
    if (status === 'COMPLETED') expect(observer.getSnapshot().newQuizIds).toEqual(['delayed-new-quiz']);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('keeps exact receipt reconciliation queued when an older response matches the still-observed job', async () => {
    const { observer, service, job } = setup(); service.getGenerationJobs.mockResolvedValue(page([]));
    observer.start(); await tick();
    const oldResponse = deferred<QuizGenerationResponse>();
    const oldPost = vi.fn().mockReturnValue(oldResponse.promise);
    const oldStarting = generationOperations.start('account-a', 'wizard', 'text', oldPost);
    service.getGenerationJobs.mockResolvedValue(page([pending])); await observer.refresh(true);
    const newResponse = deferred<QuizGenerationResponse>();
    const newPost = vi.fn().mockReturnValue(newResponse.promise);
    const newStarting = generationOperations.start('account-a', 'upload-tab', 'upload', newPost);
    await observer.refresh(true);
    const discovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise).mockResolvedValue(page([]));
    const result: QuizGenerationStatus = { ...complete, jobId: 'new-job', generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockImplementation(async jobId => jobId === result.jobId ? result : complete);
    newResponse.resolve({ ...accepted, jobId: result.jobId }); await newStarting; await tick();
    // The old job's delayed POST now replies while fresh discovery is pending.
    // It still matches the selected ID but cannot satisfy the newer receipt.
    oldResponse.resolve(accepted); await oldStarting;
    discovery.resolve(page([])); await tick(120_000);
    expect(job()).toEqual(result);
    expect(observer.getSnapshot().newQuizIds).toEqual(['new-quiz']);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(result.jobId, expect.any(AbortSignal));
    expect(oldPost).toHaveBeenCalledTimes(1); expect(newPost).toHaveBeenCalledTimes(1);
  });
  it('restores the new completed result when its same-key terminal replay beats recovery discovery', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const recovery = deferred<GenerationJobPage>();
    service.getGenerationJobs.mockReturnValueOnce(recovery.promise).mockResolvedValue(page([]));
    const initialPost = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'wizard', 'text', initialPost).catch(() => undefined);
    const key = initialPost.mock.calls[0][0];
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    const newerCompleted: QuizGenerationStatus = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockImplementation(async jobId => jobId === newerJob.jobId ? newerCompleted : complete);
    const replay = vi.fn().mockResolvedValue({ ...accepted, jobId: newerJob.jobId, status: 'COMPLETED' });
    await generationOperations.start('account-a', 'wizard', 'text', replay);
    recovery.resolve(page([newerJob])); await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, newQuizIds: ['new-quiz'] });
    expect(job()).toEqual(newerCompleted);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(newerJob.jobId, expect.any(AbortSignal));
    expect(initialPost).toHaveBeenCalledTimes(1); expect(replay).toHaveBeenCalledExactlyOnceWith(key);
    expect(generationOperations.getSnapshot().pending.wizard).toMatchObject({ jobId: newerJob.jobId, jobStatus: 'COMPLETED' });
  });
  it('observes a confirmed new receipt after a different previously discovered job returns 404', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    const otherTab = new GenerationOperations();
    const otherJob: QuizGenerationStatus = { ...pending, jobId: 'other-tab-job' };
    await otherTab.start('account-a', 'upload-tab', 'upload', async () => ({ ...accepted, jobId: otherJob.jobId }));
    service.getGenerationJobs.mockResolvedValue(page([otherJob])); await observer.refresh(true);
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh();
    expect(observer.getSnapshot().accessStopped).toBe(true);
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    response.resolve({ ...accepted, jobId: newerJob.jobId }); await starting; await tick(5_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationStatus).toHaveBeenLastCalledWith(newerJob.jobId, expect.any(AbortSignal));
    const newerCompleted = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted); await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    const reads = service.getGenerationStatus.mock.calls.length;
    await tick(120_000);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(reads);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('keeps a new confirmed receipt recoverable when an earlier cancellation returns 404 later', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    const otherTab = new GenerationOperations();
    const otherJob: QuizGenerationStatus = { ...pending, jobId: 'other-tab-job' };
    await otherTab.start('account-a', 'upload-tab', 'upload', async () => ({ ...accepted, jobId: otherJob.jobId }));
    service.getGenerationJobs.mockResolvedValue(page([otherJob])); await observer.refresh(true);
    let rejectCancellation!: (error: unknown) => void;
    service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
    const cancelling = observer.cancel(); await tick();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    response.resolve({ ...accepted, jobId: newerJob.jobId }); await starting;
    rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 }));
    await cancelling; await tick(5_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null, cancelling: false });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationStatus).toHaveBeenLastCalledWith(newerJob.jobId, expect.any(AbortSignal));
    expect(service.cancelGenerationJob).toHaveBeenCalledExactlyOnceWith(otherJob.jobId, expect.any(AbortSignal));
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('restores a lost new start after the previously observed job returns 404', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    let rejectStart!: (error: unknown) => void;
    const post = vi.fn().mockReturnValue(new Promise<QuizGenerationResponse>((_, reject) => { rejectStart = reject; }));
    const starting = generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh();
    expect(observer.getSnapshot().accessStopped).toBe(true);
    // The old job is gone. The backend accepted new work, but its POST response
    // is lost: recovery has no exact new ID and must read the owned collection.
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    rejectStart(new ApplicationError({ category: 'network' })); await starting; await tick();
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(generationOperations.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
    const newerCompleted = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted); await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    expect(observer.getSnapshot().newQuizIds).toEqual(['new-quiz']);
    await tick(120_000);
    expect(service.getGenerationStatus.mock.calls.map(call => call[0])).toEqual(['job-1', 'new-job']);
    expect(post).toHaveBeenCalledTimes(1);
    expect(service.cancelGenerationJob).not.toHaveBeenCalled();
  });
  it('restores a lost new start when the old cancellation returns 404 after recovery was queued', async () => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    let rejectCancellation!: (error: unknown) => void;
    service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
    const cancelling = observer.cancel(); await tick();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 }));
    await cancelling; await tick();
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null, cancelError: null, cancelling: false });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(generationOperations.getSnapshot().pending['upload-tab']?.jobId).toBeUndefined();
    const newerCompleted = { ...complete, jobId: newerJob.jobId, generatedQuizId: 'new-quiz' };
    service.getGenerationStatus.mockResolvedValue(newerCompleted); await tick(5_000);
    expect(job()).toEqual(newerCompleted);
    await tick(120_000);
    expect(service.getGenerationStatus).toHaveBeenCalledExactlyOnceWith(newerJob.jobId, expect.any(AbortSignal));
    expect(service.cancelGenerationJob).toHaveBeenCalledExactlyOnceWith('job-1', expect.any(AbortSignal));
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each(['status-first', 'cancel-last'] as const)('stops reading a missing old job when lost-start recovery finds no active work (%s)', async order => {
    const { observer, service, client } = setup(); observer.start(); await tick();
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    let rejectCancellation!: (error: unknown) => void;
    let cancelling = Promise.resolve();
    if (order === 'status-first') {
      service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
      await observer.refresh();
    } else {
      service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
      cancelling = observer.cancel(); await tick();
    }
    service.getGenerationJobs.mockResolvedValue(page([]));
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    if (order === 'cancel-last') {
      rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 })); await cancelling;
    }
    await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: null, discovered: true, accessStopped: false, error: null, cancelError: null, recoveryNotice: true });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ownedQuizzesKey('account-a') });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(order === 'status-first' ? 1 : 0);
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toBeUndefined();
    // A stale progress screen and an old active receipt cannot resurrect work
    // whose absence was confirmed by both its exact endpoint and the collection.
    observer.watch('job-1'); observer.accept(accepted); await tick(120_000);
    expect(observer.getSnapshot().jobId).toBeNull();
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(order === 'status-first' ? 1 : 0);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('keeps the old job missing across a transient lost-start discovery failure', async () => {
    const { observer, service, client } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValue(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh();
    service.getGenerationJobs.mockRejectedValueOnce(new ApplicationError({ category: 'server', status: 503 })).mockResolvedValue(page([]));
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined); await tick();
    expect(observer.getSnapshot().error?.status).toBe(503);
    await tick(9_999); expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    await tick(1);
    expect(observer.getSnapshot()).toMatchObject({ jobId: null, discovered: true, accessStopped: false, error: null, recoveryNotice: true });
    expect(client.getQueryData(generationStatusKey('account-a', 'job-1'))).toBeUndefined();
    await tick(120_000);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(3);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each([
    ['status', 401], ['status', 403], ['collection', 401], ['collection', 403], ['collection', 404],
  ] as const)('keeps %s HTTP %s stopped when a later start response is lost', async (endpoint, status) => {
    const { observer, service } = setup(); observer.start(); await tick();
    const error = new ApplicationError({ category: status === 404 ? 'not-found' : status === 401 ? 'authentication' : 'authorization', status });
    if (endpoint === 'status') service.getGenerationStatus.mockRejectedValueOnce(error);
    else service.getGenerationJobs.mockRejectedValueOnce(error);
    await observer.refresh(endpoint === 'collection');
    const discoveryReads = service.getGenerationJobs.mock.calls.length;
    const statusReads = service.getGenerationStatus.mock.calls.length;
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    visibility('hidden'); visibility('visible'); online(false); online(true); await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ accessStopped: true, error });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(discoveryReads);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(statusReads);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('does not override a late cancellation HTTP %s with queued lost-start recovery', async status => {
    const { observer, service } = setup(); observer.start(); await tick();
    let rejectCancellation!: (error: unknown) => void;
    service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
    const cancelling = observer.cancel(); await tick();
    const post = vi.fn().mockRejectedValue(new ApplicationError({ category: 'network' }));
    await generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    const error = new ApplicationError({ category: status === 401 ? 'authentication' : 'authorization', status });
    rejectCancellation(error); await cancelling; await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ accessStopped: true, error, cancelling: false });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(service.getGenerationStatus).not.toHaveBeenCalled();
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each(['before-loss', 'after-loss'] as const)('retains Retry-After when the old cancellation 404 arrives %s', async order => {
    const { observer, service, job } = setup(); observer.start(); await tick();
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'rate-limit', status: 429, retryAfterSeconds: 120 }));
    await observer.refresh();
    let rejectCancellation!: (error: unknown) => void;
    service.cancelGenerationJob.mockReturnValueOnce(new Promise<QuizGenerationStatus>((_, reject) => { rejectCancellation = reject; }));
    const cancelling = observer.cancel(); await tick();
    const newerJob: QuizGenerationStatus = { ...pending, jobId: 'new-job' };
    service.getGenerationJobs.mockResolvedValue(page([newerJob]));
    service.getGenerationStatus.mockResolvedValue(newerJob);
    let rejectStart!: (error: unknown) => void;
    const post = vi.fn().mockReturnValue(new Promise<QuizGenerationResponse>((_, reject) => { rejectStart = reject; }));
    const starting = generationOperations.start('account-a', 'upload-tab', 'upload', post).catch(() => undefined);
    await tick();
    if (order === 'before-loss') {
      rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 })); await cancelling;
    }
    rejectStart(new ApplicationError({ category: 'network' })); await starting;
    if (order === 'after-loss') {
      rejectCancellation(new ApplicationError({ category: 'not-found', status: 404 })); await cancelling;
    }
    visibility('hidden'); visibility('visible'); online(false); online(true);
    await tick(119_999); expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    await tick(1);
    expect(observer.getSnapshot()).toMatchObject({ jobId: newerJob.jobId, accessStopped: false, error: null });
    expect(job()).toEqual(newerJob);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(2);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(service.cancelGenerationJob).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403, 404])('keeps a collection-level %s stopped after an ambiguous accepted receipt', async status => {
    const { observer, service } = setup(); observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    service.getGenerationJobs.mockRejectedValueOnce(new ApplicationError({ category: status === 404 ? 'not-found' : status === 401 ? 'authentication' : 'authorization', status }));
    await observer.refresh(true);
    const discoveryReads = service.getGenerationJobs.mock.calls.length;
    const statusReads = service.getGenerationStatus.mock.calls.length;
    response.resolve({ ...accepted, jobId: 'new-job' }); await starting; await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: 'job-1', accessStopped: true });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(discoveryReads);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(statusReads);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('keeps a job-level %s stopped after a receipt for different work', async status => {
    const { observer, service } = setup(); observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    await observer.refresh(true);
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: status === 401 ? 'authentication' : 'authorization', status }));
    await observer.refresh();
    const discoveryReads = service.getGenerationJobs.mock.calls.length;
    const statusReads = service.getGenerationStatus.mock.calls.length;
    response.resolve({ ...accepted, jobId: 'new-job' }); await starting; await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: 'job-1', accessStopped: true });
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(discoveryReads);
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(statusReads);
    expect(post).toHaveBeenCalledTimes(1);
  });
  it('does not restart a 404 job on a receipt for that same job', async () => {
    const { observer, service } = setup(); observer.start(); await tick();
    const response = deferred<QuizGenerationResponse>();
    const post = vi.fn().mockReturnValue(response.promise);
    const starting = generationOperations.start('account-a', 'wizard', 'text', post);
    service.getGenerationStatus.mockRejectedValueOnce(new ApplicationError({ category: 'not-found', status: 404 }));
    await observer.refresh();
    response.resolve(accepted); await starting; await tick(120_000);
    expect(observer.getSnapshot()).toMatchObject({ jobId: 'job-1', accessStopped: true });
    expect(service.getGenerationStatus).toHaveBeenCalledTimes(1);
    expect(service.getGenerationJobs).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
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
    service.getGenerationJobs.mockReturnValueOnce(discovery.promise).mockResolvedValue(page([]));
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
