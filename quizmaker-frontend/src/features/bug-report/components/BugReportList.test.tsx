import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { BugReportDto } from '@/types';
import BugReportList from './BugReportList';

const bugReport: BugReportDto = {
  id: 'report-1',
  message: 'Saving a quiz fails after adding an image.',
  reporterName: 'Jane Doe',
  reporterEmail: 'jane@example.com',
  pageUrl: 'https://www.quizzence.com/quizzes/123/edit',
  stepsToReproduce: '1) Add image 2) Click save',
  clientVersion: 'web 1.2.3',
  clientIp: '203.0.113.10',
  severity: 'HIGH',
  status: 'OPEN',
  internalNote: 'Reproduced in Chrome.',
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T10:00:00Z',
};

describe('BugReportList', () => {
  it('renders report metadata, expands details, and forwards edit and delete actions', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { user } = renderWithProviders(
      <BugReportList bugReports={[bugReport]} onEdit={onEdit} onDelete={onDelete} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText(bugReport.message)).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('OPEN')).toBeInTheDocument();

    await user.click(screen.getByTitle('Expand details'));
    expect(screen.getByText('Steps to Reproduce')).toBeInTheDocument();
    expect(screen.getByText('Reproduced in Chrome.')).toBeInTheDocument();

    await user.click(screen.getByTitle('Edit bug report'));
    await user.click(screen.getByTitle('Delete bug report'));

    expect(onEdit).toHaveBeenCalledWith(bugReport);
    expect(onDelete).toHaveBeenCalledWith(bugReport.id);
  });

  it('shows the empty state when no reports are available', () => {
    renderWithProviders(<BugReportList bugReports={[]} />, { withAuthProvider: false });

    expect(screen.getByText('No bug reports found')).toBeInTheDocument();
    expect(screen.getByText('All bug reports have been resolved or dismissed.')).toBeInTheDocument();
  });
});
