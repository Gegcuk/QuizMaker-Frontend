// src/api/category.service.ts
import api from './axiosInstance';
import { CategoryDto, PageCategoryDto } from '../types/api';

/** Re-usable params type */
type PageParams = { page: number; size?: number };

export const getAllCategories = ({ page, size = 100 }: PageParams) =>
  api.get<PageCategoryDto>('/categories', { params: { page, size } });

export interface CategoryPayload {
  name: string;
  description?: string;
}

export const createCategory = <T = CategoryDto>(payload: CategoryPayload) =>
  api.post<T>('/categories', payload);

export const updateCategory = (categoryId: string, payload: CategoryPayload) =>
  api.patch<void>(`/categories/${categoryId}`, payload);

export const deleteCategory = (categoryId: string) =>
  api.delete<void>(`/categories/${categoryId}`);