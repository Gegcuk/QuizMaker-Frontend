// ---------------------------------------------------------------------------
// React context + provider that exposes authentication state & actions
// ---------------------------------------------------------------------------

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/services';
import { getAccessToken } from '@/utils';
import { UserDto } from '@/types';
import { revokeAccessToken } from '@/api/axiosInstance';
import {
  establishSession,
  getSessionGeneration,
  isCurrentSessionGeneration,
  SessionChangedError,
  subscribeToSessionTransitions,
  terminateSession,
} from './services/sessionLifecycle';

interface JwtResponse {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: UserDto | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (creds: { username: string; password: string }) => Promise<void>;
  register: (details: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

/* ------------------------------------------------------------------------ */
/*                            The Context itself                            */
/* ------------------------------------------------------------------------ */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /* Helper – centralises GET /auth/me + generation-safe state sync */
  const fetchCurrentUser = useCallback(async (
    expectedGeneration = getSessionGeneration(),
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await api.get<UserDto>('/v1/auth/me');
      if (!isCurrentSessionGeneration(expectedGeneration)) {
        return false;
      }
      setUser(data);
      return true;
    } catch (error) {
      if (error instanceof SessionChangedError
        || !isCurrentSessionGeneration(expectedGeneration)) {
        return false;
      }

      terminateSession('restore-failed');
      return false;
    } finally {
      if (isCurrentSessionGeneration(expectedGeneration)) {
        setIsLoading(false);
      }
    }
  }, []);

  /* -------------------------------------------------------------------- */
  /* Keep this tab aligned with local and remote principal transitions.    */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    return subscribeToSessionTransitions((transition) => {
      if (transition.status === 'anonymous') {
        setUser(null);
        setIsLoading(false);
        navigate('/login', { replace: true });
        return;
      }

      if (transition.origin === 'remote') {
        setUser(null);
        setIsLoading(true);
        void fetchCurrentUser(transition.generation);
      }
    });
  }, [fetchCurrentUser, navigate]);

  /* -------------------------------------------------------------------- */
  /* On mount: if an accessToken is lying around try to resurrect session */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (getAccessToken()) {
      void fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  /* -------------------------------------------------------------------- */
  /*  Public actions                                                      */
  /* -------------------------------------------------------------------- */
  const login = useCallback(
    async (creds: { username: string; password: string }) => {
      const { data } = await api.post<JwtResponse>('/v1/auth/login', creds);

      const transition = establishSession(data.accessToken, data.refreshToken, 'login');
      setUser(null);
      const restored = await fetchCurrentUser(transition.generation);
      if (!restored) {
        throw new Error('Unable to validate the new session. Please sign in again.');
      }
      if (isCurrentSessionGeneration(transition.generation)) {
        navigate('/quizzes', { replace: true });
      }
    },
    [fetchCurrentUser, navigate],
  );

  const register = useCallback(
    async (details: {
      username: string;
      email: string;
      password: string;
    }) => {
      await api.post('/v1/auth/register', details);
      navigate('/login', { replace: true });
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    terminateSession('logout');

    if (accessToken) {
      await revokeAccessToken(accessToken);
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  /* Memoise context value to avoid re-renders of all consumers on every keystroke */
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      register,
      logout,
      checkAuthStatus,
    }),
    [user, isLoading, login, register, logout, checkAuthStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* Convenience hook so components can just call useAuth() */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};
