import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  BugReportDto,
  BugReportPage,
  CreateBugReportRequest,
  UpdateBugReportRequest,
} from '../types/bug-report.types';
import { BUG_REPORT_ADMIN_ENDPOINTS, BUG_REPORT_ENDPOINTS } from './bug-report.endpoints';
import { BugReportService } from './bug-report.service';

const bugReport: BugReportDto = {
  id: '11111111-1111-1111-1111-111111111111',
  message: 'Saving a quiz fails after adding an image.',
  reporterName: 'Jane Doe',
  reporterEmail: 'jane@example.com',
  pageUrl: 'https://www.quizzence.com/quizzes/123/edit',
  stepsToReproduce: '1) Add image 2) Click save',
  clientVersion: 'web 1.2.3',
  clientIp: '203.0.113.10',
  severity: 'HIGH',
  status: 'OPEN',
  internalNote: null,
  createdAt: '2026-07-08T09:00:00Z',
  updatedAt: '2026-07-08T09:00:00Z',
};

const createPayload: CreateBugReportRequest = {
  message: 'Saving a quiz fails after adding an image.',
  reporterName: 'Jane Doe',
  reporterEmail: 'jane@example.com',
  pageUrl: 'https://www.quizzence.com/quizzes/123/edit',
  stepsToReproduce: '1) Add image 2) Click save',
  clientVersion: 'web 1.2.3',
  severity: 'HIGH',
};

const updatePayload: UpdateBugReportRequest = {
  status: 'IN_PROGRESS',
  severity: 'CRITICAL',
  internalNote: 'Investigating upload save path.',
};

const page: BugReportPage = {
  content: [bugReport],
  totalElements: 1,
  totalPages: 1,
  pageable: {
    paged: true,
    pageNumber: 2,
    pageSize: 5,
    offset: 10,
    sort: { sorted: true, unsorted: false, empty: false },
  },
  first: false,
  numberOfElements: 1,
  last: true,
  size: 5,
  number: 2,
  sort: { sorted: true, unsorted: false, empty: false },
  empty: false,
};

const problemError = (status: number, detail: string) => ({
  isAxiosError: true,
  message: 'Request failed',
  response: {
    status,
    data: {
      type: 'https://quizzence.com/docs/errors/validation-failed',
      title: status === 409 ? 'Conflict' : 'Request Failed',
      status,
      detail,
    },
  },
});

describe('bug report endpoint helpers', () => {
  it('matches deployed public and admin bug-report OpenAPI paths', () => {
    expect(BUG_REPORT_ENDPOINTS.SUBMIT).toBe('/v1/bug-reports');
    expect(BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORTS).toBe('/v1/admin/bug-reports');
    expect(BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORT_BY_ID('11111111-1111-1111-1111-111111111111')).toBe(
      '/v1/admin/bug-reports/11111111-1111-1111-1111-111111111111',
    );
    expect(BUG_REPORT_ADMIN_ENDPOINTS.BULK_DELETE).toBe('/v1/admin/bug-reports/bulk-delete');
  });
});

describe('BugReportService', () => {
  let axios: AxiosMock;
  let service: BugReportService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new BugReportService(axios.instance);
  });

  it('submits public bug reports with the deployed payload shape', async () => {
    const submissionResponse = { id: bugReport.id };
    axios.post.mockResolvedValue({ data: submissionResponse });

    await expect(service.submitBugReport(createPayload)).resolves.toBe(submissionResponse);

    expect(axios.post).toHaveBeenCalledWith('/v1/bug-reports', createPayload);
  });

  it('lists admin bug reports with deployed filters, pagination, and default sort', async () => {
    axios.get.mockResolvedValue({ data: page });

    await expect(service.listBugReports({
      page: 2,
      size: 5,
      status: 'OPEN',
      severity: 'HIGH',
    })).resolves.toBe(page);

    expect(axios.get).toHaveBeenCalledWith('/v1/admin/bug-reports', {
      params: {
        page: 2,
        size: 5,
        sort: ['createdAt,DESC'],
        status: 'OPEN',
        severity: 'HIGH',
      },
    });
  });

  it('uses explicit list sort values without rewriting caller intent', async () => {
    axios.get.mockResolvedValue({ data: page });

    await service.listBugReports({ sort: ['severity,DESC', 'createdAt,DESC'] });

    expect(axios.get).toHaveBeenCalledWith('/v1/admin/bug-reports', {
      params: {
        page: 0,
        size: 20,
        sort: ['severity,DESC', 'createdAt,DESC'],
      },
    });
  });

  it('covers deployed admin create, read, update, delete, and bulk-delete operations', async () => {
    axios.post
      .mockResolvedValueOnce({ data: bugReport })
      .mockResolvedValueOnce({});
    axios.get.mockResolvedValue({ data: bugReport });
    axios.patch.mockResolvedValue({ data: { ...bugReport, ...updatePayload } });
    axios.delete.mockResolvedValue({});

    await expect(service.createBugReport(createPayload)).resolves.toBe(bugReport);
    await expect(service.getBugReport(bugReport.id)).resolves.toBe(bugReport);
    await expect(service.updateBugReport(bugReport.id, updatePayload)).resolves.toMatchObject(updatePayload);
    await expect(service.deleteBugReport(bugReport.id)).resolves.toBeUndefined();
    await expect(service.bulkDelete([bugReport.id])).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/admin/bug-reports', createPayload);
    expect(axios.get).toHaveBeenCalledWith('/v1/admin/bug-reports/11111111-1111-1111-1111-111111111111');
    expect(axios.patch).toHaveBeenCalledWith(
      '/v1/admin/bug-reports/11111111-1111-1111-1111-111111111111',
      updatePayload,
    );
    expect(axios.delete).toHaveBeenCalledWith('/v1/admin/bug-reports/11111111-1111-1111-1111-111111111111');
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/admin/bug-reports/bulk-delete', [bugReport.id]);
  });

  it('preserves ProblemDetail detail for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Message is required.'))
      .mockRejectedValueOnce(problemError(409, 'Bug report was already updated.'));

    await expect(service.submitBugReport({ message: '' })).rejects.toThrow(
      'Validation error: Message is required.',
    );
    await expect(service.createBugReport(createPayload)).rejects.toThrow(
      'Conflict: Bug report was already updated.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions to manage bug reports'],
    [404, 'Bug report not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred while processing bug reports'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getBugReport(bugReport.id)).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.patch
      .mockRejectedValueOnce(problemError(403, 'Admin role required.'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.updateBugReport(bugReport.id, updatePayload)).rejects.toMatchObject({ status: 403 });
    await expect(service.updateBugReport(bugReport.id, updatePayload)).rejects.toThrow('Network unavailable');
  });
});
