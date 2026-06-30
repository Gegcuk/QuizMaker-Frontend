import { describe, expect, it } from 'vitest';
import { QUESTION_ENDPOINTS } from './question.endpoints';

describe('QUESTION_ENDPOINTS', () => {
  it('matches the deployed Questions OpenAPI collection and schema paths', () => {
    expect(QUESTION_ENDPOINTS.CREATE_QUESTION).toBe('/v1/questions');
    expect(QUESTION_ENDPOINTS.GET_QUESTIONS).toBe('/v1/questions');
    expect(QUESTION_ENDPOINTS.GET_ALL_SCHEMAS).toBe('/v1/questions/schemas');
    expect(QUESTION_ENDPOINTS.GET_SCHEMA_BY_TYPE('FILL_GAP')).toBe(
      '/v1/questions/schemas/FILL_GAP',
    );
  });

  it('builds the deployed item path consistently for every operation', () => {
    expect(QUESTION_ENDPOINTS.GET_QUESTION('question-1')).toBe('/v1/questions/question-1');
    expect(QUESTION_ENDPOINTS.UPDATE_QUESTION('question-1')).toBe('/v1/questions/question-1');
    expect(QUESTION_ENDPOINTS.DELETE_QUESTION('question-1')).toBe('/v1/questions/question-1');
  });
});
