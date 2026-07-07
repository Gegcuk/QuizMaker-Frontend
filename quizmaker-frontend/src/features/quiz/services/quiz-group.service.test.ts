import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  QuizGroupDto,
  QuizGroupSummaryDto,
  QuizSummaryDto,
} from '../types/quiz.types';
import type { Paginated } from '@/types';
import { QuizGroupService } from './quiz-group.service';

const quizSummary: QuizSummaryDto = {
  id: 'quiz-1',
  title: 'Architecture Quiz',
  createdAt: '2026-07-07T12:00:00Z',
  updatedAt: '2026-07-07T12:00:00Z',
  status: 'DRAFT',
  visibility: 'PRIVATE',
  creatorId: 'user-1',
  questionCount: 3,
  tagCount: 0,
  estimatedTime: 10,
};

const group: QuizGroupDto = {
  id: 'group-1',
  ownerId: 'user-1',
  name: 'Architecture',
  quizCount: 1,
  createdAt: '2026-07-07T12:00:00Z',
  updatedAt: '2026-07-07T12:00:00Z',
};

const groupSummary: QuizGroupSummaryDto = {
  id: group.id,
  name: group.name,
  createdAt: group.createdAt,
  updatedAt: group.updatedAt,
  quizCount: 1,
  quizPreviews: [quizSummary],
};

const page = <T,>(content: T[]): Paginated<T> => ({
  content,
  totalElements: content.length,
  totalPages: content.length === 0 ? 0 : 1,
  size: 20,
  number: 0,
  first: true,
  last: true,
  numberOfElements: content.length,
  empty: content.length === 0,
});

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 409 ? 'Conflict' : 'Validation Failed',
      status,
      detail,
    },
  },
});

