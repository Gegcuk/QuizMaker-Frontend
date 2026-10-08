// Timeout cancellation does not unwind an async test body before the next test.
// The runner's after hook must await the same cleanup started by cancellation.
export const registerSmokeCleanup = (context, cleanup) => {
  let completion;
  const finish = () => completion ??= Promise.resolve().then(cleanup);
  const onAbort = () => { void finish().catch(() => {}); };
  context.signal.addEventListener('abort', onAbort, { once: true });
  context.after(async () => {
    try { await finish(); }
    finally { context.signal.removeEventListener('abort', onAbort); }
  });
  if (context.signal.aborted) onAbort();
  return finish;
};
