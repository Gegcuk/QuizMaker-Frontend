import { performance } from 'node:perf_hooks';

export async function withPreparationDeadline(phases, {
  budgetMs = 300_000,
  now = () => performance.now(),
  signal,
} = {}) {
  if (!Number.isFinite(budgetMs) || budgetMs <= 0 || budgetMs > 300_000) {
    throw new Error('Preparation budget must be positive and at most five minutes');
  }
  if (signal?.aborted) throw signal.reason || new Error('Preparation cancelled');
  const started = now();
  const controller = new AbortController();
  const timeoutError = new Error('Entire browser preparation exceeded its shared deadline');
  const timer = setTimeout(() => controller.abort(timeoutError), budgetMs);
  const timings = [];
  let activePhase;
  let rejectOnAbort;
  const aborted = new Promise((_, reject) => {
    rejectOnAbort = () => reject(controller.signal.reason);
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });
  const cancel = () => controller.abort(signal.reason || new Error('Preparation cancelled'));
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  try {
    for (const phase of phases) {
      if (controller.signal.aborted) throw controller.signal.reason;
      const remainingMs = budgetMs - (now() - started);
      if (remainingMs <= 0) throw timeoutError;
      activePhase = phase.name;
      const phaseStarted = now();
      await Promise.race([
        phase.run({ signal: controller.signal, remainingMs }),
        aborted,
      ]);
      timings.push({ phase: phase.name, milliseconds: now() - phaseStarted });
      if (now() - started >= budgetMs) throw timeoutError;
    }
    return { milliseconds: now() - started, timings };
  } catch (error) {
    error.preparation = { status: 'failed', milliseconds: now() - started, phase: activePhase, timings };
    throw error;
  } finally {
    clearTimeout(timer);
    controller.signal.removeEventListener('abort', rejectOnAbort);
    signal?.removeEventListener('abort', cancel);
    // Stop cooperative children if a phase fails before the timer expires.
    if (!controller.signal.aborted) controller.abort(new Error('Preparation finished'));
  }
}
