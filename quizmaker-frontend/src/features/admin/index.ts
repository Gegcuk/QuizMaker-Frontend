// Admin feature exports
export { AdminService } from './services/admin.service';
export { ADMIN_ENDPOINTS, SUPER_ADMIN_ENDPOINTS } from './services/admin.endpoints';
export type {
  RoleDto,
  CreateRoleRequest,
  UpdateRoleRequest,
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  ReconciliationResult,
  PolicyDiff,
  Page,
  PermissionName,
  RoleName
} from './types/admin.types';
