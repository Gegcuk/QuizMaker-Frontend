import type { AxiosInstance } from 'axios';
import { vi, type Mock } from 'vitest';

export interface AxiosMock {
  instance: AxiosInstance;
  delete: Mock;
  get: Mock;
  head: Mock;
  patch: Mock;
  post: Mock;
  put: Mock;
  request: Mock;
}

export const createAxiosMock = (): AxiosMock => {
  const methods = {
    delete: vi.fn(),
    get: vi.fn(),
    head: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    request: vi.fn(),
  };

  return {
    instance: methods as unknown as AxiosInstance,
    ...methods,
  };
};
