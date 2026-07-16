import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router-dom';
import { renderWithProviders, screen } from '@/test/render';
import BillingCancelPage from './BillingCancelPage';

const LocationProbe = () => <output data-testid="location">{useLocation().pathname}</output>;

describe('BillingCancelPage', () => {
  it('explains that checkout was canceled and returns users to billing', async () => {
    const { user } = renderWithProviders(
      <>
        <BillingCancelPage />
        <LocationProbe />
      </>,
      { route: '/billing/cancel', withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Checkout canceled' })).toBeInTheDocument();
    expect(screen.getByText('No charges were made. Start a new checkout to purchase tokens.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/billing');
  });
});
