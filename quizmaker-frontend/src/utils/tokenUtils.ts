// ---------------------------------------------------------------------------
// Utility helpers for working with JWTs in localStorage with in-memory fallbacks
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// In-memory token storage as fallback when localStorage is not available
let inMemoryTokens: { accessToken: string | null; refreshToken: string | null } = {
  accessToken: null,
  refreshToken: null
};

// Check if localStorage is available
const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

// Safe localStorage operations with in-memory fallback
const safeGetItem = (key: string): string | null => {
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(key);
  }
  return key === ACCESS_TOKEN_KEY ? inMemoryTokens.accessToken : inMemoryTokens.refreshToken;
};

const safeSetItem = (key: string, value: string): void => {
  if (isLocalStorageAvailable()) {
    localStorage.setItem(key, value);
  } else {
    if (key === ACCESS_TOKEN_KEY) {
      inMemoryTokens.accessToken = value;
    } else if (key === REFRESH_TOKEN_KEY) {
      inMemoryTokens.refreshToken = value;
    }
  }
};

const safeRemoveItem = (key: string): void => {
  if (isLocalStorageAvailable()) {
    localStorage.removeItem(key);
  } else {
    if (key === ACCESS_TOKEN_KEY) {
      inMemoryTokens.accessToken = null;
    } else if (key === REFRESH_TOKEN_KEY) {
      inMemoryTokens.refreshToken = null;
    }
  }
};

export const getAccessToken = (): string | null =>
  safeGetItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string) =>
  safeSetItem(ACCESS_TOKEN_KEY, token);

export const getRefreshToken = (): string | null =>
  safeGetItem(REFRESH_TOKEN_KEY);

export const setRefreshToken = (token: string) =>
  safeSetItem(REFRESH_TOKEN_KEY, token);

export const setTokens = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

export const clearTokens = () => {
  safeRemoveItem(ACCESS_TOKEN_KEY);
  safeRemoveItem(REFRESH_TOKEN_KEY);
};
