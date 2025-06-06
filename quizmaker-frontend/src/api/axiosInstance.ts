// src/api/axiosInstance.ts
// ---------------------------------------------------------------------------
// A single, shared Axios instance that
//   1.  Attaches the current access-token to every request.
//   2.  Batches *all* simultaneous 401 responses into **one** token-refresh
//      round-trip (so N pending requests → 1 × POST /auth/refresh).
//   3.  Retries the original request once with the fresh token.
//   4.  If refresh fails (or no refresh-token exists) → logs user out
//      by clearing localStorage and hard-redirecting to /login.
// ---------------------------------------------------------------------------

import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../utils/tokenUtils';

/* ------------------------------------------------------------------------ */
/* 1. Axios instance                                                        */
/* ------------------------------------------------------------------------ */
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
});

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
}

/* ------------------------------------------------------------------------ */
/* 3. Request interceptor – inject “Authorization: Bearer <token>”          */
/* ------------------------------------------------------------------------ */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    // Note: we preserve any custom headers the caller may have set.
    config.headers = {
      ...(config.headers as any),
      Authorization: `Bearer ${token}`,
    } as any;
  }
  return config;
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
    'http://localhost:8080/api/v1/auth/refresh',
    { refreshToken },
  );

  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
};

/** Centralised “logout-and-redirect” so we do it the same way everywhere */
const forceLogout = () => {
  clearTokens();
  window.location.href = '/login'; // outside React, so hard redirect
};

api.interceptors.response.use(
  (response: AxiosResponse) => response, // happy path → just pass it through

  async (error: AxiosError) => {
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

export default api;
