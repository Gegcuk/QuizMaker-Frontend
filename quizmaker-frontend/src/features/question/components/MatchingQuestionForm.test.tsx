import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { MatchingQuestionForm } from './MatchingQuestionForm';

const matchingContent = {
  left: [
    { id: 1, text: 'Mitochondria', matchId: 10 },
    { id: 2, text: 'Ribosome', matchId: 11 },
    { id: 3, text: 'Nucleus', matchId: 12 },
    { id: 4, text: 'Golgi apparatus', matchId: 13 },
  ],
  right: [
    { id: 10, text: 'Energy production' },
    { id: 11, text: 'Protein synthesis' },
    { id: 12, text: 'Stores DNA' },
    { id: 13, text: 'Packages proteins' },
  ],
};

describe('MatchingQuestionForm', () => {
  it('preserves the authoring pairs and reports text edits', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingQuestionForm content={matchingContent} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(matchingContent);
    });

    await user.clear(screen.getAllByPlaceholderText('Enter left item...')[0]);
    await user.type(screen.getAllByPlaceholderText('Enter left item...')[0], 'Nucleus');
    await user.clear(screen.getAllByPlaceholderText('Enter matching right item...')[0]);
    await user.type(screen.getAllByPlaceholderText('Enter matching right item...')[0], 'Stores DNA');

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        left: [
          { id: 1, text: 'Nucleus', matchId: 10 },
          ...matchingContent.left.slice(1),
        ],
        right: [
          { id: 10, text: 'Stores DNA' },
          ...matchingContent.right.slice(1),
        ],
      });
    });
  });

  it('adds and removes complete pairs without allowing fewer than the backend minimum of four', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingQuestionForm content={matchingContent} onChange={onChange} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add Pair' }));

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        left: [
          ...matchingContent.left,
          { id: 5, text: '', matchId: 14 },
        ],
        right: [
          ...matchingContent.right,
          { id: 14, text: '' },
        ],
      });
    });
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(5);

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        left: [
          matchingContent.left[1],
          matchingContent.left[2],
          matchingContent.left[3],
          { id: 5, text: '', matchId: 14 },
        ],
        right: [
          matchingContent.right[1],
          matchingContent.right[2],
          matchingContent.right[3],
          { id: 14, text: '' },
        ],
      });
    });
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('preserves media-only pairs in both columns', async () => {
    const onChange = vi.fn();
    const contentWithMedia = {
      left: [
        {
          id: 1,
          matchId: 10,
          media: { assetId: 'left-image', cdnUrl: 'https://cdn.example.test/left.png' },
        },
        ...matchingContent.left.slice(1),
      ],
      right: [
        {
          id: 10,
          media: { assetId: 'right-image', cdnUrl: 'https://cdn.example.test/right.png' },
        },
        ...matchingContent.right.slice(1),
      ],
    };

    renderWithProviders(
      <MatchingQuestionForm content={contentWithMedia} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        left: [
          { ...contentWithMedia.left[0], text: '' },
          ...contentWithMedia.left.slice(1),
        ],
        right: [
          { ...contentWithMedia.right[0], text: '' },
          ...contentWithMedia.right.slice(1),
        ],
      });
    });
    expect(screen.getAllByAltText('Uploaded media preview')).toHaveLength(2);
  });
});
