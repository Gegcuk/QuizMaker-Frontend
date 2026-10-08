import { afterEach, describe, expect, it } from 'vitest';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import { diagnostics } from './reporter';
import { startDiagnostics } from './lifecycle';

describe('diagnostics lifecycle', () => {
  let stop: (() => void) | undefined;
  afterEach(() => { stop?.(); terminateSession('logout'); diagnostics.setEnabled(true); });

  it('clears on login, account change, and logout without recording identities', () => {
    stop = startDiagnostics();
    diagnostics.report({ status: 503 }, 'request');
    establishSession('account-a-token', 'account-a-refresh');
    expect(diagnostics.read()).toEqual([]);
    diagnostics.report({ status: 503 }, 'request');
    establishSession('account-b-token', 'account-b-refresh', 'account-switch');
    expect(diagnostics.read()).toEqual([]);
    diagnostics.report({ status: 503 }, 'request');
    terminateSession('logout');
    expect(diagnostics.read()).toEqual([]);
  });

  it('reports rejections safely, prevents raw default output, and removes listeners', () => {
    stop = startDiagnostics();
    const event = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(event, 'reason', { value: new Error('seeded-token-secret') });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(diagnostics.read()[0]).toMatchObject({ source: 'rejection', category: 'unexpected' });
    expect(JSON.stringify(diagnostics.read())).not.toContain('seeded-token-secret');
    stop();
    window.dispatchEvent(event);
    expect(diagnostics.read()).toEqual([]);
  });

  it('clears when the tab leaves and continues to suppress raw output when killed', () => {
    stop = startDiagnostics();
    diagnostics.report({ status: 503 }, 'request');
    window.dispatchEvent(new Event('pagehide'));
    expect(diagnostics.read()).toEqual([]);
    diagnostics.setEnabled(false);
    const event = new Event('unhandledrejection', { cancelable: true });
    Object.defineProperty(event, 'reason', { value: 'seeded-secret' });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(diagnostics.read()).toEqual([]);
  });

  it('does not retain or print a raw runtime error', () => {
    stop = startDiagnostics();
    const event = new ErrorEvent('error', {
      message: 'runtime-seeded-secret', error: new Error('runtime-seeded-secret'), cancelable: true,
    });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(diagnostics.read()[0]).toMatchObject({ source: 'application', category: 'unexpected' });
    expect(JSON.stringify(diagnostics.read())).not.toContain('runtime-seeded-secret');
  });
});
