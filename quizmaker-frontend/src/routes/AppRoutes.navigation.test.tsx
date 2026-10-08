import { useLocation, useParams } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { act, renderWithProviders, screen, setTestAuthTokens, waitFor } from '@/test/render';
import { server } from '@/test/msw/server';
import { mockCurrentUserHandler } from '@/test/msw/handlers';
import AppRoutes from './AppRoutes';

vi.mock('../pages/QuizDetailPage', () => ({
  default: function QuizDestinationProbe() {
    const { quizId } = useParams();
    const location = useLocation();
    return <p>Quiz {quizId}{location.search}</p>;
  },
}));
vi.mock('../features/quiz/components/MyQuizzesPage', () => ({ default: () => <p>My quiz library</p> }));
const mockLogin = () => server.use(
  mockCurrentUserHandler(),
  http.post('http://localhost:3000/api/v1/auth/login', () => HttpResponse.json({
    accessToken: 'fixture-access', refreshToken: 'fixture-refresh',
  })),
);

describe('protected Questions destination through login', () => {
  it('interpolates the real quiz ID for an authenticated deep link', async () => {
    setTestAuthTokens();
    server.use(mockCurrentUserHandler());
    const { router } = renderWithProviders(<AppRoutes />, { route: '/quizzes/quiz-123/questions?keep=value#question-4' });
    expect(await screen.findByText('Quiz quiz-123?keep=value&tab=questions')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/quizzes/quiz-123');
    expect(router.state.location.search).toBe('?keep=value&tab=questions');
    expect(router.state.location.hash).toBe('#question-4');
  });

  it('preserves the protected destination, consumes it on success, and does not reuse it at ordinary login', async () => {
    mockLogin();
    const { user, router } = renderWithProviders(<AppRoutes />, { route: '/quizzes/quiz-123/questions' });
    await screen.findByLabelText('Username or Email');
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.state).toEqual({ returnTo: '/quizzes/quiz-123/questions' });
    await user.type(screen.getByLabelText('Username or Email'), 'author');
    await user.type(screen.getByLabelText('Password'), 'FixturePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Quiz quiz-123?tab=questions')).toBeInTheDocument();
    expect(router.state.location.state).toBeNull();
    await act(async () => { await router.navigate('/login'); });
    expect(await screen.findByText('My quiz library')).toBeInTheDocument();
    expect(router.state.location.state).toBeNull();
  });

  it('keeps the return target after failed credentials and returns after a successful retry', async () => {
    mockLogin();
    server.use(http.post('http://localhost:3000/api/v1/auth/login', () => new HttpResponse(null, { status: 401 }), { once: true }));
    const { user, router } = renderWithProviders(<AppRoutes />, { route: '/quizzes/quiz-123?tab=questions#question-4' });
    await user.type(await screen.findByLabelText('Username or Email'), 'author');
    await user.type(screen.getByLabelText('Password'), 'FixturePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Authentication required. Please sign in again.')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ returnTo: '/quizzes/quiz-123?tab=questions#question-4' });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Quiz quiz-123?tab=questions')).toBeInTheDocument();
    expect(router.state.location.hash).toBe('#question-4');
    expect(router.state.location.state).toBeNull();
  });

  it('uses the normal default for ordinary successful login', async () => {
    mockLogin();
    const { user, router } = renderWithProviders(<AppRoutes />, { route: '/login' });
    await user.type(await screen.findByLabelText('Username or Email'), 'author');
    await user.type(screen.getByLabelText('Password'), 'FixturePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('My quiz library')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/my-quizzes');
  });

  it('retains the destination when validating the new session fails, then consumes it after retry', async () => {
    mockLogin();
    server.use(http.get('http://localhost:3000/api/v1/auth/me', () => new HttpResponse(null, { status: 503 }), { once: true }));
    const { user, router } = renderWithProviders(<AppRoutes />, { route: '/quizzes/quiz-123?tab=questions#question-4' });
    await user.type(await screen.findByLabelText('Username or Email'), 'author');
    await user.type(screen.getByLabelText('Password'), 'FixturePassword1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Authentication required. Please sign in again.')).toBeInTheDocument();
    expect(router.state.location.state).toEqual({ returnTo: '/quizzes/quiz-123?tab=questions#question-4' });
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Quiz quiz-123?tab=questions')).toBeInTheDocument();
    expect(router.state.location.hash).toBe('#question-4');
    expect(router.state.location.state).toBeNull();
  });

  it('rejects a callback-loop destination at the authenticated login boundary', async () => {
    setTestAuthTokens();
    server.use(mockCurrentUserHandler());
    const { router } = renderWithProviders(<AppRoutes />, { route: '/' });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument());
    await act(async () => { await router.navigate('/login', { state: { returnTo: '/oauth2/redirect/?code=canary' } }); });
    expect(await screen.findByText('My quiz library')).toBeInTheDocument();
    expect(router.state.location.state).toBeNull();
  });
});
