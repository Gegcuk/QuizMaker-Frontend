// src/api/axiosInstance.ts
// ---------------------------------------------------------------------------
// Enhanced Axios instance that provides:
//   1.  Attaches the current access-token to every request.
//   2.  Batches *all* simultaneous 401 responses into **one** token-refresh
//      round-trip (so N pending requests → 1 × POST /auth/refresh).
//   3.  Retries the original request once with the fresh token.
//   4.  Rejects responses and refreshes that belong to an old login session.
//   5.  Support for file uploads (multipart/form-data)
//   6.  Enhanced error handling for new endpoints
//   7.  Request/response logging for debugging
//   8.  Timeout configurations for long-running operations
//   9.  Progress tracking for file uploads
//   10. Aborts in-flight work when the authenticated principal changes.
// ---------------------------------------------------------------------------

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosProgressEvent,
} from 'axios';
import {
  getAccessToken,
  getRefreshToken,
} from '../utils/tokenUtils';
import { getSafeRequestTarget } from './requestDiagnostics';
import {
  assertCurrentSessionGeneration,
  getSessionGeneration,
  isCurrentSessionGeneration,
  registerSessionRequest,
  rotateSessionTokens,
  SessionChangedError,
  terminateSession,
} from '@/features/auth/services/sessionLifecycle';

/* ------------------------------------------------------------------------ */
/* 1. Enhanced Axios instance with timeout and logging                      */
/* ------------------------------------------------------------------------ */

// Configuration for different request types
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const FILE_UPLOAD_TIMEOUT = 300000; // 5 minutes
const LONG_RUNNING_TIMEOUT = 600000; // 10 minutes

// Support VITE_API_BASE_URL for prerender/build-time API access
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    serialize: (params) => {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Serialize arrays using repeated parameters without brackets
          // e.g., quizIds=uuid1&quizIds=uuid2
          value.forEach((item) => {
            searchParams.append(key, String(item));
          });
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return searchParams.toString();
    }
  }
});

// Development diagnostics intentionally omit headers and bodies because they can contain credentials.
const isDevelopment = import.meta.env.DEV;

/* ------------------------------------------------------------------------ */
/* 2. Types                                                                 */
/* ------------------------------------------------------------------------ */

/** Payload we expect back from POST /auth/refresh (matches backend spec) */
interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

/** We extend Axios’ config so we can tag a request as “already retried” */
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _isFileUpload?: boolean;
  _isLongRunning?: boolean;
  _sessionAbortController?: AbortController;
  _sessionGeneration?: number;
  _sessionOriginalSignal?: InternalAxiosRequestConfig['signal'];
  _sessionSignalForwarder?: () => void;
  _sessionUnregister?: () => void;
}

/** Progress tracking callback type */
export type ProgressCallback = (progress: number, loaded: number, total: number) => void;

/** Enhanced request configuration */
export interface EnhancedRequestConfig extends InternalAxiosRequestConfig {
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  onDownloadProgress?: (progressEvent: AxiosProgressEvent) => void;
  timeout?: number;
  _isFileUpload?: boolean;
  _isLongRunning?: boolean;
  data?: any;
  headers: any;
  method?: string;
  url?: string;
}

