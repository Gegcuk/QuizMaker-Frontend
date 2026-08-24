import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/utils/tokenUtils';

const SESSION_SYNC_CHANNEL = 'quizzence:auth-session:v1';
const SESSION_SYNC_STORAGE_KEY = 'quizzence:auth-session-sync:v1';
const MAX_SEEN_TRANSITIONS = 32;

export type SessionStatus = 'anonymous' | 'authenticated';

export type SessionTransitionReason =
  | 'account-switch'
  | 'forced-logout'
  | 'login'
  | 'logout'
  | 'oauth-login'
  | 'restore-failed';

export interface SessionTransition {
  generation: number;
  id: string;
  origin: 'local' | 'remote';
  reason: SessionTransitionReason;
  status: SessionStatus;
}

interface SessionSyncMessage {
  id: string;
  reason: SessionTransitionReason;
  sourceId: string;
  status: SessionStatus;
  version: 1;
}

interface CredentialStore {
  clearTokens(): void;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken: string): void;
}

type SessionTransitionListener = (transition: SessionTransition) => void;

const transitionReasons = new Set<SessionTransitionReason>([
  'account-switch',
  'forced-logout',
  'login',
  'logout',
  'oauth-login',
  'restore-failed',
]);

const createOpaqueId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};

const isSessionSyncMessage = (value: unknown): value is SessionSyncMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<SessionSyncMessage>;
  return message.version === 1
    && typeof message.id === 'string'
    && message.id.length > 0
    && typeof message.sourceId === 'string'
    && message.sourceId.length > 0
    && (message.status === 'anonymous' || message.status === 'authenticated')
    && typeof message.reason === 'string'
    && transitionReasons.has(message.reason as SessionTransitionReason);
};

export class SessionChangedError extends Error {
  readonly code = 'SESSION_CHANGED';

  constructor() {
    super('The authenticated session changed before the request completed.');
    this.name = 'SessionChangedError';
  }
}

export class AuthSessionLifecycle {
  private readonly credentials: CredentialStore;
  private readonly listeners = new Set<SessionTransitionListener>();
  private readonly requestsByGeneration = new Map<number, Set<AbortController>>();
  private readonly seenTransitionIds = new Set<string>();
  private readonly sourceId = createOpaqueId();
  private generation = 0;
  private status: SessionStatus;
  private channel: BroadcastChannel | null = null;
  private browserSyncStarted = false;

  constructor(credentials: CredentialStore) {
    this.credentials = credentials;
    this.status = credentials.getAccessToken() || credentials.getRefreshToken()
      ? 'authenticated'
      : 'anonymous';
  }

  getGeneration = (): number => this.generation;

  getStatus = (): SessionStatus => this.status;

  isCurrentGeneration = (generation: number): boolean => generation === this.generation;

  assertCurrentGeneration = (generation: number): void => {
    if (!this.isCurrentGeneration(generation)) {
      throw new SessionChangedError();
    }
  };

