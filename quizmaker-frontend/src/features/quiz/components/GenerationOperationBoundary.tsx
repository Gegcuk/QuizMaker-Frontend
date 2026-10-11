import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/features/auth';
import { subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';
import { generationOperations } from '../services/generationOperations';

export function GenerationOperationBoundary({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => subscribeToSessionTransitions(() => generationOperations.clearSession()), []);
  useEffect(() => { if (!isLoading) generationOperations.activate(user?.id ?? null); }, [user?.id, isLoading]);
  return children;
}
