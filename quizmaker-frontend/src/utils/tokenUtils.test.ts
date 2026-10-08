import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => { vi.resetModules(); localStorage.clear(); });
afterEach(() => vi.restoreAllMocks());

describe('token storage read failures', () => {
  it('returns the existing empty fallback when writes work but reads are denied', async () => {
    const tokens = await import('./tokenUtils');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
    // The availability write/remove probe still succeeds in this case.
    expect(tokens.getAccessToken()).toBeNull();
    expect(tokens.getRefreshToken()).toBeNull();
  });
  it('retains tokens already held by the existing in-memory fallback', async () => {
    const tokens = await import('./tokenUtils');
    const deniedWrites = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Unavailable'); });
    tokens.setTokens('fixture-access', 'fixture-refresh');
    deniedWrites.mockRestore();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Read denied'); });
    expect(tokens.getAccessToken()).toBe('fixture-access');
    expect(tokens.getRefreshToken()).toBe('fixture-refresh');
  });
  it('continues reading the existing keys normally when storage is usable', async () => {
    const tokens = await import('./tokenUtils');
    localStorage.setItem('accessToken', 'stored-access-fixture');
    localStorage.setItem('refreshToken', 'stored-refresh-fixture');
    expect(tokens.getAccessToken()).toBe('stored-access-fixture');
    expect(tokens.getRefreshToken()).toBe('stored-refresh-fixture');
  });
});
