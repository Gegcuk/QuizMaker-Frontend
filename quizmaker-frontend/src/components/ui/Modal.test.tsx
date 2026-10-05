import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Modal from './Modal';

const NestedEditor = () => {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return <>
    <button onClick={() => setEditing(true)}>Open editor</button>
    <Modal isOpen={editing} onClose={() => setConfirming(true)} title="Question editor">
      <label>Question input<input defaultValue="Unsaved question" /></label>
    </Modal>
    <ConfirmationModal isOpen={confirming} onClose={() => setConfirming(false)}
      onConfirm={() => { setConfirming(false); setEditing(false); }}
      title="Leave without saving?" message="Unsaved input will be lost."
      cancelText="Stay" confirmText="Leave" />
  </>;
};

describe('nested authoring confirmation', () => {
  it('keeps focus and Escape in the top dialog, returns focus on Stay, and unlocks scrolling on Leave', async () => {
    const { user } = renderWithProviders(<NestedEditor />, { withAuthProvider: false });
    const open = screen.getByRole('button', { name: 'Open editor' });
    await user.click(open);
    const input = screen.getByLabelText('Question input');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Leave without saving?' })).toHaveAccessibleDescription('Unsaved input will be lost.');
    expect(screen.queryByRole('dialog', { name: 'Question editor' })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus());
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'Question editor' })).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(open).toHaveFocus();
  });
});
