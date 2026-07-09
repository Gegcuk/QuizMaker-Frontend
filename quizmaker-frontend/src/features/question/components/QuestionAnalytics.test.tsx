import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import QuestionAnalytics from './QuestionAnalytics';

describe('QuestionAnalytics', () => {
  it('renders the available performance metrics and switches time ranges', async () => {
    const { user } = renderWithProviders(
      <QuestionAnalytics questionId="question-1" />,
      { withAuthProvider: false },
    );

    await screen.findByText('Performance metrics and insights');

    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('124')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('0m 45s')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Last 30 days' }));
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));

    expect(screen.getByRole('button', { name: 'Last 7 days' })).toBeInTheDocument();
  });
});
