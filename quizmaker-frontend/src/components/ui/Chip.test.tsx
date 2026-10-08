import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Chip, { type ChipProps } from './Chip';

const ToggleChip = ({ variant }: Pick<ChipProps, 'variant'>) => {
  const [selected, setSelected] = useState(true);
  return <Chip label="Quiz filter" variant={variant} selected={selected} onClick={() => setSelected(previous => !previous)} />;
};

describe('filter chips', () => {
  it.each(['default', 'primary', 'success', 'warning', 'danger'] as const)('exposes %s selection and supports keyboard toggling', async variant => {
    const { user } = renderWithProviders(<ToggleChip variant={variant} />, { withAuthProvider: false });
    const chip = screen.getByRole('button', { name: 'Quiz filter', pressed: true });
    await user.tab();
    expect(chip).toHaveFocus();
    await user.keyboard(' ');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
    await user.keyboard('{Enter}');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps a disabled selected filter selected and prevents activation', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Chip label="Completed" selected disabled onClick={onClick} />, { withAuthProvider: false });
    const chip = screen.getByRole('button', { name: 'Completed', pressed: true });
    expect(chip).toBeDisabled();
    await user.click(chip);
    expect(onClick).not.toHaveBeenCalled();
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
});
