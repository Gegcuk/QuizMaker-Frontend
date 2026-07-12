import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import QuizTagManager from './QuizTagManager';

const tagService = vi.hoisted(() => ({
  getTags: vi.fn(),
  createTag: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  TagService: class {
    getTags = tagService.getTags;
    createTag = tagService.createTag;
  },
}));

const tags = [
  { id: 'tag-1', name: 'architecture', description: 'System design' },
  { id: 'tag-2', name: 'security', description: 'Application security' },
];

describe('QuizTagManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tagService.getTags.mockResolvedValue({ content: tags });
  });

  it('filters tags and changes checkbox selection once', async () => {
    const onTagsChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizTagManager quizId="quiz-1" currentTagIds={[]} onTagsChange={onTagsChange} />,
      { withAuthProvider: false },
    );

    await user.click(await screen.findByRole('checkbox', { name: /architecture/ }));

    expect(onTagsChange).toHaveBeenCalledTimes(1);
    expect(onTagsChange).toHaveBeenCalledWith(['tag-1']);

    await user.type(screen.getByLabelText('Search Tags'), 'security');
    expect(screen.queryByText('#architecture')).not.toBeInTheDocument();
    expect(screen.getByText('#security')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search Tags'));
    await user.click(screen.getByRole('button', { name: 'Select All' }));

    expect(onTagsChange).toHaveBeenLastCalledWith(['tag-1', 'tag-2']);
  });

  it('creates a tag and makes it available for later selection', async () => {
    tagService.createTag.mockResolvedValue({ tagId: 'tag-3' });
    const { user } = renderWithProviders(
      <QuizTagManager quizId="quiz-1" currentTagIds={[]} onTagsChange={vi.fn()} />,
      { withAuthProvider: false },
    );

    await screen.findByText('#architecture');
    await user.click(screen.getByRole('button', { name: '+ Add New Tag' }));
    await user.type(screen.getByLabelText(/Tag Name/), 'data');
    await user.type(screen.getByLabelText('Description'), 'Data platform architecture');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));

    await waitFor(() => {
      expect(tagService.createTag).toHaveBeenCalledWith({
        name: 'data',
        description: 'Data platform architecture',
      });
    });
    expect(screen.getByText('#data')).toBeInTheDocument();
  });
});
