import { afterEach, describe, expect, it, vi } from 'vitest';
import { GenerationOperations, GENERATION_RETENTION_MS, GENERATION_STORAGE_PREFIX } from './generationOperations';
import { establishSession } from '@/features/auth/services/sessionLifecycle';
import { toApplicationError } from '@/utils/applicationError';

const accepted = { jobId: 'job-1', status: 'PENDING' as const, message: 'queued', estimatedTimeSeconds: 0 };
const fail = (status: number, retryAfter?: string) => toApplicationError({ response: { status, headers: { 'Retry-After': retryAfter } } });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('generation command lifecycle', () => {
  it('serializes explicit abandonment behind a dispatched start with browser entry locks', async () => {
    const tails = new Map<string, Promise<void>>();
    vi.stubGlobal('navigator', { locks: { request: <T,>(name: string, action: () => T | Promise<T>) => {
      const previous = tails.get(name) ?? Promise.resolve();
      let release!: () => void;
      const held = new Promise<void>(done => { release = done; });
      tails.set(name, previous.then(() => held));
      return previous.then(action).finally(release);
    } } });
    let started!: () => void;
    const dispatched = new Promise<void>(done => { started = done; });
    let finish!: (value: typeof accepted) => void;
    const first = new GenerationOperations();
    const pending = first.start('account-a', 'wizard', 'text', () => {
      started();
      return new Promise(done => { finish = done; });
    });
    await dispatched;
    const otherTab = new GenerationOperations();
    otherTab.activate('account-a');
    const abandonment = otherTab.abandon('wizard');
    await Promise.resolve();
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).not.toBeNull();
    finish(accepted);
    await pending;
    await abandonment;
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull();
  });

  it('keeps the newer command across reload when an old tab records a late terminal receipt', async () => {
    const oldTab = new GenerationOperations();
    await oldTab.start('account-a', 'wizard', 'text', async () => accepted);
    const newTab = new GenerationOperations();
    newTab.activate('account-a');
    await newTab.recordJob('job-1', 'COMPLETED', 'quiz-1');
    await newTab.abandon('wizard');
    const next = vi.fn<(key: string) => Promise<typeof accepted>>().mockResolvedValue({ ...accepted, jobId: 'job-2' });
    await newTab.start('account-a', 'wizard', 'text', next);
    await oldTab.recordJob('job-1', 'COMPLETED', 'quiz-1');
    const restored = new GenerationOperations();
    const noPost = vi.fn();
    expect((await restored.start('account-a', 'wizard', 'text', noPost)).jobId).toBe('job-2');
    expect(restored.getSnapshot().pending.wizard?.key).toBe(next.mock.calls[0][0]);
    expect(noPost).not.toHaveBeenCalled();
  });

  it('does not resurrect an abandoned command from an old tab receipt', async () => {
    const oldTab = new GenerationOperations();
    await oldTab.start('account-a', 'wizard', 'text', async () => accepted);
    const newTab = new GenerationOperations();
    newTab.activate('account-a');
    await newTab.abandon('wizard');
    await oldTab.recordJob('job-1', 'COMPLETED', 'quiz-1');
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull();
  });

  it('does not let stale confirmation delete another tab\'s newer command', async () => {
    const oldTab = new GenerationOperations();
    await oldTab.start('account-a', 'wizard', 'text', async () => accepted);
    const newTab = new GenerationOperations();
    newTab.activate('account-a');
    await newTab.abandon('wizard');
    await newTab.start('account-a', 'wizard', 'text', async () => ({ ...accepted, jobId: 'job-2' }));
    await expect(oldTab.abandon('wizard')).rejects.toThrow('changed in another tab');
    const restored = new GenerationOperations();
    restored.activate('account-a');
    expect(restored.getSnapshot().pending.wizard?.jobId).toBe('job-2');
  });

  it('does not overwrite a new identity when retrying a failed receipt save in an old tab', async () => {
    const oldTab = new GenerationOperations();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    await expect(oldTab.start('account-a', 'wizard', 'text', async () => {
      write.mockImplementation(() => { throw new DOMException('Unavailable'); });
      return accepted;
    })).rejects.toThrow('Cannot save');
    write.mockRestore();
    const newTab = new GenerationOperations();
    newTab.activate('account-a');
    await newTab.abandon('wizard');
    await newTab.start('account-a', 'wizard', 'text', async () => ({ ...accepted, jobId: 'job-2' }));
    await expect(oldTab.retrySaving()).rejects.toThrow('changed in another tab');
    const restored = new GenerationOperations();
    restored.activate('account-a');
    expect(restored.getSnapshot().pending.wizard?.jobId).toBe('job-2');
  });

  it.each([429, 503])('blocks reload retry after HTTP %s when its Retry-After could not be saved', async status => {
    vi.useFakeTimers();
    const first = new GenerationOperations();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const send = vi.fn(async () => {
      write.mockImplementation(() => { throw new DOMException('Unavailable'); });
      throw fail(status, '120');
    });
    await expect(first.start('account-a', 'wizard', 'text', send)).rejects.toThrow('Cannot save');
    const key = first.getSnapshot().pending.wizard?.key;
    write.mockRestore();
    await vi.advanceTimersByTimeAsync(31_000);
    const reload = new GenerationOperations();
    const retry = vi.fn().mockResolvedValue(accepted);
    await expect(reload.start('account-a', 'wizard', 'text', retry)).rejects.toThrow('retry deadline is unknown');
    expect(retry).not.toHaveBeenCalled();
    await reload.retrySaving(); // Reading the uncertainty marker is not outcome recovery.
    await vi.advanceTimersByTimeAsync(89_000);
    await expect(reload.start('account-a', 'wizard', 'text', retry)).rejects.toThrow('retry deadline is unknown');
    expect(retry).not.toHaveBeenCalled();
    await first.retrySaving(); // Original tab still holds the observed deadline.
    await reload.start('account-a', 'wizard', 'text', retry);
    expect(retry).toHaveBeenCalledExactlyOnceWith(key);
    expect(send).toHaveBeenCalledOnce();
  });

  it('requires explicit abandonment after an interrupted request without a saved outcome', async () => {
    const first = new GenerationOperations();
    let resolve!: (value: typeof accepted) => void;
    const pending = first.start('account-a', 'wizard', 'text', () => new Promise(done => { resolve = done; }));
    const key = first.getSnapshot().pending.wizard?.key;
    const reload = new GenerationOperations();
    reload.activate('account-a');
    await reload.abandon('wizard');
    const next = vi.fn().mockResolvedValue({ ...accepted, jobId: 'job-2' });
    await reload.start('account-a', 'wizard', 'text', next);
    resolve(accepted);
    await expect(pending).rejects.toThrow('changed in another tab');
    expect(next.mock.calls[0][0]).not.toBe(key);
    const restored = new GenerationOperations();
    restored.activate('account-a');
    expect(restored.getSnapshot().pending.wizard?.jobId).toBe('job-2');
  });

  it.each(['read', 'remove'] as const)('repairs a transient %s failure without submitting or abandoning automatically', async action => {
    const store = new GenerationOperations();
    const send = vi.fn().mockRejectedValue(fail(503, '120'));
    await expect(store.start('account-a', 'wizard', 'text', send)).rejects.toMatchObject({ status: 503 });
    const key = store.getSnapshot().pending.wizard?.key;
    const fault = vi.spyOn(Storage.prototype, action === 'read' ? 'getItem' : 'removeItem')
      .mockImplementation(() => { throw new DOMException('Unavailable'); });
    if (action === 'read') await expect(store.start('account-a', 'wizard', 'text', send)).rejects.toThrow('Cannot save');
    else await expect(store.abandon('wizard')).rejects.toThrow('Cannot save');
    fault.mockRestore();
    await store.retrySaving();
    expect(store.getSnapshot().storageError).toBeNull();
    expect(store.getSnapshot().pending.wizard?.key).toBe(key);
    expect(send).toHaveBeenCalledOnce();
    await expect(store.start('account-a', 'wizard', 'text', send)).rejects.toThrow('Wait');
    await store.abandon('wizard');
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull();
  });

  it.each(['document', 'upload', 'text'] as const)('retains the %s identity across a lost response, manual retry and reload', async source => {
    const first = new GenerationOperations();
    let originalKey = '';
    await expect(first.start('account-a', 'wizard', source, async key => {
      originalKey = key;
      expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toContain(key);
      throw toApplicationError({ isAxiosError: true, code: 'ERR_NETWORK' });
    }, source === 'document' ? 'document-1' : undefined)).rejects.toThrow('Network');
    expect(originalKey).toMatch(/^[0-9a-f-]{36}$/);
    const restored = new GenerationOperations();
    const replay = vi.fn(async () => accepted);
    await expect(restored.start('account-a', 'wizard', source, replay)).resolves.toEqual(accepted);
    expect(replay).toHaveBeenCalledExactlyOnceWith(originalKey);
    const anotherReload = new GenerationOperations();
    const noNewPost = vi.fn();
    expect((await anotherReload.start('account-a', 'wizard', source, noNewPost)).jobId).toBe('job-1');
    expect(noNewPost).not.toHaveBeenCalled();
  });

  it.each([429, 503])('honours HTTP %s Retry-After across reload without scheduling a POST', async status => {
    vi.useFakeTimers();
    const first = new GenerationOperations();
    const send = vi.fn().mockRejectedValue(fail(status, '60'));
    await expect(first.start('account-a', 'text-tab', 'text', send)).rejects.toMatchObject({ status });
    const key = send.mock.calls[0][0];
    const restored = new GenerationOperations();
    const retry = vi.fn().mockResolvedValue(accepted);
    await expect(restored.start('account-a', 'text-tab', 'text', retry)).rejects.toThrow('Wait 60');
    await vi.advanceTimersByTimeAsync(59_000);
    expect(send).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    await expect(restored.start('account-a', 'text-tab', 'text', retry)).rejects.toThrow('Wait 1');
    await vi.advanceTimersByTimeAsync(1000);
    expect(retry).not.toHaveBeenCalled();
    await restored.start('account-a', 'text-tab', 'text', retry);
    expect(retry).toHaveBeenCalledExactlyOnceWith(key);
  });

  it.each([undefined, 'invalid'])('uses the approved 30-second wait for absent/malformed guidance: %s', async header => {
    vi.useFakeTimers();
    const store = new GenerationOperations();
    await expect(store.start('account-a', 'text-tab', 'text', async () => { throw fail(503, header); })).rejects.toMatchObject({ status: 503 });
    await expect(store.start('account-a', 'text-tab', 'text', vi.fn())).rejects.toThrow('Wait 30');
  });

  it('keeps 409 non-retryable until explicit abandonment and a newly confirmed submission', async () => {
    const store = new GenerationOperations();
    const conflict = vi.fn().mockRejectedValue(fail(409));
    await expect(store.start('account-a', 'text-tab', 'text', conflict)).rejects.toThrow('409');
    const key = conflict.mock.calls[0][0];
    const next = vi.fn().mockResolvedValue(accepted);
    await expect(store.start('account-a', 'text-tab', 'text', next)).rejects.toThrow('Confirm a new start');
    expect(next).not.toHaveBeenCalled();
    expect(store.getSnapshot().pending['text-tab']?.key).toBe(key);
    await store.abandon('text-tab');
    await store.start('account-a', 'text-tab', 'text', next);
    expect(next.mock.calls[0][0]).not.toBe(key);
  });

  it('does not send when storage is unavailable and retains the allocated key for recovery', async () => {
    const store = new GenerationOperations();
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Unavailable'); });
    const send = vi.fn().mockResolvedValue(accepted);
    await expect(store.start('account-a', 'upload-tab', 'upload', send)).rejects.toThrow('Cannot save');
    const key = store.getSnapshot().pending['upload-tab']?.key;
    expect(send).not.toHaveBeenCalled();
    write.mockRestore();
    await store.retrySaving();
    // A pre-POST storage failure must not impose the uncertainty delay.
    await store.start('account-a', 'upload-tab', 'upload', send);
    expect(send).toHaveBeenCalledExactlyOnceWith(key);
  });

  it('retains a known job after post-send save failure; saving recovery sends no POST', async () => {
    const store = new GenerationOperations();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    const send = vi.fn(async () => {
      write.mockImplementation(() => { throw new DOMException('Unavailable'); });
      return accepted;
    });
    await expect(store.start('account-a', 'wizard', 'upload', send)).rejects.toThrow('Cannot save');
    const key = store.getSnapshot().pending.wizard?.key;
    expect(store.getSnapshot().pending.wizard?.jobId).toBe('job-1');
    await expect(store.start('account-a', 'wizard', 'upload', send)).rejects.toThrow('Cannot save');
    write.mockRestore();
    await store.retrySaving();
    expect(send).toHaveBeenCalledOnce();
    const replay = await store.start('account-a', 'wizard', 'upload', send);
    expect(replay.jobId).toBe('job-1');
    expect(store.getSnapshot().pending.wizard?.key).toBe(key);
    expect(send).toHaveBeenCalledOnce();
  });

  it('does not silently recover malformed/read-inaccessible storage by creating a new command', async () => {
    localStorage.setItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`, '{broken');
    const store = new GenerationOperations();
    const send = vi.fn();
    await expect(store.start('account-a', 'wizard', 'text', send)).rejects.toThrow('Cannot save');
    expect(send).not.toHaveBeenCalled();
    localStorage.clear();
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Unavailable'); });
    await expect(new GenerationOperations().start('account-a', 'wizard', 'text', send)).rejects.toThrow('Cannot save');
    expect(send).not.toHaveBeenCalled();
    read.mockRestore();
  });

  it('rejects account-switch late responses and never exposes another account operation', async () => {
    const store = new GenerationOperations();
    let resolve!: (value: typeof accepted) => void;
    const pending = store.start('account-a', 'wizard', 'text', () => new Promise(done => { resolve = done; }));
    const oldKey = store.getSnapshot().pending.wizard?.key;
    establishSession('access-b', 'refresh-b', 'account-switch');
    store.clearSession();
    store.activate('account-b');
    resolve(accepted);
    await expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    expect(store.getSnapshot().pending).toEqual({});
    const next = vi.fn().mockResolvedValue(accepted);
    await store.start('account-b', 'wizard', 'text', next);
    expect(next.mock.calls[0][0]).not.toBe(oldKey);
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`)).toBeNull();
  });

  it('requires a new confirmed command after the 30-day retention window', async () => {
    vi.useFakeTimers();
    const store = new GenerationOperations();
    await store.start('account-a', 'wizard', 'document', async () => accepted, 'document-1');
    await vi.advanceTimersByTimeAsync(GENERATION_RETENTION_MS);
    const retry = vi.fn();
    await expect(store.start('account-a', 'wizard', 'document', retry)).rejects.toThrow('30-day');
    expect(retry).not.toHaveBeenCalled();
    await store.abandon('wizard');
    await store.start('account-a', 'wizard', 'document', async () => accepted, 'document-1');
  });

  it('stores terminal receipt and persists only allowlisted operational metadata', async () => {
    const store = new GenerationOperations();
    await store.start('account-a', 'wizard', 'text', async () => accepted);
    await store.recordJob('job-1', 'COMPLETED', 'quiz-1');
    const restored = new GenerationOperations();
    restored.activate('account-a');
    expect(restored.getSnapshot().pending.wizard).toMatchObject({ state: 'terminal', jobId: 'job-1', quizId: 'quiz-1' });
    expect(Object.keys(JSON.parse(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:wizard`) ?? '{}')).sort())
      .toEqual(['accountId', 'createdAt', 'entryPoint', 'expiresAt', 'jobId', 'jobStatus', 'key', 'notBefore', 'quizId', 'source', 'state', 'version']);
  });

  it('serializes double clicks before a start resolves', async () => {
    const store = new GenerationOperations();
    let resolve!: (value: typeof accepted) => void;
    const send = vi.fn(() => new Promise<typeof accepted>(done => { resolve = done; }));
    const first = store.start('account-a', 'wizard', 'text', send);
    await expect(store.start('account-a', 'wizard', 'text', send)).rejects.toThrow('already being submitted');
    expect(send).toHaveBeenCalledOnce();
    resolve(accepted);
    await first;
  });
});
