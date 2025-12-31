// Bug report related type definitions
// Based on the bug-reports API group specification

/**
 * Severity levels reported by users or assigned by admins
 */
export type BugSeverity = 'UNSPECIFIED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Workflow status for bug reports
 */
export type BugReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

/**
 * Bug report DTO returned by the API
 */
export interface BugReportDto {
  id: string;
  message: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  pageUrl?: string | null;
  stepsToReproduce?: string | null;
  clientVersion?: string | null;
  clientIp?: string | null;
  severity: BugSeverity;
  status: BugReportStatus;
  internalNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for submitting or creating a bug report
 */
export interface CreateBugReportRequest {
  message: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  clientVersion?: string;
  severity?: BugSeverity;
}

/**
 * Submission response from the public endpoint
 * The API returns an object keyed by field name with a UUID value (e.g., {id: "..."}).
 */
export type BugReportSubmissionResponse = Record<string, string>;

/**
 * Fields that can be updated by admins
 */
export interface UpdateBugReportRequest {
  message?: string;
  reporterName?: string;
  reporterEmail?: string;
  pageUrl?: string;
  stepsToReproduce?: string;
  clientVersion?: string;
  severity?: BugSeverity;
  status?: BugReportStatus;
  internalNote?: string;
}

/**
 * Filters and pagination for listing bug reports (admin)
 */
export interface BugReportListParams {
  status?: BugReportStatus;
  severity?: BugSeverity;
  page?: number;
  size?: number;
  sort?: string | string[];
}

/**
 * Sort metadata from Spring Data pageable responses
 */
export interface SortObject {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
}

/**
 * Pageable metadata from Spring Data pageable responses
 */
export interface PageableObject {
  paged?: boolean;
  pageNumber: number;
  pageSize: number;
  unpaged?: boolean;
  offset?: number;
  sort: SortObject;
}

/**
 * Page wrapper for bug report listings
 */
export interface BugReportPage {
  content: BugReportDto[];
  totalElements: number;
  totalPages: number;
  pageable: PageableObject;
  first: boolean;
  numberOfElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: SortObject;
  empty: boolean;
}
