import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ConfirmationModal from './ConfirmationModal';

const renderModal = ({
  isOpen = true,
  isLoading = false,
  onClose = vi.fn(),
  onConfirm = vi.fn(),
} = {}) =>
  renderWithProviders(
    <ConfirmationModal
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Tag"
      message="This action cannot be undone."
      confirmText="Delete Tag"
    />,
    { withAuthProvider: false },
  );

describe('ConfirmationModal', () => {
  it('does not render while closed', () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its panel above the backdrop and runs confirm and cancel actions', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { user } = renderModal({ onClose, onConfirm });

    const dialog = screen.getByRole('dialog', { name: 'Delete Tag' });
    expect(dialog).toHaveClass('relative', 'z-10');
    expect(screen.getByTestId('confirmation-modal-backdrop')).toHaveClass('z-0');

    await user.click(screen.getByRole('button', { name: 'Delete Tag' }));
    expect(onConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from the backdrop when idle', async () => {
    const onClose = vi.fn();
    const { user } = renderModal({ onClose });

    await user.click(screen.getByTestId('confirmation-modal-backdrop'));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('blocks duplicate actions and backdrop dismissal while loading', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const { user } = renderModal({ isLoading: true, onClose, onConfirm });

    expect(
      screen.getByRole('button', { name: 'Loading Delete Tag' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await user.click(screen.getByTestId('confirmation-modal-backdrop'));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
