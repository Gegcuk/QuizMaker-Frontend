import { http, HttpResponse } from 'msw';
import type { UserDto } from '@/types';

export const testUser: UserDto = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'test-user',
  email: 'test-user@example.com',
  isActive: true,
  roles: ['ROLE_USER'],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockCurrentUserHandler = (user: UserDto = testUser) =>
  http.get('http://localhost:3000/api/v1/auth/me', ({ request }) => {
    if (!request.headers.get('authorization')) {
      return new HttpResponse(null, { status: 401 });
    }

    return HttpResponse.json(user);
  });

export const handlers = [];
