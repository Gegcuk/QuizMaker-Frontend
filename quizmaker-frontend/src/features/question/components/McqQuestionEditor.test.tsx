import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { McqMultiContent, McqSingleContent } from '@/types';
import McqQuestionEditor from './McqQuestionEditor';

const singleChoiceContent: McqSingleContent = {
  options: [
    { id: 'a', text: 'Store genetic information', correct: false },
    { id: 'b', text: 'Produce ATP', correct: true },
    { id: 'c', text: 'Transport proteins', correct: false },
    { id: 'd', text: 'Break down waste', correct: false },
  ],
};

const multiChoiceContent: McqMultiContent = {
  options: [
    { id: 'a', text: 'Has hair or fur', correct: true },
    { id: 'b', text: 'Produces milk', correct: true },
    { id: 'c', text: 'Is warm-blooded', correct: false },
    { id: 'd', text: 'Exclusively lays eggs', correct: false },
  ],
};

const fiveOptionMultiContent: McqMultiContent = {
  options: [
    ...multiChoiceContent.options,
    { id: 'e', text: 'Breathes with lungs', correct: false },
  ],
};

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as McqSingleContent | McqMultiContent | undefined;

describe('McqQuestionEditor', () => {
  it('loads saved single-choice options and emits the MCQ_SINGLE content shape', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <McqQuestionEditor content={singleChoiceContent} onChange={onChange} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Select the one correct answer')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Option text...')).toHaveLength(4);
    expect(screen.getByDisplayValue('Produce ATP')).toBeInTheDocument();
    expect(screen.getByLabelText('Mark option B as correct')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Add Option' })).toBeDisabled();
    screen.getAllByLabelText(/Remove option/).forEach((button) => {
      expect(button).toBeDisabled();
    });

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual(singleChoiceContent);
    });
  });

  it('keeps single-choice questions to exactly one selected correct answer', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <McqQuestionEditor content={singleChoiceContent} onChange={onChange} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Mark option C as correct'));

    expect(screen.getByLabelText('Mark option B as correct')).not.toBeChecked();
    expect(screen.getByLabelText('Mark option C as correct')).toBeChecked();
    await waitFor(() => {
      expect(getLastChange(onChange)?.options.map((option) => option.correct)).toEqual([
        false,
        false,
        true,
        false,
      ]);
    });
  });

  it('updates option text while preserving existing option ids and correctness', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <McqQuestionEditor content={singleChoiceContent} onChange={onChange} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getAllByPlaceholderText('Option text...')[0], {
      target: { value: 'Store DNA in the nucleus' },
    });

    await waitFor(() => {
      expect(getLastChange(onChange)?.options[0]).toEqual({
        id: 'a',
        text: 'Store DNA in the nucleus',
        correct: false,
      });
      expect(getLastChange(onChange)?.options[1]).toEqual(singleChoiceContent.options[1]);
    });
  });

  it('allows multi-choice questions to add up to six options and mark several correct', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <McqQuestionEditor
        content={multiChoiceContent}
        onChange={onChange}
        isMultiSelect
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Add Option' }));
    await user.click(screen.getByRole('button', { name: 'Add Option' }));

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Option text...')).toHaveLength(6);
    });
    expect(screen.getByRole('button', { name: 'Add Option' })).toBeDisabled();
    expect(getLastChange(onChange)?.options.map((option) => option.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);

    await user.click(screen.getByLabelText('Mark option C as correct'));

    await waitFor(() => {
      expect(getLastChange(onChange)?.options.slice(0, 3).map((option) => option.correct)).toEqual([
        true,
        true,
        true,
      ]);
    });
  });

  it('prevents multi-choice questions from dropping below four options', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <McqQuestionEditor
        content={fiveOptionMultiContent}
        onChange={onChange}
        isMultiSelect
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Remove option E'));

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Option text...')).toHaveLength(4);
    });
    expect(getLastChange(onChange)?.options.map((option) => option.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    screen.getAllByLabelText(/Remove option/).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('normalizes empty or oversized initial content to live schema option counts', async () => {
    const emptyOnChange = vi.fn();
    renderWithProviders(
      <McqQuestionEditor content={{ options: [] }} onChange={emptyOnChange} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByPlaceholderText('Option text...')).toHaveLength(4);
    await waitFor(() => {
      expect(getLastChange(emptyOnChange)?.options).toEqual([
        { id: 'a', text: '', correct: false },
        { id: 'b', text: '', correct: false },
        { id: 'c', text: '', correct: false },
        { id: 'd', text: '', correct: false },
      ]);
    });

    const oversizedOnChange = vi.fn();
    renderWithProviders(
      <McqQuestionEditor content={fiveOptionMultiContent} onChange={oversizedOnChange} />,
      { withAuthProvider: false },
    );

    expect(screen.queryByDisplayValue('Breathes with lungs')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(getLastChange(oversizedOnChange)?.options).toHaveLength(4);
    });
  });
});
