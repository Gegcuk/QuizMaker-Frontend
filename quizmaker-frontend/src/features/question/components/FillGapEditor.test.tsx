import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { FillGapContent } from '@/types';
import FillGapEditor from './FillGapEditor';

const legacyContent: FillGapContent = {
  text: 'Cellular respiration produces {1}.',
  gaps: [{ id: 1, answer: 'ATP' }],
};

const dragOptionContent: FillGapContent = {
  text: 'Cellular respiration occurs in the {1} and produces {2}.',
  gaps: [
    { id: 1, answer: 'mitochondria' },
    { id: 2, answer: 'ATP' },
  ],
  options: [
    'chloroplast',
    'mitochondria',
    'nucleus',
    'ATP',
    'ribosome',
    'oxygen',
    'glucose',
    'NADH',
  ],
};

const extendedDragOptionContent: FillGapContent = {
  text: 'Cellular respiration produces {1}.',
  gaps: [{ id: 1, answer: 'ATP' }],
  options: [
    'ATP',
    'chloroplast',
    'ribosome',
    'nucleus',
    'oxygen',
    'glucose',
    'NADH',
    'cytoplasm',
    'cell wall',
    'lysosome',
  ],
};

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as FillGapContent | undefined;

describe('FillGapEditor', () => {
  it('preserves legacy typed-answer content when the answer pool is disabled', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor content={legacyContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(screen.getByRole('checkbox', { name: 'Answer pool' })).not.toBeChecked();
    expect(screen.getByText('Gap 1:')).toBeInTheDocument();
    expect(getLastChange(onChange)).toEqual(legacyContent);
    expect(getLastChange(onChange)).not.toHaveProperty('options');
  });

  it('splits randomized existing options into correct-answer chips and distractor inputs', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor content={dragOptionContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());

    expect(screen.getByRole('checkbox', { name: 'Answer pool' })).toBeChecked();
    expect(screen.getAllByText('mitochondria').length).toBeGreaterThan(1);
    expect(screen.getAllByText('ATP').length).toBeGreaterThan(1);
    expect(screen.getAllByPlaceholderText('Enter distractor...')).toHaveLength(6);
    expect(screen.getByDisplayValue('chloroplast')).toBeInTheDocument();
    expect(screen.getByDisplayValue('ribosome')).toBeInTheDocument();
    expect(screen.getByText('Pool total: 8 options. Ready for drag-option mode.')).toBeInTheDocument();

    const changedContent = getLastChange(onChange);
    expect(changedContent?.options).toHaveLength(8);
    expect(changedContent?.options).toEqual(
      expect.arrayContaining([
        'mitochondria',
        'ATP',
        'chloroplast',
        'nucleus',
        'ribosome',
        'oxygen',
        'glucose',
        'NADH',
      ]),
    );
  });

  it('builds schema-sized options from correct answers plus six unique distractors', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={{ text: '', gaps: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Add Gap' }));
    fireEvent.change(screen.getByPlaceholderText('Enter correct answer...'), {
      target: { value: 'ATP' },
    });

    await user.click(screen.getByRole('checkbox', { name: 'Answer pool' }));

    const distractors = screen.getAllByPlaceholderText('Enter distractor...');
    ['chloroplast', 'ribosome', 'nucleus', 'oxygen', 'glucose', 'NADH'].forEach((value, index) => {
      fireEvent.change(distractors[index], { target: { value } });
    });

    await waitFor(() => {
      expect(getLastChange(onChange)?.options).toEqual([
        'ATP',
        'chloroplast',
        'ribosome',
        'nucleus',
        'oxygen',
        'glucose',
        'NADH',
      ]);
    });

    expect(screen.getByText('Pool total: 7 options. Ready for drag-option mode.')).toBeInTheDocument();
  });

  it('warns when the answer pool does not have the backend-required distractor count', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={legacyContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('checkbox', { name: 'Answer pool' }));

    expect(screen.getAllByPlaceholderText('Enter distractor...')).toHaveLength(6);
    expect(screen.getByText(/Add 6 more unique options; this question needs at least 7 total/)).toBeInTheDocument();
  });

  it('preserves a valid ten-option pool with nine distractors', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor content={extendedDragOptionContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByPlaceholderText('Enter distractor...')).toHaveLength(9);
    expect(screen.getByText('Pool total: 10 options. Ready for drag-option mode.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Distractor' })).toBeDisabled();
    await waitFor(() => {
      expect(getLastChange(onChange)?.options).toEqual(extendedDragOptionContent.options);
    });
  });

  it('keeps duplicate values visible and reports how to fix them', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor
        content={{
          ...dragOptionContent,
          options: [...(dragOptionContent.options || []), ' CHLOROPLAST '],
        }}
        onChange={onChange}
        showPreview={false}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByDisplayValue(/chloroplast/i)).toHaveLength(2);
    expect(screen.getByText(/Remove duplicate options/)).toBeInTheDocument();
    await waitFor(() => {
      expect(getLastChange(onChange)?.options).toContain('chloroplast');
      expect(getLastChange(onChange)?.options).toContain('CHLOROPLAST');
    });
  });

  it('allows additional distractors until the pool reaches ten total options', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={legacyContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('checkbox', { name: 'Answer pool' }));
    const initialDistractors = screen.getAllByPlaceholderText('Enter distractor...');
    ['one', 'two', 'three', 'four', 'five', 'six'].forEach((value, index) => {
      fireEvent.change(initialDistractors[index], { target: { value } });
    });

    await user.click(screen.getByRole('button', { name: 'Add Distractor' }));
    await user.click(screen.getByRole('button', { name: 'Add Distractor' }));
    await user.click(screen.getByRole('button', { name: 'Add Distractor' }));
    const allDistractors = screen.getAllByPlaceholderText('Enter distractor...');
    ['seven', 'eight', 'nine'].forEach((value, index) => {
      fireEvent.change(allDistractors[index + 6], { target: { value } });
    });

    await waitFor(() => {
      expect(getLastChange(onChange)?.options).toHaveLength(10);
      expect(screen.getByText('Pool total: 10 options. Ready for drag-option mode.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Add Distractor' })).toBeDisabled();
  });

  it('removes options from emitted content when answer pool is disabled', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={dragOptionContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('checkbox', { name: 'Answer pool' }));

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        text: dragOptionContent.text,
        gaps: dragOptionContent.gaps,
      });
    });
    expect(getLastChange(onChange)).not.toHaveProperty('options');
  });

  it('creates gap answer rows when markers are typed manually', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor content={{ text: '', gaps: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'Cellular respiration produces {1}.' },
    });

    expect(screen.getByText('Gap Answers')).toBeInTheDocument();
    expect(screen.getByText('Gap 1:')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter correct answer...')).toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        text: 'Cellular respiration produces {1}.',
        gaps: [{ id: 1, answer: '' }],
      });
    });
  });

  it('removes stale gap rows when markers are deleted from the text', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <FillGapEditor content={legacyContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'Cellular respiration produces ATP.' },
    });

    expect(screen.queryByText('Gap Answers')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        text: 'Cellular respiration produces ATP.',
        gaps: [],
      });
    });
  });

  it('preserves typed-marker answers when Add Gap inserts the next available marker', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={{ text: '', gaps: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getByLabelText(/Question Text/), {
      target: { value: 'Cellular respiration produces {1}.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter correct answer...'), {
      target: { value: 'ATP' },
    });

    await user.click(screen.getByRole('button', { name: 'Add Gap' }));

    const answerInputs = screen.getAllByPlaceholderText('Enter correct answer...');
    expect(answerInputs).toHaveLength(2);
    expect(answerInputs[0]).toHaveValue('ATP');
    expect(screen.getByLabelText(/Question Text/)).toHaveValue('Cellular respiration produces {1}.{2}');

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        text: 'Cellular respiration produces {1}.{2}',
        gaps: [
          { id: 1, answer: 'ATP' },
          { id: 2, answer: '' },
        ],
      });
    });
  });

  it('removes a marker from the text when its gap row is removed', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <FillGapEditor content={dragOptionContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Remove gap 1'));

    expect(screen.getByLabelText(/Question Text/)).toHaveValue(
      'Cellular respiration occurs in the  and produces {2}.',
    );
    expect(screen.queryByText('Gap 1:')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)?.gaps).toEqual([{ id: 2, answer: 'ATP' }]);
      expect(getLastChange(onChange)?.text).not.toContain('{1}');
    });
  });
});
