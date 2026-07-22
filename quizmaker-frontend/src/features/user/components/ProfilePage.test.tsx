import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ProfilePage from './ProfilePage';

vi.mock('./UserProfile', () => ({
  default: () => <div>User profile content</div>,
}));

vi.mock('@/features/billing/components/TokenTopUp', () => ({
  default: () => <div>Token top-up content</div>,
}));

describe('ProfilePage', () => {
  it('composes the account profile and token purchase controls', () => {
    renderWithProviders(<ProfilePage />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByText('User profile content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Purchase Tokens' })).toBeInTheDocument();
    expect(screen.getByText('Token top-up content')).toBeInTheDocument();
  });
});
