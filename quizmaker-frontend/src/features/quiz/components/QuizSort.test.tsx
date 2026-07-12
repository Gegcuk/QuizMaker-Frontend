import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizSort, { type SortOption } from './QuizSort';

const QuizSortHarness = ({ onSortChange = vi.fn() }: { onSortChange?: (sort: SortOption) => void }) => {
  const [sortBy, setSortBy] = useState<SortOption>('createdAt_desc');

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    onSortChange(sort);
  };

  return <QuizSort sortBy={sortBy} onSortChange={handleSortChange} />;
};

describe('QuizSort', () => {
  it('changes sorting through labelled radio controls', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(<QuizSortHarness onSortChange={onSortChange} />, {
      withAuthProvider: false,
    });
    const titleAscending = screen.getByRole('radio', { name: /^Title \(A-Z\)/ });

    expect(screen.getByRole('radio', { name: /^Newest First/ })).toBeChecked();
    await user.click(titleAscending);

    expect(onSortChange).toHaveBeenLastCalledWith('title_asc');
    expect(titleAscending).toBeChecked();
  });

  it('changes sorting through quick-sort controls', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(<QuizSortHarness onSortChange={onSortChange} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: 'Easy First' }));

    expect(onSortChange).toHaveBeenLastCalledWith('difficulty_asc');
    expect(screen.getByRole('radio', { name: /^Difficulty \(Easy to Hard\)/ })).toBeChecked();
  });
});
