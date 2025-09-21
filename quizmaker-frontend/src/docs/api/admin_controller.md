# Admin Controller API

Base path: `/api/v1/admin`

Administration endpoints for roles, permissions, user-role assignments, and system operations. All endpoints require authentication via JWT. Each route enforces fine‑grained permissions using the `@RequirePermission` annotation.

Security notes:
- Uses custom `@RequirePermission` annotation enforced by an AOP aspect.
- Swagger security annotation references `Bearer Authentication` and expects Bearer JWT tokens.
- All endpoints require proper JWT authentication with valid permissions.

## Endpoints

### GET `/roles`
- Purpose: List all roles (with permissions)
- Auth: Required
- Permission: `ROLE_READ`
- Response: `200 OK` with `RoleDto[]`
```json
[
  {
    "roleId": 1,
    "roleName": "ROLE_ADMIN",
    "description": "Administrator role",
    "isDefault": false,
    "permissions": ["QUIZ_ADMIN", "USER_ADMIN", "ROLE_READ"],
    "userCount": 3
  }
]
```

---

### GET `/roles/paginated`
- Purpose: Get roles with pagination and filtering
- Auth: Required
- Permission: `ROLE_READ`
- Query params: 
  - `page` (number, default: 0)
  - `size` (number, default: 20)
  - `sort` (string, default: "roleName")
  - `search` (string, optional) - Filter roles by name/description
- Response: `200 OK` with `Page<RoleDto>`
```json
{
  "content": [
    {
      "roleId": 1,
      "roleName": "ROLE_ADMIN",
      "description": "Administrator role",
      "isDefault": false,
      "permissions": ["QUIZ_ADMIN", "USER_ADMIN", "ROLE_READ"],
      "userCount": 3
    }
  ],
  "pageable": {
    "sort": {"sorted": true, "unsorted": false},
    "pageNumber": 0,
    "pageSize": 20
  },
  "totalElements": 5,
  "totalPages": 1,
  "first": true,
  "last": true
}
```

---

### GET `/roles/{roleId}`
- Purpose: Get role by ID
- Auth: Required
- Permission: `ROLE_READ`
- Path params: `roleId` (number)
- Response: `200 OK` with `RoleDto`
- Errors: `404 Not Found` if role does not exist

---

### POST `/roles`
- Purpose: Create a new role
- Auth: Required
- Permission: `ROLE_CREATE`
- Request body (JSON): `CreateRoleRequest`
```json
{
  "roleName": "ROLE_EDITOR",
  "description": "Editors can curate content",
  "isDefault": false
}
```
- Response: `200 OK` with `RoleDto`

Notes:
- Typical REST would return `201 Created` with a `Location` header; current implementation returns `200`.

---

### PUT `/roles/{roleId}`
- Purpose: Update role fields (description, default flag)
- Auth: Required
- Permission: `ROLE_UPDATE`
- Path params: `roleId` (number)
- Request body (JSON): `UpdateRoleRequest`
```json
{ "description": "Updated description", "isDefault": true }
```
- Response: `200 OK` with updated `RoleDto`
- Errors: `404 Not Found` if role does not exist

---

### DELETE `/roles/{roleId}`
- Purpose: Delete a role
- Auth: Required
- Permission: `ROLE_DELETE`
- Path params: `roleId` (number)
- Response: `204 No Content`
- Errors: `404 Not Found` if role does not exist

---

### POST `/users/{userId}/roles/{roleId}`
- Purpose: Assign a role to a user
- Auth: Required
- Permission: `ROLE_ASSIGN`
- Path params: `userId` (UUID), `roleId` (number)
- Response: `200 OK` (empty body)
- Errors: `404 Not Found` if user or role does not exist

---

### DELETE `/users/{userId}/roles/{roleId}`
- Purpose: Remove a role from a user
- Auth: Required
- Permission: `ROLE_ASSIGN`
- Path params: `userId` (UUID), `roleId` (number)
- Response: `200 OK` (empty body)
- Errors: `404 Not Found` if user or role does not exist

---

### POST `/system/initialize`
- Purpose: Initialize default roles and permissions
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Request body: none
- Response: `200 OK` with a status message
- Errors: `400 Bad Request` if system initialization is disabled via feature flag
```json
"System initialized successfully"
```

---

### GET `/system/status`
- Purpose: Retrieve system status text
- Auth: Required
- Permissions: `SYSTEM_ADMIN` OR `AUDIT_READ`
- Response: `200 OK` with plain text
```json
"System status: All systems operational"
```

---

### POST `/super/dangerous-operation`
- Purpose: Execute a privileged operation
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Response: `200 OK` with a message
```json
"Operation completed"
```

---

## Permission Management Endpoints

