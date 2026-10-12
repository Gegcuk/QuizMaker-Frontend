import ProgressBar from '@/components/ui/ProgressBar';
import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components';
import { useGenerationObservation, useObservedQuizTitle } from '../hooks/useGenerationObservation';
import { isActiveGeneration } from '../services/generationJobs';

interface Props { jobId?: string; className?: string; showEmpty?: boolean; title?: string }
const labels = {
  PENDING: 'Queued', PROCESSING: 'Generating your quiz', COMPLETED: 'Quiz ready',
  FAILED: 'Generation failed', CANCELLED: 'Generation cancelled',
} as const;

/** Compact presentation for My Quizzes; observation belongs to the session owner. */
export function GenerationJobBlock({ jobId, className = '', showEmpty = false, title = 'AI quiz generation' }: Props) {
  const headingId = useId();
  const navigate = useNavigate();
  const { job, checking, discovered, cancelling, paused, error, cancelError, accessStopped, recoveryNotice, observer } = useGenerationObservation(jobId);
  const resultTitle = useObservedQuizTitle(job);
  const startDate = job?.startedAt ? new Date(job.startedAt) : null;
  const startedAt = startDate && Number.isFinite(startDate.getTime())
    ? startDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : null;
  const hasChunkCounts = job?.totalChunks != null && job.totalChunks > 0
    && job.processedChunks != null && job.processedChunks <= job.totalChunks;
  if (!job && !checking && !error && !recoveryNotice && !showEmpty) return null;
  return (
    <section aria-labelledby={headingId} className={className}>
      <Card className="border-l-4 border-theme-interactive-info bg-theme-bg-info" padding="sm">
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <h3 id={headingId} className="text-sm font-semibold text-theme-text-primary">{title}</h3>
              <p role="status" className="text-sm text-theme-text-secondary">
                {job ? <Badge variant={job.status === 'COMPLETED' ? 'success' : 'info'} size="sm">{labels[job.status]}</Badge> : checking || !observer || (!discovered && !error) ? 'Checking your generation jobs…' : error ? 'Generation jobs are unavailable' : 'No active generation found'}
              </p>
              {job?.progressPercentage != null && <span className="text-sm tabular-nums text-theme-text-secondary">{Math.round(job.progressPercentage)}%</span>}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {isActiveGeneration(job) && <Button className="min-h-11" variant="secondary" size="sm" onClick={() => { void observer?.cancel(); }} disabled={cancelling || paused || accessStopped} loading={cancelling}>Cancel Generation</Button>}
              {job?.status === 'COMPLETED' && job.generatedQuizId && <Button className="min-h-11" variant="primary" size="sm" onClick={() => navigate(`/quizzes/${job.generatedQuizId}`)}>View Generated Quiz</Button>}
              {!accessStopped && (error || showEmpty) && <Button className="min-h-11" variant="outline" size="sm" disabled={checking || cancelling || paused} onClick={() => { void observer?.refresh(); }}>Refresh status</Button>}
            </div>
          </div>
          {resultTitle && <p className="mt-1 text-sm font-medium text-theme-text-primary break-words [overflow-wrap:anywhere]">{resultTitle}</p>}
          {(startedAt || hasChunkCounts) && <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-theme-text-secondary">
            {startedAt && <span>Started: <time dateTime={job?.startedAt ?? undefined}>{startedAt}</time></span>}
            {hasChunkCounts && <span>Chunks processed: {job?.processedChunks}/{job?.totalChunks}</span>}
          </div>}
          {job?.progressPercentage != null && <ProgressBar className="mt-2 [&>div:first-child]:sr-only [&_[role=progressbar]]:motion-reduce:transition-none" value={job.progressPercentage} label="Generation progress" size="sm" />}
          {(paused || error || cancelError || recoveryNotice || job?.status === 'FAILED') && <div className="mt-2 space-y-1">
              {paused && <p className="text-sm text-theme-text-secondary">Status checks are paused until this tab is visible and online.</p>}
              {error && <p role="alert" className="text-sm text-theme-text-secondary">
                Current status is temporarily unavailable. {job ? 'The last confirmed state is shown. ' : ''}
                {error.message} {!accessStopped && (job ? 'Checks will resume when available.' : 'Wait, then use Refresh status.')}
              </p>}
              {cancelError && <p role="alert" className="text-sm text-theme-text-secondary">Cancellation could not be confirmed. {cancelError.message} The server status is shown.</p>}
              {recoveryNotice && discovered && !error && !job && !checking && <p className="text-sm text-theme-text-secondary">No active job was found. Your earlier request may already have completed; the quiz list has been refreshed. Its outcome has not been linked to the original command.</p>}
              {job?.status === 'FAILED' && <p className="text-sm text-theme-text-secondary">The server reported that generation failed. Review your generation settings before confirming another start.</p>}
          </div>}
        </CardBody>
      </Card>
    </section>
  );
}
