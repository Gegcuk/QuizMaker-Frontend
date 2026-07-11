import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import IconPicker from './IconPicker';

const IconPickerHarness = ({ onChange = vi.fn() }: { onChange?: (icon: string | undefined) => void }) => {
  const [value, setValue] = useState<string | undefined>();

  const handleChange = (icon: string | undefined) => {
    setValue(icon);
    onChange(icon);
  };

  return <IconPicker value={value} onChange={handleChange} />;
};

describe('IconPicker', () => {
  it('switches categories and toggles the selected icon', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<IconPickerHarness onChange={onChange} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByTitle('Organizational'));
    const folder = screen.getByRole('button', { name: 'Select Organizational icon 📁' });
    await user.click(folder);

    expect(onChange).toHaveBeenLastCalledWith('📁');
    expect(folder).toHaveClass('border-theme-interactive-primary');

    await user.click(folder);

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(folder).toHaveClass('border-transparent');
  });

  it('shows the combined icon collection when requested', async () => {
    const { user } = renderWithProviders(<IconPickerHarness />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'All' }));

    expect(screen.getAllByRole('button', { name: 'Select 📝 icon' }).length).toBeGreaterThan(1);
  });
});
