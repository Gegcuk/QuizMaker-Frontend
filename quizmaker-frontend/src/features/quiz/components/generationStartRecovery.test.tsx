import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { TextGenerationTab } from './TextGenerationTab';
import { DocumentUploadTab } from './DocumentUploadTab';
import DocumentUpload from '@/features/document/components/DocumentUpload';
import { generationOperations, GENERATION_STORAGE_PREFIX } from '../services/generationOperations';
import { toApplicationError } from '@/utils/applicationError';
import { Button } from '@/components';

const mocks = vi.hoisted(() => ({ text: vi.fn(), upload: vi.fn(), document: vi.fn(), getDocument: vi.fn() }));
vi.mock('@/features/auth', async original => ({ ...await original<typeof import('@/features/auth')>(), useAuth: () => ({ user: { id: 'account-a' }, isLoading: false }) }));
vi.mock('@/services', () => ({
  api: {},
  QuizService: class { generateQuizFromText = mocks.text; generateQuizFromUpload = mocks.upload; generateQuizFromDocument = mocks.document; },
  DocumentService: class {
    getDocumentConfig = async () => ({ defaultStrategy: 'PAGE_BASED', defaultMaxChunkSize: 2400 });
    uploadDocument = async () => ({ id: 'document-1', title: 'Notes', originalFilename: 'original.txt', fileSize: 500, status: 'PROCESSED' });
    getDocumentById = mocks.getDocument;
  },
  tokenEstimationService: { estimateFromText: () => null },
}));
vi.mock('@/features/ai', () => ({
  GenerationProgress: ({ jobId, onGenerationCancelled }: { jobId: string; onGenerationCancelled?: () => void }) => <div>
    Generation job: {jobId}
    <Button onClick={async () => {
      await generationOperations.recordJob(jobId, 'CANCELLED');
      onGenerationCancelled?.();
    }}>Cancel Generation</Button>
  </div>,
  TokenEstimationDisplay: () => null,
}));
const sourceText = 'Private source material about photosynthesis, respiration, and plant nutrition. '.repeat(7);
const file = new File([sourceText], 'original.txt', { type: 'text/plain' });
const lostResponse = () => toApplicationError({ isAxiosError: true, code: 'ERR_NETWORK' });
const accepted = { jobId: 'same-job', status: 'PENDING' as const, message: 'queued', estimatedTimeSeconds: 10 };
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

async function fillText(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.click(screen.getByLabelText(/Enter your text content/));
  await user.paste(sourceText);
}

