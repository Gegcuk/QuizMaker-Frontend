import { isAxiosError, isCancel } from 'axios';

export type ErrorCategory =
  | 'validation' | 'authentication' | 'authorization' | 'not-found'
  | 'conflict' | 'gone' | 'precondition' | 'rate-limit' | 'server'
  | 'offline' | 'network' | 'timeout' | 'cancelled' | 'unexpected';

const guidance: Record<ErrorCategory, string> = {
  validation: 'Validation error. Check your entries and try again.',
  authentication: 'Authentication required. Please sign in again.',
  authorization: 'Insufficient permissions. Ask the owner for access.',
  'not-found': 'The requested item was not found. Return to the list and refresh it.',
  conflict: 'Conflict. Refresh the latest state before trying again.',
  gone: 'This item is no longer available. Return to the list.',
  precondition: 'The item changed. Refresh the latest state before trying again.',
  'rate-limit': 'Too many requests. Please wait before trying again.',
  server: 'Server error occurred. Please try again later.',
  offline: 'You appear to be offline. Check your connection before trying again.',
  network: 'Network error occurred. Check your connection before trying again.',
  timeout: 'The request timed out. Check the latest state before trying again.',
  cancelled: 'The request was cancelled.',
  unexpected: 'An unexpected error occurred. Please refresh the page and try again.',
};

const safeCodes = new Set([
  'INSUFFICIENT_BALANCE', 'VALIDATION_ERROR', 'AUTHENTICATION_ERROR',
  'AUTHORIZATION_ERROR', 'NOT_FOUND', 'CONFLICT', 'RATE_LIMIT_EXCEEDED',
  'SERVICE_UNAVAILABLE', 'SESSION_CHANGED',
]);
const safeProblemNames = new Set([
  'type-mismatch', 'internal-server-error', 'validation-failed', 'validation-error',
  'bad-request', 'unauthorized', 'forbidden', 'not-found', 'conflict', 'gone',
  'precondition-failed', 'rate-limit-exceeded', 'too-many-requests',
  'service-unavailable', 'insufficient-balance', 'insufficient-token-balance',
]);
const safeFieldNames = new Set([
  'title', 'description', 'name', 'username', 'email', 'password', 'confirmPassword',
  'currentPassword', 'newPassword', 'difficulty', 'visibility', 'content', 'response',
  'file', 'text', 'questionText', 'type', 'categoryId', 'tagIds', 'questionsPerType',
  'estimatedTime', 'options', 'gaps', 'answer', 'answers', 'id', 'MCQ_SINGLE',
  'MCQ_MULTI', 'TRUE_FALSE', 'FILL_GAP', 'MATCHING', 'ORDERING', 'COMPLIANCE', 'HOTSPOT',
  // Request-property names verified in the live group specifications. Values are never retained.
  'action', 'aggressiveCombinationThreshold', 'align', 'alt', 'articleId', 'assetId',
  'attachmentAssetId', 'attachmentUrl', 'author', 'autoCreateCategory', 'autoCreateTags',
  'blocks', 'canonicalUrl', 'caption', 'chapterNumber', 'chapterTitle', 'checklist',
  'chunkIndices', 'chunkingStrategy', 'clearAttachment', 'clientId', 'clientVersion',
  'code', 'codeVerifier', 'color', 'contentGroup', 'detail', 'documentId', 'dryRun',
  'estimatedTimePerQuestion', 'eventName', 'excerpt', 'expiresAt', 'explanation', 'faqs',
  'format', 'height', 'heroImage', 'heroKicker', 'hint', 'href', 'icon',
  'includeCorrectAnswer', 'includeCorrectness', 'includeExplanation', 'internalNote',
  'isDefault', 'isPublic', 'isRepetitionEnabled', 'keyPoints', 'label', 'language', 'link',
  'maxChunkSize', 'message', 'mimeType', 'minChunkSize', 'mode', 'newPriceLookupKey',
  'noindex', 'ogImage', 'oneTime', 'orderedQuizIds', 'originalFilename', 'packId',
  'packReferenceProvided', 'pageUrl', 'payload', 'permissionName', 'position', 'priceId',
  'primaryCta', 'provider', 'publishedAt', 'question', 'questionId', 'quizDescription',
  'quizIds', 'quizScope', 'quizTitle', 'readingTime', 'redirectUri', 'references',
  'refreshToken', 'rendition', 'reporterEmail', 'reporterName', 'resource', 'roleName',
  'scope', 'secondaryCta', 'sectionId', 'sections', 'severity', 'sha256', 'sizeBytes',
  'slug', 'sourceType', 'stats', 'status', 'stepsToReproduce', 'storeChunks', 'strategy',
  'subscriptionId', 'summary', 'tags', 'timerDuration', 'timerEnabled', 'token', 'update',
  'url', 'value', 'width',
]);

interface LocalMediaValidation {
  reason: 'no-file' | 'empty-file' | 'file-too-large' | 'unsupported-file-type' | 'image-unreadable';
  maxSizeBytes?: number;
  allowedMimeTypes?: readonly string[];
}

