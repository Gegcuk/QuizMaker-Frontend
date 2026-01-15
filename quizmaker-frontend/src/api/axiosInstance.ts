// src/api/axiosInstance.ts
// ---------------------------------------------------------------------------
// Enhanced Axios instance that provides:
//   1.  Attaches the current access-token to every request.
//   2.  Batches *all* simultaneous 401 responses into **one** token-refresh
//      round-trip (so N pending requests → 1 × POST /auth/refresh).
//   3.  Retries the original request once with the fresh token.
//   4.  If refresh fails (or no refresh-token exists) → logs user out
//      by clearing localStorage and hard-redirecting to /login.
//   5.  Support for file uploads (multipart/form-data)
//   6.  Enhanced error handling for new endpoints
//   7.  Request/response logging for debugging
//   8.  Timeout configurations for long-running operations
//   9.  Progress tracking for file uploads
//   10. Throttled refresh calls to prevent race conditions
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
  setTokens,
  clearTokens,
} from '../utils/tokenUtils';

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

// Enable request/response logging in development
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
  const enhancedConfig = config as EnhancedRequestConfig;
  
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
    console.group(`🚀 API Request: ${enhancedConfig.method?.toUpperCase()} ${enhancedConfig.url}`);
    console.log('Headers:', enhancedConfig.headers);
    console.log('Data:', enhancedConfig.data);
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
let refreshPromise: Promise<string> | null = null;

/** Helper: perform the refresh in isolation (never uses the shared instance) */
const runRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token present');
  }

  const { data } = await axios.post<RefreshResponse>(
    '/api/v1/auth/refresh',
    { refreshToken },
  );

  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
};

/** Centralised "logout-and-redirect" so we do it the same way everywhere */
const forceLogout = () => {
  clearTokens();
  
  // Dispatch a custom event that AuthContext can listen to
  // This allows for better integration with React state management
  window.dispatchEvent(new CustomEvent('auth:force-logout', {
    detail: { reason: 'token-expired' }
  }));
  
  // Fallback: hard redirect if the event listener doesn't handle it
  setTimeout(() => {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, 100);
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Response logging in development
    if (isDevelopment) {
      console.group(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log('Status:', response.status);
      console.log('Data:', response.data);
      console.log('Headers:', response.headers);
      console.groupEnd();
    }
    return response;
  },

  async (error: AxiosError) => {
    // Error logging in development
    if (isDevelopment) {
      console.group(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.log('Status:', error.response?.status);
      console.log('Error:', error.message);
      console.log('Response Data:', error.response?.data);
      console.groupEnd();
    }
    const original = error.config as RetryConfig | undefined;

    /* ------------------------------------------------------------------ */
    /* Bail-out cases – we won’t even *try* to refresh                     */
    /* ------------------------------------------------------------------ */
    if (
      error.response?.status !== 401 || // not an auth error
      original?._retry || // we already retried this request once
      !getRefreshToken() // no refresh-token to exchange
    ) {
      return Promise.reject(error);
    }

    /* ------------------------------------------------------------------ */
    /* First 401 encounter for this request – mark it so we don’t loop     */
    /* ------------------------------------------------------------------ */
    if (original) {
      original._retry = true;
    }

    /* ------------------------------------------------------------------ */
    /* Ensure only the FIRST 401 kicks off a refresh                       */
    /* ------------------------------------------------------------------ */
    if (!refreshPromise) {
      refreshPromise = runRefresh().catch((refreshErr) => {
        // Important: clear the shared promise *before* we throw so that
        // subsequent requests don’t hang forever.
        refreshPromise = null;
        forceLogout();
        throw refreshErr;
      });
      // When the refresh completes (success or failure) we must clear it so
      // future 401s can spawn a new cycle.
      refreshPromise.finally(() => {
        refreshPromise = null;
      });
    }

    /* ------------------------------------------------------------------ */
    /* Wait here until refresh finishes (success OR failure)               */
    /* ------------------------------------------------------------------ */
    const newAccessToken = await refreshPromise;

    /* ------------------------------------------------------------------ */
    /* At this point we have a fresh token – repeat the original request   */
    /* ------------------------------------------------------------------ */
    if (original) {
      original.headers = {
        ...(original.headers as any),
        Authorization: `Bearer ${newAccessToken}`,
      } as any;
      return api(original);
    }

    // In the unlikely event original is undefined, treat as fatal
    forceLogout();
    return Promise.reject(error);
  },
);

/* ------------------------------------------------------------------------ */
/* 5. Utility functions for enhanced features                               */
/* ------------------------------------------------------------------------ */

/** Throttled refresh mechanism to prevent race conditions */
let refreshThrottleTimeout: number | null = null;
const REFRESH_THROTTLE_DELAY = 1000; // 1 second

const throttledRefresh = async (): Promise<string> => {
  if (refreshThrottleTimeout) {
    // Wait for existing refresh to complete
    return new Promise((resolve, reject) => {
      refreshThrottleTimeout = setTimeout(async () => {
        try {
          const token = await runRefresh();
          resolve(token);
        } catch (error) {
          reject(error);
        }
      }, REFRESH_THROTTLE_DELAY);
    });
  }
  
  return runRefresh();
};

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

export const axiosInstance = api;


export default api;
