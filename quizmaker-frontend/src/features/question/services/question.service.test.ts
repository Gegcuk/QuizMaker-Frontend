import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  CreateQuestionRequest,
  Page,
  QuestionDto,
  QuestionSchemaResponse,
  UpdateQuestionRequest,
} from '../types/question.types';
import { QuestionService } from './question.service';

const question: QuestionDto = {
  id: 'question-1',
  type: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  questionText: 'Architecture decisions should be documented.',
  content: { answer: true },
  hint: null,
  explanation: null,
  attachmentUrl: null,
  createdAt: '2026-06-30T12:00:00Z',
  updatedAt: '2026-06-30T12:00:00Z',
  quizIds: ['quiz-1'],
  tagIds: [],
};

const questionPage: Page<QuestionDto> = {
  content: [question],
  pageable: {
    sort: { sorted: false, unsorted: true, empty: true },
    pageNumber: 2,
    pageSize: 20,
    offset: 40,
    paged: true,
    unpaged: false,
  },
  totalPages: 3,
  totalElements: 41,
  last: true,
  size: 20,
  number: 2,
  sort: { sorted: false, unsorted: true, empty: true },
  numberOfElements: 1,
  first: false,
  empty: false,
};

const createRequest: CreateQuestionRequest = {
  type: 'TRUE_FALSE',
  difficulty: 'MEDIUM',
  questionText: question.questionText,
  content: { answer: true },
  quizIds: ['quiz-1'],
};

const updateRequest: UpdateQuestionRequest = {
  ...createRequest,
  clearAttachment: true,
};

const fillGapSchema: QuestionSchemaResponse = {
  schema: {
    type: 'object',
    required: ['text', 'gaps'],
    properties: {
      options: { type: 'array', items: { type: 'string' } },
    },
  },
  example: {
    text: 'The {1} produces ATP.',
    gaps: [{ id: 1, answer: 'mitochondria' }],
  },
  description: 'Fill-gap question content',
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: 'Validation Failed',
      status,
      detail,
    },
  },
});

describe('QuestionService', () => {
  let axios: AxiosMock;
  let service: QuestionService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new QuestionService(axios.instance);
  });

  it('creates a question with the deployed POST collection contract', async () => {
    axios.post.mockResolvedValue({ data: { questionId: 'question-1' } });

    await expect(service.createQuestion(createRequest)).resolves.toEqual({
      questionId: 'question-1',
    });
    expect(axios.post).toHaveBeenCalledWith('/v1/questions', createRequest);
  });

  it('translates legacy pageNumber callers to the OpenAPI page query parameter', async () => {
    axios.get.mockResolvedValue({ data: questionPage });

    await expect(
      service.getQuestions({ quizId: 'quiz-1', pageNumber: 2, size: 20 }),
    ).resolves.toBe(questionPage);
    expect(axios.get).toHaveBeenCalledWith('/v1/questions', {
      params: { quizId: 'quiz-1', page: 2, size: 20 },
    });
  });

  it('passes the live page, size, sort, and quiz filters without renaming them', async () => {
    axios.get.mockResolvedValue({ data: questionPage });

    await service.getQuestions({
      quizId: 'quiz-1',
      page: 1,
      size: 10,
      sort: ['createdAt,desc'],
    });

    expect(axios.get).toHaveBeenCalledWith('/v1/questions', {
      params: {
        quizId: 'quiz-1',
        page: 1,
        size: 10,
        sort: ['createdAt,desc'],
      },
    });
  });

  it('retrieves, updates, and deletes an individual question by ID', async () => {
    axios.get.mockResolvedValue({ data: question });
    axios.patch.mockResolvedValue({ data: question });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getQuestionById('question-1')).resolves.toBe(question);
    await expect(service.updateQuestion('question-1', updateRequest)).resolves.toBe(question);
    await expect(service.deleteQuestion('question-1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenCalledWith('/v1/questions/question-1');
    expect(axios.patch).toHaveBeenCalledWith('/v1/questions/question-1', updateRequest);
    expect(axios.delete).toHaveBeenCalledWith('/v1/questions/question-1');
  });

  it('retrieves all schemas and a type-specific schema', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { FILL_GAP: fillGapSchema } })
      .mockResolvedValueOnce({ data: fillGapSchema });

    await expect(service.getAllSchemas()).resolves.toEqual({ FILL_GAP: fillGapSchema });
    await expect(service.getSchemaByType('FILL_GAP')).resolves.toBe(fillGapSchema);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/questions/schemas');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/questions/schemas/FILL_GAP');
  });

  it('preserves live ProblemDetail detail text for validation failures', async () => {
    axios.post.mockRejectedValue(
      problemError(400, 'Options array should contain the required distractors.'),
    );

    await expect(service.createQuestion(createRequest)).rejects.toThrow(
      'Validation error: Options array should contain the required distractors.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Question not found'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getQuestionById('question-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves network failure context', async () => {
    axios.get.mockRejectedValue(new Error('Network unavailable'));

    await expect(service.getAllSchemas()).rejects.toThrow('Network unavailable');
  });
});
