import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { TrueFalseContent } from '@/types';
import TrueFalseEditor from './TrueFalseEditor';

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as TrueFalseContent | undefined;

describe('TrueFalseEditor', () => {
  it('loads a saved false answer as the active radio option', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <TrueFalseEditor content={{ answer: false }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('radio', { name: 'True' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'False' })).toBeChecked();
    expect(screen.getByText(/Correct Answer:/)).toHaveTextContent('Correct Answer: False');

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({ answer: false });
    });
  });

  it('emits the backend TRUE_FALSE content shape when the answer changes', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <TrueFalseEditor content={{ answer: false }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('radio', { name: 'True' }));

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({ answer: true });
    });
    expect(getLastChange(onChange)).not.toHaveProperty('options');
    expect(getLastChange(onChange)).not.toHaveProperty('correct');
  });

  it('defaults empty editor content to true for new questions', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <TrueFalseEditor content={{} as TrueFalseContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('radio', { name: 'True' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'False' })).not.toBeChecked();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({ answer: true });
    });
  });

  it('can hide or show the static preview section', () => {
    const { rerender } = renderWithProviders(
      <TrueFalseEditor content={{ answer: true }} onChange={vi.fn()} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();

    rerender(<TrueFalseEditor content={{ answer: true }} onChange={vi.fn()} showPreview />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('How it will appear:')).toBeInTheDocument();
  });
});
