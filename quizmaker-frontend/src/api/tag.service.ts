// src/api/tag.service.ts
import api from './axiosInstance';
import { PageTagDto, TagDto } from '../types/api';

type PageParams = { page: number; size?: number };

export const getAllTags = ({ page, size = 100 }: PageParams) =>
  api.get<PageTagDto>('/tags', { params: { page, size } });

export interface TagPayload {
  name: string;
  description?: string;
}

export const createTag = <T = TagDto>(payload: TagPayload) =>
  api.post<T>('/tags', payload);

export const updateTag = (tagId: string, payload: TagPayload) =>
  api.patch<void>(`/tags/${tagId}`, payload);

export const deleteTag = (tagId: string) => api.delete<void>(`/tags/${tagId}`);