import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ColorPicker from './ColorPicker';

const ColorPickerHarness = ({ onChange = vi.fn() }: { onChange?: (color: string | undefined) => void }) => {
  const [value, setValue] = useState<string | undefined>();

  const handleChange = (color: string | undefined) => {
    setValue(color);
    onChange(color);
  };

  return <ColorPicker value={value} onChange={handleChange} />;
};

describe('ColorPicker', () => {
  it('selects and toggles a preset color', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<ColorPickerHarness onChange={onChange} />, {
      withAuthProvider: false,
    });
    const blue = screen.getByRole('button', { name: 'Select Blue color' });

    await user.click(blue);

    expect(onChange).toHaveBeenLastCalledWith('#3B82F6');
    expect(screen.getByText('#3B82F6')).toBeInTheDocument();
    expect(blue.querySelector('svg')).not.toBeNull();

    await user.click(blue);

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByText('#3B82F6')).not.toBeInTheDocument();
  });

  it('emits only complete custom hex colors and can clear the selection', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<ColorPickerHarness onChange={onChange} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: 'Custom color' }));
    const customInput = screen.getByPlaceholderText('#000000');
    await user.type(customInput, '#12AB34');

    expect(onChange).toHaveBeenLastCalledWith('#12AB34');
    expect(screen.getByText('#12AB34')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByText('#12AB34')).not.toBeInTheDocument();
  });
});
