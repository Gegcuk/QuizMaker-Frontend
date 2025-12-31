/**
 * Bug report API endpoints
 */
export const BUG_REPORT_ENDPOINTS = {
  SUBMIT: '/v1/bug-reports',
} as const;

/**
 * Admin bug report endpoints
 */
export const BUG_REPORT_ADMIN_ENDPOINTS = {
  BUG_REPORTS: '/v1/admin/bug-reports',
  BUG_REPORT_BY_ID: (id: string) => `/v1/admin/bug-reports/${id}`,
  BULK_DELETE: '/v1/admin/bug-reports/bulk-delete',
} as const;
