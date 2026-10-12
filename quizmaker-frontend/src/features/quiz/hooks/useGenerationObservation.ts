import { useContext, useEffect, useSyncExternalStore } from 'react';
import { skipToken, useQuery } from '@tanstack/react-query';
import type { QuizGenerationStatus } from '@/types';
import { ObserverContext } from '../providers/GenerationObserverContext';
import { emptyObservation, generationStatusKey } from '../services/generationObserver';
const noSubscription = () => () => {};
const emptySnapshot = () => emptyObservation;

export function useGenerationObservation(jobId?: string) {
  const observer = useContext(ObserverContext);
  const state = useSyncExternalStore(observer?.subscribe ?? noSubscription, observer?.getSnapshot ?? emptySnapshot);
  const selectedId = state.jobId ?? jobId;
  const { data: job } = useQuery<QuizGenerationStatus>({
    queryKey: generationStatusKey(observer?.accountId ?? '', selectedId ?? null),
    queryFn: skipToken, enabled: false, gcTime: Infinity,
  });
  useEffect(() => { if (jobId) observer?.watch(jobId); }, [observer, jobId]);
  return { ...state, job, observer };
}

/** Card markers do not subscribe to status/polling updates or register queries. */
export function useObservedQuizMarkers() {
  const observer = useContext(ObserverContext);
  const newQuizIds = useSyncExternalStore(observer?.subscribe ?? noSubscription,
    observer ? () => observer.getSnapshot().newQuizIds : () => emptyObservation.newQuizIds);
  return { newQuizIds, acknowledge: (quizId: string) => observer?.acknowledge(quizId) };
}
