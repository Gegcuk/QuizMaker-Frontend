import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type { AvatarUploadResponse, UserProfileResponse } from '@/types';
import { UserService } from './user.service';

const profile: UserProfileResponse = {
  id: 'user-1',
  username: 'architect',
  email: 'architect@example.com',
  displayName: 'Architecture Lead',
  bio: 'Designs software systems.',
  avatarUrl: 'https://cdn.example.com/avatar.png',
  preferences: { theme: 'light' },
  joinedAt: '2026-07-08T09:00:00Z',
  verified: true,
  roles: ['ROLE_USER'],
  version: 3,
};

const avatarResponse: AvatarUploadResponse = {
  avatarUrl: 'https://cdn.example.com/avatar-new.png',
  message: 'Avatar updated successfully',
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 409 ? 'Conflict' : 'Request Failed',
      status,
      detail,
    },
  },
});

describe('UserService', () => {
  let axios: AxiosMock;
  let service: UserService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new UserService(axios.instance);
  });

  it('loads the authenticated user profile from the deployed profile endpoint', async () => {
    axios.get.mockResolvedValue({ data: profile });

    await expect(service.getUserProfile()).resolves.toBe(profile);

    expect(axios.get).toHaveBeenCalledWith('/v1/users/me');
  });

  it('patches profile fields with the deployed merge-patch endpoint', async () => {
    const update = {
      displayName: 'Updated Architect',
      bio: 'Updated bio',
      preferences: { theme: 'dark' },
    };
    axios.patch.mockResolvedValue({
      data: { ...profile, ...update, version: 4 },
    });

    await expect(service.updateUserProfile(update)).resolves.toMatchObject({
      displayName: 'Updated Architect',
      bio: 'Updated bio',
      version: 4,
    });

    expect(axios.patch).toHaveBeenCalledWith('/v1/users/me', update);
  });

  it('uploads avatars as multipart form data with the shared upload flag', async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    axios.post.mockResolvedValue({ data: avatarResponse });

    await expect(service.uploadAvatar(file)).resolves.toBe(avatarResponse);

    expect(axios.post).toHaveBeenCalledWith(
      '/v1/users/me/avatar',
      expect.any(FormData),
      { _isFileUpload: true },
    );
    const formData = axios.post.mock.calls[0][1] as FormData;
    expect(formData.get('file')).toBe(file);
  });

  it('does not expose unsupported generic service operations', () => {
    const serviceSurface = service as unknown as Record<string, unknown>;

    expect(serviceSurface.getAll).toBeUndefined();
    expect(serviceSurface.getUserById).toBeUndefined();
    expect(serviceSurface.create).toBeUndefined();
    expect(serviceSurface.update).toBeUndefined();
    expect(serviceSurface.search).toBeUndefined();
    expect(serviceSurface.activateUser).toBeUndefined();
    expect(serviceSurface.deactivateUser).toBeUndefined();
    expect(serviceSurface.bulkActivateUsers).toBeUndefined();
    expect(serviceSurface.bulkDeactivateUsers).toBeUndefined();
    expect(serviceSurface.bulkCreate).toBeUndefined();
    expect(serviceSurface.bulkUpdate).toBeUndefined();
    expect(serviceSurface.bulkDelete).toBeUndefined();
    expect(serviceSurface.count).toBeUndefined();
    expect(serviceSurface.export).toBeUndefined();
  });

  it('preserves ProblemDetail detail for validation and conflict failures', async () => {
    axios.patch
      .mockRejectedValueOnce(problemError(400, 'Display name is too long.'))
      .mockRejectedValueOnce(problemError(409, 'Profile was updated by another request.'));

    await expect(service.updateUserProfile({ displayName: 'x'.repeat(300) })).rejects.toThrow(
      'Validation error: Display name is too long.',
    );
    await expect(service.updateUserProfile({ displayName: 'Architect' })).rejects.toThrow(
      'Conflict: Profile was updated by another request.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'User not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getUserProfile()).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(401, 'Login required'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.uploadAvatar(new File(['x'], 'x.png'))).rejects.toMatchObject({ status: 401 });
    await expect(service.uploadAvatar(new File(['x'], 'x.png'))).rejects.toThrow('Network unavailable');
  });
});
