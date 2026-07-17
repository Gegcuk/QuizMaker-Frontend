import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import BugReportModal from './BugReportModal';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  submitBugReport: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock('../services/bug-report.service', () => ({
  bugReportService: {
    submitBugReport: serviceMocks.submitBugReport,
  },
}));

describe('BugReportModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    });
    serviceMocks.submitBugReport.mockResolvedValue({ id: 'report-1' });
  });

  it('submits a concise report using the authenticated reporter details', async () => {
    const onClose = vi.fn();
    const { user } = renderWithProviders(<BugReportModal isOpen onClose={onClose} />, {
      withAuthProvider: false,
    });

    await user.type(
      screen.getByLabelText('What happened?'),
      'The quiz editor loses my changes after saving.',
    );
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    await waitFor(() => {
      expect(serviceMocks.submitBugReport).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The quiz editor loses my changes after saving.',
          reporterName: 'Ada Lovelace',
          reporterEmail: 'ada@example.com',
        }),
      );
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('requires a message before sending a report', async () => {
    const { user } = renderWithProviders(<BugReportModal isOpen onClose={vi.fn()} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: 'Send report' }));

    expect(
      await screen.findByText('Please add a quick note about what went wrong.'),
    ).toBeInTheDocument();
    expect(serviceMocks.submitBugReport).not.toHaveBeenCalled();
  });

  it('reveals optional diagnostic fields and keeps a submission error visible', async () => {
    serviceMocks.submitBugReport.mockRejectedValue(new Error('Bug reports are unavailable.'));
    const onClose = vi.fn();
    const { user } = renderWithProviders(<BugReportModal isOpen onClose={onClose} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /add more detail/i }));
    expect(screen.getByLabelText('Page URL')).toBeInTheDocument();
    expect(screen.getByLabelText('Steps to reproduce')).toBeInTheDocument();

    await user.type(screen.getByLabelText('What happened?'), 'The report form cannot submit.');
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    expect((await screen.findAllByText('Bug reports are unavailable.')).length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
  });
});
