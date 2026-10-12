import type { GenerationStatus, QuizGenerationResponse } from '@/types';
import { assertCurrentSessionGeneration, getSessionGeneration, isCurrentSessionGeneration, SessionChangedError } from '@/features/auth/services/sessionLifecycle';
import { toApplicationError } from '@/utils/applicationError';

export const generationEntryPoints = ['text-tab', 'upload-tab', 'wizard', 'ai-step', 'document-upload', 'selected-pages'] as const;
export type GenerationEntryPoint = typeof generationEntryPoints[number];
export type GenerationSource = 'document' | 'upload' | 'text';
export const GENERATION_STORAGE_PREFIX = 'quizzence:generation-start:v1:';
export const GENERATION_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_WAIT_MS = 30_000;
const states = ['ready', 'uncertain', 'retry', 'conflict', 'accepted', 'terminal', 'expired'] as const;
type OperationState = typeof states[number];

/** Explicit metadata allowlist. Never add request bodies or content-derived values here. */
export interface PendingGenerationOperation {
  version: 1;
  accountId: string;
  entryPoint: GenerationEntryPoint;
  source: GenerationSource;
  key: string;
  createdAt: number;
  expiresAt: number;
  state: OperationState;
  notBefore: number;
  documentId?: string;
  jobId?: string;
  jobStatus?: GenerationStatus;
  quizId?: string;
}
interface Snapshot {
  pending: Partial<Record<GenerationEntryPoint, PendingGenerationOperation>>;
  storageError: string | null;
  busy: Partial<Record<GenerationEntryPoint, boolean>>;
}
const storageMessage = 'Cannot save generation recovery information. No new request will be sent. Restore browser storage and retry saving; your existing operation key will be kept.';
const changedMessage = 'Recovery information changed in another tab. Reload to review the current operation before confirming a new start.';
const uncertainMessage = 'The previous request outcome was not saved, so its retry deadline is unknown. Restore recovery information in the original tab or explicitly abandon the operation before confirming a new start.';
const statuses: readonly string[] = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
const terminal = (status: GenerationStatus) => ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status);
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(value);
const timestamp = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const fields = new Set(['version', 'accountId', 'entryPoint', 'source', 'key', 'createdAt', 'expiresAt', 'state', 'notBefore', 'documentId', 'jobId', 'jobStatus', 'quizId']);

function parseMetadata(raw: string, accountId: string, entryPoint: GenerationEntryPoint): PendingGenerationOperation {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GenerationOperationError(storageMessage);
  const item = value as Record<string, unknown>;
  if (Object.keys(item).some(key => !fields.has(key)) || item.version !== 1
    || item.accountId !== accountId || item.entryPoint !== entryPoint
    || !['text', 'upload', 'document'].includes(String(item.source))
    || typeof item.key !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.key)
    || !timestamp(item.createdAt) || !timestamp(item.expiresAt) || !timestamp(item.notBefore)
    || item.expiresAt !== item.createdAt + GENERATION_RETENTION_MS
    || !states.includes(item.state as OperationState)
    || ['documentId', 'jobId', 'quizId'].some(key => item[key] !== undefined && !validId(item[key]))
    || (item.jobStatus !== undefined && !statuses.includes(String(item.jobStatus)))
    || (['accepted', 'terminal'].includes(String(item.state)) && !validId(item.jobId))) {
    throw new GenerationOperationError(storageMessage);
  }
  return item as unknown as PendingGenerationOperation;
}

export class GenerationOperationError extends Error {
  constructor(message: string) { super(message); this.name = 'GenerationOperationError'; }
}
class OperationChangedError extends GenerationOperationError {
  constructor() { super(changedMessage); }
}
export function getGenerationErrorMessage(error: unknown): string {
  return error instanceof GenerationOperationError ? error.message : toApplicationError(error).message;
}