describe('generation start recovery screens', () => {
  it('repairs a transient read failure through the recovery button without POST', async () => {
    mocks.text.mockResolvedValue(accepted);
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await fillText(view.user);
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(key => {
      if (key.startsWith(GENERATION_STORAGE_PREFIX)) throw new DOMException('Unavailable');
      return null;
    });
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    await screen.findByRole('button', { name: 'Retry saving recovery information' });
    expect(mocks.text).not.toHaveBeenCalled();
    read.mockRestore();
    await view.user.click(screen.getByRole('button', { name: 'Retry saving recovery information' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry saving recovery information' })).not.toBeInTheDocument());
    expect(mocks.text).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    expect(await screen.findByText('Generation job: same-job')).toBeInTheDocument();
  });

  it('repairs removal failure but requires another explicit confirmation before removing the key', async () => {
    mocks.text.mockResolvedValue(accepted);
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await fillText(view.user);
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    await screen.findByText('Generation job: same-job');
    expect(screen.queryByRole('button', { name: 'Prepare new generation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show existing generation job' })).not.toBeInTheDocument();
    await view.user.click(screen.getByRole('button', { name: 'Cancel Generation' }));
    const key = generationOperations.getSnapshot().pending['text-tab']?.key;
    const remove = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new DOMException('Unavailable'); });
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Confirm new start' }));
    await screen.findByRole('button', { name: 'Retry saving recovery information' });
    await view.user.click(screen.getByRole('button', { name: 'Keep existing operation' }));
    remove.mockRestore();
    await view.user.click(screen.getByRole('button', { name: 'Retry saving recovery information' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Retry saving recovery information' })).not.toBeInTheDocument());
    expect(generationOperations.getSnapshot().pending['text-tab']?.key).toBe(key);
    expect(mocks.text).toHaveBeenCalledOnce();
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Confirm new start' }));
    await waitFor(() => expect(generationOperations.getSnapshot().pending['text-tab']).toBeUndefined());
    expect(mocks.text).toHaveBeenCalledOnce();
  });

  it('keeps a completed command on the new-generation form until the user explicitly prepares a new start', async () => {
    await generationOperations.start('account-a', 'text-tab', 'text', async () => accepted);
    await generationOperations.recordJob(accepted.jobId, 'COMPLETED', 'completed-quiz');
    const originalKey = generationOperations.getSnapshot().pending['text-tab']?.key;
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await screen.findByRole('button', { name: 'Prepare new generation' });
    expect(screen.queryByText('Generation job: same-job')).not.toBeInTheDocument();
    expect(mocks.text).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Keep existing operation' }));
    expect(generationOperations.getSnapshot().pending['text-tab']?.key).toBe(originalKey);
    expect(mocks.text).not.toHaveBeenCalled();
  });
  it('shows an unknown deadline after reload and blocks POST until explicit new-start confirmation', async () => {
    mocks.text.mockResolvedValue(accepted);
    const createdAt = Date.now() - 60_000;
    const operation = { version: 1, accountId: 'account-a', entryPoint: 'text-tab', source: 'text',
      key: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', createdAt,
      expiresAt: createdAt + 30 * 24 * 60 * 60 * 1000, state: 'uncertain', notBefore: 0 };
    localStorage.setItem(`${GENERATION_STORAGE_PREFIX}account-a:text-tab`, JSON.stringify(operation));
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await fillText(view.user);
    expect(screen.getByText(/previous request outcome was not saved/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Quiz from Text/ })).toBeDisabled();
    expect(mocks.text).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Confirm new start' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Generate Quiz from Text/ })).toBeEnabled());
    expect(mocks.text).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    await screen.findByText('Generation job: same-job');
    expect(mocks.text.mock.calls[0][1]).not.toBe(operation.key);
  });

  it.each(['text', 'upload', 'document'] as const)('restores %s after reload and retries the existing key with no persisted source', async source => {
    const Component = source === 'text' ? TextGenerationTab : source === 'upload' ? DocumentUploadTab : DocumentUpload;
    const send = mocks[source];
    send.mockRejectedValueOnce(lostResponse()).mockResolvedValueOnce(accepted);
    mocks.getDocument.mockResolvedValue({ id: 'document-1', title: 'Notes', originalFilename: 'original.txt', fileSize: 500, status: 'PROCESSED' });
    let view = renderWithProviders(<Component />, { withAuthProvider: false });
    if (source === 'text') await fillText(view.user);
    else {
      await view.user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
      if (source === 'document') {
        await view.user.click(screen.getByRole('button', { name: 'Upload Document' }));
        await view.user.click(await screen.findByRole('button', { name: 'Generate Quiz from Document' }));
        await view.user.clear(screen.getByPlaceholderText('Enter quiz title...'));
        await view.user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Original quiz');
        await view.user.clear(screen.getByPlaceholderText('Enter quiz description...'));
        await view.user.type(screen.getByPlaceholderText('Enter quiz description...'), 'Original description');
      }
    }
    const submit = () => screen.getByRole('button', { name: source === 'text' ? /Generate Quiz from Text/ : source === 'upload' ? 'Upload Document & Start Quiz Generation' : 'Start Quiz Generation' });
    await view.user.click(submit());
    await waitFor(() => expect(send).toHaveBeenCalledOnce());
    await screen.findByText(/Network error occurred/);
    const firstBody = send.mock.calls[0][0];
    const key = send.mock.calls[0][1];
    expect(Object.values(localStorage).join('')).not.toContain(sourceText);
    expect(Object.values(localStorage).join('')).not.toContain('original.txt');
    view.unmount();
    // Remount resets input; lifecycle tests separately restore from a fresh store instance.
    view = renderWithProviders(<Component />, { withAuthProvider: false });
    await screen.findByText(/pending.*generation operation was restored|pending document generation was restored/i);
    expect(send).toHaveBeenCalledOnce();
    if (source === 'text') {
      expect(screen.getByLabelText(/Enter your text content/)).toHaveValue('');
      await fillText(view.user);
    } else if (source === 'upload') await view.user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
    else {
      await view.user.click(await screen.findByRole('button', { name: 'Generate Quiz from Document' }));
      await view.user.clear(screen.getByPlaceholderText('Enter quiz title...'));
        await view.user.type(screen.getByPlaceholderText('Enter quiz title...'), 'Original quiz');
        await view.user.clear(screen.getByPlaceholderText('Enter quiz description...'));
        await view.user.type(screen.getByPlaceholderText('Enter quiz description...'), 'Original description');
    }
    await view.user.click(submit());
    expect(await screen.findByText('Generation job: same-job')).toBeInTheDocument();
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][1]).toBe(key);
    if (source !== 'upload') expect(send.mock.calls[1][0]).toEqual(firstBody);
    expect(localStorage.getItem(`${GENERATION_STORAGE_PREFIX}account-a:${source === 'text' ? 'text-tab' : source === 'upload' ? 'upload-tab' : 'document-upload'}`)).toContain(key);
  });

  it('blocks storage failure before POST, retries saving without POST, and reuses the key on submission', async () => {
    mocks.text.mockResolvedValue(accepted);
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await fillText(view.user);
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Unavailable'); });
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    expect((await screen.findAllByText(/Cannot save generation recovery/)).length).toBeGreaterThan(0);
    const key = generationOperations.getSnapshot().pending['text-tab']?.key;
    expect(mocks.text).not.toHaveBeenCalled();
    write.mockRestore();
    await view.user.click(screen.getByRole('button', { name: 'Retry saving recovery information' }));
    expect(mocks.text).not.toHaveBeenCalled();
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    expect(await screen.findByText('Generation job: same-job')).toBeInTheDocument();
    expect(mocks.text.mock.calls[0][1]).toBe(key);
  });

  it('keeps conflict blocked until the user confirms abandoning the original command', async () => {
    mocks.text.mockRejectedValueOnce(toApplicationError({ response: { status: 409 } })).mockResolvedValueOnce(accepted);
    const view = renderWithProviders(<TextGenerationTab />, { withAuthProvider: false });
    await fillText(view.user);
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    await screen.findByText(/Generation conflict \(409\).*source or settings/);
    expect(mocks.text).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: /Generate Quiz from Text/ })).toBeDisabled();
    const oldKey = mocks.text.mock.calls[0][1];
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Keep existing operation' }));
    expect(mocks.text).toHaveBeenCalledOnce();
    await view.user.click(screen.getByRole('button', { name: 'Prepare new generation' }));
    await view.user.click(screen.getByRole('button', { name: 'Confirm new start' }));
    expect(mocks.text).toHaveBeenCalledOnce();
    await view.user.click(screen.getByRole('button', { name: /Generate Quiz from Text/ }));
    expect(await screen.findByText('Generation job: same-job')).toBeInTheDocument();
    expect(mocks.text.mock.calls[1][1]).not.toBe(oldKey);
  });
});
