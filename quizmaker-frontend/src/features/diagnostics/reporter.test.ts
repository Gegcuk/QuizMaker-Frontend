import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDiagnosticReporter } from './reporter';

describe('tab-local diagnostics policy', () => {
  let reporter: ReturnType<typeof createDiagnosticReporter>;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    reporter = createDiagnosticReporter('a'.repeat(40));
  });
  afterEach(() => { reporter.clear(); vi.useRealTimers(); vi.unstubAllEnvs(); });

  it('keeps only allowlisted metadata and route templates', () => {
    const secret = 'token-answer-document-prompt-payment-canary';
    const consoleSpy = vi.spyOn(console, 'error');
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem');
    const fetchSpy = vi.spyOn(window, 'fetch');
    reporter.report({ response: { status: 503, data: { detail: secret } }, stack: secret }, 'render', `/quizzes/${secret}/attempt`);
    expect(reporter.read()).toEqual([{
      category: 'server', source: 'render', status: 503, route: '/quizzes/:quizId/attempt',
      release: 'a'.repeat(40), occurredAt: Date.now(), reference: expect.any(String),
    }]);
    expect(JSON.stringify(reporter.read())).not.toContain(secret);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(storageSpy).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it('suppresses the same category across sources for exactly 60 seconds', () => {
    reporter.report({ status: 503 }, 'request');
    vi.advanceTimersByTime(59_999);
    reporter.report({ status: 500 }, 'render');
    expect(reporter.read()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    reporter.report({ status: 503 }, 'rejection');
    expect(reporter.read()).toHaveLength(2);
  });

  it('evicts the oldest record at 20 events and expires events by 30 minutes', () => {
    for (let i = 0; i < 21; i += 1) {
      reporter.report({ status: 503 }, 'request');
      vi.advanceTimersByTime(60_000);
    }
    expect(reporter.read()).toHaveLength(20);
    expect(reporter.read()[0].occurredAt).toBe(Date.parse('2026-10-08T12:01:00Z'));
    vi.advanceTimersByTime(30 * 60_000);
    expect(reporter.read()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes a record at the expiry boundary even without further reports', () => {
    reporter.report({ status: 503 }, 'request');
    vi.advanceTimersByTime(30 * 60_000 - 1);
    expect(reporter.read()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(reporter.read()).toEqual([]);
  });

  it('clears records and suppression state when killed or cleared', () => {
    reporter.report({ status: 503 }, 'request');
    reporter.setEnabled(false);
    reporter.report({ status: 503 }, 'request');
    expect(reporter.read()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    reporter.setEnabled(true);
    reporter.report({ status: 503 }, 'request');
    expect(reporter.read()).toHaveLength(1);
    reporter.clear();
    reporter.report({ status: 503 }, 'request');
    expect(reporter.read()).toHaveLength(1);
  });

  it('supports the build kill switch and keeps buffers isolated', () => {
    vi.stubEnv('VITE_DIAGNOSTICS_ENABLED', 'false');
    const disabled = createDiagnosticReporter();
    disabled.report({ status: 503 }, 'request');
    expect(disabled.read()).toEqual([]);
    disabled.setEnabled(true);
    disabled.report({ status: 503 }, 'request');
    expect(disabled.read()).toEqual([]);
    reporter.report({ status: 503 }, 'request');
    const anotherTab = createDiagnosticReporter();
    expect(anotherTab.read()).toEqual([]);
  });

  it('ignores cancellation and rejects unknown source, route, and release strings', () => {
    reporter.report({ code: 'ERR_CANCELED' }, 'request');
    expect(reporter.read()).toEqual([]);
    const invalidSource = 'seed-secret' as Parameters<typeof reporter.report>[1];
    reporter.report({}, invalidSource);
    expect(reporter.read()).toEqual([]);
    const invalidRelease = createDiagnosticReporter('seed-secret');
    invalidRelease.report({}, 'render', '/unknown/seed-secret?token=seed-secret');
    expect(invalidRelease.read()[0]).toMatchObject({ route: 'unknown', release: 'unknown' });
    invalidRelease.clear();
  });
});
