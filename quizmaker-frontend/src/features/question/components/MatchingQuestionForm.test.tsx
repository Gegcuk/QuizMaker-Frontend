import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import { MatchingQuestionForm } from './MatchingQuestionForm';

const matchingContent = {
  left: [
    { id: 1, text: 'Mitochondria', matchId: 10 },
    { id: 2, text: 'Ribosome', matchId: 11 },
  ],
  right: [
    { id: 10, text: 'Energy production' },
    { id: 11, text: 'Protein synthesis' },
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
          matchingContent.left[1],
        ],
        right: [
          { id: 10, text: 'Stores DNA' },
          matchingContent.right[1],
        ],
      });
    });
  });

  it('adds and removes complete pairs without allowing fewer than two', async () => {
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
          { id: 3, text: '', matchId: 12 },
        ],
        right: [
          ...matchingContent.right,
          { id: 12, text: '' },
        ],
      });
    });
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(3);

    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        left: [
          matchingContent.left[1],
          { id: 3, text: '', matchId: 12 },
        ],
        right: [
          matchingContent.right[1],
          { id: 12, text: '' },
        ],
      });
    });
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
});
