import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreateQuizRequest } from '@/types';
import QuizPreview from './QuizPreview';

describe('QuizPreview', () => {
  it('shows the empty state until a quiz title is available', () => {
    renderWithProviders(<QuizPreview quizData={{}} />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'No quiz data' })).toBeInTheDocument();
    expect(screen.getByText('Start by adding a title and description to see the preview')).toBeInTheDocument();
  });

  it('summarises quiz settings and alerts on a missing timer duration', () => {
    const quizData: Partial<CreateQuizRequest> = {
      title: 'Architecture Leadership',
      description: 'A quiz about leading architecture teams.',
      visibility: 'PUBLIC',
      difficulty: 'HARD',
      estimatedTime: 90,
      timerEnabled: true,
      isRepetitionEnabled: true,
    };

    renderWithProviders(<QuizPreview quizData={quizData} />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'Architecture Leadership' })).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
    expect(screen.getByText('Allowed')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    expect(screen.getByText('Timer is enabled but no duration is set. Please set a timer duration.')).toBeInTheDocument();
  });
});
