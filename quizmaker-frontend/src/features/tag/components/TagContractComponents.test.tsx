import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuizDto, TagDto } from '@/types';
import QuizTagManager from '@/features/quiz/components/QuizTagManager';
import { TagAnalytics } from './TagAnalytics';
import { TagList } from './TagList';
import { TagStats } from './TagStats';

const serviceMocks = vi.hoisted(() => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  getQuizzes: vi.fn(),
  getTags: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    getQuizzes = serviceMocks.getQuizzes;
  },
  TagService: class {
    createTag = serviceMocks.createTag;
    deleteTag = serviceMocks.deleteTag;
    getTags = serviceMocks.getTags;
    updateTag = serviceMocks.updateTag;
  },
}));

const tag = (overrides: Partial<TagDto> = {}): TagDto => ({
  id: 'tag-1',
  name: 'Architecture',
  description: 'Software architecture topics',
  ...overrides,
});

const quiz = (overrides: Partial<QuizDto> = {}): QuizDto => ({
  id: 'quiz-1',
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T09:00:00Z',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'DRAFT',
  estimatedTime: 15,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: ['tag-1'],
  ...overrides,
});

const tagPage = (content: TagDto[]) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  numberOfElements: content.length,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
});

const quizPage = (content: QuizDto[]) => ({
  content,
  totalElements: content.length,
  totalPages: 1,
  numberOfElements: content.length,
  size: 20,
  number: 0,
  first: true,
  last: true,
  empty: content.length === 0,
});

describe('tag components with deployed TagDto payloads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.getTags.mockResolvedValue(tagPage([tag()]));
    serviceMocks.getQuizzes.mockResolvedValue(quizPage([quiz()]));
    serviceMocks.createTag.mockResolvedValue({ tagId: 'tag-new' });
  });

  it('renders TagList without timestamp columns', async () => {
    renderWithProviders(
      <TagList
        onEditTag={vi.fn()}
        onDeleteTag={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(await screen.findAllByText('Architecture')).not.toHaveLength(0);
    expect(screen.getByText('Software architecture topics')).toBeInTheDocument();
    expect(screen.queryByText('Created')).not.toBeInTheDocument();
  });

  it('renders TagStats from usage data without tag activity timestamps', async () => {
    renderWithProviders(<TagStats />, { withAuthProvider: false });

    expect(await screen.findByText('Tag Statistics')).toBeInTheDocument();
    expect(screen.getByText('Unused Tags')).toBeInTheDocument();
    expect(screen.queryByText('Growth Rate')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Activity')).not.toBeInTheDocument();
  });

  it('renders TagAnalytics usage trends without tag creation trends', async () => {
    renderWithProviders(<TagAnalytics />, { withAuthProvider: false });

    expect(await screen.findByText('Tag Analytics')).toBeInTheDocument();
    expect(screen.getByText('Tag Usage Trend')).toBeInTheDocument();
    expect(screen.queryByText('Tag Creation Trend')).not.toBeInTheDocument();
  });

  it('creates quiz tags without synthesizing timestamp fields', async () => {
    serviceMocks.getTags.mockResolvedValueOnce(tagPage([]));
    const onTagsChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizTagManager
        quizId="quiz-1"
        currentTagIds={[]}
        onTagsChange={onTagsChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByRole('button', { name: '+ Add New Tag' }));
    await user.type(screen.getByLabelText(/Tag Name/), 'Architecture');
    await user.type(screen.getByLabelText('Description'), 'Software architecture topics');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));

    await waitFor(() => {
      expect(serviceMocks.createTag).toHaveBeenCalledWith({
        name: 'Architecture',
        description: 'Software architecture topics',
      });
    });
    expect(await screen.findByText('#Architecture')).toBeInTheDocument();
    expect(screen.queryByText(/Created:/)).not.toBeInTheDocument();
  });
});
