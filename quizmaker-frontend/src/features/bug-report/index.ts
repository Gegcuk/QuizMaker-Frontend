// Bug report feature exports
export { BugReportService, bugReportService } from './services/bug-report.service';
export { BUG_REPORT_ENDPOINTS, BUG_REPORT_ADMIN_ENDPOINTS } from './services/bug-report.endpoints';
export { default as BugReportModal } from './components/BugReportModal';
export { default as BugReportManagementPage } from './components/BugReportManagementPage';

export type {
  BugReportDto,
  BugReportListParams,
  BugReportPage,
  BugReportStatus,
  BugSeverity,
  CreateBugReportRequest,
  UpdateBugReportRequest,
  BugReportSubmissionResponse,
  PageableObject,
  SortObject,
} from './types/bug-report.types';
