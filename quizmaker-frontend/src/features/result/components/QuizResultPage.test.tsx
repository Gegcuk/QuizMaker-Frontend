import { Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuizResultPage from './QuizResultPage';

const resultMocks = vi.hoisted(() => ({
  getAttemptReview: vi.fn(),
  getAsset: vi.fn(),
}));

vi.mock('@/services', () => ({
  api: {},
  AttemptService: class {
    getAttemptReview = resultMocks.getAttemptReview;
  },
}));

vi.mock('@/features/media', () => ({
  mediaService: {
    getAsset: resultMocks.getAsset,
  },
}));

const renderPage = (route: string) => renderWithProviders(
  <Routes>
    <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />
  </Routes>,
  { route, withAuthProvider: false },
);

describe('QuizResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('explains when the route omits an attempt id without calling the review API', () => {
    renderPage('/quizzes/quiz-1/results');

    expect(screen.getByText('No attempt ID provided.')).toBeInTheDocument();
    expect(resultMocks.getAttemptReview).not.toHaveBeenCalled();
  });

  it('renders the backend review failure from the attempt route', async () => {
    resultMocks.getAttemptReview.mockRejectedValue({ response: { data: { error: 'Review unavailable' } } });

    renderPage('/quizzes/quiz-1/results?attemptId=attempt-1');

    expect(await screen.findByText('Review unavailable')).toBeInTheDocument();
    expect(resultMocks.getAttemptReview).toHaveBeenCalledWith('attempt-1', {
      includeUserAnswers: true,
      includeCorrectAnswers: true,
      includeQuestionContext: true,
    });
  });
});
