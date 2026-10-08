import { afterEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, AxiosHeaders, CanceledError } from 'axios';
import { ApplicationError, getSafeErrorMessage, toApplicationError } from './applicationError';
import { getValidationErrors, isErrorStatus } from './errorUtils';

const secret = 'seed-token-answer-document-prompt-payment-secret';
const correlationId = '12345678-1234-4234-8234-123456789abc';
const failure = (status: number, data: unknown = {}) => ({
  isAxiosError: true, message: secret, stack: secret, request: { body: secret },
  config: { url: `/quizzes/${secret}?answer=${secret}`, headers: { Authorization: secret } },
  response: { status, data, headers: { 'X-Correlation-ID': correlationId } },
});

describe('application error boundary', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [400, 'validation', 'Check your entries'],
    [401, 'authentication', 'sign in again'],
    [403, 'authorization', 'Ask the owner'],
    [404, 'not-found', 'Return to the list'],
    [409, 'conflict', 'Refresh the latest state'],
    [410, 'gone', 'no longer available'],
    [412, 'precondition', 'item changed'],
    [422, 'validation', 'Check your entries'],
    [429, 'rate-limit', 'Please wait'],
    [503, 'server', 'try again later'],
  ])('keeps HTTP %i actionable without retaining the transport', (status, category, recovery) => {
    const error = toApplicationError(failure(status, { status, detail: secret, title: secret, instance: secret }));
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error).toMatchObject({ status, category, correlationId, response: { status } });
    expect(getSafeErrorMessage(error)).toContain(recovery);
    expect(getSafeErrorMessage(error)).toContain(`Support reference: ${correlationId}`);
    expect(isErrorStatus(error, status)).toBe(true);
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(error.stack).toBeUndefined();
    expect(error).not.toHaveProperty('cause');
    expect(error).not.toHaveProperty('config');
    expect(error).not.toHaveProperty('request');
    expect(error.response).not.toHaveProperty('data');
    expect(toApplicationError(error)).toBe(error);
  });

  it('keeps allowlisted type, code, field associations and retry guidance', () => {
    const error = toApplicationError(failure(422, {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      properties: { code: 'VALIDATION_ERROR', retryAfter: 15, errors: { title: [secret], [secret]: [secret] } },
    }));
    expect(error).toMatchObject({
      type: 'https://quizzence.com/docs/errors/validation-failed', code: 'VALIDATION_ERROR', retryAfterSeconds: 15,
      fieldErrors: { title: ['Check this field and try again.'] },
    });
    expect(getValidationErrors(error)).toEqual({ title: ['Check this field and try again.'] });
    expect(error.message).toContain('Wait at least 15 seconds');
    expect(JSON.stringify(error)).not.toContain(secret);
  });

  it('reads Retry-After seconds and HTTP dates with AxiosHeaders', () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-08T12:00:00Z'));
    for (const retry of ['20', 'Thu, 08 Oct 2026 12:00:20 GMT']) {
      const raw = failure(429);
      const error = toApplicationError({ ...raw, response: { ...raw.response, headers: new AxiosHeaders({ 'Retry-After': retry }) } });
      expect(error.retryAfterSeconds).toBe(20);
    }
  });

  it.each([null, undefined, 'raw-secret', [], 12, { response: { status: '503', data: [secret] } }])(
    'falls back safely for malformed failures', value => {
      expect(toApplicationError(value).category).toBe('unexpected');
      expect(getSafeErrorMessage(value)).not.toContain('raw-secret');
    },
  );

  it('rejects malformed metadata and never exposes arbitrary strings', () => {
    const raw = failure(503, {
      code: secret, type: `https://quizzence.com/docs/errors/${secret}`, correlationId: secret,
      errors: { title: [null], email: {}, '': [secret], [secret]: [secret] }, retryAfter: -20,
    });
    const error = toApplicationError({ ...raw, response: { ...raw.response, headers: { 'x-correlation-id': secret, 'retry-after': secret } } });
    expect(error).toMatchObject({ status: 503, category: 'server' });
    expect(error.code).toBeUndefined();
    expect(error.type).toBeUndefined();
    expect(error.correlationId).toBeUndefined();
    expect(error.fieldErrors).toBeUndefined();
    expect(error.retryAfterSeconds).toBeUndefined();
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(toApplicationError({ get response() { throw new Error(secret); } }).category).toBe('unexpected');
  });

  it('distinguishes network, offline, timeout, cancellation, and session changes', () => {
    expect(toApplicationError(new AxiosError(secret, 'ERR_NETWORK')).category).toBe('network');
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(toApplicationError(new AxiosError(secret, 'ERR_NETWORK')).category).toBe('offline');
    expect(toApplicationError(new AxiosError(secret, 'ECONNABORTED')).category).toBe('timeout');
    expect(toApplicationError(new AxiosError(secret, 'ETIMEDOUT')).category).toBe('timeout');
    expect(toApplicationError(new CanceledError(secret)).category).toBe('cancelled');
    expect(toApplicationError({ code: 'SESSION_CHANGED', message: secret })).toMatchObject({ category: 'cancelled', code: 'SESSION_CHANGED' });
    expect(toApplicationError(new Error(secret)).category).toBe('unexpected');
    for (const raw of [
      new AxiosError(secret, 'ERR_NETWORK'),
      new AxiosError(secret, 'ECONNABORTED'),
      new AxiosError(secret, 'ETIMEDOUT'),
      new CanceledError(secret),
      { code: 'SESSION_CHANGED', message: secret },
    ]) {
      const safe = toApplicationError(raw);
      expect(JSON.stringify(safe)).not.toContain(secret);
      expect(safe.message).not.toContain(secret);
      expect(safe.stack).toBeUndefined();
    }
  });

  it('preserves the existing quiz balance trigger and zero balance without retaining detail', () => {
    const raw = failure(409, { detail: `Insufficient token balance: required=6, available=0. ${secret}` });
    expect(toApplicationError(raw, { balanceConflict: true })).toMatchObject({
      code: 'INSUFFICIENT_BALANCE', balance: { requiredTokens: 6, currentBalance: 0 },
    });
    expect(JSON.stringify(toApplicationError(raw, { balanceConflict: true }))).not.toContain(secret);
    expect(toApplicationError(raw).code).toBeUndefined();
  });

  it('preserves verified quiz, generation, document, and media field associations', () => {
    const error = toApplicationError(failure(422, { errors: {
      timerDuration: [secret], timerEnabled: [secret], quizTitle: [secret], quizDescription: [secret],
      language: [secret], estimatedTimePerQuestion: [secret], chunkIndices: [secret],
      maxChunkSize: [secret], chunkingStrategy: [secret], 'blocks[0].assetId': [secret],
      sizeBytes: [secret], mimeType: [secret], originalFilename: [secret], [secret]: [secret],
    } }));
    expect(error.fieldErrors).toMatchObject({
      timerDuration: ['Check this field and try again.'], timerEnabled: ['Check this field and try again.'],
      quizTitle: ['Check this field and try again.'], quizDescription: ['Check this field and try again.'],
      language: ['Check this field and try again.'], estimatedTimePerQuestion: ['Check this field and try again.'],
      chunkIndices: ['Check this field and try again.'], maxChunkSize: ['Check this field and try again.'],
      chunkingStrategy: ['Check this field and try again.'], 'blocks[0].assetId': ['Check this field and try again.'],
      sizeBytes: ['Check this field and try again.'], mimeType: ['Check this field and try again.'],
      originalFilename: ['Check this field and try again.'],
    });
    expect(JSON.stringify(error)).not.toContain(secret);
  });

  it('does not let rejected field names displace valid field errors', () => {
    const errors = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`seed-secret-${i}`, [secret]]));
    errors.timerDuration = [secret];
    expect(getValidationErrors(failure(422, { errors }))).toEqual({ timerDuration: ['Check this field and try again.'] });
  });

  it('does not trust raw local-looking messages or arbitrary local metadata', () => {
    expect(getSafeErrorMessage(new Error('File is empty.'))).toContain('unexpected error');
    expect(getSafeErrorMessage({ localMediaValidation: { reason: 'empty-file' }, message: secret })).toContain('unexpected error');
    const error = new ApplicationError({ category: 'validation', localMediaValidation: {
      reason: 'unsupported-file-type', allowedMimeTypes: [`image/${secret}`],
    } });
    expect(error.message).toBe('Unsupported file type. Choose a supported file format.');
    expect(JSON.stringify(error)).not.toContain(secret);
  });
});
