import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type { TagDto, TagPage } from '../types/tag.types';
import { TagService } from './tag.service';

const tag: TagDto = {
  id: 'tag-1',
  name: 'Architecture',
  description: 'Software architecture topics',
  createdAt: '2026-07-07T12:00:00Z',
  updatedAt: '2026-07-07T12:00:00Z',
};

const tagPage: TagPage = {
  content: [tag],
  pageable: {
    pageNumber: 0,
    pageSize: 20,
    offset: 0,
    paged: true,
    unpaged: false,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  totalElements: 1,
  totalPages: 1,
  last: true,
  first: true,
  numberOfElements: 1,
  size: 20,
  number: 0,
  empty: false,
  sort: { sorted: true, unsorted: false, empty: false },
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: 'Request Failed',
      status,
      detail,
    },
  },
});

describe('TagService', () => {
  let axios: AxiosMock;
  let service: TagService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new TagService(axios.instance);
  });

  it('lists tags with deployed defaults and custom sort criteria', async () => {
    axios.get.mockResolvedValue({ data: tagPage });

    await expect(service.getTags()).resolves.toBe(tagPage);
    await expect(
      service.getTags({ page: 1, size: 100, sort: ['name,DESC'] }),
    ).resolves.toBe(tagPage);

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/tags', {
      params: { page: 0, size: 20, sort: 'name,ASC' },
    });
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/tags', {
      params: { page: 1, size: 100, sort: ['name,DESC'] },
    });
  });

  it('gets, creates, updates, and deletes tags', async () => {
    axios.get.mockResolvedValue({ data: tag });
    axios.post.mockResolvedValue({ data: { tagId: 'tag-1' } });
    axios.patch.mockResolvedValue({ data: tag });
    axios.delete.mockResolvedValue({ data: undefined });

    await expect(service.getTagById('tag-1')).resolves.toBe(tag);
    await expect(
      service.createTag({ name: 'Architecture', description: tag.description }),
    ).resolves.toEqual({ tagId: 'tag-1' });
    await expect(service.updateTag('tag-1', { description: 'Updated' })).resolves.toBe(tag);
    await expect(service.deleteTag('tag-1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenCalledWith('/v1/tags/tag-1');
    expect(axios.post).toHaveBeenCalledWith('/v1/tags', {
      name: 'Architecture',
      description: tag.description,
    });
    expect(axios.patch).toHaveBeenCalledWith('/v1/tags/tag-1', {
      description: 'Updated',
    });
    expect(axios.delete).toHaveBeenCalledWith('/v1/tags/tag-1');
  });

  it('preserves ProblemDetail detail for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Name must be between 3 and 50 characters.'))
      .mockRejectedValueOnce(problemError(409, 'Tag name already exists.'));

    await expect(service.createTag({ name: 'A' })).rejects.toThrow(
      'Validation error: Name must be between 3 and 50 characters.',
    );
    await expect(service.createTag({ name: 'Architecture' })).rejects.toThrow(
      'Conflict: Tag name already exists.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Tag not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getTagById('tag-1')).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.delete
      .mockRejectedValueOnce(problemError(403, 'Forbidden'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.deleteTag('tag-1')).rejects.toMatchObject({ status: 403 });
    await expect(service.deleteTag('tag-1')).rejects.toThrow('Network unavailable');
  });
});
