import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizDetailHeader from './QuizDetailHeader';

const quiz = (status: QuizDto['status'] = 'PUBLISHED'): QuizDto => ({
  id: 'quiz-1',
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T10:00:00.000Z',
  creatorId: 'user-1',
  title: 'Architecture Leadership',
  description: 'A quiz about leading architecture teams.',
  visibility: 'PUBLIC',
  difficulty: 'HARD',
  status,
  estimatedTime: 90,
  isRepetitionEnabled: true,
  timerEnabled: true,
  timerDuration: 45,
  tagIds: [],
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QuizDetailHeader', () => {
  it('renders quiz details and invokes every supplied action', async () => {
    const callbacks = {
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onShare: vi.fn(),
      onExport: vi.fn(),
      onStart: vi.fn(),
      onManageQuestions: vi.fn(),
      onManageGeneration: vi.fn(),
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderWithProviders(<QuizDetailHeader quiz={quiz()} {...callbacks} />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Architecture Leadership' })).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('Multiple attempts')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start Quiz/ }));
    await user.click(screen.getByRole('button', { name: /Questions/ }));
    await user.click(screen.getByRole('button', { name: /Edit Quiz/ }));
    await user.click(screen.getByRole('button', { name: /AI Generation/ }));
    await user.click(screen.getByRole('button', { name: /Share/ }));
    await user.click(screen.getByRole('button', { name: /Export Results/ }));
    await user.click(screen.getByRole('button', { name: /Delete Quiz/ }));

    expect(callbacks.onStart).toHaveBeenCalledOnce();
    expect(callbacks.onManageQuestions).toHaveBeenCalledOnce();
    expect(callbacks.onEdit).toHaveBeenCalledOnce();
    expect(callbacks.onManageGeneration).toHaveBeenCalledOnce();
    expect(callbacks.onShare).toHaveBeenCalledOnce();
    expect(callbacks.onExport).toHaveBeenCalledOnce();
    expect(callbacks.onDelete).toHaveBeenCalledOnce();
  });

  it('does not expose start when a quiz is not published and shows an unlimited timer', () => {
    renderWithProviders(
      <QuizDetailHeader quiz={{ ...quiz('DRAFT'), timerEnabled: false, timerDuration: 0 }} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('button', { name: /Start Quiz/ })).not.toBeInTheDocument();
    expect(screen.getByText('No limit')).toBeInTheDocument();
  });
});
