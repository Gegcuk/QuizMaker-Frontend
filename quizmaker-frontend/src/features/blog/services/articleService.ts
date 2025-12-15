import api from '@/api/axiosInstance';
import {
  ArticleDto,
  ArticleListResponse,
  ArticleTagSummary,
  ArticleSitemapEntry,
  ArticleUpsertPayload,
  ArticleStatus,
} from '../types';

export interface ArticleListParams {
  tags?: string[];
  page?: number;
  size?: number;
  sort?: string; // e.g. "publishedAt,desc"
  contentGroup?: string;
}

export interface ArticleAdminListParams extends ArticleListParams {
  status?: ArticleStatus | 'all';
}

// Public article endpoints (no auth required)
const PUBLIC_LIST_PATH = '/v1/articles/public';
const PUBLIC_SLUG_PATH = (slug: string) => `/v1/articles/public/slug/${slug}`;
const ADMIN_SLUG_PATH = (slug: string) => `/v1/articles/slug/${slug}`;
const TAGS_PATH = '/v1/articles/tags';
const SITEMAP_PATH = '/v1/articles/sitemap';

const normalizePage = (data: any, page: number, size: number): ArticleListResponse => {
  const content = data?.content ?? data?.items ?? [];
  const total = data?.totalElements ?? data?.total ?? 0;
  const respSize = data?.size ?? size;
  const respNumber = data?.number ?? page;
  return {
    items: content,
    total,
    limit: respSize,
    offset: respNumber * respSize,
  };
};

export const articleService = {
  async list(params?: ArticleListParams): Promise<ArticleListResponse> {
    const {
      page = 0,
      size = 20,
      sort = 'publishedAt,desc',
      tags,
      contentGroup,
    } = params || {};

    const query: Record<string, unknown> = { page, size, sort };
    if (tags?.length) {
      query.tags = tags;
    }
    if (contentGroup) {
      query.contentGroup = contentGroup;
    }

    const { data } = await api.get(PUBLIC_LIST_PATH, { params: query });
    return normalizePage(data, page, size);
  },

  async listAdmin(params?: ArticleAdminListParams): Promise<ArticleListResponse> {
    const {
      page = 0,
      size = 20,
      sort = 'publishedAt,desc',
      tags,
      contentGroup,
      status,
    } = params || {};

    const query: Record<string, unknown> = { page, size, sort };
    if (tags?.length) {
      query.tags = tags;
    }
    if (contentGroup) {
      query.contentGroup = contentGroup;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const { data } = await api.get('/v1/articles', { params: query });
    return normalizePage(data, page, size);
  },

  async getBySlug(slug: string): Promise<ArticleDto> {
    const { data } = await api.get<ArticleDto>(PUBLIC_SLUG_PATH(slug));
    return data;
  },

  // Admin (auth required) — supports drafts via includeDrafts=true
  async getAdminBySlug(slug: string, includeDrafts: boolean = true): Promise<ArticleDto> {
    const { data } = await api.get<ArticleDto>(ADMIN_SLUG_PATH(slug), { params: { includeDrafts } });
    return data;
  },

  async getTags(): Promise<ArticleTagSummary[]> {
    const { data } = await api.get<ArticleTagSummary[]>(TAGS_PATH);
    return data;
  },

  async getSitemap(): Promise<ArticleSitemapEntry[]> {
    const { data } = await api.get<ArticleSitemapEntry[]>(SITEMAP_PATH);
    return data;
  },

  // Admin (auth required)
  async create(payload: ArticleUpsertPayload): Promise<ArticleDto> {
    const { data } = await api.post<ArticleDto>('/v1/articles', payload);
    return data;
  },

  async update(articleId: string, payload: ArticleUpsertPayload): Promise<ArticleDto> {
    const { data } = await api.put<ArticleDto>(`/v1/articles/${articleId}`, payload);
    return data;
  },

  async delete(articleId: string): Promise<void> {
    await api.delete(`/v1/articles/${articleId}`);
  },
};
