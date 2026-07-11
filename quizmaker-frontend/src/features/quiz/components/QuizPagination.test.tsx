import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizPagination from './QuizPagination';

const pagination = {
  pageNumber: 2,
  pageSize: 10,
  totalElements: 100,
  totalPages: 10,
};

describe('QuizPagination', () => {
  it('does not render when pagination is unnecessary', () => {
    const { rerender } = renderWithProviders(
      <QuizPagination
        pagination={{ ...pagination, totalPages: 1 }}
        onPageChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('button', { name: 'Go to next page' })).not.toBeInTheDocument();

    rerender(
      <QuizPagination
        pagination={{ ...pagination, totalElements: 0 }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Go to previous page' })).not.toBeInTheDocument();
  });

  it('navigates pages and validates jump-to-page input', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizPagination pagination={pagination} onPageChange={onPageChange} />,
      { withAuthProvider: false },
    );

    expect(
      screen.getAllByText((_, element) => element?.textContent === 'Showing 11 to 20 of 100 results'),
    ).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveAttribute('aria-current', 'page');

    await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    await user.click(screen.getByRole('button', { name: 'Go to page 4' }));
    await user.clear(screen.getByLabelText('Jump to:'));
    await user.type(screen.getByLabelText('Jump to:'), '4');

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it('disables navigation at the first and final pages', () => {
    const { rerender } = renderWithProviders(
      <QuizPagination
        pagination={{ ...pagination, pageNumber: 1 }}
        onPageChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();

    rerender(
      <QuizPagination
        pagination={{ ...pagination, pageNumber: pagination.totalPages }}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Go to next page' })).toBeDisabled();
  });
});
