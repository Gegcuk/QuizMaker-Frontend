import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useQueryClient } from '@tanstack/react-query';
import { createQueryWrapper, createTestQueryClient } from '@/test/render';
import { QueryProvider } from '@/providers/QueryProvider';
import { establishSession, terminateSession } from '@/features/auth/services/sessionLifecycle';
import type { TagDto, TagPage } from '@/types';
import { metadataKeys, useTagPage, useCategoryPage, useDeletedTags, useQuizMetadata } from './useQuizMetadataQueries';
import { useTagMutations } from './useTaxonomyMutations';

const mocks = vi.hoisted(() => ({
  getTags: vi.fn(), getCategories: vi.fn(), createTag: vi.fn(), updateTag: vi.fn(), deleteTag: vi.fn(),
}));
vi.mock('@/services', () => ({
  api: {},
  TagService: class {
    getTags = mocks.getTags;
    createTag = mocks.createTag;
    updateTag = mocks.updateTag;
    deleteTag = mocks.deleteTag;
  },
  categoryService: { getCategories: mocks.getCategories },
}));

const architecture = { id: 'tag-1', name: 'Architecture', description: 'Design' };
const security = { id: 'tag-2', name: 'Security' };
const category = { id: 'category-1', name: 'Software' };
const page = (content: TagDto[], overrides: Partial<TagPage> = {}): TagPage => ({
  content, totalElements: content.length, totalPages: content.length ? 1 : 0,
  numberOfElements: content.length, size: 20, number: 0, empty: !content.length,
  first: true, last: true,
  pageable: { pageNumber: 0, pageSize: 20, offset: 0, paged: true, unpaged: false,
    sort: { sorted: true, unsorted: false, empty: false } },
  sort: { sorted: true, unsorted: false, empty: false }, ...overrides,
});
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(complete => { resolve = complete; });
  return { promise, resolve };
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getTags.mockResolvedValue(page([architecture, security]));
  mocks.getCategories.mockResolvedValue(page([category]));
});

