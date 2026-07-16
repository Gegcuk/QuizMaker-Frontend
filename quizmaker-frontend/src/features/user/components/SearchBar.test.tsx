import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import type { QuizDto } from '@/types';
import SearchBar from './SearchBar';

const searchMocks = vi.hoisted(() => ({
  getCategories: vi.fn(),
  getQuizzes: vi.fn(),
  getTags: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  categoryService: {
    getCategories: searchMocks.getCategories,
  },
  QuizService: class {
    getQuizzes = searchMocks.getQuizzes;
  },
  TagService: class {
    getTags = searchMocks.getTags;
  },
}));

const quiz = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'JavaScript Fundamentals',
  description: 'Language basics',
  categoryId: 'category-1',
  tagIds: ['tag-1'],
  difficulty: 'EASY',
  estimatedTime: 10,
} as unknown as QuizDto;

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    searchMocks.getCategories.mockResolvedValue({ content: [{ id: 'category-1', name: 'Programming' }] });
    searchMocks.getTags.mockResolvedValue({ content: [{ id: 'tag-1', name: 'JavaScript' }] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces a search, reports criteria, and renders mapped category and tag labels', async () => {
    const onSearch = vi.fn();
    const onSearchChange = vi.fn();
    searchMocks.getQuizzes.mockResolvedValue({
      content: [quiz],
      totalPages: 1,
      totalElements: 1,
    });
    renderWithProviders(
      <SearchBar onSearch={onSearch} onSearchChange={onSearchChange} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'JavaScript' },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchMocks.getQuizzes).toHaveBeenCalledWith(expect.objectContaining({
      search: 'JavaScript',
      page: 0,
      size: 12,
    }));
    expect(onSearchChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'JavaScript' }));
    expect(onSearch).toHaveBeenCalledWith([quiz]);
    expect(screen.getByText('JavaScript Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('');
    expect(screen.queryByText('JavaScript Fundamentals')).not.toBeInTheDocument();
  });

  it('shows the request failure after the debounced search runs', async () => {
    searchMocks.getQuizzes.mockRejectedValue(new Error('Search is unavailable'));
    renderWithProviders(<SearchBar />, { withAuthProvider: false });

    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'JavaScript' },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByText('Search is unavailable')).toBeInTheDocument();
  });
});