describe('QuizGroupService', () => {
  let axios: AxiosMock;
  let service: QuizGroupService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new QuizGroupService(axios.instance);
  });

  it('lists and retrieves quiz groups with deployed parameters', async () => {
    const params = {
      page: 0,
      size: 10,
      sort: ['createdAt,desc'],
      includeQuizzes: true,
      previewSize: 3,
    };
    axios.get
      .mockResolvedValueOnce({ data: page([groupSummary]) })
      .mockResolvedValueOnce({ data: group });

    await expect(service.getQuizGroups(params)).resolves.toEqual(page([groupSummary]));
    await expect(service.getQuizGroupById('group-1')).resolves.toBe(group);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/quiz-groups', { params });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quiz-groups/group-1');
  });

  it('returns the deployed string ID when creating a group', async () => {
    const request = { name: 'Architecture' };
    axios.post.mockResolvedValue({ data: 'group-1' });

    await expect(service.createQuizGroup(request)).resolves.toBe('group-1');
    expect(axios.post).toHaveBeenCalledWith('/v1/quiz-groups', request);
  });

  it('retains compatibility with legacy object ID responses', async () => {
    axios.post
      .mockResolvedValueOnce({ data: { groupId: 'group-1' } })
      .mockResolvedValueOnce({ data: { id: 'group-2' } });

    await expect(service.createQuizGroup({ name: 'One' })).resolves.toBe('group-1');
    await expect(service.createQuizGroup({ name: 'Two' })).resolves.toBe('group-2');
  });

  it('rejects invalid create-group response formats', async () => {
    axios.post.mockResolvedValue({ data: {} });

    await expect(service.createQuizGroup({ name: 'Architecture' })).rejects.toThrow(
      'Invalid response format from createQuizGroup API',
    );
  });

  it('updates and deletes a quiz group', async () => {
    const update = { name: 'Updated Architecture' };
    axios.patch.mockResolvedValue({ data: { ...group, ...update } });
    axios.delete.mockResolvedValue({ data: undefined });

    await service.updateQuizGroup('group-1', update);
    await expect(service.deleteQuizGroup('group-1')).resolves.toBeUndefined();

    expect(axios.patch).toHaveBeenCalledWith('/v1/quiz-groups/group-1', update);
    expect(axios.delete).toHaveBeenCalledWith('/v1/quiz-groups/group-1');
  });

  it('lists, adds, and removes quizzes in a group', async () => {
    const params = { page: 0, size: 20, sort: ['createdAt,desc'] };
    axios.get.mockResolvedValue({ data: page([quizSummary]) });
    axios.post.mockResolvedValue({ data: undefined });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getQuizzesInGroup('group-1', params)).resolves.toEqual(
      page([quizSummary]),
    );
    await service.addQuizzesToGroup('group-1', { quizIds: ['quiz-1'], position: 0 });
    await service.removeQuizFromGroup('group-1', 'quiz-1');

    expect(axios.get).toHaveBeenCalledWith('/v1/quiz-groups/group-1/quizzes', { params });
    expect(axios.post).toHaveBeenCalledWith('/v1/quiz-groups/group-1/quizzes', {
      quizIds: ['quiz-1'],
      position: 0,
    });
    expect(axios.delete).toHaveBeenCalledWith('/v1/quiz-groups/group-1/quizzes/quiz-1');
  });

  it('reorders group quizzes and lists archived quizzes', async () => {
    const reorder = { orderedQuizIds: ['quiz-2', 'quiz-1'] };
    const params = { page: 0, size: 20, sort: ['createdAt,desc'] };
    axios.patch.mockResolvedValue({ data: undefined });
    axios.get.mockResolvedValue({ data: page([quizSummary]) });

    await service.reorderQuizzesInGroup('group-1', reorder);
    await expect(service.getArchivedQuizzes(params)).resolves.toEqual(page([quizSummary]));

    expect(axios.patch).toHaveBeenCalledWith(
      '/v1/quiz-groups/group-1/quizzes/reorder',
      reorder,
    );
    expect(axios.get).toHaveBeenCalledWith('/v1/quiz-groups/archived', { params });
  });

  it('checks preview membership before requesting the full group list', async () => {
    axios.get.mockResolvedValue({ data: page([groupSummary]) });

    await expect(service.isQuizInGroup('group-1', 'quiz-1')).resolves.toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('falls back to the full group list when a quiz is absent from previews', async () => {
    axios.get
      .mockResolvedValueOnce({ data: page([{ ...groupSummary, quizPreviews: [] }]) })
      .mockResolvedValueOnce({ data: page([quizSummary]) });

    await expect(service.isQuizInGroup('group-1', 'quiz-1')).resolves.toBe(true);
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/quiz-groups/group-1/quizzes', {
      params: { size: 1000 },
    });
  });

  it('filters groups containing a quiz and returns safe defaults on lookup failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    axios.get
      .mockResolvedValueOnce({ data: page([groupSummary, { ...groupSummary, id: 'group-2', quizPreviews: [] }]) })
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.getGroupsForQuiz('quiz-1')).resolves.toEqual([groupSummary]);
    await expect(service.getGroupsForQuiz('quiz-1')).resolves.toEqual([]);
    await expect(service.isQuizInGroup('group-1', 'quiz-1')).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });

  it('preserves live ProblemDetail detail for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Group name must not be blank.'))
      .mockRejectedValueOnce(problemError(409, 'Quiz order changed concurrently.'));

    await expect(service.createQuizGroup({ name: '' })).rejects.toThrow(
      'Validation error: Group name must not be blank.',
    );
    await expect(
      service.addQuizzesToGroup('group-1', { quizIds: ['quiz-1'] }),
    ).rejects.toThrow('Conflict: Quiz order changed concurrently.');
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Quiz group not found'],
    [429, 'Too many requests'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getQuizGroupById('group-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.get
      .mockRejectedValueOnce(problemError(403, 'Forbidden'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.getQuizGroupById('group-1')).rejects.toMatchObject({ status: 403 });
    await expect(service.getQuizGroupById('group-1')).rejects.toThrow('Network unavailable');
  });
});