describe('taxonomy Query ownership', () => {
  it('shares canonical parameterized keys and deduplicates concurrent readers', async () => {
    const client = createTestQueryClient();
    const wrapper = createQueryWrapper(client);
    const first = renderHook(() => useTagPage({ page: 0, size: 20, sort: 'name,ASC' }), { wrapper });
    const second = renderHook(() => useTagPage({ sort: ['name,ASC'] }), { wrapper });
    await waitFor(() => expect(first.result.current.data?.content).toEqual([architecture, security]));
    expect(second.result.current.data).toBe(first.result.current.data);
    expect(mocks.getTags).toHaveBeenCalledTimes(1);
    expect(metadataKeys.tagList({ sort: 'name,ASC' })).toEqual(metadataKeys.tagList({ sort: ['name,ASC'] }));
    expect(metadataKeys.tagList({ page: 1 })).not.toEqual(metadataKeys.tagList({ page: 0 }));
    expect(metadataKeys.tagList({ size: 10 })).not.toEqual(metadataKeys.tagList({ size: 20 }));
    expect(metadataKeys.tagList({ sort: 'name,DESC' })).not.toEqual(metadataKeys.tagList());
    expect(client.getQueryCache().getAll().every(query => query.queryKey[0] === 'metadata')).toBe(true);
  });

  it('refreshes active variants, marks inactive pages stale, and leaves categories untouched after create', async () => {
    const client = createTestQueryClient();
    client.setQueryDefaults(metadataKeys.tags(), { gcTime: Infinity });
    const inactiveParams = { page: 4, size: 10, sort: 'name,DESC' };
    client.setQueryData(metadataKeys.tagList(inactiveParams), page([security], { number: 4, size: 10 }));
    const { result } = renderHook(() => ({
      large: useQuizMetadata(), small: useTagPage({ page: 0, size: 1 }),
      category: useCategoryPage(), writes: useTagMutations(),
    }), { wrapper: createQueryWrapper(client) });
    await waitFor(() => expect(result.current.large.isLoading).toBe(false));
    const categoriesReads = mocks.getCategories.mock.calls.length;
    const created = { id: 'tag-3', name: 'Algorithms' };
    const backendPage = page([created], { size: 1, totalElements: 3, totalPages: 3, last: false });
    mocks.createTag.mockImplementation(async () => {
      mocks.getTags.mockImplementation(async params => params?.size === 1
        ? backendPage : page([created, architecture, security]));
      return { tagId: created.id };
    });
    await act(async () => { await result.current.writes.create.mutateAsync({ name: 'Algorithms' }); });
    await waitFor(() => expect(result.current.large.tags.map(tag => tag.name)).toEqual(['Algorithms', 'Architecture', 'Security']));
    expect(result.current.small.data).toEqual(backendPage);
    expect(client.getQueryState(metadataKeys.tagList(inactiveParams))?.isInvalidated).toBe(true);
    expect(mocks.getCategories).toHaveBeenCalledTimes(categoriesReads);
    expect(result.current.category.data?.content).toEqual([category]);
  });

  it('keeps a server-confirmed rename when refreshing the list fails', async () => {
    const { result } = renderHook(() => ({ read: useTagPage(), writes: useTagMutations() }), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    const renamed = { ...architecture, name: 'Systems' };
    mocks.updateTag.mockResolvedValue(renamed);
    mocks.getTags.mockRejectedValue(new Error('List unavailable'));
    await act(async () => { await result.current.writes.update.mutateAsync({ id: architecture.id, data: { name: 'Systems' } }); });
    await waitFor(() => expect(result.current.read.error?.message).toBe('List unavailable'));
    expect(result.current.writes.update.isSuccess).toBe(true);
    await waitFor(() => expect(result.current.read.data?.content).toEqual([renamed, security]));
  });

  it.each(['create', 'update', 'remove'] as const)('leaves server truth intact after failed %s', async action => {
    const { result } = renderHook(() => ({ read: useTagPage(), deleted: useDeletedTags(), writes: useTagMutations() }), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    mocks.createTag.mockRejectedValue(new Error('Write denied'));
    mocks.updateTag.mockRejectedValue(new Error('Write denied'));
    mocks.deleteTag.mockRejectedValue(new Error('Write denied'));
    await act(async () => {
      const pending = action === 'create' ? result.current.writes.create.mutateAsync({ name: 'Algorithms' })
        : action === 'update' ? result.current.writes.update.mutateAsync({ id: architecture.id, data: { name: 'Systems' } })
          : result.current.writes.remove.mutateAsync(architecture.id);
      await expect(pending).rejects.toThrow('Write denied');
    });
    expect(result.current.read.data?.content).toEqual([architecture, security]);
    expect(result.current.deleted).toEqual({});
    expect(mocks.getTags).toHaveBeenCalledTimes(1);
  });

  it('rejects a late read that would resurrect a confirmed deleted record', async () => {
    const { result } = renderHook(() => ({ read: useTagPage(), deleted: useDeletedTags(), writes: useTagMutations() }), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    const late = deferred<TagPage>();
    mocks.getTags.mockImplementationOnce(() => late.promise);
    let oldRead: Promise<unknown>;
    act(() => { oldRead = result.current.read.refetch(); });
    await waitFor(() => expect(mocks.getTags).toHaveBeenCalledTimes(2));
    const oldSignal: AbortSignal = mocks.getTags.mock.calls[1][1];
    mocks.deleteTag.mockImplementation(async () => {
      mocks.getTags.mockResolvedValue(page([security]));
    });
    await act(async () => { await result.current.writes.remove.mutateAsync(architecture.id); });
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { late.resolve(page([architecture, security])); await oldRead; });
    await waitFor(() => {
      expect(result.current.read.data?.content).toEqual([security]);
      expect(result.current.deleted[architecture.id].name).toBe('Architecture');
    });
  });

  it('serializes concurrent writes across consumers and preserves the last confirmed result', async () => {
    const { result } = renderHook(() => ({ read: useTagPage(), first: useTagMutations(), second: useTagMutations() }), {
      wrapper: createQueryWrapper(createTestQueryClient()),
    });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    const firstWrite = deferred<TagDto>();
    mocks.updateTag.mockImplementationOnce(() => firstWrite.promise).mockRejectedValueOnce(new Error('Second write denied'));
    let results: Promise<PromiseSettledResult<TagDto>[]>;
    act(() => {
      results = Promise.allSettled([
        result.current.first.update.mutateAsync({ id: architecture.id, data: { name: 'Systems' } }),
        result.current.second.update.mutateAsync({ id: architecture.id, data: { name: 'Rejected' } }),
      ]);
    });
    await waitFor(() => expect(mocks.updateTag).toHaveBeenCalledTimes(1));
    const renamed = { ...architecture, name: 'Systems' };
    mocks.getTags.mockResolvedValue(page([renamed, security]));
    await act(async () => { firstWrite.resolve(renamed); await results; });
    expect(mocks.updateTag).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.read.data?.content).toEqual([renamed, security]));
  });
});

