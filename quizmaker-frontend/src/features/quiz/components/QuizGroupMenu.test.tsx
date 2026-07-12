import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import QuizGroupMenu from './QuizGroupMenu';

const groupService = vi.hoisted(() => ({
  getQuizGroups: vi.fn(),
  addQuizzesToGroup: vi.fn(),
  removeQuizFromGroup: vi.fn(),
}));

vi.mock('../services', () => ({ quizGroupService: groupService }));

const groups = [
  {
    id: 'group-1',
    name: 'Current group',
    quizCount: 2,
    createdAt: '2026-07-12T09:00:00.000Z',
    updatedAt: '2026-07-12T09:00:00.000Z',
    quizPreviews: [{ id: 'quiz-1' }],
  },
  {
    id: 'group-2',
    name: 'Available group',
    quizCount: 0,
    createdAt: '2026-07-12T09:00:00.000Z',
    updatedAt: '2026-07-12T09:00:00.000Z',
    quizPreviews: [],
  },
];

describe('QuizGroupMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    groupService.getQuizGroups.mockResolvedValue({ content: groups });
    groupService.addQuizzesToGroup.mockResolvedValue(undefined);
    groupService.removeQuizFromGroup.mockResolvedValue(undefined);
  });

  it('loads membership, updates it, and opens group creation', async () => {
    const onGroupsChanged = vi.fn();
    const onOpenModal = vi.fn();
    const { user } = renderWithProviders(
      <QuizGroupMenu quizId="quiz-1" onGroupsChanged={onGroupsChanged} onOpenModal={onOpenModal} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Loading groups...')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Current group/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Current group/ }));
    await user.click(screen.getByRole('button', { name: /Available group/ }));
    await user.click(screen.getByRole('button', { name: 'Create New Group' }));

    await waitFor(() => {
      expect(groupService.removeQuizFromGroup).toHaveBeenCalledWith('group-1', 'quiz-1');
      expect(groupService.addQuizzesToGroup).toHaveBeenCalledWith('group-2', { quizIds: ['quiz-1'] });
    });
    expect(onGroupsChanged).toHaveBeenCalledTimes(2);
    expect(onOpenModal).toHaveBeenCalledOnce();
  });

  it('offers a retry when loading groups fails', async () => {
    groupService.getQuizGroups.mockRejectedValueOnce(new Error('unavailable'));
    const { user } = renderWithProviders(<QuizGroupMenu quizId="quiz-1" />, {
      withAuthProvider: false,
    });

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(groupService.getQuizGroups).toHaveBeenCalledTimes(2));
  });
});
