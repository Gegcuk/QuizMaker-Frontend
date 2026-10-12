import { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ClockIcon, CogIcon, NoSymbolIcon, QuestionMarkCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Alert, Button, Card } from '@/components';
import ProgressBar from '@/components/ui/ProgressBar';
import { useGenerationObservation, useObservedQuizTitle } from '../hooks/useGenerationObservation';
import { isActiveGeneration } from '../services/generationJobs';

interface QuizGenerationStatusProps {
  jobId?: string;
  initialStatus?: string;
  estimatedTimeSeconds?: number;
  onComplete?: (quizId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  layout?: 'centered' | 'panel';
  title?: string;
  className?: string;
}

const statusLabels = {
  PENDING: 'Queued', PROCESSING: 'Generating your quiz',
  COMPLETED: 'Quiz ready', FAILED: 'Generation failed', CANCELLED: 'Generation cancelled',
} as const;
const statusIcons = { PENDING: ClockIcon, PROCESSING: CogIcon, COMPLETED: CheckCircleIcon, FAILED: XCircleIcon, CANCELLED: NoSymbolIcon };
const statusStyles = {
  PENDING: 'text-theme-interactive-warning bg-theme-bg-warning', PROCESSING: 'text-theme-interactive-primary bg-theme-bg-info',
  COMPLETED: 'text-theme-interactive-success bg-theme-bg-success', FAILED: 'text-theme-interactive-danger bg-theme-bg-danger',
  CANCELLED: 'text-theme-text-secondary bg-theme-bg-tertiary',
} as const;
const formatTime = (seconds: number) => {
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
};

/** Full progress layouts share the session observer with the compact My Quizzes block. */
export const QuizGenerationStatus = ({ jobId, onComplete, onError, onCancel, onRetry, layout = 'centered', title, className = '' }: QuizGenerationStatusProps) => {
  const { job, checking, discovered, cancelling, paused, error, cancelError, accessStopped, recoveryNotice, observer } = useGenerationObservation(jobId);
  const resultTitle = useObservedQuizTitle(job);
  const headingId = useId();
  const navigate = useNavigate();
  const panel = layout === 'panel';
  const heading = title ?? (panel ? 'Quiz Generation Progress' : 'Generating Your Quiz');
  const Icon = job ? statusIcons[job.status] : QuestionMarkCircleIcon;
  const hasChunks = job?.totalChunks != null && job.totalChunks > 0 && job.processedChunks != null && job.processedChunks <= job.totalChunks;
  const notified = useRef<string | null>(null);
  useEffect(() => {
    if (!job || (jobId && job.jobId !== jobId) || notified.current === `${job.jobId}:${job.status}`) return;
    if (job.status === 'COMPLETED' && job.generatedQuizId) {
      notified.current = `${job.jobId}:${job.status}`;
      onComplete?.(job.generatedQuizId);
    } else if (job.status === 'FAILED') {
      notified.current = `${job.jobId}:${job.status}`;
      onError?.('The server reported that quiz generation failed.');
    } else if (job.status === 'CANCELLED') {
      notified.current = `${job.jobId}:${job.status}`;
      onCancel?.();
    }
  }, [job, jobId, onComplete, onError, onCancel]);
  return <section aria-labelledby={headingId} className={`${panel ? '' : 'max-w-2xl mx-auto'} ${className}`}>
    <Card padding={panel ? 'md' : 'lg'}>
      <div className={panel ? 'flex flex-wrap items-start justify-between gap-4 mb-6' : 'text-center mb-6'}>
        <div>
          {!panel && <Icon aria-hidden="true" className={`w-16 h-16 mx-auto mb-4 text-theme-interactive-primary ${job?.status === 'PROCESSING' ? 'motion-safe:animate-spin' : ''}`} />}
          <h3 id={headingId} className={`${panel ? 'text-lg' : 'text-xl'} font-semibold text-theme-text-primary mb-2`}>{heading}</h3>
          <p role="status" className="text-theme-text-secondary">
            {job ? statusLabels[job.status] : error ? 'Generation jobs are unavailable' : checking || !observer || !discovered ? 'Checking your generation jobs…' : 'No active generation found'}
          </p>
        </div>
        {job && <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${panel ? '' : 'mt-4'} ${statusStyles[job.status]}`}>
          {panel && <Icon aria-hidden="true" className="w-5 h-5" />}{job.status}
        </span>}
      </div>
      {resultTitle && <p className="mb-6 font-medium text-theme-text-primary break-words [overflow-wrap:anywhere]">{resultTitle}</p>}
      {hasChunks && isActiveGeneration(job) && <div className="mb-6 p-4 bg-theme-bg-info border border-theme-border-info rounded-lg text-sm text-theme-interactive-info">
        Processing chunk {job?.processedChunks} of {job?.totalChunks}
      </div>}
      {job?.progressPercentage != null && <ProgressBar className="mb-6 [&_[role=progressbar]]:motion-reduce:transition-none" value={job.progressPercentage} label="Generation progress" showPercentage size="sm" />}
      {(job?.elapsedTimeSeconds != null || job?.estimatedTimeRemainingSeconds != null) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
        {job.elapsedTimeSeconds != null && <div className={`p-3 bg-theme-bg-secondary rounded-lg ${panel ? '' : 'text-center'}`}>
          <p className="font-medium text-theme-text-primary">{panel ? 'Time Elapsed' : 'Elapsed Time'}</p>
          <p className="text-theme-text-secondary">{formatTime(job.elapsedTimeSeconds)}</p>
        </div>}
        {job.estimatedTimeRemainingSeconds != null && <div className={`p-3 bg-theme-bg-secondary rounded-lg ${panel ? '' : 'text-center'}`}>
          <p className="font-medium text-theme-text-primary">{panel ? 'Estimated Time Remaining' : 'Estimated Remaining'}</p>
          <p className="text-theme-text-secondary">{formatTime(job.estimatedTimeRemainingSeconds)}</p>
        </div>}
      </div>}
      <div className="space-y-3 mb-6">
        {paused && <Alert type="info">Status checks are paused until this tab is visible and online.</Alert>}
        {error && <Alert type="error">Current status is temporarily unavailable. {job && 'The last confirmed state is shown. '}{error.message}</Alert>}
        {cancelError && <Alert type="error">Cancellation could not be confirmed. {cancelError.message}</Alert>}
        {job?.status === 'FAILED' && <Alert type="error">The server reported that generation failed. Review your generation settings before confirming another start.</Alert>}
        {recoveryNotice && discovered && !job && !checking && !error && <Alert type="info">No active job was found. Your earlier request may already have completed; the quiz list has been refreshed.</Alert>}
      </div>
      <div className={`flex flex-wrap gap-3 ${panel ? 'justify-end' : 'justify-center'}`}>
        {!accessStopped && (panel || error || (!job && discovered)) && <Button variant="secondary" disabled={checking || cancelling || paused || !observer} loading={checking} onClick={() => { void observer?.refresh(); }}>Refresh</Button>}
        {isActiveGeneration(job) && <Button variant={panel ? 'danger' : 'secondary'} disabled={cancelling || paused || accessStopped} loading={cancelling} onClick={() => { void observer?.cancel(); }}>Cancel Generation</Button>}
        {job?.status === 'COMPLETED' && job.generatedQuizId && <Button variant="primary" onClick={() => navigate(`/quizzes/${job.generatedQuizId}`)}>View Generated Quiz</Button>}
        {job?.status === 'FAILED' && onRetry && <Button variant="secondary" onClick={onRetry}>Try Again</Button>}
      </div>
    </Card>
  </section>;
};
