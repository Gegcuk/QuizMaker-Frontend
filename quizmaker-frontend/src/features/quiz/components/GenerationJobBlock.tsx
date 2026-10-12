import ProgressBar from '@/components/ui/ProgressBar';
import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, CardBody } from '@/components';
import { useGenerationObservation } from '../hooks/useGenerationObservation';
import { isActiveGeneration } from '../services/generationJobs';

interface Props { jobId?: string; className?: string; showEmpty?: boolean; title?: string }
const labels = {
  PENDING: 'Queued', PROCESSING: 'Generating your quiz', COMPLETED: 'Quiz ready',
  FAILED: 'Generation failed', CANCELLED: 'Generation cancelled',
} as const;

/** Presentation only: both the compact block and generation screens use the session owner. */
export function GenerationJobBlock({ jobId, className = '', showEmpty = false, title = 'AI quiz generation' }: Props) {
  const headingId = useId();
  const navigate = useNavigate();
  const { job, checking, discovered, cancelling, paused, error, cancelError, accessStopped, recoveryNotice, observer } = useGenerationObservation(jobId);
  if (!job && !checking && !error && !recoveryNotice && !showEmpty) return null;
  return (
    <section aria-labelledby={headingId} className={className}>
      <h3 id={headingId} className="text-lg font-medium text-theme-text-primary mb-3">{title}</h3>
      <Card className="border-l-4 border-theme-interactive-info bg-theme-bg-info" padding="md">
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p role="status" className="font-medium text-theme-text-primary">
                {job ? labels[job.status] : checking || !observer || (!discovered && !error) ? 'Checking your generation jobs…' : error ? 'Generation jobs are unavailable' : 'No active generation found'}
              </p>
              {job && <Badge variant={job.status === 'COMPLETED' ? 'success' : 'info'} size="sm">{job.status}</Badge>}
              {job && isActiveGeneration(job) && <p className="text-sm text-theme-text-secondary">You can leave this page. Progress will be available when you return.</p>}
              {paused && <p className="text-sm text-theme-text-secondary">Status checks are paused until this tab is visible and online.</p>}
              {error && <p role="alert" className="text-sm text-theme-text-secondary">
                Current status is temporarily unavailable. {job ? 'The last confirmed state is shown. ' : ''}
                {error.message} {!accessStopped && (job ? 'Checks will resume when available.' : 'Wait, then use Refresh status.')}
              </p>}
              {cancelError && <p role="alert" className="text-sm text-theme-text-secondary">Cancellation could not be confirmed. {cancelError.message} The server status is shown.</p>}
              {recoveryNotice && discovered && !error && !job && !checking && <p className="text-sm text-theme-text-secondary">No active job was found. Your earlier request may already have completed; the quiz list has been refreshed. Its outcome has not been linked to the original command.</p>}
              {job?.status === 'FAILED' && <p className="text-sm text-theme-text-secondary">The server reported that generation failed. Review your generation settings before confirming another start.</p>}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {isActiveGeneration(job) && <Button className="min-h-11" variant="secondary" size="sm" onClick={() => { void observer?.cancel(); }} disabled={cancelling || paused || accessStopped} loading={cancelling}>Cancel Generation</Button>}
              {job?.status === 'COMPLETED' && job.generatedQuizId && <Button className="min-h-11" variant="primary" size="sm" onClick={() => navigate(`/quizzes/${job.generatedQuizId}`)}>View Generated Quiz</Button>}
              {!accessStopped && (error || showEmpty) && <Button className="min-h-11" variant="outline" size="sm" disabled={checking || cancelling || paused} onClick={() => { void observer?.refresh(); }}>Refresh status</Button>}
            </div>
          </div>
          {job?.progressPercentage != null && <ProgressBar className="mt-3 [&_[role=progressbar]]:motion-reduce:transition-none" value={job.progressPercentage} label="Generation progress" showPercentage size="sm" />}
        </CardBody>
      </Card>
    </section>
  );
}