### GET `/permissions`
- Purpose: Get all permissions
- Auth: Required
- Permission: `PERMISSION_READ`
- Response: `200 OK` with `Permission[]`
```json
[
  {
    "permissionId": 1,
    "permissionName": "QUIZ_CREATE",
    "description": "Create quizzes",
    "resource": "quiz",
    "action": "create",
    "roles": []
  }
]
```

---

### GET `/permissions/{permissionId}`
- Purpose: Get permission by ID
- Auth: Required
- Permission: `PERMISSION_READ`
- Path params: `permissionId` (number)
- Response: `200 OK` with `Permission`
- Errors: `404 Not Found` if permission does not exist

---

### POST `/permissions`
- Purpose: Create a new permission
- Auth: Required
- Permission: `PERMISSION_CREATE`
- Request body (JSON): `CreatePermissionRequest`
```json
{
  "permissionName": "QUIZ_EXPORT",
  "description": "Export quizzes",
  "resource": "quiz",
  "action": "export"
}
```
- Response: `200 OK` with `Permission`

---

### PUT `/permissions/{permissionId}`
- Purpose: Update an existing permission
- Auth: Required
- Permission: `PERMISSION_UPDATE`
- Path params: `permissionId` (number)
- Request body (JSON): `UpdatePermissionRequest`
```json
{
  "description": "Updated description",
  "resource": "quiz",
  "action": "export"
}
```
- Response: `200 OK` with updated `Permission`
- Errors: `404 Not Found` if permission does not exist

---

### DELETE `/permissions/{permissionId}`
- Purpose: Delete a permission
- Auth: Required
- Permission: `PERMISSION_DELETE`
- Path params: `permissionId` (number)
- Response: `204 No Content`
- Errors: `404 Not Found` if permission does not exist

---

### POST `/roles/{roleId}/permissions/{permissionId}`
- Purpose: Assign permission to role
- Auth: Required
- Permission: `ROLE_ASSIGN`
- Path params: `roleId` (number), `permissionId` (number)
- Response: `200 OK` (empty body)
- Errors: `404 Not Found` if role or permission does not exist

---

### DELETE `/roles/{roleId}/permissions/{permissionId}`
- Purpose: Remove permission from role
- Auth: Required
- Permission: `ROLE_ASSIGN`
- Path params: `roleId` (number), `permissionId` (number)
- Response: `200 OK` (empty body)
- Errors: `404 Not Found` if role or permission does not exist

---

## Policy Reconciliation Endpoints

### POST `/policy/reconcile`
- Purpose: Reconcile roles and permissions against canonical manifest
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Request body: none
- Response: `200 OK` with `ReconciliationResult` (success) or `400 Bad Request` (failure)
```json
{
  "success": true,
  "message": "Reconciliation completed successfully",
  "permissionsAdded": 5,
  "permissionsRemoved": 0,
  "rolesAdded": 2,
  "rolesUpdated": 1,
  "rolePermissionMappingsUpdated": 3,
  "errors": []
}
```

---

### GET `/policy/status`
- Purpose: Get policy reconciliation status
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Response: `200 OK` with `PolicyDiff`
```json
{
  "missingPermissions": ["QUIZ_EXPORT"],
  "extraPermissions": ["OBSOLETE_PERMISSION"],
  "missingRoles": ["ROLE_MODERATOR"],
  "extraRoles": ["OBSOLETE_ROLE"],
  "rolePermissionMismatches": {
    "ROLE_ADMIN": ["QUIZ_EXPORT"]
  },
  "manifestVersion": "1.2.0",
  "isInSync": false
}
```

---

### GET `/policy/version`
- Purpose: Get canonical policy manifest version
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Response: `200 OK` with version string
```json
"1.2.0"
```

---

### POST `/policy/reconcile/{roleName}`
- Purpose: Reconcile specific role against canonical manifest
- Auth: Required
- Permission: `SYSTEM_ADMIN`
- Path params: `roleName` (string)
- Request body: none
- Response: `200 OK` with `ReconciliationResult` (success) or `400 Bad Request` (failure)
```json
{
  "success": true,
  "message": "Role ROLE_ADMIN reconciled successfully",
  "permissionsAdded": 0,
  "permissionsRemoved": 0,
  "rolesAdded": 0,
  "rolesUpdated": 1,
  "rolePermissionMappingsUpdated": 2,
  "errors": []
}
```

## DTOs

### CreateRoleRequest
```ts
type CreateRoleRequest = {
  roleName: string;      // required, unique (e.g., "ROLE_EDITOR"), normalized to uppercase
  description?: string;  // optional
  isDefault: boolean;    // whether assigned to new users by default
};
```

### UpdateRoleRequest
```ts
type UpdateRoleRequest = {
  description?: string;  // optional
  isDefault: boolean;    // optional
};
```

