import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AdminWorkspacePage from './AdminWorkspacePage';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const adminServiceMocks = vi.hoisted(() => ({
  approveQuiz: vi.fn(),
  getEmailProviderStatus: vi.fn(),
  getPendingReviewQuizzes: vi.fn(),
  getQuizModerationAudits: vi.fn(),
  rejectQuiz: vi.fn(),
  testPasswordResetEmail: vi.fn(),
  testVerificationEmail: vi.fn(),
  unpublishQuiz: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock('@/features/admin', () => ({
  adminService: adminServiceMocks,
}));

vi.mock('@/features/seo', () => ({
  Seo: () => null,
}));

const organizationId = '00000000-0000-4000-8000-000000000001';
const pendingQuiz = {
  id: '00000000-0000-4000-8000-000000000010',
  title: 'Software architecture review',
  creatorId: '00000000-0000-4000-8000-000000000011',
  createdAt: '2026-07-14T12:00:00Z',
};

const renderAdminWorkspace = () =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin"
        element={(
          <ProtectedRoute requiredRoles={['ROLE_MODERATOR', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']}>
            <AdminWorkspacePage />
          </ProtectedRoute>
        )}
      />
      <Route path="/" element={<p>Home</p>} />
      <Route path="/login" element={<p>Login</p>} />
    </Routes>,
    { route: '/admin', withAuthProvider: false },
  );

describe('AdminWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: {
        email: 'admin@example.com',
        roles: ['ROLE_ADMIN'],
      },
    });
    adminServiceMocks.getEmailProviderStatus.mockResolvedValue({
      providerClass: 'AwsSesEmailService',
      isNoop: false,
      isSes: true,
      isSmtp: false,
    });
    adminServiceMocks.getPendingReviewQuizzes.mockResolvedValue([]);
    adminServiceMocks.getQuizModerationAudits.mockResolvedValue([]);
    adminServiceMocks.approveQuiz.mockResolvedValue(undefined);
    adminServiceMocks.rejectQuiz.mockResolvedValue(undefined);
    adminServiceMocks.unpublishQuiz.mockResolvedValue(undefined);
    adminServiceMocks.testPasswordResetEmail.mockResolvedValue('Password reset test email sent.');
    adminServiceMocks.testVerificationEmail.mockResolvedValue('Verification test email sent.');
  });

  it('loads admin-only email diagnostics and sends an explicitly confirmed test email', async () => {
    const { user } = renderAdminWorkspace();

    expect(await screen.findByText('Amazon SES')).toBeInTheDocument();
    expect(adminServiceMocks.getEmailProviderStatus).toHaveBeenCalledOnce();

    await user.clear(screen.getByLabelText('Test recipient'));
    await user.type(screen.getByLabelText('Test recipient'), 'recipient@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));

    expect(screen.getByRole('dialog', { name: 'Send test email' })).toHaveTextContent('recipient@example.com');
    await user.click(screen.getByRole('button', { name: 'Send email' }));

    await waitFor(() => {
      expect(adminServiceMocks.testPasswordResetEmail).toHaveBeenCalledWith('recipient@example.com');
    });

    await user.click(screen.getByRole('button', { name: 'Send verification email' }));
    await user.click(screen.getByRole('button', { name: 'Send email' }));

    await waitFor(() => {
      expect(adminServiceMocks.testVerificationEmail).toHaveBeenCalledWith('recipient@example.com');
    });
  });

  it('keeps the email confirmation open and reports a failed delivery', async () => {
    adminServiceMocks.testPasswordResetEmail.mockRejectedValue(new Error('Email provider rejected the request.'));
    const { user } = renderAdminWorkspace();

    await screen.findByText('Amazon SES');
    await user.clear(screen.getByLabelText('Test recipient'));
    await user.type(screen.getByLabelText('Test recipient'), 'recipient@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));
    await user.click(screen.getByRole('button', { name: 'Send email' }));

    expect(await screen.findByText('Email provider rejected the request.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Send test email' })).toBeInTheDocument();
    expect(adminServiceMocks.testPasswordResetEmail).toHaveBeenCalledWith('recipient@example.com');
  });

  it('shows an email diagnostics failure without exposing stale provider details', async () => {
    adminServiceMocks.getEmailProviderStatus.mockRejectedValue(new Error('Insufficient permissions'));

    renderAdminWorkspace();

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('Amazon SES')).not.toBeInTheDocument();
  });

  it('validates the organization UUID before requesting a moderation queue', async () => {
    const { user } = renderAdminWorkspace();

    await user.type(screen.getByLabelText('Organization UUID'), 'not-a-uuid');
    await user.click(screen.getByRole('button', { name: 'Load review queue' }));

    expect(await screen.findByText('Enter a valid organization UUID before loading the review queue.')).toBeInTheDocument();
    expect(adminServiceMocks.getPendingReviewQuizzes).not.toHaveBeenCalled();
  });

  it('loads the queue, exposes an audit trail, and confirms a rejection with its reason', async () => {
    adminServiceMocks.getPendingReviewQuizzes.mockResolvedValue([pendingQuiz]);
    adminServiceMocks.getQuizModerationAudits.mockResolvedValue([
      {
        id: '00000000-0000-4000-8000-000000000012',
        quizId: pendingQuiz.id,
        moderatorId: '00000000-0000-4000-8000-000000000013',
        action: 'SUBMIT',
        reason: 'Ready for review.',
        createdAt: '2026-07-14T12:30:00Z',
      },
    ]);
    const { user } = renderAdminWorkspace();

    await user.type(screen.getByLabelText('Organization UUID'), organizationId);
    await user.click(screen.getByRole('button', { name: 'Load review queue' }));

    expect(await screen.findByText(pendingQuiz.title)).toBeInTheDocument();
    expect(adminServiceMocks.getPendingReviewQuizzes).toHaveBeenCalledWith(organizationId);

    await user.click(screen.getByRole('button', { name: 'View audit' }));
    expect(await screen.findByText('Ready for review.')).toBeInTheDocument();
    expect(adminServiceMocks.getQuizModerationAudits).toHaveBeenCalledWith(pendingQuiz.id);

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Rejection reason'), 'Missing source attribution.');
    await user.click(screen.getByRole('button', { name: 'Reject quiz' }));

    await waitFor(() => {
      expect(adminServiceMocks.rejectQuiz).toHaveBeenCalledWith(pendingQuiz.id, 'Missing source attribution.');
    });
    expect(screen.queryByText(pendingQuiz.title)).not.toBeInTheDocument();
  });

  it('does not submit a rejection until its required reason is provided', async () => {
    adminServiceMocks.getPendingReviewQuizzes.mockResolvedValue([pendingQuiz]);
    const { user } = renderAdminWorkspace();

    await user.type(screen.getByLabelText('Organization UUID'), organizationId);
    await user.click(screen.getByRole('button', { name: 'Load review queue' }));
    await screen.findByText(pendingQuiz.title);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.type(screen.getByLabelText('Rejection reason'), ' ');
    await user.click(screen.getByRole('button', { name: 'Reject quiz' }));

    expect(await screen.findByText('A rejection reason is required.')).toBeInTheDocument();
    expect(adminServiceMocks.rejectQuiz).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Reject quiz' })).toBeInTheDocument();
  });

  it('shows normalized queue failures without leaving stale moderation data visible', async () => {
    adminServiceMocks.getPendingReviewQuizzes.mockRejectedValue(new Error('Insufficient permissions'));
    const { user } = renderAdminWorkspace();

    await user.type(screen.getByLabelText('Organization UUID'), organizationId);
    await user.click(screen.getByRole('button', { name: 'Load review queue' }));

    expect(await screen.findByText('Insufficient permissions')).toBeInTheDocument();
    expect(screen.queryByText('No quizzes currently await moderation.')).not.toBeInTheDocument();
  });

  it('permits moderators into the workspace without exposing admin-only email controls', () => {
    authMocks.useAuth.mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { roles: ['ROLE_MODERATOR'] },
    });

    renderAdminWorkspace();

    expect(screen.getByRole('heading', { name: 'Quiz moderation' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Email diagnostics' })).not.toBeInTheDocument();
    expect(adminServiceMocks.getEmailProviderStatus).not.toHaveBeenCalled();
  });

  it('redirects users without a moderation role before rendering the workspace', () => {
    authMocks.useAuth.mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { roles: ['ROLE_USER'] },
    });

    renderAdminWorkspace();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Administration' })).not.toBeInTheDocument();
  });
});
