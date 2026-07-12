import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreateQuizRequest } from '@/types';
import QuizBasicInfo from './QuizBasicInfo';

const initialData: Partial<CreateQuizRequest> = {
  title: 'Architecture Quiz',
  description: 'A quiz about software architecture.',
};

const BasicInfoHarness = ({
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

  return <QuizBasicInfo quizData={quizData} onDataChange={handleDataChange} isEditing={isEditing} />;
};

describe('QuizBasicInfo', () => {
  it('keeps basic fields read-only outside edit mode', () => {
    renderWithProviders(<BasicInfoHarness isEditing={false} />, { withAuthProvider: false });

    expect(screen.getByLabelText(/Quiz Title/)).toBeDisabled();
    expect(screen.getByLabelText('Description')).toBeDisabled();
  });

  it('updates the preview and validates the title while editing', async () => {
    const onDataChange = vi.fn();
    const { user } = renderWithProviders(<BasicInfoHarness onDataChange={onDataChange} />, {
      withAuthProvider: false,
    });
    const title = screen.getByLabelText(/Quiz Title/);

    await user.clear(title);
    await user.type(title, 'AI');

    expect(screen.getByText('Quiz title must be at least 3 characters')).toBeInTheDocument();

    await user.type(title, ' Governance');
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'A governance quiz for engineering teams.');

    expect(onDataChange).toHaveBeenLastCalledWith({
      title: 'AI Governance',
      description: 'A governance quiz for engineering teams.',
    });
    expect(screen.getByRole('heading', { name: 'AI Governance' })).toBeInTheDocument();
    expect(screen.queryByText('Quiz title must be at least 3 characters')).not.toBeInTheDocument();
  });
});
