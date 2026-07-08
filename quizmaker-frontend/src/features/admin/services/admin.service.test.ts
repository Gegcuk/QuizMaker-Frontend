import { beforeEach, describe, expect, it } from 'vitest';
import { createAxiosMock, type AxiosMock } from '@/test/mockAxios';
import type {
  Permission,
  PolicyDiff,
  ReconciliationResult,
  RoleDto,
} from '@/types';
import { ADMIN_ENDPOINTS, SUPER_ADMIN_ENDPOINTS } from './admin.endpoints';
import { AdminService } from './admin.service';

const role: RoleDto = {
  roleId: 1,
  roleName: 'ROLE_ADMIN',
  description: 'Administrator role',
  isDefault: false,
  permissions: ['ROLE_READ', 'ROLE_ASSIGN'],
  userCount: 2,
};

const permission: Permission = {
  permissionId: 10,
  permissionName: 'ROLE_READ',
  description: 'Read roles',
  resource: 'ROLE',
  action: 'READ',
};

const reconciliation: ReconciliationResult = {
  success: true,
  message: 'Policy reconciled',
  permissionsAdded: 1,
  permissionsRemoved: 0,
  rolesAdded: 0,
  rolesUpdated: 1,
  rolePermissionMappingsUpdated: 2,
  errors: [],
};

const policyDiff: PolicyDiff = {
  missingPermissions: ['ROLE_ASSIGN'],
  extraPermissions: [],
  missingRoles: [],
  extraRoles: [],
  rolePermissionMismatches: {
    ROLE_ADMIN: ['ROLE_ASSIGN'],
  },
  manifestVersion: '2026.07.08',
  isInSync: false,
};

const rolePage = {
  content: [role],
  pageable: {
    sort: { sorted: true, unsorted: false },
    pageNumber: 1,
    pageSize: 10,
  },
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
};

const pack = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Starter',
  description: 'Starter token pack',
  tokens: 1000,
  priceCents: 999,
  currency: 'GBP',
  stripePriceId: 'price_123',
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

describe('admin endpoint helpers', () => {
  it('matches deployed admin OpenAPI paths', () => {
    expect(ADMIN_ENDPOINTS.ROLES).toBe('/v1/admin/roles');
    expect(ADMIN_ENDPOINTS.ROLES_PAGINATED).toBe('/v1/admin/roles/paginated');
    expect(ADMIN_ENDPOINTS.ROLE_BY_ID('1')).toBe('/v1/admin/roles/1');
    expect(ADMIN_ENDPOINTS.ASSIGN_ROLE('user-1', '1')).toBe('/v1/admin/users/user-1/roles/1');
    expect(ADMIN_ENDPOINTS.REMOVE_ROLE('user-1', '1')).toBe('/v1/admin/users/user-1/roles/1');
    expect(ADMIN_ENDPOINTS.PERMISSIONS).toBe('/v1/admin/permissions');
    expect(ADMIN_ENDPOINTS.PERMISSION_BY_ID('10')).toBe('/v1/admin/permissions/10');
    expect(ADMIN_ENDPOINTS.ASSIGN_PERMISSION_TO_ROLE('1', '10')).toBe('/v1/admin/roles/1/permissions/10');
    expect(ADMIN_ENDPOINTS.REMOVE_PERMISSION_FROM_ROLE('1', '10')).toBe('/v1/admin/roles/1/permissions/10');
    expect(ADMIN_ENDPOINTS.POLICY_RECONCILE).toBe('/v1/admin/policy/reconcile');
    expect(ADMIN_ENDPOINTS.POLICY_RECONCILE_ROLE('ROLE_ADMIN')).toBe('/v1/admin/policy/reconcile/ROLE_ADMIN');
    expect(SUPER_ADMIN_ENDPOINTS.DANGEROUS_OPERATION).toBe('/v1/admin/super/dangerous-operation');
    expect((SUPER_ADMIN_ENDPOINTS as Record<string, unknown>).BULK_OPERATIONS).toBeUndefined();
  });
});

