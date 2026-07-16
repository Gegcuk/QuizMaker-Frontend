import { describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuizDto, QuizStatus } from '@/types';
import QuizPublishModal from './QuizPublishModal';

const buildQuiz = (status: QuizStatus): QuizDto => ({
  id: 'quiz-1',
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T09:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Leadership',
  description: 'A quiz about software architecture leadership.',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status,
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
  questionCount: 3,
});

const renderModal = ({
  isOpen = true,
  status = 'DRAFT',
  onClose = vi.fn(),
  onConfirm = vi.fn().mockResolvedValue(undefined),
}: {
  isOpen?: boolean;
  status?: QuizStatus;
  onClose?: () => void;
  onConfirm?: (status: QuizStatus) => Promise<void>;
} = {}) =>
  renderWithProviders(
    <QuizPublishModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      quiz={buildQuiz(status)}
    />,
    { withAuthProvider: false },
  );

describe('QuizPublishModal', () => {
  it('does not render while closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the panel above the backdrop and closes from cancel', async () => {
    const onClose = vi.fn();
    const { user } = renderModal({ onClose });

    const dialog = screen.getByRole('dialog', {
      name: 'Quiz Status Management',
    });
    expect(dialog).toHaveClass('relative', 'z-10');
    expect(screen.getByTestId('quiz-publish-modal-backdrop')).toHaveClass('z-0');

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from the backdrop when idle', async () => {
    const onClose = vi.fn();
    const { user } = renderModal({ onClose });

    await user.click(screen.getByTestId('quiz-publish-modal-backdrop'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('publishes draft quizzes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { user } = renderModal({ status: 'DRAFT', onClose, onConfirm });

    await user.click(screen.getByRole('button', { name: 'Publish Quiz' }));

    expect(onConfirm).toHaveBeenCalledWith('PUBLISHED');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('saves published quizzes as draft', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { user } = renderModal({ status: 'PUBLISHED', onClose, onConfirm });

    await user.click(screen.getByRole('button', { name: 'Save as Draft' }));

    expect(onConfirm).toHaveBeenCalledWith('DRAFT');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('archives active quizzes', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { user } = renderModal({ status: 'DRAFT', onClose, onConfirm });

    await user.click(screen.getByRole('button', { name: 'Archive Quiz' }));

    expect(onConfirm).toHaveBeenCalledWith('ARCHIVED');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('restores archived quizzes as drafts without offering a direct publish action', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    const { user } = renderModal({ status: 'ARCHIVED', onClose, onConfirm });

    expect(screen.queryByRole('button', { name: 'Publish Quiz' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Archive Quiz' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Restore as Draft' }));

    expect(onConfirm).toHaveBeenCalledWith('DRAFT');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents duplicate status submissions while loading', async () => {
    let resolveConfirm: (() => void) | undefined;
    const pendingConfirm = new Promise<void>((resolve) => {
      resolveConfirm = resolve;
    });
    const onConfirm = vi.fn(() => pendingConfirm);
    const onClose = vi.fn();
    const { user } = renderModal({ status: 'DRAFT', onClose, onConfirm });

    const publishButton = screen.getByRole('button', { name: 'Publish Quiz' });
    await user.click(publishButton);

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(publishButton).toBeDisabled();

    await user.click(publishButton);
    await user.click(screen.getByTestId('quiz-publish-modal-backdrop'));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();

    expect(resolveConfirm).toBeDefined();
    await act(async () => {
      resolveConfirm?.();
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
