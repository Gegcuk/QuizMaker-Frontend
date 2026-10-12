import { useEffect, useRef } from 'react';
import { useGenerationObservation } from '../hooks/useGenerationObservation';
import { GenerationJobBlock } from './GenerationJobBlock';

interface QuizGenerationStatusProps {
  jobId: string;
  initialStatus?: string;
  estimatedTimeSeconds?: number;
  onComplete?: (quizId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export const QuizGenerationStatus = ({ jobId, onComplete, onError, onCancel }: QuizGenerationStatusProps) => {
  const { job } = useGenerationObservation(jobId);
  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!job || job.jobId !== jobId || notified.current === `${jobId}:${job.status}`) return;
    if (job.status === 'COMPLETED' && job.generatedQuizId) {
      notified.current = `${jobId}:${job.status}`;
      onComplete?.(job.generatedQuizId);
    } else if (job.status === 'FAILED') {
      notified.current = `${jobId}:${job.status}`;
      onError?.('The server reported that quiz generation failed.');
    } else if (job.status === 'CANCELLED') {
      notified.current = `${jobId}:${job.status}`;
      onCancel?.();
    }
  }, [job, jobId, onComplete, onError, onCancel]);
  return <GenerationJobBlock jobId={jobId} showEmpty title="Generating Your Quiz" />;
};
