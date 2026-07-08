import { isAxiosError, type AxiosInstance, type AxiosResponse } from 'axios';
import { BUG_REPORT_ADMIN_ENDPOINTS, BUG_REPORT_ENDPOINTS } from './bug-report.endpoints';
import {
  BugReportDto,
  BugReportListParams,
  BugReportPage,
  BugReportSubmissionResponse,
  CreateBugReportRequest,
  UpdateBugReportRequest,
} from '../types/bug-report.types';
import api from '@/api/axiosInstance';
import { getErrorMessage } from '@/utils/errorUtils';

type BugReportServiceError = Error & {
  status?: number;
  response?: AxiosResponse;
};

/**
 * Service for bug report submission and admin management
 * Implements endpoints from the bug-reports API group
 */
export class BugReportService {
  protected axiosInstance: AxiosInstance;

  constructor(axiosInstance: AxiosInstance) {
    this.axiosInstance = axiosInstance;
  }

  /**
   * Submit a bug report (public endpoint)
   * POST /api/v1/bug-reports
   */
  async submitBugReport(payload: CreateBugReportRequest): Promise<BugReportSubmissionResponse> {
    try {
      const response = await this.axiosInstance.post<BugReportSubmissionResponse>(
        BUG_REPORT_ENDPOINTS.SUBMIT,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * List bug reports with optional status/severity filters (admin)
   * GET /api/v1/admin/bug-reports
   */
  async listBugReports(params: BugReportListParams = {}): Promise<BugReportPage> {
    try {
      const response = await this.axiosInstance.get<BugReportPage>(BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORTS, {
        params: {
          page: params.page ?? 0,
          size: params.size ?? 20,
          sort: params.sort ?? ['createdAt,DESC'],
          ...(params.status ? { status: params.status } : {}),
          ...(params.severity ? { severity: params.severity } : {}),
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Create a bug report on behalf of a user (admin)
   * POST /api/v1/admin/bug-reports
   */
  async createBugReport(payload: CreateBugReportRequest): Promise<BugReportDto> {
    try {
      const response = await this.axiosInstance.post<BugReportDto>(
        BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORTS,
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Get a bug report by ID (admin)
   * GET /api/v1/admin/bug-reports/{id}
   */
  async getBugReport(id: string): Promise<BugReportDto> {
    try {
      const response = await this.axiosInstance.get<BugReportDto>(
        BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORT_BY_ID(id)
      );
      return response.data;
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Update a bug report (admin)
   * PATCH /api/v1/admin/bug-reports/{id}
   */
  async updateBugReport(id: string, payload: UpdateBugReportRequest): Promise<BugReportDto> {
    try {
      const response = await this.axiosInstance.patch<BugReportDto>(
        BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORT_BY_ID(id),
        payload
      );
      return response.data;
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Delete a bug report (admin)
   * DELETE /api/v1/admin/bug-reports/{id}
   */
  async deleteBugReport(id: string): Promise<void> {
    try {
      await this.axiosInstance.delete(BUG_REPORT_ADMIN_ENDPOINTS.BUG_REPORT_BY_ID(id));
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Bulk delete bug reports (admin)
   * POST /api/v1/admin/bug-reports/bulk-delete
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await this.axiosInstance.post(BUG_REPORT_ADMIN_ENDPOINTS.BULK_DELETE, ids);
    } catch (error) {
      throw this.handleBugReportError(error);
    }
  }

  /**
   * Handle bug-report-specific API errors
   */
  private handleBugReportError(error: unknown): BugReportServiceError {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = getErrorMessage(error);
      const bugReportError: BugReportServiceError = new Error(message);
      bugReportError.status = status;
      bugReportError.response = error.response;

      switch (status) {
        case 400:
          bugReportError.message = `Validation error: ${message}`;
          break;
        case 401:
          bugReportError.message = 'Authentication required';
          break;
        case 403:
          bugReportError.message = 'Insufficient permissions to manage bug reports';
          break;
        case 404:
          bugReportError.message = 'Bug report not found';
          break;
        case 409:
          bugReportError.message = `Conflict: ${message}`;
          break;
        case 429:
          bugReportError.message = 'Too many requests. Please try again later.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          bugReportError.message = 'Server error occurred while processing bug reports';
          break;
        default:
          bugReportError.message = message || 'Bug report operation failed';
      }

      return bugReportError;
    }

    return new Error(error instanceof Error ? error.message : 'Network error occurred');
  }
}

// Default instance using the shared axios client
export const bugReportService = new BugReportService(api);
