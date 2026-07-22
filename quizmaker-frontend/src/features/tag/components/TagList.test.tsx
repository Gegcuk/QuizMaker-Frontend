import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { TagDto } from '@/types';
import { TagList } from './TagList';

const tagMocks = vi.hoisted(() => ({
  getTags: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  TagService: class {
    getTags = tagMocks.getTags;
  },
}));

const tags: TagDto[] = [
  { id: 'tag-1', name: 'Architecture', description: 'Design topics' },
  { id: 'tag-2', name: 'Security', description: 'Security topics' },
];

describe('TagList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tagMocks.getTags.mockResolvedValue({ content: tags, totalElements: 2, totalPages: 1 });
  });

  it('filters tags and forwards the selected row', async () => {
    const onTagSelect = vi.fn();
    const { user } = renderWithProviders(
      <TagList onEditTag={vi.fn()} onDeleteTag={vi.fn()} onTagSelect={onTagSelect} />,
      { withAuthProvider: false },
    );

    expect((await screen.findAllByText('Architecture')).length).toBeGreaterThan(0);
    await user.type(screen.getByPlaceholderText('Search tags...'), 'security');

    expect(screen.queryByText('Design topics')).not.toBeInTheDocument();
    await user.click(screen.getByText('Security topics'));
    expect(onTagSelect).toHaveBeenCalledWith(tags[1]);
  });

  it('shows the shared empty state when no tags are returned', async () => {
    tagMocks.getTags.mockResolvedValue({ content: [], totalElements: 0, totalPages: 0 });

    renderWithProviders(<TagList onEditTag={vi.fn()} onDeleteTag={vi.fn()} />, {
      withAuthProvider: false,
    });

    expect(await screen.findByText('No data available')).toBeInTheDocument();
  });

  it('exposes a retry control when the service fails', async () => {
    tagMocks.getTags.mockRejectedValue(new Error('Tags are unavailable.'));
    const { user } = renderWithProviders(<TagList onEditTag={vi.fn()} onDeleteTag={vi.fn()} />, {
      withAuthProvider: false,
    });

    expect(await screen.findByText('Tags are unavailable.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(tagMocks.getTags).toHaveBeenCalledTimes(2));
  });
});
