// src/api/category.service.ts
import api from './axiosInstance';
import { PageCategoryDto } from '../types/api';

/** Re-usable params type */
type PageParams = { page: number; size?: number };

export const getAllCategories = ({ page, size = 100 }: PageParams) =>
  api.get<PageCategoryDto>('/categories', { params: { page, size } });
