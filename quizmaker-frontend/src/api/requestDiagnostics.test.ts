import { describe, expect, it } from 'vitest';
import { getSafeRequestTarget } from './requestDiagnostics';

describe('getSafeRequestTarget', () => {
  it('omits query strings and fragments from diagnostics', () => {
    expect(
      getSafeRequestTarget('/v1/auth/oauth/exchange?code=code-canary#verifier-canary'),
    ).toBe('/v1/auth/oauth/exchange');
  });

  it('redacts dynamic or identity-bearing path segments', () => {
    expect(
      getSafeRequestTarget(
        '/v1/users/person%40example.com/quizzes/48c68179-dc93-40ba-a4e3-07aeaffdfff4',
      ),
    ).toBe('/v1/users/:redacted/quizzes/:redacted');
  });

  it('fails closed for missing or malformed endpoints', () => {
    expect(getSafeRequestTarget(undefined)).toBe('[unknown endpoint]');
    expect(getSafeRequestTarget('http://%')).toBe('[redacted endpoint]');
  });
});
