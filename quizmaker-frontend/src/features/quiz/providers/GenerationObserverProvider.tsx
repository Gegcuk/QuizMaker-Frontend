import { useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth';
import api from '@/api/axiosInstance';
import { QuizService } from '../services/quiz.service';
import { GenerationObserver } from '../services/generationObserver';

import { ObserverContext } from './GenerationObserverContext';

export function GenerationObserverProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const client = useQueryClient();
  const [observer, setObserver] = useState<GenerationObserver | null>(null);
  const accountId = !isLoading ? user?.id : undefined;
  useEffect(() => {
    if (!accountId) { setObserver(null); return; }
    const next = new GenerationObserver(accountId, client, new QuizService(api));
    setObserver(next);
    next.start();
    return () => next.destroy();
  }, [accountId, client]);
  // Render cannot expose an old account while its effect cleanup is pending.
  const current = observer?.accountId === accountId ? observer : null;
  return <ObserverContext.Provider value={current}>{children}</ObserverContext.Provider>;
}
