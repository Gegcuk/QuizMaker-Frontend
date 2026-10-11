import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { TagService, api, categoryService } from '@/services';
import type { CategoryDto, CreateCategoryRequest, CreateTagRequest, TagDto, UpdateCategoryRequest, UpdateTagRequest } from '@/types';
import { assertCurrentSessionGeneration } from '@/features/auth/services/sessionLifecycle';
import { metadataKeys, getMetadataSessionGeneration, type DeletedTaxonomy } from './useQuizMetadataQueries';

type Taxonomy = 'tags' | 'categories';
type RecordDto = TagDto | CategoryDto;
type Change = { kind: 'create' } | { kind: 'update'; record: RecordDto } | { kind: 'delete'; id: string };

// A cleared mutation cache cannot resume TanStack's paused scoped mutations.
// Keep the queue attached weakly to the session's client, and let every queued
// operation settle through the generation guard even after that cache is cleared.
const pendingWrites = new WeakMap<QueryClient, Map<Taxonomy, Promise<void>>>();

function serialize<T>(client: QueryClient, kind: Taxonomy, operation: () => Promise<T>): Promise<T> {
  const queue = pendingWrites.get(client) ?? new Map<Taxonomy, Promise<void>>();
  pendingWrites.set(client, queue);
  const result = (queue.get(kind) ?? Promise.resolve()).then(operation);
  const settled = result.then(() => undefined, () => undefined);
  queue.set(kind, settled);
  void settled.then(() => {
    if (queue.get(kind) === settled) queue.delete(kind);
  });
  return result;
}

const familyKey = (kind: Taxonomy) => kind === 'tags' ? metadataKeys.tags() : metadataKeys.categories();
const deletedKey = (kind: Taxonomy) => kind === 'tags' ? metadataKeys.deletedTags() : metadataKeys.deletedCategories();
const detailKey = (kind: Taxonomy, id: string) => kind === 'tags' ? metadataKeys.tag(id) : metadataKeys.category(id);

interface CachedPage {
  content: RecordDto[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  size: number;
  empty: boolean;
}

async function reconcile(client: QueryClient, kind: Taxonomy, change: Change, generation: number) {
  assertCurrentSessionGeneration(generation);
  const queryKey = familyKey(kind);
  // Query cancellation also rejects results from transports that ignore abort.
  await client.cancelQueries({ queryKey });
  assertCurrentSessionGeneration(generation);

  const lists = { queryKey: [...queryKey, 'list'] };
  if (change.kind === 'delete') {
    const pages = client.getQueriesData<CachedPage>(lists);
    const record = pages.flatMap(([, page]) => page?.content ?? []).find(item => item.id === change.id)
      ?? client.getQueryData<RecordDto>(detailKey(kind, change.id))
      ?? { id: change.id, name: 'Unavailable' };
    client.setQueryData<DeletedTaxonomy<RecordDto>>(deletedKey(kind), previous => ({
      ...previous, [change.id]: record,
    }));
    client.removeQueries({ queryKey: detailKey(kind, change.id), exact: true });
    client.setQueriesData<CachedPage>(lists, page => {
      if (!page) return page;
      const content = page.content.filter(item => item.id !== change.id);
      const totalElements = Math.max(0, page.totalElements - 1);
      return {
        ...page, content, totalElements,
        totalPages: Math.ceil(totalElements / page.size),
        numberOfElements: content.length, empty: content.length === 0,
      };
    });
  } else if (change.kind === 'update') {
    client.setQueriesData<CachedPage>(lists, page => page && ({
      ...page,
      content: page.content.map(item => item.id === change.record.id ? change.record : item),
    }));
    client.setQueryData(detailKey(kind, change.record.id), change.record);
  }

  // Pages are refetched rather than locally inserting/reordering records.
  // Read failures remain query errors; they do not turn a committed write into a failed write.
  await client.invalidateQueries({ queryKey: [...queryKey, 'list'], refetchType: 'active' });
  assertCurrentSessionGeneration(generation);
}

function useTaxonomyWrite<TVariables, TResult>(
  kind: Taxonomy,
  action: string,
  write: (value: TVariables) => Promise<TResult>,
  change: (result: TResult, value: TVariables) => Change,
) {
  const client = useQueryClient();
  const mutation = useMutation({
    mutationKey: [...familyKey(kind), action],
    mutationFn: ({ value, generation }: { value: TVariables; generation: number }) => serialize(client, kind, async () => {
      assertCurrentSessionGeneration(generation);
      const result = await write(value);
      assertCurrentSessionGeneration(generation);
      await reconcile(client, kind, change(result, value), generation);
      return result;
    }),
  });
  return {
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
    mutateAsync: (value: TVariables) => mutation.mutateAsync({ value, generation: getMetadataSessionGeneration(client) }),
  };
}

export function useTagMutations() {
  const create = useTaxonomyWrite('tags', 'create',
    (data: CreateTagRequest) => new TagService(api).createTag(data), () => ({ kind: 'create' }));
  const update = useTaxonomyWrite('tags', 'update',
    ({ id, data }: { id: string; data: UpdateTagRequest }) => new TagService(api).updateTag(id, data),
    record => ({ kind: 'update', record }));
  const remove = useTaxonomyWrite('tags', 'delete',
    (id: string) => new TagService(api).deleteTag(id), (_, id) => ({ kind: 'delete', id }));
  return { create, update, remove };
}

export function useCategoryMutations() {
  const create = useTaxonomyWrite('categories', 'create',
    (data: CreateCategoryRequest) => categoryService.createCategory(data), () => ({ kind: 'create' }));
  const update = useTaxonomyWrite('categories', 'update',
    ({ id, data }: { id: string; data: UpdateCategoryRequest }) => categoryService.updateCategory(id, data),
    record => ({ kind: 'update', record }));
  const remove = useTaxonomyWrite('categories', 'delete',
    (id: string) => categoryService.deleteCategory(id), (_, id) => ({ kind: 'delete', id }));
  return { create, update, remove };
}
