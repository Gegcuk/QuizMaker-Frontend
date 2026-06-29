import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionForAttemptDto } from '../types/attempt.types';
import HotspotAnswer from './HotspotAnswer';

const hotspotQuestion: QuestionForAttemptDto = {
  id: 'hotspot-question',
  type: 'HOTSPOT',
  difficulty: 'MEDIUM',
  questionText: 'Select the target region.',
  safeContent: {
    imageUrl: '',
    regions: [
      { id: 1, x: 5, y: 5, width: 30, height: 30 },
      { id: 2, x: 55, y: 55, width: 30, height: 30 },
    ],
  },
};

describe('HotspotAnswer', () => {
  it('uses theme feedback states and prevents changes after submission', async () => {
    const onAnswerChange = vi.fn();
    const { user } = renderWithProviders(
      <HotspotAnswer
        question={hotspotQuestion}
        currentAnswer={2}
        onAnswerChange={onAnswerChange}
        disabled
        showFeedback
        isCorrect={false}
        correctAnswer={{ regionId: 1 }}
      />,
      { withAuthProvider: false },
    );

    const correctRegion = screen.getByRole('button', { name: 'Select region 1' });
    const incorrectRegion = screen.getByRole('button', { name: 'Select region 2' });

    expect(correctRegion).toBeDisabled();
    expect(correctRegion).toHaveClass('border-theme-interactive-success');
    expect(correctRegion).toHaveClass('bg-theme-bg-success');
    expect(incorrectRegion).toBeDisabled();
    expect(incorrectRegion).toHaveClass('border-theme-interactive-danger');
    expect(incorrectRegion).toHaveClass('bg-theme-bg-danger');

    await user.click(correctRegion);

    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('renders an explicit empty state when no selectable regions exist', () => {
    renderWithProviders(
      <HotspotAnswer
        question={{ ...hotspotQuestion, safeContent: { imageUrl: '', regions: [] } }}
        onAnswerChange={vi.fn()}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('No regions available')).toBeInTheDocument();
  });
});