const safeMediaMimeTypes = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'image/avif', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif',
  'application/pdf', 'text/plain', 'text/csv', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

/** Only locally selected reasons and validated configuration can supply this text. */
const localMediaMessage = (validation: LocalMediaValidation | undefined): string | undefined => {
  switch (validation?.reason) {
    case 'no-file': return 'No file selected.';
    case 'empty-file': return 'File is empty.';
    case 'image-unreadable': return 'Failed to read image dimensions. Choose another image.';
    case 'file-too-large': {
      const limit = validation.maxSizeBytes;
      if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit <= 0) {
        return 'File is too large. Choose a smaller file.';
      }
      const size = limit < 1024 ? `${limit} B`
        : limit < 1024 * 1024 ? `${(limit / 1024).toFixed(1)} KB`
        : `${(limit / (1024 * 1024)).toFixed(1)} MB`;
      return `File is too large. Max size is ${size}.`;
    }
    case 'unsupported-file-type': {
      const types = validation.allowedMimeTypes;
      return Array.isArray(types) && types.length > 0 && types.length <= 20
        && types.every(type => safeMediaMimeTypes.has(type))
        ? `Unsupported file type. Allowed: ${types.join(', ')}.`
        : 'Unsupported file type. Choose a supported file format.';
    }
    default: return undefined;
  }
};

const record = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : undefined;

const httpStatus = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isInteger(value) && value >= 400 && value <= 599
    ? value : undefined;

const nonnegativeNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000
    ? value : undefined;

const problemType = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const prefix = 'https://quizzence.com/docs/errors/';
  return value.startsWith(prefix) && safeProblemNames.has(value.slice(prefix.length))
    ? value : undefined;
};

const reference = (value: unknown): string | undefined =>
  typeof value === 'string' && (/^[a-f0-9]{32}$/i.test(value)
    || /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value))
    ? value : undefined;

const readHeader = (headers: unknown, name: string): unknown => {
  const values = record(headers);
  if (!values) return undefined;
  if (typeof values.get === 'function') return values.get.call(headers, name);
  const key = Object.keys(values).find(key => key.toLowerCase() === name);
  return key ? values[key] : undefined;
};

const retrySeconds = (value: unknown): number | undefined => {
  if (typeof value === 'number') return nonnegativeNumber(value);
  if (typeof value !== 'string' || value.length > 64) return undefined;
  if (/^\d{1,6}$/.test(value.trim())) return Number(value.trim());
  if (!/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) return undefined;
  const milliseconds = Date.parse(value) - Date.now();
  return Number.isFinite(milliseconds)
    ? nonnegativeNumber(Math.max(0, Math.ceil(milliseconds / 1000))) : undefined;
};

const fieldErrors = (value: unknown): Record<string, string[]> | undefined => {
  const fields = record(value);
  if (!fields) return undefined;
  const result: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(fields)) {
    if (field.length > 100 || !/^[A-Za-z]\w*(?:\.\w+|\[\d{1,4}\])*$/.test(field)
      || !field.split(/[.[\]]/).filter(Boolean).every(
      part => safeFieldNames.has(part) || /^\d{1,4}$/.test(part),
    )) continue;
    if (typeof messages !== 'string' && !(Array.isArray(messages) && messages.length > 0
      && messages.every(message => typeof message === 'string'))) continue;
    // Keep the field association without echoing submitted values in server text.
    result[field] = ['Check this field and try again.'];
    if (Object.keys(result).length === 20) break;
  }
  return Object.keys(result).length ? result : undefined;
};

const categoryForStatus = (status: number): ErrorCategory => {
  switch (status) {
    case 400: case 413: case 415: case 422: return 'validation';
    case 401: return 'authentication';
    case 403: return 'authorization';
    case 404: return 'not-found';
    case 409: return 'conflict';
    case 410: return 'gone';
    case 412: return 'precondition';
    case 429: return 'rate-limit';
    default: return status >= 500 ? 'server' : 'unexpected';
  }
};

interface ErrorMetadata {
  category: ErrorCategory;
  status?: number;
  code?: string;
  type?: string;
  fieldErrors?: Record<string, string[]>;
  retryAfterSeconds?: number;
  correlationId?: string;
  balance?: { requiredTokens?: number; currentBalance?: number };
  invalidCheckout?: boolean;
  localMediaValidation?: LocalMediaValidation;
}

/** No Axios config, request, body, original stack, or cause survives this boundary. */
export class ApplicationError extends Error {
  readonly category: ErrorCategory;
  readonly status?: number;
  readonly code?: string;
  readonly type?: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSeconds?: number;
  readonly correlationId?: string;
  readonly balance?: ErrorMetadata['balance'];
  readonly recovery: string;
  // Status-only compatibility for existing checks, including query retry policy.
  readonly response?: { status: number };