  subscribe = (listener: SessionTransitionListener): (() => void) => {
    this.listeners.add(listener);
    this.startBrowserSync();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopBrowserSync();
      }
    };
  };

  establishSession = (
    accessToken: string,
    refreshToken: string,
    reason: Extract<SessionTransitionReason, 'account-switch' | 'login' | 'oauth-login'> = 'login',
  ): SessionTransition => this.applyLocalTransition(
    'authenticated',
    reason,
    () => this.credentials.setTokens(accessToken, refreshToken),
  );

  terminateSession = (
    reason: Extract<SessionTransitionReason, 'forced-logout' | 'logout' | 'restore-failed'>,
  ): SessionTransition | null => {
    const hasCredentials = Boolean(
      this.credentials.getAccessToken() || this.credentials.getRefreshToken(),
    );
    if (this.status === 'anonymous' && !hasCredentials) {
      return null;
    }

    return this.applyLocalTransition(
      'anonymous',
      reason,
      () => this.credentials.clearTokens(),
    );
  };

  rotateTokens = (
    generation: number,
    accessToken: string,
    refreshToken: string,
  ): void => {
    this.assertCurrentGeneration(generation);
    this.credentials.setTokens(accessToken, refreshToken);
  };

  registerRequest = (generation: number, controller: AbortController): (() => void) => {
    if (!this.isCurrentGeneration(generation)) {
      controller.abort(new SessionChangedError());
      return () => undefined;
    }

    const controllers = this.requestsByGeneration.get(generation) ?? new Set<AbortController>();
    controllers.add(controller);
    this.requestsByGeneration.set(generation, controllers);

    return () => {
      controllers.delete(controller);
      if (controllers.size === 0) {
        this.requestsByGeneration.delete(generation);
      }
    };
  };

  receiveExternalTransition = (value: unknown): void => {
    if (!isSessionSyncMessage(value)
      || value.sourceId === this.sourceId
      || this.seenTransitionIds.has(value.id)) {
      return;
    }

    this.rememberTransition(value.id);
    this.generation += 1;
    this.status = value.status;
    if (value.status === 'anonymous') {
      this.credentials.clearTokens();
    }
    this.abortOlderRequests();
    this.emit({
      generation: this.generation,
      id: value.id,
      origin: 'remote',
      reason: value.reason,
      status: value.status,
    });
  };

  resetForTests = (): void => {
    this.abortAllRequests();
    this.stopBrowserSync();
    this.listeners.clear();
    this.seenTransitionIds.clear();
    this.generation = 0;
    this.status = this.credentials.getAccessToken() || this.credentials.getRefreshToken()
      ? 'authenticated'
      : 'anonymous';
  };

  private applyLocalTransition = (
    status: SessionStatus,
    reason: SessionTransitionReason,
    updateCredentials: () => void,
  ): SessionTransition => {
    this.generation += 1;
    this.status = status;
    this.abortOlderRequests();
    updateCredentials();

    const message: SessionSyncMessage = {
      id: createOpaqueId(),
      reason,
      sourceId: this.sourceId,
      status,
      version: 1,
    };
    this.rememberTransition(message.id);

    const transition: SessionTransition = {
      generation: this.generation,
      id: message.id,
      origin: 'local',
      reason,
      status,
    };
    this.emit(transition);
    this.publish(message);
    return transition;
  };

  private abortOlderRequests = (): void => {
    for (const [generation, controllers] of this.requestsByGeneration) {
      if (generation === this.generation) {
        continue;
      }
      controllers.forEach((controller) => controller.abort(new SessionChangedError()));
      this.requestsByGeneration.delete(generation);
    }
  };

  private abortAllRequests = (): void => {
    this.requestsByGeneration.forEach((controllers) => {
      controllers.forEach((controller) => controller.abort(new SessionChangedError()));
    });
    this.requestsByGeneration.clear();
  };

  private emit = (transition: SessionTransition): void => {
    this.listeners.forEach((listener) => listener(transition));
  };

  private rememberTransition = (id: string): void => {
    this.seenTransitionIds.add(id);
    if (this.seenTransitionIds.size <= MAX_SEEN_TRANSITIONS) {
      return;
    }

    const oldest = this.seenTransitionIds.values().next().value;
    if (oldest) {
      this.seenTransitionIds.delete(oldest);
    }
  };

  private publish = (message: SessionSyncMessage): void => {
    this.startBrowserSync();
    try {
      this.channel?.postMessage(message);
    } catch {
      // The storage event below remains available when the channel fails.
    }

    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(SESSION_SYNC_STORAGE_KEY, JSON.stringify(message));
      window.localStorage.removeItem(SESSION_SYNC_STORAGE_KEY);
    } catch {
      // BroadcastChannel still synchronizes logout when browser storage is unavailable.
    }
  };

  private readonly handleStorage = (event: StorageEvent): void => {
    if (event.key !== SESSION_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      this.receiveExternalTransition(JSON.parse(event.newValue));
    } catch {
      // Ignore malformed messages from unrelated scripts or old app versions.
    }
  };

  private startBrowserSync = (): void => {
    if (this.browserSyncStarted || typeof window === 'undefined') {
      return;
    }
    this.browserSyncStarted = true;
    window.addEventListener('storage', this.handleStorage);

    if (typeof BroadcastChannel === 'undefined') {
      return;
    }
    try {
      this.channel = new BroadcastChannel(SESSION_SYNC_CHANNEL);
      this.channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        this.receiveExternalTransition(event.data);
      });
    } catch {
      this.channel = null;
    }
  };

  private stopBrowserSync = (): void => {
    if (!this.browserSyncStarted || typeof window === 'undefined') {
      return;
    }
    window.removeEventListener('storage', this.handleStorage);
    this.channel?.close();
    this.channel = null;
    this.browserSyncStarted = false;
  };
}

const authSession = new AuthSessionLifecycle({
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
});

export const getSessionGeneration = authSession.getGeneration;
export const isCurrentSessionGeneration = authSession.isCurrentGeneration;
export const assertCurrentSessionGeneration = authSession.assertCurrentGeneration;
export const subscribeToSessionTransitions = authSession.subscribe;
export const establishSession = authSession.establishSession;
export const terminateSession = authSession.terminateSession;
export const rotateSessionTokens = authSession.rotateTokens;
export const registerSessionRequest = authSession.registerRequest;
export const resetAuthSessionForTests = authSession.resetForTests;
