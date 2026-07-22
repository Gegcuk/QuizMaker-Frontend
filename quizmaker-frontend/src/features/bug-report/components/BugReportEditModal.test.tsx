import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { BugReportDto } from '@/types';
import BugReportEditModal from './BugReportEditModal';

const serviceMocks = vi.hoisted(() => ({
  updateBugReport: vi.fn(),
}));

vi.mock('../services/bug-report.service', () => ({
  bugReportService: {
    updateBugReport: serviceMocks.updateBugReport,
  },
}));

const bugReport: BugReportDto = {
  id: 'report-1',
  message: 'Saving a quiz fails after adding an image.',
  reporterName: 'Jane Doe',
  reporterEmail: 'jane@example.com',
  pageUrl: 'https://www.quizzence.com/quizzes/123/edit',
  stepsToReproduce: '1) Add image 2) Click save',
  clientVersion: 'web 1.2.3',
  severity: 'HIGH',
  status: 'OPEN',
  internalNote: 'Reproduced in Chrome.',
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T10:00:00Z',
};

describe('BugReportEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.updateBugReport.mockResolvedValue(bugReport);
  });

  it('loads existing details and submits the edited report', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    const { user } = renderWithProviders(
      <BugReportEditModal isOpen bugReport={bugReport} onClose={onClose} onSuccess={onSuccess} />,
      { withAuthProvider: false },
    );

    const message = screen.getByLabelText('What happened?');
    expect(message).toHaveValue(bugReport.message);
    expect(screen.getByLabelText('Internal Note')).toHaveValue('Reproduced in Chrome.');

    await user.clear(message);
    await user.type(message, 'Saving a quiz fails after editing an image.');
    await user.click(screen.getByRole('button', { name: 'Update report' }));

    await waitFor(() => {
      expect(serviceMocks.updateBugReport).toHaveBeenCalledWith(
        bugReport.id,
        expect.objectContaining({
          message: 'Saving a quiz fails after editing an image.',
          reporterName: 'Jane Doe',
          reporterEmail: 'jane@example.com',
          severity: 'HIGH',
          status: 'OPEN',
          internalNote: 'Reproduced in Chrome.',
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('requires a message before updating a report', async () => {
    const { user } = renderWithProviders(
      <BugReportEditModal isOpen bugReport={bugReport} onClose={vi.fn()} onSuccess={vi.fn()} />,
      { withAuthProvider: false },
    );

    await user.clear(screen.getByLabelText('What happened?'));
    await user.click(screen.getByRole('button', { name: 'Update report' }));

    expect(await screen.findByText('Message is required.')).toBeInTheDocument();
    expect(serviceMocks.updateBugReport).not.toHaveBeenCalled();
  });

  it('keeps a service failure visible and does not close the modal', async () => {
    serviceMocks.updateBugReport.mockRejectedValue(new Error('Update is unavailable.'));
    const onClose = vi.fn();
    const { user } = renderWithProviders(
      <BugReportEditModal isOpen bugReport={bugReport} onClose={onClose} onSuccess={vi.fn()} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Update report' }));

    expect((await screen.findAllByText('Update is unavailable.')).length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
  });
});
