import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { LeaderboardEntryDto } from '@/types';
import QuizLeaderboard from './QuizLeaderboard';

const entries: LeaderboardEntryDto[] = Array.from({ length: 12 }, (_, index) => ({
  userId: `user-${index + 1}`,
  username: `Participant ${index + 1}`,
  bestScore: 100 - index * 5,
}));

describe('QuizLeaderboard', () => {
  it('renders the top ten entries and can reveal all participants', async () => {
    const { user } = renderWithProviders(<QuizLeaderboard entries={entries} />, {
      withAuthProvider: false,
    });

    expect(screen.getByText('Participant 10')).toBeInTheDocument();
    expect(screen.queryByText('Participant 11')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show All' }));

    expect(screen.getByText('Participant 12')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show Top 10' })).toBeInTheDocument();
  });

  it('renders loading and empty states', () => {
    const { rerender } = renderWithProviders(<QuizLeaderboard entries={[]} isLoading />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    expect(screen.queryByText('No attempts yet')).not.toBeInTheDocument();

    rerender(<QuizLeaderboard entries={[]} />);

    expect(screen.getByText('No attempts yet')).toBeInTheDocument();
  });
});
