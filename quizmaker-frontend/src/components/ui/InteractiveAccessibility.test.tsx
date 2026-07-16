import { useState } from 'react';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import Card from './Card';
import FileUpload from './FileUpload';
import Modal from './Modal';
import Rating from './Rating';
import Table from './Table';

const ModalHarness = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>Open confirmation</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm changes">
        <button type="button">Keep editing</button>
        <button type="button">Discard changes</button>
      </Modal>
    </>
  );
};

describe('shared interactive accessibility', () => {
  it('makes clickable cards keyboard-operable without making static cards focusable', async () => {
    const onClick = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Card onClick={onClick}>Open architecture quiz</Card>,
      { withAuthProvider: false },
    );
    const card = screen.getByRole('button', { name: 'Open architecture quiz' });

    await user.tab();
    expect(card).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);

    rerender(<Card>Static architecture quiz</Card>);
    expect(screen.queryByRole('button', { name: 'Static architecture quiz' })).not.toBeInTheDocument();
  });

  it('uses keyboard-accessible radio controls for editable ratings only', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Rating value={2} onChange={onChange} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('radiogroup', { name: 'Rating: Fair' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Set rating to 2 out of 5' })).toHaveAttribute('aria-checked', 'true');

    const thirdRating = screen.getByRole('radio', { name: 'Set rating to 3 out of 5' });
    thirdRating.focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(3);

    rerender(<Rating value={2} onChange={onChange} readOnly />);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Rating: Fair' })).toBeInTheDocument();
  });

  it('keeps file uploads keyboard-accessible and names file-removal controls', async () => {
    const onFileSelect = vi.fn();
    const { user, rerender } = renderWithProviders(
      <FileUpload onFileSelect={onFileSelect} accept=".pdf" showPreview />,
      { withAuthProvider: false },
    );
    const input = screen.getByLabelText(/Choose files/);
    const file = new File(['quiz'], 'architecture.pdf', { type: 'application/pdf' });

    await user.tab();
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledWith([file]);

    await user.click(screen.getByRole('button', { name: 'Remove architecture.pdf' }));
    expect(onFileSelect).toHaveBeenLastCalledWith([]);

    rerender(<FileUpload onFileSelect={onFileSelect} disabled />);
    const disabledInput = screen.getByLabelText(/Choose files/);
    expect(disabledInput).toBeDisabled();
    fireEvent.change(disabledInput, { target: { files: [file] } });
    expect(onFileSelect).toHaveBeenCalledTimes(2);
  });

  it('uses keyboard controls for sorting, selecting, and opening table rows', async () => {
    const onSelectionChange = vi.fn();
    const onRowClick = vi.fn();
    const { user } = renderWithProviders(
      <Table
        data={[{ id: 'architecture', title: 'Architecture' }, { id: 'security', title: 'Security' }]}
        columns={[{ key: 'title', header: 'Title', sortable: true }]}
        sortable
        selectable
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
        rowLabel={(row) => row.title}
      />,
      { withAuthProvider: false },
    );

    const sortButton = screen.getByRole('button', { name: 'Title' });
    sortButton.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('columnheader', { name: 'Title' })).toHaveAttribute('aria-sort', 'ascending');

    const architectureRow = screen.getAllByRole('row').find((row) => row.textContent?.includes('Architecture'))!;
    architectureRow.focus();
    await user.keyboard(' ');
    expect(onRowClick).toHaveBeenCalledWith({ id: 'architecture', title: 'Architecture' }, 0);

    await user.click(screen.getByRole('checkbox', { name: 'Select Architecture' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['architecture']);
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
  });

  it('moves focus into modals, traps Tab navigation, and restores the trigger focus', async () => {
    const { user } = renderWithProviders(<ModalHarness />, { withAuthProvider: false });
    const trigger = screen.getByRole('button', { name: 'Open confirmation' });

    await user.click(trigger);
    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(screen.getByRole('button', { name: 'Discard changes' })).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(closeButton).toHaveFocus();

    await user.click(closeButton);
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
