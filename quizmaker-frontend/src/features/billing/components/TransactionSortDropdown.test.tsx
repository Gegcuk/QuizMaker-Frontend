import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import TransactionSortDropdown from './TransactionSortDropdown';

describe('TransactionSortDropdown', () => {
  it('shows the current sort and reports a new option before closing', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(
      <TransactionSortDropdown sortBy="newest" onSortChange={onSortChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Sort by: Newest First/ }));
    await user.click(screen.getByRole('button', { name: 'Highest Amount' }));

    expect(onSortChange).toHaveBeenCalledWith('amount_desc');
    expect(screen.queryByRole('button', { name: 'Lowest Amount' })).not.toBeInTheDocument();
  });

  it('closes when clicking outside without changing sort', async () => {
    const onSortChange = vi.fn();
    const { user } = renderWithProviders(
      <>
        <TransactionSortDropdown sortBy="oldest" onSortChange={onSortChange} />
        <button type="button">Outside</button>
      </>,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Sort by: Oldest First/ }));
    expect(screen.getByRole('button', { name: 'Lowest Amount' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('button', { name: 'Lowest Amount' })).not.toBeInTheDocument();
    expect(onSortChange).not.toHaveBeenCalled();
  });
});