  constructor(metadata: ErrorMetadata) {
    const category = Object.hasOwn(guidance, metadata.category) ? metadata.category : 'unexpected';
    const code = metadata.code && safeCodes.has(metadata.code) ? metadata.code : undefined;
    const correlationId = reference(metadata.correlationId);
    const retryAfterSeconds = nonnegativeNumber(metadata.retryAfterSeconds);
    const balanceMessage = code === 'INSUFFICIENT_BALANCE'
      ? 'Insufficient token balance for generation. Add tokens before trying again.' : undefined;
    const wait = retryAfterSeconds === undefined ? '' : ` Wait at least ${retryAfterSeconds} seconds.`;
    const support = correlationId ? ` Support reference: ${correlationId}.` : '';
    const specific = metadata.invalidCheckout ? 'Invalid checkout response. Refresh payment status before trying again.'
      : metadata.status === 413 ? 'File size exceeds maximum allowed size. Choose a smaller file.'
      : metadata.status === 415 ? 'Unsupported document format. Choose a supported file type.' : undefined;
    super(`${localMediaMessage(metadata.localMediaValidation) ?? balanceMessage ?? specific ?? guidance[category]}${wait}${support}`);
    this.name = 'ApplicationError';
    this.stack = undefined;
    this.category = category;
    this.status = httpStatus(metadata.status);
    this.code = code;
    this.type = problemType(metadata.type);
    this.fieldErrors = fieldErrors(metadata.fieldErrors);
    this.retryAfterSeconds = retryAfterSeconds;
    this.correlationId = correlationId;
    if (metadata.balance) this.balance = Object.freeze({
      requiredTokens: nonnegativeNumber(metadata.balance.requiredTokens),
      currentBalance: nonnegativeNumber(metadata.balance.currentBalance),
    });
    this.recovery = this.message;
    if (this.status !== undefined) this.response = Object.freeze({ status: this.status });
    if (this.fieldErrors) {
      Object.values(this.fieldErrors).forEach(messages => Object.freeze(messages));
      Object.freeze(this.fieldErrors);
    }
    Object.freeze(this);
  }
}

export function toApplicationError(error: unknown, options: { balanceConflict?: boolean } = {}): ApplicationError {
  if (error instanceof ApplicationError) return error;
  // Malformed payloads (including throwing getters) must not replace a failure.
  try {
    const source = record(error);
    if (isCancel(error) || source?.code === 'ERR_CANCELED' || source?.code === 'SESSION_CHANGED') {
      return new ApplicationError({ category: 'cancelled', code: source?.code === 'SESSION_CHANGED' ? 'SESSION_CHANGED' : undefined });
    }
    const response = record(source?.response);
    const data = record(response?.data);
    const extensions = record(data?.properties);
    const status = httpStatus(response?.status) ?? httpStatus(source?.status) ?? httpStatus(data?.status);
    const type = problemType(data?.type);
    const candidateCode = data?.code ?? extensions?.code;
    let code = typeof candidateCode === 'string' && safeCodes.has(candidateCode) ? candidateCode : undefined;
    let balance: ErrorMetadata['balance'];
    // Preserve the existing balance-modal trigger, while discarding detail text.
    const detail = typeof data?.detail === 'string' ? data.detail : typeof data?.message === 'string' ? data.message : '';
    if (status === 409 && options.balanceConflict && (code === 'INSUFFICIENT_BALANCE'
      || /insufficient|balance|token/i.test(detail))) {
      code = 'INSUFFICIENT_BALANCE';
      const required = detail.match(/required[=:]?\s*(\d{1,6})(?!\d)/i);
      const available = detail.match(/available[=:]?\s*(\d{1,6})(?!\d)/i);
      balance = {
        requiredTokens: nonnegativeNumber(data?.requiredTokens ?? data?.required) ?? (required ? Number(required[1]) : undefined),
        currentBalance: nonnegativeNumber(data?.currentBalance ?? data?.available) ?? (available ? Number(available[1]) : undefined),
      };
    }
    const category = source?.message === 'Unable to validate the new session. Please sign in again.' ? 'authentication'
      : status !== undefined ? categoryForStatus(status)
      : source?.code === 'ECONNABORTED' || source?.code === 'ETIMEDOUT' ? 'timeout'
      : isAxiosError(error) && !response && typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline'
      : isAxiosError(error) && (source?.request || source?.code === 'ERR_NETWORK') ? 'network'
      : 'unexpected';
    return new ApplicationError({
      category, status, code, type, balance,
      invalidCheckout: source?.message === 'Invalid checkout response',
      fieldErrors: fieldErrors(data?.errors ?? data?.details ?? extensions?.errors ?? extensions?.details),
      retryAfterSeconds: retrySeconds(readHeader(response?.headers, 'retry-after') ?? data?.retryAfter ?? extensions?.retryAfter),
      correlationId: reference(readHeader(response?.headers, 'x-correlation-id'))
        ?? reference(readHeader(response?.headers, 'x-request-id'))
        ?? reference(data?.correlationId ?? extensions?.correlationId),
    });
  } catch {
    return new ApplicationError({ category: 'unexpected' });
  }
}

export function getSafeErrorMessage(error: unknown): string {
  return toApplicationError(error).message;
}
