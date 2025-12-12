import api from '@/api/axiosInstance';
import {
  ArticleDto,
  ArticleListResponse,
  ArticleResponse,
  ArticleStatus,
  ArticleTagSummary,
  ArticleSitemapEntry,
} from '../types';

export interface ArticleListParams {
  status?: ArticleStatus;
  tag?: string[];
  limit?: number;
  offset?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

// Public article endpoints (no auth required)
const PUBLIC_LIST_PATH = '/v1/articles/public';
const PUBLIC_SLUG_PATH = (slug: string) => `/v1/articles/public/slug/${slug}`;
const TAGS_PATH = '/v1/articles/tags';
const SITEMAP_PATH = '/v1/articles/sitemap';

export const articleService = {
  async list(params?: ArticleListParams): Promise<ArticleListResponse> {
    const { data } = await api.get<ArticleListResponse>(PUBLIC_LIST_PATH, { params });
    return data;
  },

  async getBySlug(slug: string): Promise<ArticleDto> {
    const { data } = await api.get<ArticleResponse>(PUBLIC_SLUG_PATH(slug));
    return data.article;
  },

  async getTags(): Promise<ArticleTagSummary[]> {
    const { data } = await api.get<ArticleTagSummary[]>(TAGS_PATH);
    return data;
  },

  async getSitemap(): Promise<ArticleSitemapEntry[]> {
    const { data } = await api.get<ArticleSitemapEntry[]>(SITEMAP_PATH);
    return data;
  },
};