/* ------------------------------------------------------------------------ */
/* 3. Request interceptor – inject “Authorization: Bearer <token>”          */
/* ------------------------------------------------------------------------ */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const enhancedConfig = config as EnhancedRequestConfig & RetryConfig;

  if (enhancedConfig._sessionGeneration === undefined) {
    enhancedConfig._sessionGeneration = getSessionGeneration();
  }
  assertCurrentSessionGeneration(enhancedConfig._sessionGeneration);

  const originalSignal = enhancedConfig._sessionOriginalSignal ?? enhancedConfig.signal;
  const sessionController = new AbortController();
  const forwardAbort = () => sessionController.abort();
  if (originalSignal?.aborted) {
    forwardAbort();
  } else {
    originalSignal?.addEventListener?.('abort', forwardAbort, { once: true });
  }
  enhancedConfig._sessionOriginalSignal = originalSignal;
  enhancedConfig._sessionAbortController = sessionController;
  enhancedConfig._sessionSignalForwarder = forwardAbort;
  enhancedConfig._sessionUnregister = registerSessionRequest(
    enhancedConfig._sessionGeneration,
    sessionController,
  );
  enhancedConfig.signal = sessionController.signal;
  
  // Set appropriate timeout based on request type
  if (enhancedConfig._isFileUpload) {
    enhancedConfig.timeout = FILE_UPLOAD_TIMEOUT;
  } else if (enhancedConfig._isLongRunning) {
    enhancedConfig.timeout = LONG_RUNNING_TIMEOUT;
  }

  // Handle file uploads
  if (enhancedConfig._isFileUpload && enhancedConfig.data instanceof FormData) {
    // Remove Content-Type header to let browser set it with boundary
    delete enhancedConfig.headers?.['Content-Type'];
  }

  // Inject authorization token
  const token = getAccessToken();
  if (token) {
    enhancedConfig.headers = {
      ...(enhancedConfig.headers as any),
      Authorization: `Bearer ${token}`,
    } as any;
  }

  // Request logging in development
  if (isDevelopment) {
    console.group(
      `🚀 API Request: ${enhancedConfig.method?.toUpperCase()} ${getSafeRequestTarget(enhancedConfig.url)}`,
    );
    console.log('Timeout:', enhancedConfig.timeout);
    console.groupEnd();
  }

  return enhancedConfig;
});

/* ------------------------------------------------------------------------ */
/* 4. Response interceptor – one automatic refresh on 401                   */
/* ------------------------------------------------------------------------ */

/** A promise that resolves with a fresh *access* token once the ongoing
 *  refresh finishes. All requests that hit 401 while refresh is running
 *  await this promise instead of firing additional /auth/refresh calls. */
interface RefreshFlight {
  generation: number;
  promise: Promise<string>;
}

let refreshFlight: RefreshFlight | null = null;

const releaseSessionRequest = (config: RetryConfig | undefined): void => {
  if (!config) {
    return;
  }

  config._sessionUnregister?.();
  if (config._sessionOriginalSignal && config._sessionSignalForwarder) {
    config._sessionOriginalSignal.removeEventListener?.('abort', config._sessionSignalForwarder);
  }
  config.signal = config._sessionOriginalSignal;
  delete config._sessionAbortController;
  delete config._sessionSignalForwarder;
  delete config._sessionUnregister;
};

/** Helper: perform the refresh in isolation (never uses the shared instance) */
const runRefresh = async (generation: number): Promise<string> => {
  assertCurrentSessionGeneration(generation);
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token present');
  }

  // Use the same base URL as the main API instance
  const refreshBaseUrl = apiBaseUrl;
  const refreshUrl = `${refreshBaseUrl}/v1/auth/refresh`;

  const controller = new AbortController();
  const unregister = registerSessionRequest(generation, controller);
  try {
    const { data } = await axios.post<RefreshResponse>(
      refreshUrl,
      { refreshToken },
      { signal: controller.signal },
    );

    rotateSessionTokens(generation, data.accessToken, data.refreshToken);
    return data.accessToken;
  } finally {
    unregister();
  }
};

const isTerminalRefreshError = (error: unknown): boolean => {
  return axios.isAxiosError(error) && error.response?.status === 401;
};

const getRefreshFlight = (generation: number): Promise<string> => {
  if (refreshFlight?.generation === generation) {
    return refreshFlight.promise;
  }

  const settledPromise = runRefresh(generation)
    .catch((error: unknown) => {
      if (isCurrentSessionGeneration(generation) && isTerminalRefreshError(error)) {
        terminateSession('forced-logout');
      }
      throw error;
    })
    .finally(() => {
      if (refreshFlight?.generation === generation) {
        refreshFlight = null;
      }
    });

  refreshFlight = { generation, promise: settledPromise };
  return settledPromise;
};

const NON_REFRESHABLE_AUTH_PATHS = [
  '/v1/auth/login',
  '/v1/auth/register',
  '/v1/auth/refresh',
  '/v1/auth/oauth/exchange',
  '/v1/auth/forgot-password',
  '/v1/auth/reset-password',
  '/v1/auth/verify-email',
  '/v1/auth/resend-verification',
];

