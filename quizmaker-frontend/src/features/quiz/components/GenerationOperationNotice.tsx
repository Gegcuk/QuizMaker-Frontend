import { useEffect, useState } from 'react';
import { Alert, Button, Modal } from '@/components';
import type { GenerationOperationController } from '../hooks/useGenerationOperation';

/** Recovery controls deliberately never send a start request themselves. */
export function GenerationOperationNotice({ controller, onNewStart, onResumeJob }: {
  controller: GenerationOperationController;
  onNewStart?: () => void;
  onResumeJob?: (jobId: string) => void;
}) {
  const { operation, storageError, busy } = controller;
  const [confirmNew, setConfirmNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!operation || operation.notBefore <= Date.now()) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= operation.notBefore) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [operation]);
  const wait = operation ? Math.max(0, Math.ceil((operation.notBefore - now) / 1000)) : 0;
  if (!operation && !storageError && !error) return null;
  return <div className="space-y-3 my-4">
    {(storageError || error) && <Alert type="error">{storageError || error}</Alert>}
    {storageError && <Button variant="secondary" disabled={busy} onClick={() => {
      try { controller.retrySaving(); setError(null); } catch { setError('Recovery information could not be saved. Try again when browser storage is available.'); }
    }}>Retry saving recovery information</Button>}
    {operation && <>
      <Alert type="info">
        {operation.state === 'expired' || operation.expiresAt <= now
          ? 'The 30-day recovery window expired. A new generation needs your confirmation.'
          : operation.jobId ? 'This operation already has a generation job. Its identity is retained across reloads.'
          : operation.state === 'conflict' ? 'Generation conflict (409). A new command needs your confirmation.'
          : operation.source === 'document' ? 'A pending document generation was restored. Restore the original page selections and generation settings before retrying the same operation key.' : 'A pending generation operation was restored. Re-enter the exact original text or select the original file and restore all generation settings. Submitting again retries the same operation key.'}
        {wait > 0 && ` Wait ${wait} seconds before retrying.`}
      </Alert>
      {operation.jobId && onResumeJob && <Button variant="secondary" disabled={busy} onClick={() => {
        if (operation.jobId) onResumeJob(operation.jobId);
      }}>Show existing generation job</Button>}
      <Button variant="secondary" disabled={busy || Boolean(storageError)} onClick={() => setConfirmNew(true)}>Abandon operation / prepare new start</Button>
    </>}
    <Modal isOpen={confirmNew} onClose={() => setConfirmNew(false)} title="Confirm a new generation start">
      <p className="text-theme-text-primary mb-4">The previous request may already have created a job. Abandoning its recovery information does not cancel that job. A new submission may reserve tokens again.</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setConfirmNew(false)}>Keep existing operation</Button>
        <Button variant="primary" disabled={busy || Boolean(storageError)} onClick={() => {
          try { controller.abandon(); setConfirmNew(false); setError(null); onNewStart?.(); }
          catch { setError('Could not remove recovery information. No new key or request was created.'); }
        }}>Confirm new start</Button>
      </div>
    </Modal>
  </div>;
}
