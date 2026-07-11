import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizShare from './QuizShare';

const quiz: QuizDto = {
  id: 'quiz-1',
  createdAt: '2026-07-11T09:00:00.000Z',
  updatedAt: '2026-07-11T09:00:00.000Z',
  creatorId: 'user-1',
  title: 'Architecture Leadership',
  description: 'A quiz about leading software architecture.',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
};

const setNavigatorProperty = (name: 'clipboard' | 'share', value: unknown) => {
  Object.defineProperty(window.navigator, name, { configurable: true, value });
};

const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');

afterEach(() => {
  vi.restoreAllMocks();

  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }

  if (originalShare) {
    Object.defineProperty(navigator, 'share', originalShare);
  } else {
    Reflect.deleteProperty(navigator, 'share');
  }
});

describe('QuizShare', () => {
  it('uses the native sharing API when it is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    setNavigatorProperty('share', share);
    const { user } = renderWithProviders(<QuizShare quiz={quiz} />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Share Quiz' }));

    expect(share).toHaveBeenCalledWith({
      title: quiz.title,
      text: quiz.description,
      url: `${window.location.origin}/quizzes/${quiz.id}`,
    });
  });

  it('opens an accessible fallback dialog and copies the share URL', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setNavigatorProperty('share', undefined);
    setNavigatorProperty('clipboard', { writeText });
    expect(navigator.clipboard.writeText).toBe(writeText);
    const { user } = renderWithProviders(<QuizShare quiz={quiz} />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Share Quiz' }));

    expect(screen.getByRole('dialog', { name: 'Share Quiz' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy' }));

    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close share dialog' }));
    expect(screen.queryByRole('dialog', { name: 'Share Quiz' })).not.toBeInTheDocument();
  });
});
