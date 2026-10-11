import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth';
import { generationOperations, type GenerationEntryPoint, type GenerationSource } from '../services/generationOperations';
import type { QuizGenerationResponse } from '@/types';

export function useGenerationOperation(entryPoint: GenerationEntryPoint) {
  const { user, isLoading } = useAuth();
  const snapshot = useSyncExternalStore(generationOperations.subscribe, generationOperations.getSnapshot);
  useEffect(() => { if (!isLoading) generationOperations.activate(user?.id ?? null); }, [user?.id, isLoading]);
  const pending = snapshot.pending[entryPoint];
  const operation = pending?.accountId === user?.id ? pending : undefined;
  const [now, setNow] = useState(Date.now);
  const notBefore = operation?.notBefore ?? 0;
  const expiresAt = operation?.expiresAt;
  useEffect(() => {
    setNow(Date.now());
    if (notBefore <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= notBefore) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [notBefore]);
  useEffect(() => {
    if (!expiresAt || expiresAt <= now) return;
    // Long retention windows exceed the browser's maximum timeout delay.
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(expiresAt - now, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [expiresAt, now]);

  return {
    operation,
    blocked: isLoading || !user || Boolean(snapshot.storageError) || Boolean(snapshot.busy[entryPoint])
      || Boolean(operation && (operation.jobId || operation.notBefore > now || operation.expiresAt <= now || ['conflict', 'terminal', 'expired'].includes(operation.state))),
    busy: Boolean(snapshot.busy[entryPoint]),
    storageError: snapshot.storageError,
    start: (source: GenerationSource, send: (key: string) => Promise<QuizGenerationResponse>, documentId?: string) => {
      if (!user || isLoading) return Promise.reject(new Error('Please sign in before starting generation.'));
      return generationOperations.start(user.id, entryPoint, source, send, documentId);
    },
    retrySaving: () => generationOperations.retrySaving(),
    abandon: () => generationOperations.abandon(entryPoint),
  };
}
export type GenerationOperationController = ReturnType<typeof useGenerationOperation>;
