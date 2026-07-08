import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import TagManagementPage from './TagManagementPage';

const mocks = vi.hoisted(() => ({
  createTag: vi.fn(),
  deleteTag: vi.fn(),
  getTags: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  TagService: class {
    createTag = mocks.createTag;
    deleteTag = mocks.deleteTag;
    getTags = mocks.getTags;
    updateTag = mocks.updateTag;
  },
}));

describe('TagManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTags.mockResolvedValue({
      content: [{ id: 'tag-1', name: 'Architecture', description: 'Design' }],
    });
    mocks.deleteTag.mockResolvedValue(undefined);
  });

  it('deletes a tag after confirmation', async () => {
    const { user } = renderWithProviders(<TagManagementPage />, {
      withAuthProvider: false,
    });

    await user.click(await screen.findByRole('button', { name: 'Delete tag' }));
    expect(screen.getByRole('dialog', { name: 'Delete Tag' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete Tag' }));

    await waitFor(() => expect(mocks.deleteTag).toHaveBeenCalledWith('tag-1'));
    expect(mocks.getTags).toHaveBeenCalledTimes(2);
  });
});
