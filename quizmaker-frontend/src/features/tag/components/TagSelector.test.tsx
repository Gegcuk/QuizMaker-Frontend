import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { TagDto } from '@/types';
import { TagSelector } from './TagSelector';

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

describe('TagSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tagMocks.getTags.mockResolvedValue({ content: tags });
  });

  it('selects one tag and closes the single-select menu', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <TagSelector selectedTags={[]} onSelectionChange={onSelectionChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Select tags...' }));
    await user.click(await screen.findByRole('button', { name: /Architecture Architecture Design topics/ }));

    expect(onSelectionChange).toHaveBeenCalledWith([tags[0]]);
    expect(screen.queryByPlaceholderText('Search tags...')).not.toBeInTheDocument();
  });

  it('enforces the maximum tag selection and supports clearing the current selection', async () => {
    const onSelectionChange = vi.fn();
    const { user } = renderWithProviders(
      <TagSelector selectedTags={[tags[0]]} onSelectionChange={onSelectionChange} multiple maxSelections={1} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Architecture/ }));
    await screen.findByRole('button', { name: /Security Security Security topics/ });
    await user.click(screen.getByRole('button', { name: /Security Security Security topics/ }));

    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(screen.getByText('Maximum 1 tags selected. Remove some to add more.')).toBeInTheDocument();

    await user.click(screen.getByTitle('Clear all'));
    expect(onSelectionChange).toHaveBeenCalledWith([]);
  });

  it('shows a tag loading failure after the dropdown is opened', async () => {
    tagMocks.getTags.mockRejectedValue(new Error('Cannot load tags.'));
    const { user } = renderWithProviders(
      <TagSelector selectedTags={[]} onSelectionChange={vi.fn()} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(tagMocks.getTags).toHaveBeenCalled());
    await user.click(screen.getByRole('button', { name: 'Select tags...' }));

    expect(await screen.findByText('Cannot load tags.')).toBeInTheDocument();
  });
});
