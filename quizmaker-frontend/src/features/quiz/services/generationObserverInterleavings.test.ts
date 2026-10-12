import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { QuizGenerationResponse, QuizGenerationStatus } from '@/types';
import { establishSession } from '@/features/auth/services/sessionLifecycle';
import { ApplicationError } from '@/utils/applicationError';
import { GenerationObserver, generationStatusKey } from './generationObserver';
import { GenerationOperations, generationOperations } from './generationOperations';
import type { GenerationJobPage } from './generationJobs';

const oldJob: QuizGenerationStatus = { jobId: 'old-job', status: 'PROCESSING', progressPercentage: 70 };
const newerJob: QuizGenerationStatus = { jobId: 'new-job', status: 'PROCESSING', progressPercentage: 10 };
const newestJob: QuizGenerationStatus = { jobId: 'newest-job', status: 'PROCESSING', progressPercentage: 5 };
const receipt = (jobId: string): QuizGenerationResponse => ({ jobId, status: 'PROCESSING', message: 'confirmed', estimatedTimeSeconds: 10 });
const missing = () => new ApplicationError({ category: 'not-found', status: 404 });
const modes = ['visibility', 'reconnect'] as const;
type ResumeMode = typeof modes[number];
const page = (content: QuizGenerationStatus[]): GenerationJobPage => ({
  content, number: 0, size: 20, totalPages: content.length ? 1 : 0,
  totalElements: content.length, last: true, numberOfElements: content.length,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const observers: GenerationObserver[] = [];
const clients: QueryClient[] = [];
function setup(accountId = 'account-a', initial: QuizGenerationStatus | null = oldJob) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const service = {
    getGenerationJobs: vi.fn().mockResolvedValue(page(initial ? [initial] : [])),
    getGenerationStatus: vi.fn().mockResolvedValue(initial ?? oldJob),
    cancelGenerationJob: vi.fn(),
  };
  const observer = new GenerationObserver(accountId, client, service);
  observers.push(observer);
  clients.push(client);
  observer.start();
  return { observer, client, service, job: () => client.getQueryData<QuizGenerationStatus>(generationStatusKey(accountId, observer.getSnapshot().jobId)) };
}

async function tick(ms = 0) { await vi.advanceTimersByTimeAsync(ms); }
function setAvailable(mode: ResumeMode, available: boolean) {
  if (mode === 'visibility') {
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(available ? 'visible' : 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  } else {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(available);
    window.dispatchEvent(new Event(available ? 'online' : 'offline'));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});
afterEach(() => {
  observers.splice(0).forEach(observer => observer.destroy());
  clients.splice(0).forEach(client => client.clear());
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe.each(modes)('generation response interleavings on %s', mode => {
  it.each(['receipt-before-404', 'receipt-during-list', 'receipt-after-list'] as const)(
    'preserves newer cross-tab work after an old DELETE 404 and delayed POST (%s)', async order => {
      const a = setup('account-a', null);
      await tick();
      const postReply = deferred<QuizGenerationResponse>();
      const post = vi.fn().mockReturnValue(postReply.promise);
      const starting = generationOperations.start('account-a', 'wizard', 'text', post);
      await tick();
      // The server accepted this POST, but owned discovery sees its job before
      // the original receipt arrives. Later, another tab starts newer work.
      a.service.getGenerationJobs.mockResolvedValue(page([oldJob]));
      await a.observer.refresh(true);
      const cancelReply = deferred<QuizGenerationStatus>();
      a.service.cancelGenerationJob.mockReturnValueOnce(cancelReply.promise);
      const cancelling = a.observer.cancel();
      await tick();
      setAvailable(mode, false);
      const otherTab = new GenerationOperations();
      const otherPost = vi.fn().mockResolvedValue(receipt(newerJob.jobId));
      await otherTab.start('account-a', 'upload-tab', 'upload', otherPost);
      const freshList = deferred<GenerationJobPage>();
      a.service.getGenerationJobs.mockReturnValueOnce(freshList.promise).mockResolvedValue(page([newerJob]));
      a.service.getGenerationStatus.mockResolvedValue(newerJob);
      setAvailable(mode, true);

      if (order === 'receipt-before-404') {
        postReply.resolve(receipt(oldJob.jobId));
        await starting;
      }
      cancelReply.reject(missing());
      await cancelling;
      await tick();
      expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(3);
      if (order === 'receipt-during-list') {
        postReply.resolve(receipt(oldJob.jobId));
        await starting;
      }
      freshList.resolve(page([newerJob]));
      await tick();
      if (order === 'receipt-after-list') {
        postReply.resolve(receipt(oldJob.jobId));
        await starting;
        await tick();
      }

      expect(a.job()).toEqual(newerJob);
      expect(a.observer.getSnapshot()).toMatchObject({
        jobId: newerJob.jobId, error: null, accessStopped: false, cancelling: false, cancelError: null,
      });
      const complete: QuizGenerationStatus = { ...newerJob, status: 'COMPLETED', generatedQuizId: 'new-result', progressPercentage: 100 };
      a.service.getGenerationStatus.mockResolvedValue(complete);
      await tick(5_000);
      expect(a.job()).toEqual(complete);
      expect(a.observer.getSnapshot().newQuizIds).toEqual(['new-result']);
      const requests = a.service.getGenerationJobs.mock.calls.length + a.service.getGenerationStatus.mock.calls.length;
      await tick(120_000);
      expect(a.service.getGenerationJobs.mock.calls.length + a.service.getGenerationStatus.mock.calls.length).toBe(requests);
      expect(post).toHaveBeenCalledTimes(1);
      expect(otherPost).toHaveBeenCalledTimes(1);
      expect(a.service.cancelGenerationJob).toHaveBeenCalledExactlyOnceWith(oldJob.jobId, expect.any(AbortSignal));
    },
  );

  it.each(modes)('rejects an intermediate collection after old 404 and a second resume through %s', async second => {
    const a = setup();
    await tick();
    a.service.getGenerationStatus.mockRejectedValueOnce(missing());
    await a.observer.refresh();
    expect(a.observer.getSnapshot().accessStopped).toBe(true);
    setAvailable(mode, false);
    const middle = deferred<GenerationJobPage>();
    a.service.getGenerationJobs.mockReturnValueOnce(middle.promise);
    setAvailable(mode, true);
    await tick();
    setAvailable(second, false);
    a.service.getGenerationJobs.mockResolvedValue(page([newestJob]));
    a.service.getGenerationStatus.mockResolvedValue(newestJob);
    setAvailable(second, true);
    // Duplicate browser signals must join the latest traversal.
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    middle.resolve(page([newerJob]));
    await tick();

    expect(a.observer.getSnapshot()).toMatchObject({ jobId: newestJob.jobId, error: null, accessStopped: false });
    expect(a.job()).toEqual(newestJob);
    expect(a.client.getQueryData(generationStatusKey('account-a', newerJob.jobId))).toBeUndefined();
    expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(3);
    await tick(5_000);
    expect(a.service.getGenerationStatus.mock.calls.map(call => call[0])).toEqual([oldJob.jobId, newestJob.jobId]);
  });

  describe.each(['success', '404'] as const)('account replacement with late %s collection', list => {
    it.each(['accepted', 'lost'] as const)('ignores the previous account\'s %s POST after old 404 and resume', async postResult => {
      establishSession('test-a', 'refresh-a');
      const a = setup();
      await tick();
      const postReply = deferred<QuizGenerationResponse>();
      const post = vi.fn().mockReturnValue(postReply.promise);
      const starting = generationOperations.start('account-a', 'wizard', 'text', post).catch(() => undefined);
      await tick();
      a.service.getGenerationStatus.mockRejectedValueOnce(missing());
      await a.observer.refresh();
      setAvailable(mode, false);
      const oldList = deferred<GenerationJobPage>();
      a.service.getGenerationJobs.mockReturnValueOnce(oldList.promise);
      setAvailable(mode, true);
      await tick();
      expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(2);
      establishSession('test-b', 'refresh-b', 'account-switch');
      const b = setup('account-b', newestJob);
      await tick();

      if (list === 'success') oldList.resolve(page([{ ...newerJob, jobId: 'private-a' }]));
      else oldList.reject(missing());
      if (postResult === 'accepted') postReply.resolve(receipt('private-a'));
      else postReply.reject(new ApplicationError({ category: 'network' }));
      await starting;
      await tick(120_000);

      expect(b.job()).toEqual(newestJob);
      expect(b.observer.getSnapshot()).toMatchObject({
        jobId: newestJob.jobId, error: null, accessStopped: false, cancelError: null, recoveryNotice: false, newQuizIds: [],
      });
      expect(a.client.getQueryData(generationStatusKey('account-a', 'private-a'))).toBeUndefined();
      expect(b.client.getQueryData(generationStatusKey('account-a', 'private-a'))).toBeUndefined();
      expect(Object.values(generationOperations.getSnapshot().pending).some(operation => operation?.accountId === 'account-a')).toBe(false);
      expect(a.service.getGenerationJobs).toHaveBeenCalledTimes(2);
      expect(a.service.getGenerationStatus).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledTimes(1);
    });
  });
});
