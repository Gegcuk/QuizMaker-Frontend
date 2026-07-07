import { describe, expect, it } from 'vitest';
import { QUIZ_ENDPOINTS, RESULT_ENDPOINTS } from '@/api/endpoints';

describe('quiz API endpoints', () => {
  it('matches deployed quiz collection, generation, and export paths', () => {
    expect(QUIZ_ENDPOINTS.QUIZZES).toBe('/v1/quizzes');
    expect(QUIZ_ENDPOINTS.PUBLIC_QUIZZES).toBe('/v1/quizzes/public');
    expect(QUIZ_ENDPOINTS.GENERATE_FROM_DOCUMENT).toBe('/v1/quizzes/generate-from-document');
    expect(QUIZ_ENDPOINTS.GENERATE_FROM_UPLOAD).toBe('/v1/quizzes/generate-from-upload');
    expect(QUIZ_ENDPOINTS.GENERATE_FROM_TEXT).toBe('/v1/quizzes/generate-from-text');
    expect(QUIZ_ENDPOINTS.GENERATION_JOBS).toBe('/v1/quizzes/generation-jobs');
    expect(QUIZ_ENDPOINTS.GENERATION_STATISTICS).toBe(
      '/v1/quizzes/generation-jobs/statistics',
    );
    expect(QUIZ_ENDPOINTS.CLEANUP_STALE_JOBS).toBe(
      '/v1/quizzes/generation-jobs/cleanup-stale',
    );
    expect(QUIZ_ENDPOINTS.EXPORT).toBe('/v1/quizzes/export');
  });

  it('builds deployed quiz item and relationship paths', () => {
    expect(QUIZ_ENDPOINTS.QUIZ_BY_ID('quiz-1')).toBe('/v1/quizzes/quiz-1');
    expect(QUIZ_ENDPOINTS.VISIBILITY('quiz-1')).toBe('/v1/quizzes/quiz-1/visibility');
    expect(QUIZ_ENDPOINTS.STATUS('quiz-1')).toBe('/v1/quizzes/quiz-1/status');
    expect(QUIZ_ENDPOINTS.ADD_QUESTION('quiz-1', 'question-1')).toBe(
      '/v1/quizzes/quiz-1/questions/question-1',
    );
    expect(QUIZ_ENDPOINTS.ADD_TAG('quiz-1', 'tag-1')).toBe(
      '/v1/quizzes/quiz-1/tags/tag-1',
    );
    expect(QUIZ_ENDPOINTS.CHANGE_CATEGORY('quiz-1', 'category-1')).toBe(
      '/v1/quizzes/quiz-1/category/category-1',
    );
  });

  it('builds deployed generation and result paths', () => {
    expect(QUIZ_ENDPOINTS.GENERATION_STATUS('job-1')).toBe(
      '/v1/quizzes/generation-status/job-1',
    );
    expect(QUIZ_ENDPOINTS.GENERATED_QUIZ('job-1')).toBe(
      '/v1/quizzes/generated-quiz/job-1',
    );
    expect(QUIZ_ENDPOINTS.FORCE_CANCEL_JOB('job-1')).toBe(
      '/v1/quizzes/generation-jobs/job-1/force-cancel',
    );
    expect(RESULT_ENDPOINTS.QUIZ_RESULTS('quiz-1')).toBe('/v1/quizzes/quiz-1/results');
    expect(RESULT_ENDPOINTS.LEADERBOARD('quiz-1')).toBe(
      '/v1/quizzes/quiz-1/leaderboard',
    );
  });

  it('builds every deployed quiz-group path', () => {
    expect(QUIZ_ENDPOINTS.QUIZ_GROUPS).toBe('/v1/quiz-groups');
    expect(QUIZ_ENDPOINTS.QUIZ_GROUP_BY_ID('group-1')).toBe('/v1/quiz-groups/group-1');
    expect(QUIZ_ENDPOINTS.QUIZ_GROUP_QUIZZES('group-1')).toBe(
      '/v1/quiz-groups/group-1/quizzes',
    );
    expect(QUIZ_ENDPOINTS.QUIZ_GROUP_QUIZ('group-1', 'quiz-1')).toBe(
      '/v1/quiz-groups/group-1/quizzes/quiz-1',
    );
    expect(QUIZ_ENDPOINTS.QUIZ_GROUP_REORDER('group-1')).toBe(
      '/v1/quiz-groups/group-1/quizzes/reorder',
    );
    expect(QUIZ_ENDPOINTS.ARCHIVED_QUIZZES).toBe('/v1/quiz-groups/archived');
  });
});
