import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, renderWithProviders, screen, waitFor } from '@/test/render';
import { within } from '@testing-library/react';
import { server } from '@/test/msw/server';
import type { QuizDto, TagDto } from '@/types';
import { Button } from '@/components';
import TagManagementPage from '@/features/tag/components/TagManagementPage';
import CategoryManagementPage from '@/pages/CategoryManagementPage';
import { TagSelector } from '@/features/tag/components/TagSelector';
import { CategorySelector } from '@/features/category/components/CategorySelector';
import { TagForm } from '@/features/tag/components/TagForm';
import { CategoryForm } from '@/features/category/components/CategoryForm';
import QuizCard from '@/features/quiz/components/QuizCard';
import QuizList from '@/features/quiz/components/QuizList';
import QuizFilters from '@/features/quiz/components/QuizFilters';
import QuizTagManager from '@/features/quiz/components/QuizTagManager';
import QuizCategoryManager from '@/features/quiz/components/QuizCategoryManager';
import { metadataKeys } from './useQuizMetadataQueries';
import { useTagMutations } from './useTaxonomyMutations';

const original = { id: '11111111-1111-4111-8111-111111111111', name: 'Architecture', description: 'Design' };
const createdId = '22222222-2222-4222-8222-222222222222';
const quiz: QuizDto = {
  id: 'quiz-1', title: 'Taxonomy fixture quiz', createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
  creatorId: 'fixture-user', visibility: 'PRIVATE', difficulty: 'MEDIUM', status: 'DRAFT', estimatedTime: 15,
  isRepetitionEnabled: false, timerEnabled: false, timerDuration: 0, tagIds: [original.id], categoryId: original.id,
};
const backendPage = (rows: TagDto[], size: number) => ({
  content: rows.slice(0, size), totalElements: rows.length, totalPages: Math.ceil(rows.length / size),
  first: true, last: rows.length <= size, number: 0, size, numberOfElements: Math.min(rows.length, size), empty: !rows.length,
});

