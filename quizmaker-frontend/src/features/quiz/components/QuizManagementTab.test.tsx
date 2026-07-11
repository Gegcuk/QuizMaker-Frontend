import { useState } from 'react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { CreateQuizRequest } from '@/types';
import QuizManagementTab from './QuizManagementTab';

const initialQuizData: Partial<CreateQuizRequest> = {
  title: 'Architecture Quiz',
  description: 'A quiz about software architecture.',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  estimatedTime: 20,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 30,
  tagIds: [],
};

const QuizManagementHarness = ({
  isEditing = true,
  onDataChange = vi.fn(),
}: {
  isEditing?: boolean;
  onDataChange?: Mock;
}) => {
  const [quizData, setQuizData] = useState(initialQuizData);

  const handleDataChange = (nextData: Partial<CreateQuizRequest>) => {
    setQuizData(nextData);
    onDataChange(nextData);
  };

  return (
    <QuizManagementTab
      quizData={quizData}
      onDataChange={handleDataChange}
      isEditing={isEditing}
    />
  );
};

describe('QuizManagementTab', () => {
  it('keeps quiz fields read-only outside edit mode', () => {
    renderWithProviders(<QuizManagementHarness isEditing={false} />, { withAuthProvider: false });

    expect(screen.getByLabelText('Quiz Title')).toBeDisabled();
    expect(screen.getByLabelText('Description')).toBeDisabled();
    expect(screen.getByLabelText('Estimated Time (minutes)')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Private' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Medium' })).toBeDisabled();
  });

  it('updates basic details and quiz settings through controlled state', async () => {
    const onDataChange = vi.fn();
    const { user } = renderWithProviders(
      <QuizManagementHarness onDataChange={onDataChange} />,
      { withAuthProvider: false },
    );

    await user.clear(screen.getByLabelText('Quiz Title'));
    await user.type(screen.getByLabelText('Quiz Title'), 'Security Quiz');
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'A quiz about application security.');
    await user.click(screen.getByRole('button', { name: 'Private' }));
    await user.click(screen.getByRole('button', { name: 'Public' }));
    await user.click(screen.getByRole('button', { name: 'Medium' }));
    await user.click(screen.getByRole('button', { name: 'Hard' }));
    await user.clear(screen.getByLabelText('Estimated Time (minutes)'));
    await user.type(screen.getByLabelText('Estimated Time (minutes)'), '45');

    await waitFor(() => {
      expect(onDataChange).toHaveBeenLastCalledWith(expect.objectContaining({
        title: 'Security Quiz',
        description: 'A quiz about application security.',
        visibility: 'PUBLIC',
        difficulty: 'HARD',
        estimatedTime: 45,
      }));
    });
  });

  it('reports and clears invalid estimated-time input', async () => {
    const { user } = renderWithProviders(<QuizManagementHarness />, { withAuthProvider: false });
    const estimatedTime = screen.getByLabelText('Estimated Time (minutes)');

    await user.clear(estimatedTime);
    await user.type(estimatedTime, '0');
    expect(screen.getByText('Estimated time must be at least 1 minute')).toBeInTheDocument();

    await user.clear(estimatedTime);
    await user.type(estimatedTime, '15');
    expect(screen.queryByText('Estimated time must be at least 1 minute')).not.toBeInTheDocument();
  });
});
