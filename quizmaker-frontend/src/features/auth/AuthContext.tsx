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
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '@/utils';
import { UserDto } from '@/types';

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
  logout: () => void;
}

/* ------------------------------------------------------------------------ */
/*                            The Context itself                            */
/* ------------------------------------------------------------------------ */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /* Helper – centralises GET /auth/me + state sync */
  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await api.get<UserDto>('/v1/auth/me');
      setUser(data);
    } catch {
      // api instance has already tried a refresh. If we still get here
      // the session is invalid → blow everything away.
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* -------------------------------------------------------------------- */
  /* On mount: if an accessToken is lying around try to resurrect session */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (getAccessToken()) {
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  /* -------------------------------------------------------------------- */
  /* Listen for force logout events from axios interceptor                */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    const handleForceLogout = (event: CustomEvent) => {
      const reason = event.detail?.reason;
      console.log('Force logout triggered:', reason);
      
      // Clear auth state
      clearTokens();
      setUser(null);
      
      // Navigate to login with replace to prevent back navigation
      navigate('/login', { replace: true });
    };

    // Listen for the custom event dispatched by axios interceptor
    window.addEventListener('auth:force-logout', handleForceLogout as EventListener);
    
    return () => {
      window.removeEventListener('auth:force-logout', handleForceLogout as EventListener);
    };
  }, [navigate]);

  /* -------------------------------------------------------------------- */
  /*  Public actions                                                      */
  /* -------------------------------------------------------------------- */
  const login = useCallback(
    async (creds: { username: string; password: string }) => {
      const { data } = await api.post<JwtResponse>('/v1/auth/login', creds);

      setTokens(data.accessToken, data.refreshToken);
      await fetchCurrentUser();
      navigate('/quizzes', { replace: true });
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
    try {
      await api.post('/v1/auth/logout', { refreshToken: getRefreshToken() });
    } finally {
      clearTokens();
      setUser(null);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  /* Memoise context value to avoid re-renders of all consumers on every keystroke */
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading, login, register, logout],
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