const isRefreshableRequest = (url: string | undefined): boolean => {
  return !NON_REFRESHABLE_AUTH_PATHS.some((path) => url?.startsWith(path));
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as RetryConfig;
    releaseSessionRequest(config);
    assertCurrentSessionGeneration(config._sessionGeneration ?? getSessionGeneration());

    // Response logging in development
    if (isDevelopment) {
      console.group(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${getSafeRequestTarget(response.config.url)}`,
      );
      console.log('Status:', response.status);
      console.groupEnd();
    }
    return response;
  },

  async (error: AxiosError) => {
    // Error logging in development
    if (isDevelopment) {
      console.group(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${getSafeRequestTarget(error.config?.url)}`,
      );
      console.log('Status:', error.response?.status);
      console.groupEnd();
    }
    const original = error.config as RetryConfig | undefined;
    releaseSessionRequest(original);

    const requestGeneration = original?._sessionGeneration ?? getSessionGeneration();
    if (!isCurrentSessionGeneration(requestGeneration)) {
      return Promise.reject(new SessionChangedError());
    }

    if (error.response?.status !== 401 || !original || !isRefreshableRequest(original.url)) {
      return Promise.reject(error);
    }

    if (original._retry) {
      terminateSession('forced-logout');
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      if (getAccessToken() || original.headers?.get?.('Authorization')) {
        terminateSession('forced-logout');
      }
      return Promise.reject(error);
    }

    original._retry = true;
    const newAccessToken = await getRefreshFlight(requestGeneration);
    assertCurrentSessionGeneration(requestGeneration);

    original.headers.set('Authorization', `Bearer ${newAccessToken}`);
    return api(original);
  },
);

/* ------------------------------------------------------------------------ */
/* 5. Utility functions for enhanced features                               */
/* ------------------------------------------------------------------------ */

/** Create a file upload request with progress tracking */
export const createFileUploadRequest = (
  url: string,
  file: File,
  onProgress?: ProgressCallback,
  additionalData?: Record<string, any>
): EnhancedRequestConfig => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return {
    method: 'POST',
    url,
    data: formData,
    headers: {},
    _isFileUpload: true,
    onUploadProgress: onProgress ? (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress, progressEvent.loaded, progressEvent.total);
      }
    } : undefined,
  };
};

/** Create a long-running request with extended timeout */
export const createLongRunningRequest = (
  method: string,
  url: string,
  data?: any,
  onProgress?: ProgressCallback
): EnhancedRequestConfig => {
  return {
    method: method.toUpperCase() as any,
    url,
    data,
    headers: {},
    _isLongRunning: true,
    onDownloadProgress: onProgress ? (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(progress, progressEvent.loaded, progressEvent.total);
      }
    } : undefined,
  };
};

/** Enhanced error handler with detailed error information */
export const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const data = error.response.data as any;
    
    switch (status) {
      case 400:
        throw new Error(data?.message || 'Bad request');
      case 401:
        throw new Error('Authentication required');
      case 403:
        throw new Error('Access denied');
      case 404:
        throw new Error('Resource not found');
      case 409:
        throw new Error(data?.message || 'Conflict occurred');
      case 422:
        throw new Error(data?.message || 'Validation failed');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
        throw new Error('Internal server error');
      default:
        throw new Error(data?.message || `HTTP ${status} error`);
    }
  } else if (error.request) {
    // Network error
    throw new Error('Network error. Please check your connection.');
  } else {
    // Other error
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

/**
 * Revokes the session that existed before the local identity boundary moved.
 * It intentionally bypasses the shared client so a newer login cannot attach
 * its credentials or cancel revocation of the captured access token.
 */
export const revokeAccessToken = async (accessToken: string): Promise<void> => {
  try {
    await axios.post(
      `${apiBaseUrl}/v1/auth/logout`,
      undefined,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
  } catch {
    // Local logout remains authoritative when the revocation request cannot complete.
  }
};

export const resetAxiosAuthStateForTests = (): void => {
  refreshFlight = null;
};

export const axiosInstance = api;


export default api;
