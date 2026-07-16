import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import SettingsPage from './SettingsPage';

vi.mock('./UserSettings', () => ({
  default: () => <div>User settings content</div>,
}));

describe('SettingsPage', () => {
  it('composes the account settings surface inside the page layout', () => {
    renderWithProviders(<SettingsPage />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'Account Settings' })).toBeInTheDocument();
    expect(screen.getByText('User settings content')).toBeInTheDocument();
  });
});
