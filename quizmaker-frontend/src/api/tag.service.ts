// src/api/tag.service.ts
import api from './axiosInstance';
import { PageTagDto } from '../types/api';

type PageParams = { page: number; size?: number };

export const getAllTags = ({ page, size = 100 }: PageParams) =>
  api.get<PageTagDto>('/tags', { params: { page, size } });
