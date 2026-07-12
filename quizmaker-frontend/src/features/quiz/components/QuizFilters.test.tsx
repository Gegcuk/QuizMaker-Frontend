import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuizSearchCriteria } from '@/types';
import QuizFilters from './QuizFilters';

const mocks = vi.hoisted(() => ({
  useQuizMetadata: vi.fn(),
}));

vi.mock('@/features/quiz/hooks/useQuizMetadataQueries', () => ({
  useQuizMetadata: mocks.useQuizMetadata,
}));

const FiltersHarness = ({ onClearFilters = vi.fn() }: { onClearFilters?: () => void }) => {
  const [filters, setFilters] = useState<QuizSearchCriteria>({});

  return (
    <QuizFilters
      filters={filters}
      onFiltersChange={setFilters}
      onClearFilters={onClearFilters}
    />
  );
};

describe('QuizFilters', () => {
  beforeEach(() => {
    mocks.useQuizMetadata.mockReturnValue({
      categories: [{ id: 'category-1', name: 'Architecture' }],
      tags: [{ id: 'tag-1', name: 'frontend' }],
      isLoading: false,
      error: null,
    });
  });

  it('updates search and advanced category and tag filters', async () => {
    const { user } = renderWithProviders(<FiltersHarness />, { withAuthProvider: false });

    await user.type(screen.getByLabelText('Search'), 'architecture');
    await user.click(screen.getByRole('button', { name: 'Show Advanced' }));
    await user.click(screen.getByRole('checkbox', { name: 'Architecture' }));
    await user.click(screen.getByRole('checkbox', { name: '#frontend' }));

    expect(screen.getByText('Search: "architecture"')).toBeInTheDocument();
    expect(screen.getByText('Categories: 1')).toBeInTheDocument();
    expect(screen.getByText('Tags: 1')).toBeInTheDocument();
  });

  it('clears active filters through the summary action', async () => {
    const onClearFilters = vi.fn();
    const { user } = renderWithProviders(<FiltersHarness onClearFilters={onClearFilters} />, {
      withAuthProvider: false,
    });

    await user.type(screen.getByLabelText('Search'), 'architecture');
    await user.click(screen.getAllByRole('button', { name: 'Clear All' })[0]);

    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
