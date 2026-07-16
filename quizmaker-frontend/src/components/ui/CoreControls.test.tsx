import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Alert from './Alert';
import Badge from './Badge';
import Button from './Button';
import Checkbox from './Checkbox';
import Dropdown from './Dropdown';
import Input from './Input';
import Pagination from './Pagination';
import Radio from './Radio';
import Spinner from './Spinner';
import Switch from './Switch';
import Textarea from './Textarea';

describe('shared core controls', () => {
  it('invokes enabled buttons and disables them while loading', async () => {
    const onClick = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Button onClick={onClick} leftIcon={<span>Save icon</span>}>
        Save changes
      </Button>,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Save icon\s*Save changes/ }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(
      <Button loading leftIcon={<span>Save icon</span>}>
        Save changes
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Loading Save changes' });
    expect(button).toBeDisabled();
    expect(screen.queryByText('Save icon')).not.toBeInTheDocument();
  });

  it('connects input labels, values, error text, and disabled state', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Input label="Quiz title" helperText="Choose a clear title" onChange={onChange} />,
      { withAuthProvider: false },
    );

    const input = screen.getByRole('textbox', { name: 'Quiz title' });
    await user.type(input, 'Architecture');
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText('Choose a clear title')).toBeInTheDocument();

    rerender(<Input label="Quiz title" error="A title is required" disabled />);
    expect(screen.getByRole('textbox', { name: 'Quiz title' })).toBeDisabled();
    expect(screen.getByText('A title is required')).toBeInTheDocument();
  });

  it('updates textarea content and exposes its validation state', async () => {
    const TextareaHarness = () => {
      const [value, setValue] = useState('');
      return (
        <Textarea
          label="Description"
          value={value}
          maxLength={20}
          showCharCount
          onChange={(event) => setValue(event.target.value)}
        />
      );
    };
    const { user, rerender } = renderWithProviders(<TextareaHarness />, { withAuthProvider: false });

    await user.type(screen.getByRole('textbox', { name: 'Description' }), 'Clear scope');
    expect(screen.getByText('11/20')).toBeInTheDocument();

    rerender(<Textarea label="Description" error="Description is required" />);
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });

  it('reports checkbox changes and prevents disabled changes', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Checkbox id="published" label="Published" checked={false} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('checkbox', { name: 'Published' }));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());

    rerender(<Checkbox id="published" label="Published" checked={false} disabled onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Published' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('reports radio values and exposes validation state', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Radio id="private" name="visibility" value="PRIVATE" label="Private" checked={false} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('radio', { name: 'Private' }));
    expect(onChange).toHaveBeenCalledWith('PRIVATE');

    rerender(
      <Radio
        id="private"
        name="visibility"
        value="PRIVATE"
        label="Private"
        checked={false}
        error="Select a visibility"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radio', { name: 'Private' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('reports switch changes and respects disabled state', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Switch label="Enable timer" checked={false} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('checkbox', { name: 'Enable timer' }));
    expect(onChange).toHaveBeenCalledWith(true);

    rerender(<Switch label="Enable timer" checked={false} disabled onChange={onChange} />);
    await user.click(screen.getByRole('checkbox', { name: 'Enable timer' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('selects dropdown options and does not open disabled dropdowns', async () => {
    const onChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Dropdown
        label="Difficulty"
        placeholder="Select difficulty"
        options={[
          { value: 'EASY', label: 'Easy' },
          { value: 'MEDIUM', label: 'Medium' },
        ]}
        onChange={onChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Select difficulty' }));
    await user.click(screen.getByRole('button', { name: 'Medium' }));
    expect(onChange).toHaveBeenCalledWith('MEDIUM');

    rerender(
      <Dropdown
        placeholder="Select difficulty"
        options={[{ value: 'EASY', label: 'Easy' }]}
        disabled
        onChange={onChange}
      />,
    );
    const button = screen.getByRole('button', { name: 'Select difficulty' });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(screen.queryByRole('button', { name: 'Easy' })).not.toBeInTheDocument();
  });

  it('navigates pagination, ignores the current page, and hides a single-page control', async () => {
    const onPageChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Pagination currentPage={2} totalPages={4} onPageChange={onPageChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Go to next page' }));
    await user.click(screen.getByRole('button', { name: 'Go to page 1' }));
    await user.click(screen.getByRole('button', { name: 'Go to page 2' }));
    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
    expect(onPageChange).toHaveBeenCalledTimes(2);

    rerender(<Pagination currentPage={1} totalPages={1} onPageChange={onPageChange} />);
    expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
  });

  it('removes badges without bubbling the interaction to a parent', async () => {
    const onRemove = vi.fn();
    const onParentClick = vi.fn();
    const { user } = renderWithProviders(
      <div onClick={onParentClick}>
        <Badge removable onRemove={onRemove}>Architecture</Badge>
      </div>,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Remove badge' }));
    expect(onRemove).toHaveBeenCalledOnce();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('dismisses alerts and exposes accessible loading status', async () => {
    const onDismiss = vi.fn();
    const { user } = renderWithProviders(
      <>
        <Alert type="warning" dismissible onDismiss={onDismiss} autoDismissOnInput={false}>
          Review required
        </Alert>
        <Spinner size="lg" />
      </>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('status', { name: 'Loading' })).toHaveClass('w-12', 'h-12');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.queryByText('Review required')).not.toBeInTheDocument();
  });
});
