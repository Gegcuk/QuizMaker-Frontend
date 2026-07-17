import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import BugReportManagementPage from './BugReportManagementPage';

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}));

const serviceMocks = vi.hoisted(() => ({
  deleteBugReport: vi.fn(),
  listBugReports: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
  useAuth: authMocks.useAuth,
}));

vi.mock('../services/bug-report.service', () => ({
  bugReportService: {
    deleteBugReport: serviceMocks.deleteBugReport,
    listBugReports: serviceMocks.listBugReports,
  },
}));

const report = {
  id: 'report-1',
  message: 'Saving a quiz fails after adding an image.',
  reporterName: 'Jane Doe',
  reporterEmail: 'jane@example.com',
  severity: 'HIGH' as const,
  status: 'OPEN' as const,
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T10:00:00Z',
};

const page = {
  content: [report],
  totalElements: 1,
  totalPages: 1,
};

describe('BugReportManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.useAuth.mockReturnValue({ user: { roles: ['ROLE_SUPER_ADMIN'] } });
    serviceMocks.listBugReports.mockResolvedValue(page);
    serviceMocks.deleteBugReport.mockResolvedValue(undefined);
  });

  it('loads reports and applies a single status filter through the service', async () => {
    const { user } = renderWithProviders(<BugReportManagementPage />, {
      withAuthProvider: false,
    });

    expect(await screen.findByText(report.message)).toBeInTheDocument();
    expect(serviceMocks.listBugReports).toHaveBeenCalledWith({ page: 0, size: 20 });

    await user.click(screen.getByRole('button', { name: 'Filter' }));
    await user.click(screen.getByRole('button', { name: 'Open' }));

    await waitFor(() => {
      expect(serviceMocks.listBugReports).toHaveBeenLastCalledWith({
        page: 0,
        size: 20,
        status: 'OPEN',
      });
    });
  });

  it('requires confirmation before deleting a report and refreshes the list', async () => {
    const { user } = renderWithProviders(<BugReportManagementPage />, {
      withAuthProvider: false,
    });

    await screen.findByText(report.message);
    await user.click(screen.getByTitle('Delete bug report'));
    expect(screen.getByRole('dialog', { name: 'Delete Bug Report' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(serviceMocks.deleteBugReport).toHaveBeenCalledWith(report.id);
      expect(serviceMocks.listBugReports).toHaveBeenCalledTimes(2);
    });
  });

  it('keeps a load failure visible to the administrator', async () => {
    serviceMocks.listBugReports.mockRejectedValue({
      response: { data: { message: 'Reports are unavailable.' } },
    });

    renderWithProviders(<BugReportManagementPage />, { withAuthProvider: false });

    expect(await screen.findByText('Reports are unavailable.')).toBeInTheDocument();
  });
});
