import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import InsufficientBalanceModal from './InsufficientBalanceModal';

const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;

describe('InsufficientBalanceModal', () => {
  it('stays out of the document while closed', () => {
    renderWithProviders(
      <InsufficientBalanceModal isOpen={false} onClose={vi.fn()} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows token details and supports dismissal', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <InsufficientBalanceModal
        isOpen
        onClose={onClose}
        requiredTokens={100}
        currentBalance={40}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('dialog', { name: 'Insufficient Balance' })).toBeInTheDocument();
    expect(screen.getByText('Required:')).toBeInTheDocument();
    expect(screen.getByText('100 tokens')).toBeInTheDocument();
    expect(screen.getByText('40 tokens')).toBeInTheDocument();
    expect(screen.getByText('60 more tokens')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes and navigates to billing when the user chooses to top up', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <>
        <LocationProbe />
        <InsufficientBalanceModal isOpen onClose={onClose} />
      </>,
      { route: '/quizzes', withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Top Up Tokens' }));

    expect(onClose).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/billing'));
  });
});
