import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import MatchingQuestion from './MatchingQuestion';

const makeQuestion = (overrides: Partial<QuestionDto> = {}): QuestionDto => ({
  id: 'matching-question',
  type: 'MATCHING',
  difficulty: 'MEDIUM',
  questionText: 'Match each organelle with its primary function.',
  content: {
    left: [
      { id: 1, text: 'Mitochondria', matchId: 1 },
      { id: 2, text: 'Ribosome', matchId: 2 },
      { id: 3, text: 'Nucleus', matchId: 3 },
      { id: 4, text: 'Golgi apparatus', matchId: 4 },
    ],
    right: [
      { id: 1, text: 'Energy production' },
      { id: 2, text: 'Protein synthesis' },
      { id: 3, text: 'Genetic information storage' },
      { id: 4, text: 'Protein packaging' },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
  ...overrides,
});

describe('MatchingQuestion', () => {
  it('creates a match by selecting a left item and then a right item', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    const leftItem = screen.getByRole('button', { name: /Mitochondria/ });
    await user.click(leftItem);
    expect(leftItem).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Energy production/ }));

    expect(onAnswerChange).toHaveBeenLastCalledWith({ 1: 1 });
    expect(screen.getByText('Current Matches:')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByText('Matched')).toBeInTheDocument();
  });

  it('removes an existing match from either column', async () => {
    const onAnswerChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <MatchingQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 1 }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Energy production/ }));
    expect(onAnswerChange).toHaveBeenLastCalledWith({});

    rerender(
      <MatchingQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 1 }}
        onAnswerChange={onAnswerChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: /Mitochondria/ }));
    expect(onAnswerChange).toHaveBeenLastCalledWith({});
  });

  it('moves a right item to the newly selected left item', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingQuestion
        question={makeQuestion()}
        currentAnswer={{ 1: 1 }}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Ribosome/ }));
    await user.click(screen.getByRole('button', { name: /Energy production/ }));

    expect(onAnswerChange).toHaveBeenLastCalledWith({ 2: 1 });
  });

  it('does not change matches while disabled', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <MatchingQuestion
        question={makeQuestion()}
        onAnswerChange={onAnswerChange}
        disabled
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /Mitochondria/ }));
    await user.click(screen.getByRole('button', { name: /Energy production/ }));

    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('renders sanitized rich content and the correct answer pairs in review mode', () => {
    const { container } = renderWithProviders(
      <MatchingQuestion
        question={makeQuestion({
          content: {
            left: [
              { id: 1, text: '<strong>Mitochondria</strong><script>leftAttack()</script>', matchId: 1 },
              { id: 2, text: 'Ribosome', matchId: 2 },
              { id: 3, text: 'Nucleus', matchId: 3 },
              { id: 4, text: 'Golgi apparatus', matchId: 4 },
            ],
            right: [
              { id: 1, text: 'Energy <em>production</em><img src=x onerror="rightAttack()">' },
              { id: 2, text: 'Protein synthesis' },
              { id: 3, text: 'Genetic information storage' },
              { id: 4, text: 'Protein packaging' },
            ],
          },
        })}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByText('Mitochondria')[0].tagName).toBe('STRONG');
    expect(screen.getAllByText('production')[0].tagName).toBe('EM');
    expect(screen.getByText('Correct Answer:')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img[onerror]')).not.toBeInTheDocument();
  });
});
