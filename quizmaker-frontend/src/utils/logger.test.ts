import { afterEach, describe, expect, it, vi } from 'vitest';
import { diagnostics } from '@/features/diagnostics/reporter';
import { logger } from './logger';

describe('legacy logger privacy boundary', () => {
  afterEach(() => { diagnostics.clear(); vi.restoreAllMocks(); });
  it('discards every argument in development and production', () => {
    const spies = ['debug', 'info', 'warn', 'error', 'log'].map(method =>
      vi.spyOn(console, method as 'debug').mockImplementation(() => undefined));
    const secret = 'seed-token-answer-question-document-prompt-payment';
    for (const method of ['debug', 'info', 'warn', 'error'] as const) {
      logger[method](secret, secret, { token: secret, rawUrl: secret, error: new Error(secret) });
    }
    expect(spies.every(spy => spy.mock.calls.length === 0)).toBe(true);
    expect(JSON.stringify(diagnostics.read())).not.toContain(secret);
    expect(diagnostics.read()).toHaveLength(1);
  });
});
