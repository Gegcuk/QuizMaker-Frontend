import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ConfirmationModal from './ConfirmationModal';

const renderModal = ({
  isOpen = true,
  isLoading = false,
  onClose = vi.fn(),
  onConfirm = vi.fn(),
  variant = 'danger',
  message = 'This action cannot be undone.',
  cancelText = 'Cancel',
  confirmText = 'Delete Tag',
}: Partial<React.ComponentProps<typeof ConfirmationModal>> = {}) =>
  renderWithProviders(
    <ConfirmationModal
      isOpen={isOpen}
      isLoading={isLoading}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Tag"
      message={message}
      variant={variant}
      cancelText={cancelText}
      confirmText={confirmText}
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

  it.each(['danger', 'warning', 'info'] as const)('keeps safe-first keyboard order and description for %s confirmations', async (variant) => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    const cancelText = 'Stay here and continue editing this question';
    const confirmText = 'Leave this editor without saving my changes';
    const message = 'Your unsaved question and answers will be lost if you leave.';
    const { user } = renderModal({ variant, message, cancelText, confirmText, onClose, onConfirm });
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription(message);
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([cancelText, confirmText]);
    await waitFor(() => expect(buttons[0]).toHaveFocus());
    await user.tab();
    expect(buttons[1]).toHaveFocus();
    await user.tab();
    expect(buttons[0]).toHaveFocus();
    await user.tab({ shift: true });
    expect(buttons[1]).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onConfirm).toHaveBeenCalledOnce();
    await user.keyboard('{Escape}');
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
    await user.keyboard('{Escape}{Enter}');

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
