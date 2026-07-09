import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { OpenContent } from '@/types';
import OpenQuestionEditor from './OpenQuestionEditor';

const modelAnswer =
  'Cellular respiration breaks down glucose with oxygen to produce ATP, carbon dioxide, and water.';

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as OpenContent | undefined;

describe('OpenQuestionEditor', () => {
  it('loads a saved model answer and emits the OPEN content shape', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OpenQuestionEditor content={{ answer: modelAnswer }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByLabelText(/Model Answer/)).toHaveValue(modelAnswer);
    expect(screen.getByText(/Model Answer:/)).toHaveTextContent('Model Answer: Provided');

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({ answer: modelAnswer });
    });
    expect(getLastChange(onChange)).not.toHaveProperty('options');
    expect(getLastChange(onChange)).not.toHaveProperty('correct');
  });

  it('updates the model answer as the user types', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OpenQuestionEditor content={{ answer: modelAnswer }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByLabelText(/Model Answer/), {
      target: { value: 'A strong answer should mention ATP production.' },
    });

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        answer: 'A strong answer should mention ATP production.',
      });
    });
  });

  it('defaults empty editor content to an empty required model answer', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OpenQuestionEditor content={{} as OpenContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByLabelText(/Model Answer/)).toHaveValue('');
    expect(screen.getByText(/Model Answer:/)).toHaveTextContent('Model Answer: Not provided');
    expect(screen.getByText('Model answer required')).toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({ answer: '' });
    });
  });

  it('can hide or show the static learner preview', () => {
    const { rerender } = renderWithProviders(
      <OpenQuestionEditor content={{ answer: modelAnswer }} onChange={vi.fn()} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();

    rerender(<OpenQuestionEditor content={{ answer: modelAnswer }} onChange={vi.fn()} showPreview />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('How it will appear:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your answer here...')).toBeDisabled();
  });
});
