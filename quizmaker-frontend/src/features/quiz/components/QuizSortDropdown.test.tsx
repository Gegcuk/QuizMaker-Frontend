import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import QuizSortDropdown, { type SortOption } from './QuizSortDropdown';

const QuizSortDropdownHarness = ({ onSortChange = vi.fn() }: { onSortChange?: (sort: SortOption) => void }) => {
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    onSortChange(sort);
  };

  return <QuizSortDropdown sortBy={sortBy} onSortChange={handleSortChange} />;
};

describe('QuizSortDropdown', () => {
  it('opens, selects a sort option, and closes the menu', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizSortDropdownHarness onSortChange={onSortChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Sort by: Recommended/ }));
    await user.click(screen.getByRole('button', { name: 'Newest First' }));

    expect(onSortChange).toHaveBeenCalledWith('newest');
    expect(screen.getByRole('button', { name: /Sort by: Newest First/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Oldest First' })).not.toBeInTheDocument();
  });

  it('closes when focus leaves the dropdown', async () => {
    const { user } = renderWithProviders(<QuizSortDropdownHarness />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: /Sort by: Recommended/ }));
    expect(screen.getByRole('button', { name: 'A-Z' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'A-Z' })).not.toBeInTheDocument();
  });
});
