import { describe, expect, it } from 'vitest';
import { ATTEMPT_ENDPOINTS } from './attempt.endpoints';

describe('ATTEMPT_ENDPOINTS', () => {
  it('matches the deployed attempt collection and quiz-scoped paths', () => {
    expect(ATTEMPT_ENDPOINTS.GET_ATTEMPTS).toBe('/v1/attempts');
    expect(ATTEMPT_ENDPOINTS.GET_ATTEMPTS_SUMMARY).toBe('/v1/attempts/summary');
    expect(ATTEMPT_ENDPOINTS.START_ATTEMPT('quiz-1')).toBe(
      '/v1/attempts/quizzes/quiz-1',
    );
    expect(ATTEMPT_ENDPOINTS.SHUFFLED_QUESTIONS('quiz-1')).toBe(
      '/v1/attempts/quizzes/quiz-1/questions/shuffled',
    );
  });

  it('builds every deployed attempt-scoped path', () => {
    expect(ATTEMPT_ENDPOINTS.GET_ATTEMPT('attempt-1')).toBe('/v1/attempts/attempt-1');
    expect(ATTEMPT_ENDPOINTS.SUBMIT_ANSWER('attempt-1')).toBe(
      '/v1/attempts/attempt-1/answers',
    );
    expect(ATTEMPT_ENDPOINTS.SUBMIT_BATCH_ANSWERS('attempt-1')).toBe(
      '/v1/attempts/attempt-1/answers/batch',
    );
    expect(ATTEMPT_ENDPOINTS.COMPLETE_ATTEMPT('attempt-1')).toBe(
      '/v1/attempts/attempt-1/complete',
    );
    expect(ATTEMPT_ENDPOINTS.GET_ATTEMPT_STATS('attempt-1')).toBe(
      '/v1/attempts/attempt-1/stats',
    );
    expect(ATTEMPT_ENDPOINTS.GET_ANSWER_KEY('attempt-1')).toBe(
      '/v1/attempts/attempt-1/answer-key',
    );
    expect(ATTEMPT_ENDPOINTS.GET_REVIEW('attempt-1')).toBe(
      '/v1/attempts/attempt-1/review',
    );
    expect(ATTEMPT_ENDPOINTS.CURRENT_QUESTION('attempt-1')).toBe(
      '/v1/attempts/attempt-1/current-question',
    );
    expect(ATTEMPT_ENDPOINTS.PAUSE_ATTEMPT('attempt-1')).toBe(
      '/v1/attempts/attempt-1/pause',
    );
    expect(ATTEMPT_ENDPOINTS.RESUME_ATTEMPT('attempt-1')).toBe(
      '/v1/attempts/attempt-1/resume',
    );
    expect(ATTEMPT_ENDPOINTS.DELETE_ATTEMPT('attempt-1')).toBe(
      '/v1/attempts/attempt-1',
    );
  });
});
