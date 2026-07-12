import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import CreateGroupModal from './CreateGroupModal';

vi.mock('./ColorPicker', () => ({
  default: ({ onChange }: { onChange: (color: string) => void }) => (
    <button type="button" onClick={() => onChange('#2563eb')}>Choose blue</button>
  ),
}));

vi.mock('./IconPicker', () => ({
  default: ({ onChange }: { onChange: (icon: string) => void }) => (
    <button type="button" onClick={() => onChange('book-open')}>Choose book icon</button>
  ),
}));

describe('CreateGroupModal', () => {
  it('validates the group name and submits trimmed group details', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const onCreate = vi.fn().mockResolvedValue('group-1');
    const { user } = renderWithProviders(
      <CreateGroupModal isOpen onClose={onClose} onCreate={onCreate} onSuccess={onSuccess} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('dialog', { name: 'Create New Group' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Group' })).toBeDisabled();

    await user.type(screen.getByLabelText(/Group Name/), '  Architecture  ');
    await user.type(screen.getByLabelText(/Description/), '  Engineering foundations  ');
    await user.click(screen.getByRole('button', { name: 'Choose blue' }));
    await user.click(screen.getByRole('button', { name: 'Choose book icon' }));
    await user.click(screen.getByRole('button', { name: 'Create Group' }));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        name: 'Architecture',
        description: 'Engineering foundations',
        color: '#2563eb',
        icon: 'book-open',
      });
    });
    expect(onSuccess).toHaveBeenCalledWith('group-1');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows a connection-specific error when group creation cannot reach the API', async () => {
    const onCreate = vi.fn().mockRejectedValue({ isAxiosError: true });
    const { user } = renderWithProviders(
      <CreateGroupModal isOpen onClose={vi.fn()} onCreate={onCreate} />,
      { withAuthProvider: false },
    );

    await user.type(screen.getByLabelText(/Group Name/), 'Architecture');
    await user.click(screen.getByRole('button', { name: 'Create Group' }));

    expect(await screen.findByText('Network error – check your connection')).toBeInTheDocument();
  });
});