describe('taxonomy session boundary', () => {
  it.each(['logout', 'account-switch'] as const)('cannot restore old reads, queued writes or deletion evidence after %s', async transition => {
    establishSession('fixture-access-a', 'fixture-refresh-a');
    const { result } = renderHook(() => ({
      client: useQueryClient(), read: useTagPage(), deleted: useDeletedTags(), writes: useTagMutations(),
    }), { wrapper: QueryProvider });
    await waitFor(() => expect(result.current.read.isSuccess).toBe(true));
    const oldClient = result.current.client;
    mocks.deleteTag.mockResolvedValue(undefined);
    mocks.getTags.mockResolvedValue(page([security]));
    await act(async () => { await result.current.writes.remove.mutateAsync(architecture.id); });
    await waitFor(() => expect(result.current.deleted[architecture.id]).toBeDefined());
    const lateRead = deferred<TagPage>();
    const lateWrite = deferred<TagDto>();
    mocks.getTags.mockImplementationOnce(() => lateRead.promise);
    mocks.updateTag.mockImplementationOnce(() => lateWrite.promise);
    let pending: Promise<PromiseSettledResult<unknown>[]>;
    act(() => {
      pending = Promise.allSettled([
        result.current.read.refetch(),
        result.current.writes.update.mutateAsync({ id: security.id, data: { name: 'Late old rename' } }),
        result.current.writes.remove.mutateAsync(security.id),
      ]);
    });
    await waitFor(() => expect(mocks.updateTag).toHaveBeenCalledTimes(1));
    const currentRecord = { id: 'tag-b', name: 'Current session' };
    mocks.getTags.mockResolvedValue(page([currentRecord]));
    act(() => {
      if (transition === 'logout') terminateSession('logout');
      else establishSession('fixture-access-b', 'fixture-refresh-b', 'account-switch');
    });
    await waitFor(() => expect(result.current.client).not.toBe(oldClient));
    await act(async () => {
      lateRead.resolve(page([architecture, security]));
      lateWrite.resolve({ ...security, name: 'Late old rename' });
      await pending;
    });
    await waitFor(() => expect(result.current.read.data?.content).toEqual([currentRecord]));
    expect(result.current.deleted).toEqual({});
    expect(oldClient.getQueryData<TagPage>(metadataKeys.tagList())?.content).toBeUndefined();
    expect(oldClient.getQueryData<Record<string, TagDto>>(metadataKeys.deletedTags())?.[architecture.id]).toBeUndefined();
    expect(oldClient.getMutationCache().getAll()).toHaveLength(0);
    // Only the earlier confirmed delete ran; the old-generation queued delete was rejected.
    expect(mocks.deleteTag).toHaveBeenCalledTimes(1);
  });
});
