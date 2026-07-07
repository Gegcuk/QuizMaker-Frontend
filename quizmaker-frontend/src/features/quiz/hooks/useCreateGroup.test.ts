import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCreateGroup } from './useCreateGroup';

const mocks = vi.hoisted(() => ({
  addQuizzesToGroup: vi.fn(),
  addToast: vi.fn(),
  createQuizGroup: vi.fn(),
}));

vi.mock('../services', () => ({
  quizGroupService: {
    addQuizzesToGroup: mocks.addQuizzesToGroup,
    createQuizGroup: mocks.createQuizGroup,
  },
}));

vi.mock('@/components', () => ({
  useToast: () => ({ addToast: mocks.addToast }),
}));

describe('useCreateGroup', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates a standalone group and invokes the success callback', async () => {
    const onSuccess = vi.fn();
    mocks.createQuizGroup.mockResolvedValue('group-1');
    const { result } = renderHook(() => useCreateGroup({ onSuccess }));

    await expect(
      result.current.handleCreateGroup({ name: 'Architecture' }),
    ).resolves.toBe('group-1');

    expect(mocks.addQuizzesToGroup).not.toHaveBeenCalled();
    expect(mocks.addToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Group created successfully',
    });
    expect(onSuccess).toHaveBeenCalledWith('group-1');
  });

  it('adds the requested quiz after group creation', async () => {
    mocks.createQuizGroup.mockResolvedValue('group-1');
    mocks.addQuizzesToGroup.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCreateGroup({ quizId: 'quiz-1' }));

    await result.current.handleCreateGroup({ name: 'Architecture' });

    expect(mocks.addQuizzesToGroup).toHaveBeenCalledWith('group-1', {
      quizIds: ['quiz-1'],
    });
    expect(mocks.addToast).toHaveBeenCalledWith({
      type: 'success',
      message: 'Group created and quiz added',
    });
  });

  it('keeps the created group and reports a partial quiz-add failure', async () => {
    mocks.createQuizGroup.mockResolvedValue('group-1');
    mocks.addQuizzesToGroup.mockRejectedValue({
      response: {
        data: {
          title: 'Validation Failed',
          status: 400,
          detail: 'Quiz is already in this group.',
        },
      },
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useCreateGroup({ quizId: 'quiz-1', onSuccess }),
    );

    await expect(
      result.current.handleCreateGroup({ name: 'Architecture' }),
    ).resolves.toBe('group-1');

    expect(mocks.addToast).toHaveBeenCalledWith({
      type: 'warning',
      message:
        'Group created but failed to add quiz: Quiz is already in this group. You can add it manually.',
    });
    expect(onSuccess).toHaveBeenCalledWith('group-1');
  });

  it.each(['', '   ', 'undefined', 'null'])('rejects invalid group ID %j', async groupId => {
    mocks.createQuizGroup.mockResolvedValue(groupId);
    const { result } = renderHook(() => useCreateGroup());

    await expect(
      result.current.handleCreateGroup({ name: 'Architecture' }),
    ).rejects.toThrow('Invalid group ID returned from API');
    expect(mocks.addToast).toHaveBeenCalledWith({
      type: 'error',
      message: 'Failed to create group: Invalid group ID returned',
    });
  });
});
