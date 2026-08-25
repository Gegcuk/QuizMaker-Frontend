import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Dropdown, { type DropdownOption } from './Dropdown';

const options: DropdownOption[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta', disabled: true },
  { value: 'gamma', label: 'Gamma' },
  { value: 'delta', label: 'Delta' },
];

const MultipleDropdownHarness = ({ onChange }: { onChange: (value: string[]) => void }) => {
  const [value, setValue] = useState<string[]>(['alpha']);

  return (
    <Dropdown
      label="Topics"
      options={options}
      value={value}
      multiple
      placement="top"
      onChange={(nextValue) => {
        const nextValues = nextValue as string[];
        setValue(nextValues);
        onChange(nextValues);
      }}
    />
  );
};

describe('Dropdown', () => {
  it('uses the labelled themed control for simple single-choice fields', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Dropdown
        id="difficulty"
        name="difficulty"
        label="Difficulty"
        helperText="Choose the expected challenge level."
        error="Difficulty is required."
        placeholder="Select difficulty"
        options={options}
        required
        onChange={onChange}
      />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Difficulty' });
    expect(combobox.tagName).toBe('BUTTON');
    expect(combobox).toHaveClass('bg-theme-bg-primary', 'text-theme-text-primary');
    expect(combobox).toHaveAttribute('aria-required', 'true');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription(
      'Choose the expected challenge level. Difficulty is required.',
    );
    expect(combobox.querySelectorAll('svg')).toHaveLength(0);
    expect(combobox.parentElement?.querySelectorAll('svg')).toHaveLength(1);

    await user.click(combobox);
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(onChange).toHaveBeenCalledWith('gamma');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveFocus();
  });

  it('preserves an empty value when it represents a real filter option', async () => {
    const { user } = renderWithProviders(
      <Dropdown
        ariaLabel="Difficulty filter"
        value=""
        options={[
          { value: '', label: 'All difficulties' },
          { value: 'easy', label: 'Easy' },
        ]}
        onChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Difficulty filter' });
    expect(combobox).toHaveTextContent('All difficulties');
    await user.click(combobox);
    expect(screen.getByRole('option', { name: 'All difficulties' })).toBeEnabled();
    expect(screen.queryByRole('option', { name: 'Select an option' })).not.toBeInTheDocument();
  });

  it('exposes searchable combobox state and selects with the keyboard', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Dropdown
        label="Topic"
        helperText="Search by topic name."
        error="Choose an available topic."
        options={options}
        value="alpha"
        searchable
        required
        onChange={onChange}
      />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Topic' });
    expect(combobox.tagName).toBe('INPUT');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-required', 'true');
    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox).toHaveAccessibleDescription(
      'Search by topic name. Choose an available topic.',
    );

    await user.click(combobox);

    const listbox = screen.getByRole('listbox', { name: 'Topic' });
    const alpha = screen.getByRole('option', { name: 'Alpha' });
    const beta = screen.getByRole('option', { name: 'Beta' });
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
    expect(combobox).toHaveAttribute('aria-activedescendant', alpha.id);
    expect(alpha).toHaveAttribute('aria-selected', 'true');
    expect(beta).toHaveAttribute('aria-disabled', 'true');

    await user.keyboard('{ArrowDown}');
    const gamma = screen.getByRole('option', { name: 'Gamma' });
    expect(combobox).toHaveAttribute('aria-activedescendant', gamma.id);

    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('gamma');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveFocus();
  });

  it('filters searchable options and reports an empty result', async () => {
    const { user } = renderWithProviders(
      <Dropdown
        label="Topic"
        options={options}
        searchable
        onChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Topic' });
    await user.click(combobox);
    await user.type(combobox, 'gam');

    expect(screen.getByRole('option', { name: 'Gamma' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();

    await user.clear(combobox);
    await user.type(combobox, 'unknown');
    expect(screen.getByRole('status')).toHaveTextContent('No options found');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();
  });

  it('supports multiple selection, boundaries, typeahead, and disabled options', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <MultipleDropdownHarness onChange={onChange} />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Topics' });
    await user.click(combobox);

    const listbox = screen.getByRole('listbox', { name: 'Topics' });
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true');
    expect(listbox).toHaveClass('bottom-full');

    const beta = screen.getByRole('option', { name: 'Beta' });
    await user.click(beta);
    expect(onChange).not.toHaveBeenCalled();

    await user.keyboard('{End}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'delta']);
    expect(screen.getByRole('option', { name: 'Delta' })).toHaveAttribute('aria-selected', 'true');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('g{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['alpha', 'delta', 'gamma']);

    await user.keyboard('{Home} ');
    expect(onChange).toHaveBeenLastCalledWith(['delta', 'gamma']);
  });

  it('closes on Escape, outside click, and Tab without losing predictable focus', async () => {
    const { user } = renderWithProviders(
      <div>
        <Dropdown label="Topics" options={options} multiple onChange={vi.fn()} />
        <button type="button">Next field</button>
      </div>,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Topics' });
    await user.click(combobox);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(combobox).toHaveFocus();

    await user.click(combobox);
    await user.click(combobox);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(combobox);
    await user.click(screen.getByRole('button', { name: 'Next field' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(combobox);
    await user.tab();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next field' })).toHaveFocus();
  });

  it('does not open the custom listbox while disabled', async () => {
    const { user } = renderWithProviders(
      <Dropdown
        label="Topics"
        options={options}
        multiple
        disabled
        onChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    const combobox = screen.getByRole('combobox', { name: 'Topics' });
    expect(combobox).toBeDisabled();
    await user.click(combobox);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
