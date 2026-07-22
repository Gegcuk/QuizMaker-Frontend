import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import TransactionPagination from './TransactionPagination';

const pagination = {
  pageNumber: 2,
  pageSize: 10,
  totalElements: 45,
  totalPages: 5,
};

describe('TransactionPagination', () => {
  it('does not render for an empty or single-page transaction list', () => {
    renderWithProviders(
      <TransactionPagination
        pagination={{ ...pagination, totalElements: 0, totalPages: 0 }}
        onPageChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('button', { name: 'Go to next page' })).not.toBeInTheDocument();
  });

  it('changes page through next, previous, and explicit page controls', async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <TransactionPagination pagination={pagination} onPageChange={onPageChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Go to previous page' }));
    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    await user.click(screen.getByRole('button', { name: 'Go to page 4' }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 1);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(3, 4);
  });

  it('locks boundary navigation and reports page-size changes', async () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { user } = renderWithProviders(
      <TransactionPagination
        pagination={{ ...pagination, pageNumber: 1 }}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '10' }));
    await user.click(screen.getByRole('button', { name: '20' }));

    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
