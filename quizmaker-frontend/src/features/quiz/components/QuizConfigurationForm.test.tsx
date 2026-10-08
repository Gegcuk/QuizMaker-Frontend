import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, within } from '@/test/render';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import api from '@/api/axiosInstance';
import { QuizService } from '../services/quiz.service';
import { getValidationErrors } from '@/utils/errorUtils';
import type { CreateQuizRequest } from '@/types';
import { QuizConfigurationForm } from './QuizConfigurationForm';

const quizData: Partial<CreateQuizRequest> = {
  title: 'Architecture foundations',
  description: 'A starter architecture quiz.',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  estimatedTime: 30,
  timerEnabled: false,
};

describe('QuizConfigurationForm', () => {
  it('renders the timerDuration error preserved by the real HTTP and service boundary in its existing field slot', async () => {
    server.use(http.post('*/api/v1/quizzes', () => HttpResponse.json({
      status: 422, errors: { timerDuration: ['seeded-private-value'], language: ['seeded-private-value'] },
    }, { status: 422 })));
    const failure: unknown = await new QuizService(api).createQuiz({
      title: 'Architecture foundations', visibility: 'PRIVATE', difficulty: 'MEDIUM',
      estimatedTime: 30, timerEnabled: true, timerDuration: 30, isRepetitionEnabled: false,
    }).catch((error: unknown) => error);
    const fieldErrors = getValidationErrors(failure);
    expect(fieldErrors?.language).toEqual(['Check this field and try again.']);
    renderWithProviders(<QuizConfigurationForm
      quizData={{ ...quizData, timerEnabled: true, timerDuration: 30 }}
      onDataChange={vi.fn()}
      errors={Object.fromEntries(Object.entries(fieldErrors ?? {}).map(([field, messages]) => [field, messages[0]]))}
      creationMethod="manual" onCreateQuiz={vi.fn()} isCreating={false}
    />, { withAuthProvider: false });
    const timerGroup = screen.getByText('Timer Duration (minutes) *').parentElement;
    expect(timerGroup).not.toBeNull();
    expect(within(timerGroup as HTMLElement).getByText('Check this field and try again.')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('seeded-private-value');
  });
  it('shows manual creation guidance and propagates changed quiz settings', async () => {
    const onDataChange = vi.fn();
    const onCreateQuiz = vi.fn();
    const { user } = renderWithProviders(
      <QuizConfigurationForm
        quizData={quizData}
        onDataChange={onDataChange}
        errors={{}}
        creationMethod="manual"
        onCreateQuiz={onCreateQuiz}
        isCreating={false}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Configure Your Manual Quiz' })).toBeInTheDocument();
    expect(screen.getByText(/add questions manually in the next step/)).toBeInTheDocument();

    const title = screen.getByPlaceholderText('Enter quiz title...');
    await user.clear(title);
    await user.type(title, 'Security foundations');
    await user.click(screen.getByRole('checkbox', { name: 'Enable Timer' }));

    expect(onDataChange).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Security foundations',
      timerEnabled: true,
    }));
    expect(screen.getByText('Timer Duration (minutes) *')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create Quiz & Continue' }));
    expect(onCreateQuiz).toHaveBeenCalledOnce();
  });

  it('keeps the creation action disabled while creation is in progress', () => {
    renderWithProviders(
      <QuizConfigurationForm
        quizData={quizData}
        onDataChange={vi.fn()}
        errors={{}}
        creationMethod="text"
        onCreateQuiz={vi.fn()}
        isCreating
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: /Creating Quiz/ })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Configure Your Text-Based Quiz' })).toBeInTheDocument();
  });
});
