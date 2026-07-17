import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { TagDto } from '@/types';
import { TagForm } from './TagForm';

const tagMocks = vi.hoisted(() => ({
  createTag: vi.fn(),
  getTagById: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  TagService: class {
    createTag = tagMocks.createTag;
    getTagById = tagMocks.getTagById;
    updateTag = tagMocks.updateTag;
  },
}));

const tag = (overrides: Partial<TagDto> = {}): TagDto => ({
  id: 'tag-1',
  name: 'Architecture',
  description: 'Design topics',
  ...overrides,
});

describe('TagForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates the tag name before calling the service', async () => {
    const { user } = renderWithProviders(<TagForm onSave={vi.fn()} onCancel={vi.fn()} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText(/Tag Name/), 'AI');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));

    expect(screen.getByText('Tag name must be at least 3 characters')).toBeInTheDocument();
    expect(tagMocks.createTag).not.toHaveBeenCalled();
  });

  it('creates a tag and returns the full tag response', async () => {
    tagMocks.createTag.mockResolvedValue({ tagId: 'tag-1' });
    tagMocks.getTagById.mockResolvedValue(tag());
    const onSave = vi.fn();
    const { user } = renderWithProviders(<TagForm onSave={onSave} onCancel={vi.fn()} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText(/Tag Name/), 'Architecture');
    await user.type(screen.getByLabelText('Description'), 'Design topics');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));

    await waitFor(() => {
      expect(tagMocks.createTag).toHaveBeenCalledWith({ name: 'Architecture', description: 'Design topics' });
    });
    expect(tagMocks.getTagById).toHaveBeenCalledWith('tag-1');
    expect(onSave).toHaveBeenCalledWith(tag());
  });

  it('updates an existing tag without creating a replacement', async () => {
    const updatedTag = tag({ name: 'Cloud Architecture' });
    tagMocks.updateTag.mockResolvedValue(updatedTag);
    const onSave = vi.fn();
    const { user } = renderWithProviders(
      <TagForm tag={tag()} onSave={onSave} onCancel={vi.fn()} />,
      { withAuthProvider: false },
    );

    const nameInput = screen.getByLabelText(/Tag Name/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Cloud Architecture');
    await user.click(screen.getByRole('button', { name: 'Update Tag' }));

    await waitFor(() => {
      expect(tagMocks.updateTag).toHaveBeenCalledWith('tag-1', {
        name: 'Cloud Architecture',
        description: 'Design topics',
      });
    });
    expect(onSave).toHaveBeenCalledWith(updatedTag);
  });
});