describe('AdminService', () => {
  let axios: AxiosMock;
  let service: AdminService;

  beforeEach(() => {
    axios = createAxiosMock();
    service = new AdminService(axios.instance);
  });

  it('covers deployed role CRUD endpoints using isDefault payload fields', async () => {
    axios.get.mockResolvedValueOnce({ data: [role] }).mockResolvedValueOnce({ data: role });
    axios.post.mockResolvedValueOnce({ data: role });
    axios.put.mockResolvedValueOnce({ data: { ...role, isDefault: true } });
    axios.delete.mockResolvedValueOnce({});

    await expect(service.getAllRoles()).resolves.toEqual([role]);
    await expect(service.getRoleById('1')).resolves.toBe(role);
    await expect(service.createRole({
      roleName: 'ROLE_AUDITOR',
      description: 'Auditor role',
      isDefault: false,
    })).resolves.toBe(role);
    await expect(service.updateRole('1', {
      description: 'Default admin',
      isDefault: true,
    })).resolves.toMatchObject({ isDefault: true });
    await expect(service.deleteRole('1')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/admin/roles');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/admin/roles/1');
    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/admin/roles', {
      roleName: 'ROLE_AUDITOR',
      description: 'Auditor role',
      isDefault: false,
    });
    expect(axios.put).toHaveBeenCalledWith('/v1/admin/roles/1', {
      description: 'Default admin',
      isDefault: true,
    });
    expect(axios.delete).toHaveBeenCalledWith('/v1/admin/roles/1');
  });

  it('assigns and removes user roles through deployed relationship endpoints', async () => {
    axios.post.mockResolvedValue({});
    axios.delete.mockResolvedValue({});

    await expect(service.assignRoleToUser('user-1', '1')).resolves.toBeUndefined();
    await expect(service.removeRoleFromUser('user-1', '1')).resolves.toBeUndefined();

    expect(axios.post).toHaveBeenCalledWith('/v1/admin/users/user-1/roles/1');
    expect(axios.delete).toHaveBeenCalledWith('/v1/admin/users/user-1/roles/1');
  });

  it('loads paginated roles with stable defaults and optional search params', async () => {
    axios.get.mockResolvedValue({ data: rolePage });

    await expect(service.getRolesPaginated({ page: 1, size: 10, search: 'admin' })).resolves.toBe(rolePage);

    expect(axios.get).toHaveBeenCalledWith('/v1/admin/roles/paginated', {
      params: {
        page: 1,
        size: 10,
        sort: 'roleName',
        search: 'admin',
      },
    });
  });

  it('covers deployed permission CRUD and role-permission relationship endpoints', async () => {
    axios.get.mockResolvedValueOnce({ data: [permission] }).mockResolvedValueOnce({ data: permission });
    axios.post.mockResolvedValueOnce({ data: permission }).mockResolvedValueOnce({});
    axios.put.mockResolvedValueOnce({ data: { ...permission, action: 'ASSIGN' } });
    axios.delete.mockResolvedValueOnce({}).mockResolvedValueOnce({});

    await expect(service.getAllPermissions()).resolves.toEqual([permission]);
    await expect(service.getPermissionById('10')).resolves.toBe(permission);
    await expect(service.createPermission({
      permissionName: 'ROLE_ASSIGN',
      description: 'Assign roles',
      resource: 'ROLE',
      action: 'ASSIGN',
    })).resolves.toBe(permission);
    await expect(service.updatePermission('10', {
      description: 'Assign roles',
      resource: 'ROLE',
      action: 'ASSIGN',
    })).resolves.toMatchObject({ action: 'ASSIGN' });
    await expect(service.deletePermission('10')).resolves.toBeUndefined();
    await expect(service.assignPermissionToRole('1', '10')).resolves.toBeUndefined();
    await expect(service.removePermissionFromRole('1', '10')).resolves.toBeUndefined();

    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/admin/permissions');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/admin/permissions/10');
    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/admin/permissions', {
      permissionName: 'ROLE_ASSIGN',
      description: 'Assign roles',
      resource: 'ROLE',
      action: 'ASSIGN',
    });
    expect(axios.put).toHaveBeenCalledWith('/v1/admin/permissions/10', {
      description: 'Assign roles',
      resource: 'ROLE',
      action: 'ASSIGN',
    });
    expect(axios.delete).toHaveBeenNthCalledWith(1, '/v1/admin/permissions/10');
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/admin/roles/1/permissions/10');
    expect(axios.delete).toHaveBeenNthCalledWith(2, '/v1/admin/roles/1/permissions/10');
  });

  it('covers deployed policy, system, billing sync, and super-admin endpoints', async () => {
    axios.post
      .mockResolvedValueOnce({ data: 'initialized' })
      .mockResolvedValueOnce({ data: [pack] })
      .mockResolvedValueOnce({ data: 'dangerous operation complete' })
      .mockResolvedValueOnce({ data: reconciliation })
      .mockResolvedValueOnce({ data: reconciliation });
    axios.get
      .mockResolvedValueOnce({ data: 'ready' })
      .mockResolvedValueOnce({ data: policyDiff })
      .mockResolvedValueOnce({ data: '2026.07.08' });

    await expect(service.initializeSystem()).resolves.toBe('initialized');
    await expect(service.getSystemStatus()).resolves.toBe('ready');
    await expect(service.syncBillingPacks()).resolves.toEqual([pack]);
    await expect(service.performDangerousOperation()).resolves.toBe('dangerous operation complete');
    await expect(service.reconcilePolicy()).resolves.toBe(reconciliation);
    await expect(service.getPolicyStatus()).resolves.toBe(policyDiff);
    await expect(service.getPolicyVersion()).resolves.toBe('2026.07.08');
    await expect(service.reconcileRole('ROLE_ADMIN')).resolves.toBe(reconciliation);

    expect(axios.post).toHaveBeenNthCalledWith(1, '/v1/admin/system/initialize');
    expect(axios.get).toHaveBeenNthCalledWith(1, '/v1/admin/system/status');
    expect(axios.post).toHaveBeenNthCalledWith(2, '/v1/admin/billing/packs/sync');
    expect(axios.post).toHaveBeenNthCalledWith(3, '/v1/admin/super/dangerous-operation');
    expect(axios.post).toHaveBeenNthCalledWith(4, '/v1/admin/policy/reconcile');
    expect(axios.get).toHaveBeenNthCalledWith(2, '/v1/admin/policy/status');
    expect(axios.get).toHaveBeenNthCalledWith(3, '/v1/admin/policy/version');
    expect(axios.post).toHaveBeenNthCalledWith(5, '/v1/admin/policy/reconcile/ROLE_ADMIN');
  });

  it('does not expose admin endpoints absent from the live OpenAPI spec', () => {
    const serviceSurface = service as unknown as Record<string, unknown>;

    expect(serviceSurface.performBulkOperations).toBeUndefined();
  });

  it('preserves ProblemDetail detail for validation and conflict failures', async () => {
    axios.post
      .mockRejectedValueOnce(problemError(400, 'Role name is required.'))
      .mockRejectedValueOnce(problemError(409, 'Role already exists.'));

    await expect(service.createRole({ roleName: '' })).rejects.toThrow(
      'Validation error: Role name is required.',
    );
    await expect(service.createRole({ roleName: 'ROLE_ADMIN' })).rejects.toThrow(
      'Conflict: Role already exists.',
    );
  });

  it.each([
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Resource not found'],
    [429, 'Too many requests. Please try again later.'],
    [500, 'Server error occurred'],
  ])('normalizes HTTP %i failures', async (status, expectedMessage) => {
    axios.get.mockRejectedValue(problemError(status, 'Backend detail'));

    await expect(service.getAllRoles()).rejects.toThrow(expectedMessage);
  });

  it('preserves status metadata and network failure context', async () => {
    axios.get
      .mockRejectedValueOnce(problemError(403, 'Admin role required.'))
      .mockRejectedValueOnce(new Error('Network unavailable'));

    await expect(service.getAllRoles()).rejects.toMatchObject({ status: 403 });
    await expect(service.getAllRoles()).rejects.toThrow('Network unavailable');
  });
});
