// Common types used across all API services

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

/**
 * Paginated response wrapper
 */
export interface Paginated<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string | SortOption[];
  direction?: 'asc' | 'desc';
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  message: string;
  error: string;
  status: number;
  timestamp: string;
  path: string;
  details?: Record<string, any>;
}

/**
 * Union type for all possible API errors
 */
export type ApiError = 
  | { type: 'VALIDATION_ERROR'; details: Record<string, string[]> }
  | { type: 'AUTHENTICATION_ERROR'; message: string }
  | { type: 'AUTHORIZATION_ERROR'; message: string }
  | { type: 'NOT_FOUND_ERROR'; resource: string; id: string }
  | { type: 'CONFLICT_ERROR'; message: string }
  | { type: 'RATE_LIMIT_ERROR'; retryAfter: number }
  | { type: 'SERVER_ERROR'; message: string }
  | { type: 'NETWORK_ERROR'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };

/**
 * Base entity interface for all domain objects
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Soft deletable entity interface
 */
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt?: string;
  deleted: boolean;
}

/**
 * Auditable entity interface
 */
export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

/**
 * Job status for long-running operations
 */
export interface JobStatus {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

/**
 * Search parameters for filtering
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * Export format options
 */
export type ExportFormat = 'CSV' | 'XLSX' | 'PDF' | 'JSON';

/**
 * Export request parameters
 */
export interface ExportRequest {
  format: ExportFormat;
  filters?: Record<string, any>;
  includeHeaders?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
}

/**
 * Bulk operation response
 */
export interface BulkOperationResponse {
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}

/**
 * Statistics summary
 */
export interface StatisticsSummary {
  total: number;
  active: number;
  inactive: number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Date range for filtering
 */
export interface DateRange {
  from: string;
  to: string;
}

/**
 * Sort options
 */
export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Filter options
 */
export interface FilterOption {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

/**
 * Query parameters for complex searches
 */
export interface QueryParams extends PaginationParams {
  search?: string;
  filters?: FilterOption[];
  sort?: SortOption[];
  dateRange?: DateRange;
} 