function CreatedTagConsumers({ onChange }: { onChange: (ids: string[]) => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const writes = useTagMutations();
  return <>
    <QuizTagManager quizId={quiz.id} currentTagIds={ids} onTagsChange={value => { setIds(value); onChange(value); }} />
    <Button onClick={() => void writes.update.mutateAsync({ id: createdId, data: { name: 'Zoology renamed', description: 'Confirmed rename' } })}>Rename from another consumer</Button>
    <Button onClick={() => void writes.remove.mutateAsync(createdId)}>Delete from another consumer</Button>
  </>;
}

describe('created tags outside the manager first page', () => {
  const endpoint = 'http://localhost:3000/api/v1/tags';
  const firstPage = Array.from({ length: 20 }, (_, index) => ({ id: `fixture-tag-${index}`, name: `Architecture ${index.toString().padStart(2, '0')}` }));

  it('offers the canonical created record without extending the server page, and follows shared renames/deletions', async () => {
    let rows: TagDto[] = [...firstPage];
    const pageRequests: string[][] = [];
    server.use(
      http.get(endpoint, ({ request }) => {
        const params = new URL(request.url).searchParams;
        pageRequests.push([params.get('page') ?? '', params.get('size') ?? '', params.get('sort') ?? '']);
        return HttpResponse.json(backendPage(rows, 20));
      }),
      http.post(endpoint, () => {
        rows = [...rows, { id: createdId, name: 'Zoology canonical', description: 'Server description' }];
        return HttpResponse.json({ tagId: createdId }, { status: 201 });
      }),
      http.get(`${endpoint}/${createdId}`, () => HttpResponse.json(rows.find(row => row.id === createdId))),
      http.patch(`${endpoint}/${createdId}`, async ({ request }) => {
        const data = await request.json() as { name: string; description: string };
        const record = { id: createdId, ...data };
        rows = rows.map(row => row.id === createdId ? record : row);
        return HttpResponse.json(record);
      }),
      http.delete(`${endpoint}/${createdId}`, () => {
        rows = rows.filter(row => row.id !== createdId);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const queryClient = createTestQueryClient();
    const onChange = vi.fn();
    const { user } = renderWithProviders(<CreatedTagConsumers onChange={onChange} />, { queryClient, withAuthProvider: false });
    await screen.findByText('#Architecture 00');
    await user.click(screen.getByRole('button', { name: '+ Add New Tag' }));
    await user.type(screen.getByLabelText(/Tag Name/), 'Zoology input');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));
    await screen.findByText('21 tags found');
    expect(onChange).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Search Tags'), 'Zoology');
    const choice = await screen.findByRole('checkbox', { name: /Zoology canonical Server description/ });
    expect(screen.queryByText('#Zoology input')).not.toBeInTheDocument();
    expect(queryClient.getQueryData(metadataKeys.tagList())).toMatchObject({ content: firstPage, totalElements: 21, size: 20, numberOfElements: 20 });
    expect(pageRequests.every(params => params.join('|') === '0|20|name,ASC')).toBe(true);
    await user.click(choice);
    expect(onChange).toHaveBeenLastCalledWith([createdId]);
    await user.click(screen.getByRole('button', { name: 'Rename from another consumer' }));
    await screen.findByRole('checkbox', { name: /Zoology renamed Confirmed rename/ });
    expect(screen.queryByRole('checkbox', { name: /Zoology canonical/ })).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Delete from another consumer' }));
    await screen.findByText('Zoology renamed (unavailable)');
    expect(screen.queryByRole('checkbox', { name: /Zoology/ })).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Remove unavailable tag' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('retries a failed detail read without creating a second tag', async () => {
    let posts = 0;
    let failDetail = true;
    server.use(
      http.get(endpoint, () => HttpResponse.json(backendPage(firstPage, 20))),
      http.post(endpoint, () => { posts += 1; return HttpResponse.json({ tagId: createdId }, { status: 201 }); }),
      http.get(`${endpoint}/${createdId}`, () => failDetail
        ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ id: createdId, name: 'Zoology canonical' })),
    );
    const onChange = vi.fn();
    const { user } = renderWithProviders(<QuizTagManager quizId={quiz.id} currentTagIds={[]} onTagsChange={onChange} />, { withAuthProvider: false });
    await screen.findByText('#Architecture 00');
    await user.click(screen.getByRole('button', { name: '+ Add New Tag' }));
    await user.type(screen.getByLabelText(/Tag Name/), 'Zoology input');
    await user.click(screen.getByRole('button', { name: 'Create Tag' }));
    await screen.findByText(/Tag was saved, but could not be loaded/);
    expect(posts).toBe(1);
    expect(screen.getByLabelText(/Tag Name/)).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
    failDetail = false;
    await user.click(screen.getByRole('button', { name: 'Retry loading tag' }));
    await screen.findByText('21 tags found');
    await user.type(screen.getByLabelText('Search Tags'), 'Zoology');
    await screen.findByRole('checkbox', { name: '#Zoology canonical' });
    expect(posts).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});

beforeEach(() => {
  let tags = [original];
  let categories = [original];
  for (const kind of ['tags', 'categories'] as const) {
    const rows = () => kind === 'tags' ? tags : categories;
    const save = (value: typeof tags) => { if (kind === 'tags') tags = value; else categories = value; };
    const endpoint = `http://localhost:3000/api/v1/${kind}`;
    server.use(
      http.get(endpoint, ({ request }) => HttpResponse.json(backendPage(rows(), Number(new URL(request.url).searchParams.get('size') ?? 20)))),
      http.post(endpoint, async ({ request }) => {
        const data = await request.json() as { name: string; description?: string };
        save([...rows(), { id: createdId, name: data.name, description: data.description ?? '' }]);
        return HttpResponse.json(kind === 'tags' ? { tagId: createdId } : { categoryId: createdId }, { status: 201 });
      }),
      http.patch(`${endpoint}/:id`, async ({ params, request }) => {
        const data = await request.json() as { name: string; description?: string };
        const record = { ...original, id: String(params.id), ...data };
        save(rows().map(row => row.id === params.id ? record : row));
        return HttpResponse.json(record);
      }),
      http.delete(`${endpoint}/:id`, ({ params }) => {
        save(rows().filter(row => row.id !== params.id));
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${endpoint}/:id`, ({ params }) => {
        const row = rows().find(row => row.id === params.id);
        return row ? HttpResponse.json(row) : new HttpResponse(null, { status: 404 });
      }),
    );
  }
});

function Consumers({ kind, initialSelection = false }: { kind: 'Tag' | 'Category'; initialSelection?: boolean }) {
  const [selection, setSelection] = useState<TagDto[]>(initialSelection ? [original] : []);
  return <>
    <section aria-label="Quiz card">{kind === 'Tag' ? <QuizCard quiz={quiz} showActions={false} /> : <QuizList quizzes={[quiz]} showActions={false} />}</section>
    <section aria-label="Filters"><QuizFilters filters={{}} onFiltersChange={vi.fn()} onClearFilters={vi.fn()} /></section>
    <section aria-label="Selector">
      {kind === 'Tag'
        ? <TagSelector selectedTags={selection} onSelectionChange={setSelection} />
        : <CategorySelector selectedCategories={selection} onSelectionChange={setSelection} />}
    </section>
  </>;
}

function CrossRoute({ kind }: { kind: 'Tag' | 'Category' }) {
  const location = useLocation();
  const navigate = useNavigate();
  return <>
    <Button onClick={() => navigate('/management')}>Open management</Button>
    <Button onClick={() => navigate('/consumers')}>Open consumers</Button>
    {location.pathname === '/management'
      ? kind === 'Tag' ? <TagManagementPage /> : <CategoryManagementPage />
      : <Consumers kind={kind} />}
  </>;
}

describe.each(['Tag', 'Category'] as const)('%s consumer convergence', kind => {
  it('restores the management list after a failed delete and a later successful save', async () => {
    const endpoint = `http://localhost:3000/api/v1/${kind === 'Tag' ? 'tags' : 'categories'}`;
    let saveFailed = true;
    server.use(
      http.delete(`${endpoint}/:id`, () => HttpResponse.json({ message: 'Delete denied' }, { status: 403 })),
      http.post(endpoint, async ({ request }) => {
        if (saveFailed) return new HttpResponse(null, { status: 503 });
        const data = await request.json() as { name: string; description: string };
        server.use(http.get(endpoint, () => HttpResponse.json(backendPage([original, { id: createdId, ...data }], 100))));
        return HttpResponse.json(kind === 'Tag' ? { tagId: createdId } : { categoryId: createdId }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(kind === 'Tag' ? <TagManagementPage /> : <CategoryManagementPage />, { withAuthProvider: false });
    await user.click(await screen.findByRole('button', { name: `Delete ${kind.toLowerCase()}` }));
    await user.click(screen.getByRole('button', { name: `Delete ${kind}` }));
    await screen.findByText('Insufficient permissions. Ask the owner for access.');
    await user.click(screen.getByRole('button', { name: new RegExp(`^Create ${kind}`) }));
    await user.type(screen.getByLabelText(/Name/), 'Security');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByText('Server error occurred. Please try again later.');
    expect(screen.getByText('Insufficient permissions. Ask the owner for access.')).toBeInTheDocument();
    saveFailed = false;
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByRole('row', { name: /^Security/ });
    expect(screen.getByRole('row', { name: /^Architecture Design/ })).toBeInTheDocument();
    expect(screen.queryByText('Insufficient permissions. Ask the owner for access.')).not.toBeInTheDocument();
    expect(screen.queryByText('Server error occurred. Please try again later.')).not.toBeInTheDocument();
  });

  it('retains a current list read error after a successful write clears an older delete error', async () => {
    const endpoint = `http://localhost:3000/api/v1/${kind === 'Tag' ? 'tags' : 'categories'}`;
    server.use(
      http.delete(`${endpoint}/:id`, () => new HttpResponse(null, { status: 403 })),
      http.post(endpoint, () => {
        server.use(http.get(endpoint, () => new HttpResponse(null, { status: 503 })));
        return HttpResponse.json(kind === 'Tag' ? { tagId: createdId } : { categoryId: createdId }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(kind === 'Tag' ? <TagManagementPage /> : <CategoryManagementPage />, { withAuthProvider: false });
    await user.click(await screen.findByRole('button', { name: `Delete ${kind.toLowerCase()}` }));
    await user.click(screen.getByRole('button', { name: `Delete ${kind}` }));
    await screen.findByText('Insufficient permissions. Ask the owner for access.');
    await user.click(screen.getByRole('button', { name: new RegExp(`^Create ${kind}`) }));
    await user.type(screen.getByLabelText(/Name/), 'Security');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByText('Server error occurred. Please try again later.');
    expect(screen.queryByText('Insufficient permissions. Ask the owner for access.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Create$/ })).not.toBeInTheDocument();
  });

  it('converges create, rename and delete after navigating from a warm metadata cache', async () => {
    const { user } = renderWithProviders(<CrossRoute kind={kind} />, { route: '/consumers', withAuthProvider: false });
    const card = within(screen.getByRole('region', { name: 'Quiz card' }));
    await waitFor(() => expect(card.getAllByText(kind === 'Tag' ? '#Architecture' : 'Architecture').length).toBeGreaterThan(0));
    await user.click(screen.getByRole('button', { name: 'Open management' }));
    await user.click(await screen.findByRole('button', { name: new RegExp(`^Create ${kind}`) }));
    await user.type(screen.getByLabelText(/Name/), 'Algorithms');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByText('Algorithms');
    await user.click(screen.getByRole('button', { name: 'Open consumers' }));
    const filters = within(screen.getByRole('region', { name: 'Filters' }));
    await user.click(filters.getByRole('button', { name: 'Show Advanced' }));
    expect(await filters.findByRole('checkbox', { name: kind === 'Tag' ? '#Algorithms' : 'Algorithms' })).toBeInTheDocument();
    let selector = within(screen.getByRole('region', { name: 'Selector' }));
    await user.click(selector.getByRole('button', { name: kind === 'Tag' ? 'Select tags...' : 'Select categories...' }));
    expect(await selector.findByRole('button', { name: /Algorithms/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open management' }));
    const row = await screen.findByRole('row', { name: /^Architecture Design/ });
    await user.click(within(row).getByRole('button', { name: `Edit ${kind.toLowerCase()}` }));
    await user.clear(screen.getByLabelText(/Name/));
    await user.type(screen.getByLabelText(/Name/), 'Systems');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Systems');
    await user.click(screen.getByRole('button', { name: 'Open consumers' }));
    await waitFor(() => expect(within(screen.getByRole('region', { name: 'Quiz card' })).getAllByText(kind === 'Tag' ? '#Systems' : 'Systems').length).toBeGreaterThan(0));
    expect(screen.queryByText(kind === 'Tag' ? '#Architecture' : 'Architecture')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open management' }));
    const renamedRow = await screen.findByRole('row', { name: /^Systems Design/ });
    await user.click(within(renamedRow).getByRole('button', { name: `Delete ${kind.toLowerCase()}` }));
    await user.click(screen.getByRole('button', { name: `Delete ${kind}` }));
    await waitFor(() => expect(screen.queryByText('Systems')).not.toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Open consumers' }));
    await user.click(within(screen.getByRole('region', { name: 'Filters' })).getByRole('button', { name: 'Show Advanced' }));
    expect(screen.queryByRole('checkbox', { name: kind === 'Tag' ? '#Systems' : 'Systems' })).not.toBeInTheDocument();
    selector = within(screen.getByRole('region', { name: 'Selector' }));
    await user.click(selector.getByRole('button', { name: kind === 'Tag' ? 'Select tags...' : 'Select categories...' }));
    expect(selector.queryByRole('button', { name: /Systems/ })).not.toBeInTheDocument();
  });

  it('removes an open choice while preserving a selected draft until the author removes it', async () => {
    const onChange = vi.fn();
    const onManagerChange = vi.fn();
    const { user } = renderWithProviders(<>
      {kind === 'Tag' ? <TagManagementPage /> : <CategoryManagementPage />}
      <section aria-label="Selector">
        {kind === 'Tag'
          ? <TagSelector selectedTags={[original]} onSelectionChange={onChange} />
          : <CategorySelector selectedCategories={[original]} onSelectionChange={onChange} />}
      </section>
      <section aria-label="Manager">
        {kind === 'Tag'
          ? <QuizTagManager quizId={quiz.id} currentTagIds={[original.id]} onTagsChange={onManagerChange} />
          : <QuizCategoryManager quizId={quiz.id} currentCategoryId={original.id} onCategoryChange={onManagerChange} />}
      </section>
    </>, { withAuthProvider: false });
    const selector = within(screen.getByRole('region', { name: 'Selector' }));
    await user.click(selector.getByRole('button', { name: 'Architecture' }));
    await selector.findByRole('button', { name: /Design/ });
    await user.click(await screen.findByRole('button', { name: `Delete ${kind.toLowerCase()}` }));
    await user.click(screen.getByRole('button', { name: `Delete ${kind}` }));
    await selector.findByRole('button', { name: `Remove unavailable ${kind.toLowerCase()}` });
    expect(onChange).not.toHaveBeenCalled();
    expect(selector.queryByRole('button', { name: /Design/ })).not.toBeInTheDocument();
    expect(selector.getAllByText('Architecture (unavailable)').length).toBeGreaterThan(0);
    await user.click(selector.getByRole('button', { name: `Remove unavailable ${kind.toLowerCase()}` }));
    expect(onChange).toHaveBeenCalledWith([]);
    const manager = within(screen.getByRole('region', { name: 'Manager' }));
    expect(onManagerChange).not.toHaveBeenCalled();
    expect(manager.queryByRole('checkbox', { name: /Architecture/ })).not.toBeInTheDocument();
    await user.click(manager.getByRole('button', { name: `Remove unavailable ${kind.toLowerCase()}` }));
    expect(onManagerChange).toHaveBeenCalledWith(kind === 'Tag' ? [] : undefined);
  });

  it('updates an existing selection label without inferring deletion from a partial page', async () => {
    const endpoint = `http://localhost:3000/api/v1/${kind === 'Tag' ? 'tags' : 'categories'}`;
    server.use(http.get(endpoint, ({ request }) => {
      const params = new URL(request.url).searchParams;
      return HttpResponse.json(backendPage(params.get('sort') === 'name,asc' ? [] : [original], Number(params.get('size') ?? 20)));
    }));
    const onChange = vi.fn();
    const { user } = renderWithProviders(<>
      {kind === 'Tag' ? <TagManagementPage /> : <CategoryManagementPage />}
      <section aria-label="Selector">
        {kind === 'Tag' ? <TagSelector selectedTags={[original]} onSelectionChange={onChange} />
          : <CategorySelector selectedCategories={[original]} onSelectionChange={onChange} />}
      </section>
    </>, { withAuthProvider: false });
    const selector = within(screen.getByRole('region', { name: 'Selector' }));
    expect(selector.getByRole('button', { name: 'Architecture' })).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: `Edit ${kind.toLowerCase()}` }));
    await user.clear(screen.getByLabelText(/Name/));
    await user.type(screen.getByLabelText(/Name/), 'Systems');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await selector.findByRole('button', { name: 'Systems' });
    expect(onChange).not.toHaveBeenCalled();
    expect(selector.queryByText(/unavailable/)).not.toBeInTheDocument();
  });

  it('retries only the read when creation committed but loading the saved record failed', async () => {
    let writes = 0;
    let readFailed = true;
    const endpoint = `http://localhost:3000/api/v1/${kind === 'Tag' ? 'tags' : 'categories'}`;
    server.use(
      http.post(endpoint, () => {
        writes += 1;
        return HttpResponse.json(kind === 'Tag' ? { tagId: createdId } : { categoryId: createdId }, { status: 201 });
      }),
      http.get(`${endpoint}/${createdId}`, () => readFailed
        ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ id: createdId, name: 'Server canonical name' })),
    );
    const onSave = vi.fn();
    const { user } = renderWithProviders(kind === 'Tag'
      ? <TagForm onSave={onSave} onCancel={vi.fn()} />
      : <CategoryForm onSave={onSave} onCancel={vi.fn()} />, { withAuthProvider: false });
    await user.type(screen.getByLabelText(new RegExp(`${kind} Name`)), 'Algorithms');
    await user.click(screen.getByRole('button', { name: `Create ${kind}` }));
    await screen.findByText(new RegExp(`${kind} was saved, but could not be loaded`));
    expect(writes).toBe(1);
    expect(onSave).not.toHaveBeenCalled();
    readFailed = false;
    await user.click(screen.getByRole('button', { name: `Retry loading ${kind.toLowerCase()}` }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ id: createdId, name: 'Server canonical name' }));
    expect(writes).toBe(1);
  });
});