### RoleDto
```ts
type RoleDto = {
  roleId: number;          // numeric ID
  roleName: string;        // e.g., "ROLE_ADMIN"
  description?: string;
  isDefault: boolean;
  permissions?: Set<string>;  // permission names, e.g., ["QUIZ_ADMIN", "USER_ADMIN"]
  userCount: number;       // number of users with this role (currently not populated)
};
```

### Permission
```ts
type Permission = {
  permissionId: number;     // numeric ID
  permissionName: string;   // e.g., "QUIZ_CREATE"
  description?: string;     // human-readable description
  resource: string;         // resource type, e.g., "quiz"
  action: string;           // action type, e.g., "create"
  roles: Set<Role>;         // roles that have this permission
};
```

### CreatePermissionRequest
```ts
type CreatePermissionRequest = {
  permissionName: string;   // required, unique (e.g., "QUIZ_EXPORT"), normalized to uppercase
  description?: string;     // optional
  resource?: string;        // optional
  action?: string;          // optional
};
```

### UpdatePermissionRequest
```ts
type UpdatePermissionRequest = {
  description?: string;     // optional
  resource?: string;        // optional
  action?: string;          // optional
};
```

### ReconciliationResult
```ts
type ReconciliationResult = {
  success: boolean;                        // whether reconciliation succeeded
  message: string;                         // human-readable result message
  permissionsAdded: number;               // count of permissions added
  permissionsRemoved: number;             // count of permissions removed
  rolesAdded: number;                     // count of roles added
  rolesUpdated: number;                   // count of roles updated
  rolePermissionMappingsUpdated: number;  // count of role-permission mappings updated
  errors: string[];                       // list of error messages
};
```

### PolicyDiff
```ts
type PolicyDiff = {
  missingPermissions: string[];           // permissions in manifest but not in DB
  extraPermissions: string[];             // permissions in DB but not in manifest
  missingRoles: string[];                 // roles in manifest but not in DB
  extraRoles: string[];                   // roles in DB but not in manifest
  rolePermissionMismatches: Map<string, string[]>;  // role name -> missing permissions
  manifestVersion: string;                // version of the canonical manifest
  isInSync: boolean;                      // whether DB is in sync with manifest
};
```

## Notes for Frontend
- Auth header: `Authorization: Bearer <accessToken>` is required for all admin endpoints.
- Errors: `400` for validation/duplicate names, `404` for missing resources, `403` for insufficient permissions.
- Idempotency: assigning an already‑assigned role remains `200`; removing a non‑assigned role returns `200` after set removal.
- Pagination: Use `/roles/paginated` for large role lists with search and sorting capabilities.
- Policy Reconciliation: Use `/policy/reconcile` endpoints to keep database in sync with canonical manifest.

## Available Permissions
The system includes comprehensive permissions organized by resource:

**Quiz Permissions:** `QUIZ_READ`, `QUIZ_CREATE`, `QUIZ_UPDATE`, `QUIZ_DELETE`, `QUIZ_PUBLISH`, `QUIZ_MODERATE`, `QUIZ_ADMIN`

**Question Permissions:** `QUESTION_READ`, `QUESTION_CREATE`, `QUESTION_UPDATE`, `QUESTION_DELETE`, `QUESTION_MODERATE`, `QUESTION_ADMIN`

**User Permissions:** `USER_READ`, `USER_UPDATE`, `USER_DELETE`, `USER_MANAGE`, `USER_ADMIN`

**Admin Permissions:** `ROLE_READ`, `ROLE_CREATE`, `ROLE_UPDATE`, `ROLE_DELETE`, `ROLE_ASSIGN`, `PERMISSION_READ`, `PERMISSION_CREATE`, `PERMISSION_UPDATE`, `PERMISSION_DELETE`

**System Permissions:** `SYSTEM_ADMIN`, `AUDIT_READ`

**Billing Permissions:** `BILLING_READ`, `BILLING_WRITE`

## Known Issues and Caveats
- `RoleDto.userCount` is not populated:
  - RoleMapper does not set `userCount`, so it will always be `0` in responses.
  - The field exists in the DTO but is not mapped from the Role entity.
  - This is a known limitation in the current implementation.

- Create operations return `200 OK`:
  - RESTful pattern suggests `201 Created` with `Location` header for creation endpoints.
  - Current implementation returns `200 OK` for consistency with other endpoints.

- PUT semantics vs fields:
  - `PUT /roles/{roleId}` only updates description/isDefault and cannot change `roleName`.
  - `PUT /permissions/{permissionId}` only updates description/resource/action and cannot change `permissionName`.
  - Consider `PATCH` semantics or allow renaming with proper constraints.

- System initialization feature flag:
  - `/system/initialize` can be disabled via `app.admin.system-initialization.enabled` property.
  - When disabled, returns `400 Bad Request` with appropriate message.

- Policy reconciliation:
  - Reconciliation operations are logged for audit purposes.
  - Failed reconciliations return detailed error information in the response.
  - Individual role reconciliation allows targeted updates without full system reconciliation.
