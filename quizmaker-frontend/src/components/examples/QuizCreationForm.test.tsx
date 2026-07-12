import { describe, expect, it } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import QuizCreationForm from './QuizCreationForm';

describe('QuizCreationForm example', () => {
  it('renders all fields and reports local field validation errors', async () => {
    const { user } = renderWithProviders(<QuizCreationForm />, { withAuthProvider: false });

    expect(screen.getByRole('heading', { name: 'Create New Quiz' })).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Quiz' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Quiz Title'), 'ab');
    fireEvent.blur(screen.getByLabelText('Quiz Title'));

    await waitFor(() => {
      expect(screen.getAllByText('Quiz Title must be at least 3 characters')).toHaveLength(2);
    });
  });
});
