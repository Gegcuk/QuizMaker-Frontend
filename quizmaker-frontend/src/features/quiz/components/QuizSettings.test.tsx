import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreateQuizRequest } from '@/types';
import QuizSettings from './QuizSettings';

const initialData: Partial<CreateQuizRequest> = {
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  estimatedTime: 30,
  timerEnabled: false,
  timerDuration: 15,
  isRepetitionEnabled: false,
};

const SettingsHarness = ({
  isEditing = true,
  onDataChange = vi.fn(),
}: {
  isEditing?: boolean;
  onDataChange?: (data: Partial<CreateQuizRequest>) => void;
}) => {
  const [quizData, setQuizData] = useState(initialData);

  const handleDataChange = (data: Partial<CreateQuizRequest>) => {
    setQuizData(data);
    onDataChange(data);
  };

  return <QuizSettings quizData={quizData} onDataChange={handleDataChange} isEditing={isEditing} />;
};

describe('QuizSettings', () => {
  it('keeps settings controls disabled outside edit mode', () => {
    renderWithProviders(<SettingsHarness isEditing={false} />, { withAuthProvider: false });

    expect(screen.getByRole('button', { name: /Private - Only you can see/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Medium - Balanced difficulty/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Enable Timer' })).toBeDisabled();
    expect(screen.getByLabelText(/Estimated Time/)).toBeDisabled();
  });

  it('updates visibility and timer settings with validation feedback', async () => {
    const onDataChange = vi.fn();
    const { user } = renderWithProviders(<SettingsHarness onDataChange={onDataChange} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Private - Only you can see/ }));
    await user.click(screen.getByRole('button', { name: /Public - Anyone can see/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Enable Timer' }));

    const timerDuration = screen.getByLabelText('Timer Duration (minutes)');
    await user.clear(timerDuration);
    await user.type(timerDuration, '0');

    expect(screen.getByText('Timer duration must be at least 1 minute')).toBeInTheDocument();
    expect(onDataChange).toHaveBeenLastCalledWith(expect.objectContaining({
      visibility: 'PUBLIC',
      timerEnabled: true,
      timerDuration: 0,
    }));
  });
});
