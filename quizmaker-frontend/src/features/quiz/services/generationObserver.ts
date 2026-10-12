import { isCancelledError, QueryClient, replaceEqualDeep } from '@tanstack/react-query';
import type { QuizGenerationResponse, QuizGenerationStatus } from '@/types';
import { getSessionGeneration, isCurrentSessionGeneration, subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';
import { ApplicationError, toApplicationError } from '@/utils/applicationError';
import { discoverActiveGeneration, isActiveGeneration, type GenerationJobPage } from './generationJobs';
import { generationOperations } from './generationOperations';

export const ownedQuizzesKey = (accountId: string) => ['owned-quizzes', accountId] as const;
export const generationStatusKey = (accountId: string, jobId: string | null) => ['generation-observer', accountId, 'status', jobId] as const;
export interface ObservationState {
  jobId: string | null;
  checking: boolean;
  discovered: boolean;
  cancelling: boolean;
  paused: boolean;
  error: ApplicationError | null;
  cancelError: ApplicationError | null;
  accessStopped: boolean;
  recoveryNotice: boolean;
  newQuizIds: readonly string[];
}
export const emptyObservation: ObservationState = {
  jobId: null, checking: false, discovered: false, cancelling: false, paused: false, error: null,
  cancelError: null, accessStopped: false, recoveryNotice: false, newQuizIds: [],
};
interface GenerationReader {
  getGenerationJobs(page: number, signal?: AbortSignal): Promise<GenerationJobPage>;
  getGenerationStatus(jobId: string, signal?: AbortSignal): Promise<QuizGenerationStatus>;
  cancelGenerationJob(jobId: string, signal?: AbortSignal): Promise<QuizGenerationStatus>;
}
const canRetry = (error: ApplicationError) => error.status === 429 || (error.status !== undefined && error.status >= 500)
  || ['network', 'timeout', 'offline'].includes(error.category);

/** One account/session owner, one request lane, one timeout. Consumers never start polling. */
export class GenerationObserver {
  private state: ObservationState = emptyObservation;
  private readonly listeners = new Set<() => void>();
  private readonly generation = getSessionGeneration();
  private readonly completed = new Set<string>();
  private readonly observedResultIds = new Set<string>();
  // At most one dispatched request per entry point. Another tab's starts cannot
  // share our local counter, so retain observation and discovery order instead.
  private readonly startedObservations = new Map<number, { jobId: string | null; discoveryRevision: number }>();
  private discoveryRevision = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private flight: Promise<void> | null = null;
  private cancellation: Promise<void> | null = null;
  private stopped = false;
  private version = 0;
  private failures = 0;
  private notBefore = 0;
  private nextPoll = 0;
  // Keep required reads until a current response satisfies them. Blocking on
  // another request, cancellation, visibility or Retry-After must not lose intent.
  private discoveryRequested: 'refresh' | 'recovery' | null = null;
  // An ambiguous receipt is still an exact known job. If no work is active on
  // rediscovery, reconcile this ID once: it may already have completed.
  private receiptFallback: string | null = null;
  // A missing exact job does not revoke access to a different confirmed job.
  // Collection failures and authentication/authorization failures stay stopped.
  private notFoundJobId: string | null = null;
  private statusRequested = false;
  private readonly abort = new AbortController();
  private cleanup: (() => void)[] = [];

  constructor(readonly accountId: string, private readonly client: QueryClient, private readonly service: GenerationReader) {
    // Discovery can seed status before an exact-job read. Its lifetime belongs
    // to this session owner, independently of visible query consumers.
    client.setQueryDefaults(['generation-observer', accountId, 'status'], {
      gcTime: Infinity,
      structuralSharing: (previous, incoming) => {
        // This prefix stores generation status DTOs only. Reconcile against the
        // current cache at the synchronous write, not before queryFn resolves:
        // a terminal receipt may arrive between those two points.
        const cached = previous as QuizGenerationStatus | undefined;
        const job = incoming as QuizGenerationStatus;
        if (cached?.jobId === job.jobId && !isActiveGeneration(cached) && isActiveGeneration(job)) return cached;
        return replaceEqualDeep(previous, incoming);
      },
    });
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(patch: Partial<ObservationState>) {
    if (!this.current()) return;
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }
  private current() { return !this.stopped && isCurrentSessionGeneration(this.generation); }
  private available() { return document.visibilityState !== 'hidden' && navigator.onLine !== false; }
  private job() { return this.client.getQueryData<QuizGenerationStatus>(generationStatusKey(this.accountId, this.state.jobId)); }
  private assertReadCurrent(version: number, signal: AbortSignal, startingRequest = false) {
    if (!this.current() || version !== this.version || signal.aborted || (startingRequest && !this.available())) {
      throw new ApplicationError({ category: 'cancelled' });
    }
  }
  private preserveTerminal(job: QuizGenerationStatus) {
    const previous = this.client.getQueryData<QuizGenerationStatus>(generationStatusKey(this.accountId, job.jobId));
    return previous && !isActiveGeneration(previous) && isActiveGeneration(job) ? previous : job;
  }

  start() {
    generationOperations.activate(this.accountId);
    this.cleanup = [
      subscribeToSessionTransitions(() => this.destroy()),
      generationOperations.subscribeObservation(event => {
        if (!this.current() || event.accountId !== this.accountId) return;
        if (event.kind === 'started') {
          this.startedObservations.set(event.requestId, { jobId: this.state.jobId, discoveryRevision: this.discoveryRevision });
          return;
        }
        const atDispatch = this.startedObservations.get(event.requestId);
        const observationChanged = !atDispatch || atDispatch.jobId !== this.state.jobId
          || atDispatch.discoveryRevision !== this.discoveryRevision;
        this.startedObservations.delete(event.requestId);
        if (event.kind === 'accepted') this.accept(event.response, { superseded: event.superseded, observationChanged });
        else this.requestDiscovery('recovery');
      }),
    ];
    document.addEventListener('visibilitychange', this.resume);
    window.addEventListener('online', this.resume);
    window.addEventListener('offline', this.resume);
    // Known receipts survive reload independently of input reconstruction.
    const known = Object.values(generationOperations.getSnapshot().pending).find(operation => operation?.accountId === this.accountId && operation.jobId && operation.state === 'accepted');
    if (known?.jobId) {
      this.state = { ...this.state, jobId: known.jobId };
      if (!this.client.getQueryData(generationStatusKey(this.accountId, known.jobId))) {
        this.client.setQueryData(generationStatusKey(this.accountId, known.jobId), { jobId: known.jobId, status: known.jobStatus ?? 'PENDING' });
      }
    }
    const uncertain = Object.values(generationOperations.getSnapshot().pending).some(operation => operation?.accountId === this.accountId && !operation.jobId && ['uncertain', 'retry', 'conflict'].includes(operation.state));
    if (uncertain) this.discoveryRequested = 'recovery';
    this.publish({ recoveryNotice: uncertain, paused: !this.available() });
    // A saved receipt can be older than work started elsewhere. Always discover
    // on restoration; if none is active, reconcile the known receipt separately.
    void this.refresh(true);
  }
  destroy() {
    this.stopped = true;
    this.version++;
    this.clearTimer();
    this.abort.abort();
    this.cleanup.forEach(cleanup => cleanup());
    this.cleanup = [];
    this.startedObservations.clear();
    this.receiptFallback = null;
    this.notFoundJobId = null;
    document.removeEventListener('visibilitychange', this.resume);
    window.removeEventListener('online', this.resume);
    window.removeEventListener('offline', this.resume);
    void this.client.cancelQueries({ queryKey: ['generation-observer', this.accountId] });
  }
  private clearTimer() { if (this.timer !== undefined) clearTimeout(this.timer); this.timer = undefined; }
  private schedule() {
    this.clearTimer();
    if (!this.current() || !this.available() || this.flight || this.state.accessStopped || this.state.cancelling || (this.state.error && !canRetry(this.state.error))) return;
    const requested = this.discoveryRequested || this.statusRequested;
    if (!requested && (!this.state.jobId || !isActiveGeneration(this.job()))) return;
    this.timer = setTimeout(() => { void this.refresh(); }, Math.max(0, (requested ? 0 : this.nextPoll) - Date.now(), this.notBefore - Date.now()));
  }
  private resume = () => {
    this.clearTimer();
    this.publish({ paused: !this.available() });
    if (this.available()) void this.refresh(!isActiveGeneration(this.job()) && Boolean(this.job()));
  };
  private requestDiscovery(reason: 'refresh' | 'recovery') {
    this.discoveryRequested = reason === 'recovery' ? 'recovery' : this.discoveryRequested ?? 'refresh';
    this.version++;
    this.publish({ ...(reason === 'recovery' ? { recoveryNotice: true } : {}), discovered: false });
    // An earlier read cannot resolve a lost command or a receipt conflicting
    // with observation. Queue a fresh traversal behind the current request lane.
    void this.refresh(true);
  }
  accept(response: QuizGenerationResponse, { superseded = false, observationChanged = false }: {
    superseded?: boolean;
    observationChanged?: boolean;
  } = {}) {
    if (!this.current()) return;
    const previous = this.client.getQueryData<QuizGenerationStatus>(generationStatusKey(this.accountId, response.jobId));
    const receipt: QuizGenerationStatus = { jobId: response.jobId, status: response.status ?? 'PENDING' };
    const terminalReceipt = !isActiveGeneration(receipt);
    const updated = !previous || (isActiveGeneration(previous) && terminalReceipt);
    // A terminal replay is newer evidence than an in-flight status read. An
    // earlier active receipt cannot reverse an already confirmed terminal job.
    if (updated) this.client.setQueryData(generationStatusKey(this.accountId, response.jobId), { ...previous, ...receipt });
    const known = this.client.getQueryData<QuizGenerationStatus>(generationStatusKey(this.accountId, response.jobId)) ?? receipt;
    if (!superseded && this.notFoundJobId && this.notFoundJobId !== response.jobId) {
      this.notFoundJobId = null;
      this.publish({ error: null, accessStopped: false });
    }
    // A superseded dispatch cannot replace newer observation or interrupt its
    // recovery, even if this is our first evidence of the older job. Still keep
    // the receipt for that exact job and let its command save recovery metadata.
    // Discovery begun after dispatch can observe work started in another tab.
    // Preserve both its pending intent and a discovered job, even when dispatch
    // predates this observer. Resolve ambiguous receipts through a fresh list.
    const needsDiscovery = (isActiveGeneration(known) && observationChanged
      && (this.state.jobId !== null || this.discoveryRequested !== null))
      // A terminal replay identifies the result to reconcile if the currently
      // selected active job has actually finished. It must not lose that ID.
      || (terminalReceipt && isActiveGeneration(this.job()));
    if (this.state.jobId !== response.jobId && (superseded || needsDiscovery
      || ((previous !== undefined || !isActiveGeneration(known)) && isActiveGeneration(this.job())))) {
      if (terminalReceipt && known.status === 'COMPLETED') this.refreshQuizzes();
      if (needsDiscovery && !superseded) {
        this.receiptFallback = response.jobId;
        this.requestDiscovery('refresh');
      }
      return;
    }
    // Only an ordinary refresh can yield to an exact start receipt. Another
    // command's delayed receipt cannot satisfy recovery of a lost start response.
    if (!superseded && response.jobId !== this.state.jobId) this.receiptFallback = null;
    if (!superseded && isActiveGeneration(known) && this.discoveryRequested !== 'recovery' && !this.receiptFallback) this.discoveryRequested = null;
    this.select(response.jobId, updated && terminalReceipt);
    if (terminalReceipt) this.confirm(known, false);
  }
  watch(jobId: string) {
    if (!this.current() || jobId === this.state.jobId) return;
    // A stale screen must not replace the account's currently active job.
    if (isActiveGeneration(this.job())) return;
    if (this.discoveryRequested && this.flight && !this.state.jobId) {
      // A screen supplies a fallback ID, not new server evidence. The ongoing
      // discovery still decides which job is active; absence reconciles this ID.
      this.statusRequested = true;
      this.publish({ jobId });
      return;
    }
    this.select(jobId);
  }
  private select(jobId: string, reconcile = false) {
    if (jobId === this.state.jobId && !reconcile) return;
    this.version++;
    this.failures = 0;
    this.nextPoll = 0;
    this.statusRequested = true;
    this.notFoundJobId = null;
    this.publish({ jobId, error: null, cancelError: null, accessStopped: false });
    // The lane's finally block schedules this exact job if another read or
    // cancellation is in flight. Retry-After remains an account-wide deadline.
    void this.refresh();
  }
  refresh = (discover = false): Promise<void> => {
    if (!this.current()) return Promise.resolve();
    if (discover || !this.state.jobId) this.discoveryRequested ??= 'refresh';
    if (this.flight) return this.flight;
    if (!this.discoveryRequested && this.state.jobId) this.statusRequested = true;
    if (!this.available() || this.state.cancelling || this.state.accessStopped) return Promise.resolve();
    if (Date.now() < this.notBefore) { this.schedule(); return Promise.resolve(); }
    this.clearTimer();
    const version = this.version;
    const jobId = this.discoveryRequested ? null : this.state.jobId;
    if (!jobId) this.discoveryRevision++;
    this.publish({ checking: true });
    const work = this.read(jobId, version);
    this.flight = work.finally(() => {
      this.flight = null;
      this.publish({ checking: false });
      this.schedule();
    });
    return this.flight;
  };
  private async read(jobId: string | null, version: number) {
    if (!this.current() || version !== this.version || !this.available()) return;
    // Reconcile terminal receipts once, then stop even if that read fails.
    // A later explicit refresh/resume can still request another read.
    if (jobId && this.job() && !isActiveGeneration(this.job())) this.statusRequested = false;
    try {
      if (jobId) {
        const job = await this.client.fetchQuery({
          queryKey: generationStatusKey(this.accountId, jobId),
          queryFn: async ({ signal }) => {
            this.assertReadCurrent(version, signal, true);
            const result = await this.service.getGenerationStatus(jobId, signal);
            // Reject obsolete requests here. The status cache's write policy
            // also preserves terminal receipts arriving after this check.
            this.assertReadCurrent(version, signal);
            return this.preserveTerminal(result);
          },
          staleTime: 0, retry: false, gcTime: Infinity, networkMode: 'always',
        });
        if (!this.current() || version !== this.version) return;
        this.statusRequested = false;
        this.confirm(job);
      } else {
        const active = await this.client.fetchQuery({
          queryKey: ['generation-observer', this.accountId, 'discovery'],
          queryFn: async ({ signal }) => {
            const result = await discoverActiveGeneration(async page => {
              this.assertReadCurrent(version, signal, true);
              const pageResult = await this.service.getGenerationJobs(page, signal);
              this.assertReadCurrent(version, signal);
              return { ...pageResult, content: pageResult.content.map(job => this.preserveTerminal(job)) };
            });
            this.assertReadCurrent(version, signal);
            return result;
          },
          staleTime: 0, retry: false, networkMode: 'always',
        });
        if (!this.current() || version !== this.version) return;
        this.discoveryRequested = null;
        this.publish({ discovered: true });
        if (active) {
          this.receiptFallback = null;
          this.statusRequested = false;
          this.client.setQueryData(generationStatusKey(this.accountId, active.jobId), active);
          this.publish({ jobId: active.jobId, ...(active.jobId !== this.state.jobId ? { cancelError: null } : {}) });
          this.confirm(active);
          await generationOperations.recordJob(active.jobId, active.status, active.generatedQuizId ?? undefined);
        } else {
          this.publish({ error: null });
          // Absence is not evidence that an uncertain start failed: it may have completed.
          if (this.state.recoveryNotice) this.refreshQuizzes();
          const fallback = this.receiptFallback ?? this.state.jobId;
          this.receiptFallback = null;
          if (fallback) {
            if (fallback !== this.state.jobId) this.publish({ jobId: fallback, cancelError: null, accessStopped: false });
            this.statusRequested = true;
            await this.read(fallback, version);
          }
        }
      }
    } catch (error) {
      if (!this.current() || version !== this.version) return;
      const safe = toApplicationError(error);
      if (!isCancelledError(error) && safe.category !== 'cancelled') this.readError(safe, jobId);
    }
  }
  private confirm(job: QuizGenerationStatus, resetReadBackoff = true) {
    this.notFoundJobId = null;
    if (resetReadBackoff) {
      this.failures = 0;
      this.notBefore = 0;
    }
    this.nextPoll = Date.now() + 5_000;
    this.publish({ error: null, accessStopped: false, ...(!isActiveGeneration(job) ? { cancelError: null } : {}) });
    if (job.status === 'COMPLETED') {
      // Nullable legacy results can acquire a confirmed ID on reconciliation.
      // Acknowledging a marker must still survive subsequent reads in memory.
      if (job.generatedQuizId && !this.observedResultIds.has(job.generatedQuizId)) {
        this.observedResultIds.add(job.generatedQuizId);
        this.publish({ newQuizIds: [...this.state.newQuizIds, job.generatedQuizId] });
      }
      if (!this.completed.has(job.jobId)) {
        this.completed.add(job.jobId);
        this.refreshQuizzes();
      }
    }
  }
  private refreshQuizzes() {
    const key = ownedQuizzesKey(this.accountId);
    const reads = this.client.getQueryCache().findAll({ queryKey: key })
      .filter(query => query.state.fetchStatus === 'fetching').map(query => query.promise);
    const invalidate = () => { if (this.current()) void this.client.invalidateQueries({ queryKey: key }); };
    // An initial list request may hold a pre-completion snapshot. Invalidation
    // while it has no data would join that request, so refresh after it settles.
    if (reads.length) void Promise.allSettled(reads).then(invalidate);
    else invalidate();
  }
  private readError(error: unknown, jobId: string | null = null) {
    const safe = toApplicationError(error);
    // A late cancellation can report the old job missing after a different
    // receipt has already queued discovery. That 404 cannot stop its recovery.
    const recoverReceipt = safe.status === 404 && jobId !== null
      && this.receiptFallback !== null && this.receiptFallback !== jobId;
    this.notFoundJobId = safe.status === 404 && !recoverReceipt ? jobId : null;
    this.failures++;
    const backoff = Math.min(60_000, 10_000 * 2 ** Math.min(this.failures - 1, 3));
    const delay = backoff * (0.9 + Math.random() * 0.2);
    this.notBefore = Date.now() + (canRetry(safe) ? Math.max(delay, (safe.retryAfterSeconds ?? 0) * 1000) : 0);
    this.nextPoll = this.notBefore;
    this.publish({ error: recoverReceipt ? null : safe,
      accessStopped: safe.status === 401 || safe.status === 403 || (safe.status === 404 && !recoverReceipt) });
  }
  cancel = (): Promise<void> => {
    if (this.cancellation) return this.cancellation;
    const jobId = this.state.jobId;
    if (!jobId || !this.current() || !isActiveGeneration(this.job()) || !this.available() || this.state.accessStopped) return Promise.resolve();
    this.clearTimer();
    this.publish({ cancelling: true, cancelError: null });
    const work = async () => {
      try {
        // Include the wait and every early return in finally. A new accepted
        // job must not inherit a stuck cancellation flag from this job.
        await this.flight;
        if (!this.current() || jobId !== this.state.jobId || !isActiveGeneration(this.job()) || !this.available()) return;
        const job = await this.service.cancelGenerationJob(jobId, this.abort.signal);
        // A queued discovery does not invalidate this exact-job mutation. A
        // replacement job or a newer terminal receipt does invalidate it.
        if (!this.current() || jobId !== this.state.jobId || !isActiveGeneration(this.job())) return;
        const confirmed = this.preserveTerminal(job);
        this.client.setQueryData(generationStatusKey(this.accountId, jobId), confirmed);
        this.statusRequested = false;
        // A successful DELETE does not shorten a Retry-After imposed on reads.
        this.confirm(confirmed, false);
        if (job.status === 'COMPLETED') {
          this.statusRequested = true;
          this.publish({ cancelling: false });
          await this.refresh();
        }
      } catch (error) {
        if (!this.current() || jobId !== this.state.jobId || !isActiveGeneration(this.job())) return;
        const safe = toApplicationError(error);
        this.publish({ cancelError: safe });
        // A 400/409 can mean completion won the race. A lost DELETE response is also uncertain.
        if (safe.status === 401 || safe.status === 403 || safe.status === 404) this.readError(safe, jobId);
        else {
          this.notBefore = Math.max(this.notBefore, Date.now() + (safe.retryAfterSeconds ?? 0) * 1000);
          this.publish({ cancelling: false });
          await this.refresh();
        }
      } finally {
        this.publish({ cancelling: false });
        this.schedule();
      }
    };
    this.cancellation = work().finally(() => { this.cancellation = null; });
    return this.cancellation;
  };
  acknowledge = (quizId: string) => { if (!this.state.newQuizIds.includes(quizId)) return; this.publish({ newQuizIds: this.state.newQuizIds.filter(id => id !== quizId) }); };
}
