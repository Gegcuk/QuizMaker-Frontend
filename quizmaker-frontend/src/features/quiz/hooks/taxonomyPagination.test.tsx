import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { createTestQueryClient, renderWithProviders, screen, waitFor } from '@/test/render';
import { server } from '@/test/msw/server';
import { TagList } from '@/features/tag/components/TagList';
import { CategoryList } from '@/features/category/components/CategoryList';
import type { TagDto } from '@/types';
import { metadataKeys } from './useQuizMetadataQueries';

const originalRows: TagDto[] = [
  ...Array.from({ length: 10 }, (_, index) => ({ id: `first-${index}`, name: `Aardvark ${String(index).padStart(2, '0')}` })),
  { id: 'architecture', name: 'Architecture' },
  { id: 'security', name: 'Security' },
  ...Array.from({ length: 18 }, (_, index) => ({ id: `topic-${index}`, name: `Topic ${String(index).padStart(2, '0')}` })),
];
// Another client changes page two while this reader is on page three.
const updatedRows: TagDto[] = [
  ...originalRows.slice(0, 10),
  { id: 'analytics', name: 'Analytics' },
  { id: 'architecture', name: 'Systems' },
  ...originalRows.slice(12),
];

describe.each(['tags', 'categories'] as const)('%s pagination freshness', kind => {
  const key = (page: number) => kind === 'tags'
    ? metadataKeys.tagList({ page, size: 10, sort: 'name,asc' })
    : metadataKeys.categoryList({ page, size: 10, sort: 'name,asc' });

  function setup() {
    let rows = originalRows;
    let failVisitedPage = false;
    const requests: Array<{ page: string | null; size: string | null; sort: string[] }> = [];
    server.use(http.get(`http://localhost:3000/api/v1/${kind}`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push({ page: params.get('page'), size: params.get('size'), sort: params.getAll('sort') });
      const page = Number(params.get('page'));
      const size = Number(params.get('size'));
      if (failVisitedPage && page === 1) return new HttpResponse(null, { status: 503 });
      const content = rows.slice(page * size, (page + 1) * size);
      return HttpResponse.json({
        content, totalElements: rows.length, totalPages: Math.ceil(rows.length / size),
        number: page, size, numberOfElements: content.length, first: page === 0,
        last: (page + 1) * size >= rows.length, empty: content.length === 0,
      });
    }));
    const onSelect = vi.fn();
    const queryClient = createTestQueryClient();
    const view = kind === 'tags'
      ? <TagList onEditTag={vi.fn()} onDeleteTag={vi.fn()} onTagSelect={onSelect} />
      : <CategoryList onEditCategory={vi.fn()} onDeleteCategory={vi.fn()} onCategorySelect={onSelect} />;
    const { user } = renderWithProviders(view, { queryClient, withAuthProvider: false });
    return {
      user, queryClient, requests, onSelect,
      updateServer: () => { rows = updatedRows; },
      failVisitedPage: (value: boolean) => { failVisitedPage = value; },
    };
  }

  it('refreshes a visited page, showing external creates/renames and removing deleted choices', async () => {
    const fixture = setup();
    await screen.findAllByText('Aardvark 00');
    await fixture.user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await screen.findAllByText('Architecture');
    await fixture.user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await screen.findAllByText('Topic 08');
    fixture.updateServer();
    await fixture.user.click(screen.getAllByRole('button', { name: 'Previous' })[0]);

    await screen.findAllByText('Analytics');
    await screen.findAllByText('Systems');
    expect(screen.queryByText('Architecture')).not.toBeInTheDocument();
    expect(screen.queryByText('Security')).not.toBeInTheDocument();
    expect(fixture.requests).toEqual([
      { page: '0', size: '10', sort: ['name,asc'] },
      { page: '1', size: '10', sort: ['name,asc'] },
      { page: '2', size: '10', sort: ['name,asc'] },
      { page: '1', size: '10', sort: ['name,asc'] },
    ]);
    expect(fixture.queryClient.getQueryData(key(1))).toMatchObject({ content: updatedRows.slice(10, 20) });
    expect(fixture.onSelect).not.toHaveBeenCalled();
    await fixture.user.click(screen.getAllByText('Systems')[0]);
    expect(fixture.onSelect).toHaveBeenCalledExactlyOnceWith(updatedRows[11]);
  });

  it('preserves cached server truth on a failed return read and recovers through manual retry', async () => {
    const fixture = setup();
    await screen.findAllByText('Aardvark 00');
    await fixture.user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await screen.findAllByText('Architecture');
    await fixture.user.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await screen.findAllByText('Topic 08');
    fixture.updateServer();
    fixture.failVisitedPage(true);
    await fixture.user.click(screen.getAllByRole('button', { name: 'Previous' })[0]);

    await screen.findByRole('alert');
    expect(fixture.requests).toHaveLength(4);
    expect(fixture.queryClient.getQueryData(key(1))).toMatchObject({ content: originalRows.slice(10, 20) });
    expect(fixture.onSelect).not.toHaveBeenCalled();
    fixture.failVisitedPage(false);
    await fixture.user.click(screen.getByRole('button', { name: 'Try again' }));
    await screen.findAllByText('Systems');
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(fixture.requests).toHaveLength(5);
    expect(screen.queryByText('Security')).not.toBeInTheDocument();
    expect(fixture.queryClient.getQueryData(key(1))).toMatchObject({ content: updatedRows.slice(10, 20) });
  });
});
