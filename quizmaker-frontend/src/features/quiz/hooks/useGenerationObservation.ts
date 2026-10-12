import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { QuizGenerationStatus } from '@/types';
import { ObserverContext } from '../providers/GenerationObserverContext';
import { emptyObservation, generationStatusKey } from '../services/generationObserver';
const noSubscription = () => () => {};
const emptySnapshot = () => emptyObservation;

export function useGenerationObservation(jobId?: string) {
  const observer = useContext(ObserverContext);
  const state = useSyncExternalStore(observer?.subscribe ?? noSubscription, observer?.getSnapshot ?? emptySnapshot);
  const selectedId = state.jobId ?? jobId;
  const client = useQueryClient();
  const accountId = observer?.accountId ?? '';
  // Consumers only subscribe to cache data. Removing the last visible consumer
  // must not cancel the session owner's in-flight status request.
  const subscribeJob = useCallback((notify: () => void) => client.getQueryCache().subscribe(event => {
    const key = event.query.queryKey;
    if (key[0] === 'generation-observer' && key[1] === accountId && key[2] === 'status' && key[3] === (selectedId ?? null)) notify();
  }), [client, accountId, selectedId]);
  const job = useSyncExternalStore(subscribeJob,
    () => client.getQueryData<QuizGenerationStatus>(generationStatusKey(accountId, selectedId ?? null)));
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
