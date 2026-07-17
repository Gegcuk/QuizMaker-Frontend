import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizDto, TagDto } from '@/types';
import { TagCloud } from './TagCloud';

const serviceMocks = vi.hoisted(() => ({
  getQuizzes: vi.fn(),
  getTags: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    getQuizzes = serviceMocks.getQuizzes;
  },
  TagService: class {
    getTags = serviceMocks.getTags;
  },
}));

const tags: TagDto[] = [
  { id: 'tag-1', name: 'Architecture', description: 'Design topics' },
  { id: 'tag-2', name: 'Security', description: 'Security topics' },
  { id: 'tag-3', name: 'Unused', description: 'No quiz uses this tag' },
];

const quiz = (tagIds: string[]): QuizDto => ({
  id: `quiz-${tagIds.join('-')}`,
  createdAt: '2026-07-16T09:00:00Z',
  updatedAt: '2026-07-16T10:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PUBLIC',
  difficulty: 'MEDIUM',
  status: 'PUBLISHED',
  estimatedTime: 20,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds,
});

describe('TagCloud', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows only used tags with their calculated usage counts and forwards clicks', async () => {
    serviceMocks.getTags.mockResolvedValue({ content: tags });
    serviceMocks.getQuizzes.mockResolvedValue({ content: [quiz(['tag-1']), quiz(['tag-1', 'tag-2'])] });
    const onTagClick = vi.fn();
    const { user } = renderWithProviders(<TagCloud onTagClick={onTagClick} />, {
      withAuthProvider: false,
    });

    expect(await screen.findByText('Tag Cloud')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Architecture(2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Security(1)' })).toBeInTheDocument();
    expect(screen.queryByText('Unused')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Architecture(2)' }));
    expect(onTagClick).toHaveBeenCalledWith(
      expect.objectContaining({
        ...tags[0],
        usageCount: 2,
        fontSize: expect.any(Number),
      }),
    );
  });

  it('shows a service failure instead of a misleading empty cloud', async () => {
    serviceMocks.getTags.mockRejectedValue(new Error('Tag cloud is unavailable.'));

    renderWithProviders(<TagCloud />, { withAuthProvider: false });

    expect(await screen.findByText('Tag cloud is unavailable.')).toBeInTheDocument();
  });
});
