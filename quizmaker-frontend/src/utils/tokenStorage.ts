// Token storage abstraction for future-proof token management
// This allows us to easily switch between localStorage, sessionStorage, or other storage mechanisms

/**
 * Token storage interface for abstraction
 */
export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
  clearTokens(): void;
  isAuthenticated(): boolean;
}

/**
 * Local storage implementation of token storage
 */
export class LocalStorageTokenStorage implements TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get access token from localStorage:', error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get refresh token from localStorage:', error);
      return null;
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Failed to set tokens in localStorage:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens from localStorage:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}

/**
 * Session storage implementation of token storage
 */
export class SessionStorageTokenStorage implements TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'accessToken';
  private readonly REFRESH_TOKEN_KEY = 'refreshToken';

  getAccessToken(): string | null {
    try {
      return sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get access token from sessionStorage:', error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to get refresh token from sessionStorage:', error);
      return null;
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    try {
      sessionStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      sessionStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Failed to set tokens in sessionStorage:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  clearTokens(): void {
    try {
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear tokens from sessionStorage:', error);
    }
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}

/**
 * Memory storage implementation for testing
 */
export class MemoryTokenStorage implements TokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

/**
 * Secure storage implementation using encrypted storage
 * This is a placeholder for future implementation with encryption
 */
export class SecureTokenStorage implements TokenStorage {
  private storage: TokenStorage;

  constructor(storage: TokenStorage = new LocalStorageTokenStorage()) {
    this.storage = storage;
  }

  getAccessToken(): string | null {
    const encryptedToken = this.storage.getAccessToken();
    if (!encryptedToken) return null;
    
    try {
      // TODO: Implement decryption
      return encryptedToken;
    } catch (error) {
      console.error('Failed to decrypt access token:', error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    const encryptedToken = this.storage.getRefreshToken();
    if (!encryptedToken) return null;
    
    try {
      // TODO: Implement decryption
      return encryptedToken;
    } catch (error) {
      console.error('Failed to decrypt refresh token:', error);
      return null;
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    try {
      // TODO: Implement encryption
      const encryptedAccessToken = accessToken;
      const encryptedRefreshToken = refreshToken;
      
      this.storage.setTokens(encryptedAccessToken, encryptedRefreshToken);
    } catch (error) {
      console.error('Failed to encrypt tokens:', error);
      throw new Error('Failed to securely store authentication tokens');
    }
  }

  clearTokens(): void {
    this.storage.clearTokens();
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}

/**
 * Factory function to create token storage based on configuration
 */
export function createTokenStorage(type: 'local' | 'session' | 'memory' | 'secure' = 'local'): TokenStorage {
  switch (type) {
    case 'local':
      return new LocalStorageTokenStorage();
    case 'session':
      return new SessionStorageTokenStorage();
    case 'memory':
      return new MemoryTokenStorage();
    case 'secure':
      return new SecureTokenStorage();
    default:
      return new LocalStorageTokenStorage();
  }
}

/**
 * Default token storage instance
 * Can be configured via environment variables or app configuration
 */
export const tokenStorage: TokenStorage = createTokenStorage(
  (import.meta.env.VITE_TOKEN_STORAGE_TYPE as 'local' | 'session' | 'memory' | 'secure') || 'local'
);

/**
 * Utility functions for backward compatibility
 * These maintain the existing API while using the new abstraction
 */
export const getAccessToken = (): string | null => tokenStorage.getAccessToken();
export const getRefreshToken = (): string | null => tokenStorage.getRefreshToken();
export const setTokens = (accessToken: string, refreshToken: string): void => tokenStorage.setTokens(accessToken, refreshToken);
export const clearTokens = (): void => tokenStorage.clearTokens();
export const isAuthenticated = (): boolean => tokenStorage.isAuthenticated(); 