type ObservationEvent =
  | { kind: 'started'; accountId: string; requestId: number }
  | { kind: 'accepted'; accountId: string; requestId: number; response: QuizGenerationResponse; superseded: boolean }
  | { kind: 'recover'; accountId: string; requestId: number };

export class GenerationOperations {
  private readonly observationListeners = new Set<(event: ObservationEvent) => void>();
  subscribeObservation = (listener: (event: ObservationEvent) => void) => {
    this.observationListeners.add(listener);
    return () => { this.observationListeners.delete(listener); };
  };
  private notifyObservation(event: ObservationEvent) { this.observationListeners.forEach(listener => listener(event)); }
  private accountId: string | null = null;
  private hydrated = false;
  private requireClear = false;
  private snapshot: Snapshot = { pending: {}, storageError: null, busy: {} };
  private readonly listeners = new Set<() => void>();
  // Only a key allocated here with no successful write may create a missing record.
  private readonly dirty = new Map<GenerationEntryPoint, boolean>();
  private readonly startFlights = new Set<string>();
  private startSequence = 0;

  constructor(private readonly storage: () => Storage = () => window.localStorage) {}
  getSnapshot = (): Snapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private publish(patch: Partial<Snapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach(listener => listener());
  }
  private storageKey(entry: GenerationEntryPoint): string {
    return `${GENERATION_STORAGE_PREFIX}${this.accountId}:${entry}`;
  }
  private withEntryLock<T>(accountId: string, entry: GenerationEntryPoint, generation: number, action: () => T | Promise<T>): Promise<T> {
    const run = () => {
      if (!isCurrentSessionGeneration(generation)) throw new SessionChangedError();
      return action();
    };
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request(`${GENERATION_STORAGE_PREFIX}${accountId}:${entry}`, run);
    }
    try { return Promise.resolve(run()); } catch (error) { return Promise.reject(error); }
  }
  private read(entry: GenerationEntryPoint): PendingGenerationOperation | undefined {
    const raw = this.storage().getItem(this.storageKey(entry));
    return raw === null ? undefined : parseMetadata(raw, this.accountId ?? '', entry);
  }
  private assertOwnership(operation: PendingGenerationOperation, allowMissing = false): PendingGenerationOperation | undefined {
    const current = this.read(operation.entryPoint);
    if (current ? current.key !== operation.key : !allowMissing) {
      this.dirty.delete(operation.entryPoint);
      const pending = { ...this.snapshot.pending };
      delete pending[operation.entryPoint];
      this.publish({ pending, storageError: this.dirty.size ? storageMessage : null });
      throw new OperationChangedError();
    }
    return current;
  }
  activate(accountId: string | null): void {
    if (accountId === this.accountId && this.hydrated) return;
    if (this.accountId && this.accountId !== accountId) this.clearSession();
    this.accountId = accountId;
    this.hydrated = false;
    this.dirty.clear();
    this.publish({ pending: {}, busy: {} });
    if (!accountId) return;
    try {
      if (!validId(accountId)) throw new GenerationOperationError(storageMessage);
      const storage = this.storage();
      // Remove other principals' records, including records left by a closed tab.
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      for (const key of keys) {
        if (key?.startsWith(GENERATION_STORAGE_PREFIX) && (this.requireClear || !key.startsWith(`${GENERATION_STORAGE_PREFIX}${accountId}:`))) storage.removeItem(key);
      }
      this.requireClear = false;
      const pending: Snapshot['pending'] = {};
      for (const entry of generationEntryPoints) {
        const raw = storage.getItem(this.storageKey(entry));
        if (raw !== null) {
          const operation = parseMetadata(raw, accountId, entry);
          pending[entry] = operation.expiresAt <= Date.now() ? { ...operation, state: 'expired' } : operation;
        }
      }
      this.hydrated = true;
      this.publish({ pending, storageError: null });
    } catch {
      this.publish({ storageError: storageMessage });
    }
  }
  clearSession(): void {
    this.requireClear = true;
    this.accountId = null;
    this.hydrated = false;
    this.dirty.clear();
    try {
      const storage = this.storage();
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      keys.forEach(key => { if (key?.startsWith(GENERATION_STORAGE_PREFIX)) storage.removeItem(key); });
      this.requireClear = false;
      this.publish({ pending: {}, busy: {}, storageError: null });
    } catch {
      // Logout itself still succeeds. No previous account's record is exposed.
      this.publish({ pending: {}, busy: {}, storageError: storageMessage });
    }
  }
  /** All callers hold the same entry lock, including receipt writes and recovery. */
  private save(operation: PendingGenerationOperation, allowMissing = false): void {
    try {
      const current = this.assertOwnership(operation, allowMissing);
      if (current?.state === 'terminal') operation = current;
      this.dirty.set(operation.entryPoint, allowMissing);
      this.publish({ pending: { ...this.snapshot.pending, [operation.entryPoint]: operation } });
      const encoded = JSON.stringify(operation);
      const storage = this.storage();
      storage.setItem(this.storageKey(operation.entryPoint), encoded);
      // Once written, another tab may abandon it even if our read-back fails.
      allowMissing = false;
      this.dirty.set(operation.entryPoint, false);
      if (storage.getItem(this.storageKey(operation.entryPoint)) !== encoded) throw new GenerationOperationError(storageMessage);
      this.dirty.delete(operation.entryPoint);
      this.publish({ storageError: this.dirty.size ? storageMessage : null });
    } catch (error) {
      if (error instanceof OperationChangedError) throw error;
      this.dirty.set(operation.entryPoint, allowMissing);
      this.publish({ pending: { ...this.snapshot.pending, [operation.entryPoint]: operation }, storageError: storageMessage });
      throw new GenerationOperationError(storageMessage);
    }
  }
  async retrySaving(): Promise<void> {
    const accountId = this.accountId;
    if (!accountId) throw new GenerationOperationError(storageMessage);
    const generation = getSessionGeneration();
    if (!this.hydrated) {
      this.activate(accountId);
      if (this.snapshot.storageError) throw new GenerationOperationError(storageMessage);
      return;
    }
    try {
      for (const entry of generationEntryPoints) {
        await this.withEntryLock(accountId, entry, generation, () => {
          if (this.accountId !== accountId) throw new SessionChangedError();
          const operation = this.snapshot.pending[entry];
          if (this.dirty.has(entry) && operation) this.save(operation, this.dirty.get(entry));
          else {
            // Recheck reads/deletions even when there was no failed write to save.
            const current = this.read(entry);
            const pending = { ...this.snapshot.pending };
            if (current) pending[entry] = current.expiresAt <= Date.now() ? { ...current, state: 'expired' } : current;
            else delete pending[entry];
            this.publish({ pending });
          }
        });
      }
      this.publish({ storageError: this.dirty.size ? storageMessage : null });
    } catch (error) {
      if (error instanceof SessionChangedError || error instanceof OperationChangedError) throw error;
      this.publish({ storageError: storageMessage });
      throw new GenerationOperationError(storageMessage);
    }
  }
  async abandon(entry: GenerationEntryPoint): Promise<void> {
    if (this.snapshot.storageError) throw new GenerationOperationError(storageMessage);
    if (this.snapshot.busy[entry]) throw new GenerationOperationError('Wait for the current request to finish.');
    const operation = this.snapshot.pending[entry];
    const accountId = this.accountId;
    if (!operation || !accountId) throw new OperationChangedError();
    await this.withEntryLock(accountId, entry, getSessionGeneration(), () => {
      if (this.accountId !== accountId) throw new SessionChangedError();
      // Deletion is mandatory, and may remove only the identity the user reviewed.
      try {
        this.assertOwnership(operation);
        this.storage().removeItem(this.storageKey(entry));
        if (this.storage().getItem(this.storageKey(entry)) !== null) throw new GenerationOperationError(storageMessage);
        const pending = { ...this.snapshot.pending };
        delete pending[entry];
        this.dirty.delete(entry);
        this.publish({ pending, storageError: this.dirty.size ? storageMessage : null });
      } catch (error) {
        if (error instanceof OperationChangedError) throw error;
        this.publish({ storageError: storageMessage });
        throw new GenerationOperationError(storageMessage);
      }
    });
  }
  start(accountId: string, entry: GenerationEntryPoint, source: GenerationSource,
    send: (key: string) => Promise<QuizGenerationResponse>, documentId?: string): Promise<QuizGenerationResponse> {
    const expectedGeneration = getSessionGeneration();
    const flight = `${expectedGeneration}:${accountId}:${entry}`;
    if (this.startFlights.has(flight)) return Promise.reject(new GenerationOperationError('This generation request is already being submitted.'));
    this.startFlights.add(flight);
    const result = this.withEntryLock(accountId, entry, expectedGeneration,
      () => this.performStart(accountId, entry, source, send, documentId));
    return result.finally(() => this.startFlights.delete(flight));
  }
  private async performStart(accountId: string, entry: GenerationEntryPoint, source: GenerationSource,
    send: (key: string) => Promise<QuizGenerationResponse>, documentId?: string): Promise<QuizGenerationResponse> {
    this.activate(accountId);
    if (this.snapshot.busy[entry]) throw new GenerationOperationError('This generation request is already being submitted.');
    if (!this.hydrated || this.snapshot.storageError) throw new GenerationOperationError(storageMessage);
    const generation = getSessionGeneration();
    let existing = this.snapshot.pending[entry];
    try {
      const raw = this.storage().getItem(this.storageKey(entry));
      if (raw !== null) {
        const durable = parseMetadata(raw, accountId, entry);
        if (existing && durable.key !== existing.key) throw new OperationChangedError();
        existing = durable;
        this.publish({ pending: { ...this.snapshot.pending, [entry]: durable } });
      }
      else if (existing) {
        // Another tab explicitly abandoned this identity. Do not silently allocate a replacement.
        throw new OperationChangedError();
      }
    } catch (error) {
      if (error instanceof OperationChangedError) throw error;
      this.publish({ storageError: storageMessage });
      throw error instanceof GenerationOperationError ? error : new GenerationOperationError(storageMessage);
    }
    const now = Date.now();
    if (existing && (existing.expiresAt <= now || existing.state === 'expired')) {
      throw new GenerationOperationError('The 30-day recovery window expired. Confirm a new start before generating again.');
    }
    if (existing && (existing.source !== source || ['conflict', 'terminal'].includes(existing.state))) {
      throw new GenerationOperationError('This command cannot be retried. Confirm a new start to use changed input.');
    }
    if (existing?.state === 'uncertain') throw new GenerationOperationError(uncertainMessage);
    if (existing?.jobId) return { jobId: existing.jobId, status: existing.jobStatus ?? 'PENDING', message: 'Existing generation job', estimatedTimeSeconds: 0 };
    if (existing && existing.notBefore > now) throw new GenerationOperationError(`Wait ${Math.ceil((existing.notBefore - now) / 1000)} seconds before retrying this operation.`);
    if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') throw new GenerationOperationError('This browser cannot create a secure recovery key. Use a supported browser before starting generation.');
    const operation: PendingGenerationOperation = existing ?? {
      version: 1, accountId, entryPoint: entry, source, key: crypto.randomUUID(),
      createdAt: now, expiresAt: now + GENERATION_RETENTION_MS, state: 'ready', notBefore: 0,
      ...(source === 'document' && documentId ? { documentId } : {}),
    };
    this.publish({ busy: { ...this.snapshot.busy, [entry]: true } });
    try {
      // Write before POST, including an uncertainty marker for an interrupted request.
      try { this.save({ ...operation, state: 'uncertain', notBefore: now + DEFAULT_WAIT_MS }, !existing); }
      catch (error) {
        // There was no POST: recovery must not treat this as a dispatched attempt.
        this.publish({ pending: { ...this.snapshot.pending, [entry]: operation } });
        throw error;
      }
      // Order actual dispatches, independently of response arrival and the job
      // cache. Failed pre-POST persistence must not supersede an earlier start.
      const startSequence = ++this.startSequence;
      this.notifyObservation({ kind: 'started', accountId, requestId: startSequence });
      let response: QuizGenerationResponse;
      try {
        response = await send(operation.key);
      } catch (error) {
        if (!isCurrentSessionGeneration(generation) || this.accountId !== accountId) throw new SessionChangedError();
        const safe = toApplicationError(error);
        this.notifyObservation({ kind: 'recover', accountId, requestId: startSequence });
        const isConflict = safe.status === 409 && safe.code !== 'INSUFFICIENT_BALANCE';
        const delay = safe.status === 429 || safe.status === 503
          ? (safe.retryAfterSeconds === undefined ? DEFAULT_WAIT_MS : safe.retryAfterSeconds * 1000) : 0;
        try { this.save({ ...operation, state: isConflict ? 'conflict' : 'retry', notBefore: Date.now() + delay }); }
        catch { throw new GenerationOperationError(`${storageMessage} The request may already have reached the server.`); }
        if (isConflict) throw new GenerationOperationError('Generation conflict (409). The source or settings may differ from the original command, or another job is active. Confirm a new start before submitting changed input; nothing will be submitted automatically.');
        throw safe;
      }
      if (!isCurrentSessionGeneration(generation) || this.accountId !== accountId) throw new SessionChangedError();
      if (!validId(response.jobId) || (response.status !== undefined && !statuses.includes(response.status))) {
        this.notifyObservation({ kind: 'recover', accountId, requestId: startSequence });
        throw new GenerationOperationError('The server response could not be verified. Retry the original operation with the same input.');
      }
      this.notifyObservation({ kind: 'accepted', accountId, requestId: startSequence, response, superseded: startSequence !== this.startSequence });
      this.save({ ...operation, state: response.status && terminal(response.status) ? 'terminal' : 'accepted',
        notBefore: 0, jobId: response.jobId, jobStatus: response.status ?? 'PENDING' });
      return response;
    } finally {
      if (this.accountId === accountId && isCurrentSessionGeneration(generation)) this.publish({ busy: { ...this.snapshot.busy, [entry]: false } });
    }
  }
  async recordJob(jobId: string, status: GenerationStatus, quizId?: string): Promise<void> {
    if (!validId(jobId) || !statuses.includes(status) || (quizId !== undefined && !validId(quizId))) return;
    const generation = getSessionGeneration();
    const accountId = this.accountId;
    if (!accountId) return;
    for (const operation of Object.values(this.snapshot.pending)) {
      if (!operation || operation.jobId !== jobId) continue;
      try {
        await this.withEntryLock(accountId, operation.entryPoint, generation, () => {
          if (this.accountId !== accountId) throw new SessionChangedError();
          this.assertOwnership(operation);
          const durable = this.read(operation.entryPoint);
          // An older read cannot reverse a terminal receipt for the same key.
          if (durable?.jobStatus && terminal(durable.jobStatus) && !terminal(status)) return;
          this.save({ ...operation, jobStatus: status, state: terminal(status) ? 'terminal' : 'accepted', ...(quizId ? { quizId } : {}) });
        });
      }
      catch (error) {
        if (error instanceof SessionChangedError) throw error;
        /* Recovery metadata remains in memory; the UI offers saving, never a new POST. */
      }
    }
    assertCurrentSessionGeneration(generation);
  }
}

export const generationOperations = new GenerationOperations();
