# Admin Operations Controller

## Overview
The AdminController handles administrative operations including role management, user role assignment, and system administration. This controller provides granular permission-based access control.

**Base URL**: `/api/v1/admin`

**Authentication**: All endpoints require authentication via Bearer token with appropriate permissions.

## DTO Schemas

### RoleDto
```json
{
  "roleId": 1,                                    // Role identifier
  "roleName": "ROLE_MODERATOR",                   // Role name
  "description": "Can moderate content and manage reported items", // Role description
  "isDefault": false,                             // Whether this is a default role
  "permissions": [                                // Set of permissions assigned to this role
    "QUIZ_MODERATE",
    "COMMENT_MODERATE",
    "ATTEMPT_READ_ALL"
  ],
  "userCount": 5                                  // Number of users with this role
}
```

### CreateRoleRequest
```json
{
  "roleName": "ROLE_CUSTOM",                      // Required: Role name
  "description": "Custom role for specific permissions", // Optional: Role description
  "isDefault": false                              // Optional: Whether this is a default role
}
```

**Validation Rules**:
- `roleName`: Required, not blank
- `description`: Optional
- `isDefault`: Optional boolean

### UpdateRoleRequest
```json
{
  "description": "Updated role description",      // Optional: Updated description
  "isDefault": true                               // Optional: Updated default status
}
```

**Validation Rules**:
- `description`: Optional
- `isDefault`: Optional boolean

## Permission System

### PermissionName Enum
The system uses a comprehensive permission system with the following categories:

#### Quiz Permissions
- `QUIZ_READ`: View quizzes
- `QUIZ_CREATE`: Create quizzes
- `QUIZ_UPDATE`: Update own quizzes
- `QUIZ_DELETE`: Delete own quizzes
- `QUIZ_PUBLISH`: Publish quizzes
- `QUIZ_MODERATE`: Moderate any quiz
- `QUIZ_ADMIN`: Full quiz administration

#### Question Permissions
- `QUESTION_READ`: View questions
- `QUESTION_CREATE`: Create questions
- `QUESTION_UPDATE`: Update own questions
- `QUESTION_DELETE`: Delete own questions
- `QUESTION_MODERATE`: Moderate any question
- `QUESTION_ADMIN`: Full question administration

#### Category & Tag Permissions
- `CATEGORY_READ/CREATE/UPDATE/DELETE/ADMIN`: Category management
- `TAG_READ/CREATE/UPDATE/DELETE/ADMIN`: Tag management

#### User Permissions
- `USER_READ`: View user profiles
- `USER_UPDATE`: Update own profile
- `USER_DELETE`: Delete own account
- `USER_MANAGE`: Manage other users
- `USER_ADMIN`: Full user administration

#### Role & Permission Management
- `ROLE_READ/CREATE/UPDATE/DELETE/ASSIGN`: Role management
- `PERMISSION_READ/CREATE/UPDATE/DELETE`: Permission management

#### System Permissions
- `AUDIT_READ`: View audit logs
- `SYSTEM_ADMIN`: Full system administration
- `NOTIFICATION_READ/CREATE/ADMIN`: Notification management

### RoleName Enum
- `ROLE_USER`: Basic user - can take quizzes, view public content
- `ROLE_QUIZ_CREATOR`: Can create and manage their own quizzes
- `ROLE_MODERATOR`: Can moderate content, manage reported items
- `ROLE_ADMIN`: Can manage users, categories, and system settings
- `ROLE_SUPER_ADMIN`: Full system access

## Endpoints

### 1. Get All Roles
**GET** `/api/v1/admin/roles`

Retrieves all roles in the system.

**Required Permission**: `ROLE_READ`

**Response** (200 OK):
```json
[
  {
    "roleId": 1,
    "roleName": "ROLE_USER",
    "description": "Basic user - can take quizzes, view public content",
    "isDefault": true,
    "permissions": [
      "QUIZ_READ",
      "ATTEMPT_CREATE",
      "ATTEMPT_READ"
    ],
    "userCount": 150
  },
  {
    "roleId": 2,
    "roleName": "ROLE_MODERATOR",
    "description": "Can moderate content and manage reported items",
    "isDefault": false,
    "permissions": [
      "QUIZ_MODERATE",
      "COMMENT_MODERATE",
      "ATTEMPT_READ_ALL"
    ],
    "userCount": 5
  },
  {
    "roleId": 3,
    "roleName": "ROLE_ADMIN",
    "description": "Can manage users, categories, and system settings",
    "isDefault": false,
    "permissions": [
      "USER_MANAGE",
      "CATEGORY_ADMIN",
      "TAG_ADMIN",
      "ROLE_READ"
    ],
    "userCount": 2
  }
]
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing ROLE_READ permission

### 2. Get Role by ID
**GET** `/api/v1/admin/roles/{roleId}`

Retrieves a specific role by its ID.

**Required Permission**: `ROLE_READ`

**Path Parameters**:
- `roleId`: ID of the role (required)

**Example Request**:
```
GET /api/v1/admin/roles/2
```

**Response** (200 OK):
```json
{
  "roleId": 2,
  "roleName": "ROLE_MODERATOR",
  "description": "Can moderate content and manage reported items",
  "isDefault": false,
  "permissions": [
    "QUIZ_MODERATE",
    "COMMENT_MODERATE",
    "ATTEMPT_READ_ALL"
  ],
  "userCount": 5
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing ROLE_READ permission
- `404 Not Found`: Role not found

### 3. Create Role
**POST** `/api/v1/admin/roles`

Creates a new role.

**Required Permission**: `ROLE_CREATE`

**Request Body**:
```json
{
  "roleName": "ROLE_CUSTOM",
  "description": "Custom role for specific permissions",
  "isDefault": false
}
```

**Response** (200 OK):
```json
{
  "roleId": 4,
  "roleName": "ROLE_CUSTOM",
  "description": "Custom role for specific permissions",
  "isDefault": false,
  "permissions": [],
  "userCount": 0
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing ROLE_CREATE permission

### 4. Update Role
**PUT** `/api/v1/admin/roles/{roleId}`

Updates an existing role.

**Required Permission**: `ROLE_UPDATE`

**Path Parameters**:
- `roleId`: ID of the role (required)

**Request Body**:
```json
{
  "description": "Updated custom role description",
  "isDefault": true
}
```

**Response** (200 OK):
```json
{
  "roleId": 4,
  "roleName": "ROLE_CUSTOM",
  "description": "Updated custom role description",
  "isDefault": true,
  "permissions": [],
  "userCount": 0
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing ROLE_UPDATE permission
- `404 Not Found`: Role not found

### 5. Delete Role
**DELETE** `/api/v1/admin/roles/{roleId}`

Deletes a role.

**Required Permission**: `ROLE_DELETE`

**Path Parameters**:
- `roleId`: ID of the role (required)

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing ROLE_DELETE permission
- `404 Not Found`: Role not found

### 6. Assign Role to User
**POST** `/api/v1/admin/users/{userId}/roles/{roleId}`

Assigns a role to a specific user.

**Required Role**: `ROLE_ADMIN`

**Path Parameters**:
- `userId`: UUID of the user (required)
- `roleId`: ID of the role (required)

**Example Request**:
```
POST /api/v1/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6/roles/2
```

**Response** (200 OK): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ROLE_ADMIN
- `404 Not Found`: User or role not found

### 7. Remove Role from User
**DELETE** `/api/v1/admin/users/{userId}/roles/{roleId}`

Removes a role from a specific user.

**Required Role**: `ROLE_ADMIN`

**Path Parameters**:
- `userId`: UUID of the user (required)
- `roleId`: ID of the role (required)

**Response** (200 OK): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ROLE_ADMIN
- `404 Not Found`: User or role not found

### 8. Initialize System
**POST** `/api/v1/admin/system/initialize`

Initializes system roles and permissions.

**Required Permission**: `SYSTEM_ADMIN`

**Response** (200 OK):
```json
"System initialized successfully"
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing SYSTEM_ADMIN permission

### 9. Get System Status
**GET** `/api/v1/admin/system/status`

Gets system status information.

**Required Permission**: `SYSTEM_ADMIN` OR `AUDIT_READ`

**Response** (200 OK):
```json
"System status: All systems operational (Super Admin view)"
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Missing required permissions

### 10. Perform Dangerous Operation
**POST** `/api/v1/admin/super/dangerous-operation`

Performs a dangerous operation (super admin only).

**Required Role**: `ROLE_SUPER_ADMIN`

**Response** (200 OK):
```json
"Operation completed"
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ROLE_SUPER_ADMIN

## Integration Notes

### Permission-Based Access Control
- **Permission-Based**: Use `@RequirePermission` for granular access control
- **Role-Based**: Use `@RequireRole` for role-based access control
- **Combined**: Can combine multiple permissions with OR/AND logic
- **Manual Checks**: Use `PermissionUtil` for programmatic permission checks

### Role Management Workflow
1. **List Roles**: Display available roles for management
2. **Create Roles**: Create custom roles with specific permissions
3. **Update Roles**: Modify role descriptions and default status
4. **Assign Roles**: Assign roles to users for access control
5. **Delete Roles**: Remove unused roles (with caution)

### User Role Assignment
- **Assign Roles**: Grant users specific roles for access control
- **Remove Roles**: Revoke user roles when no longer needed
- **Role Hierarchy**: Consider role hierarchy when assigning permissions
- **Audit Trail**: All role assignments are logged for security

### System Administration
- **System Initialization**: Set up default roles and permissions
- **System Status**: Monitor system health and operations
- **Super Admin**: Special operations requiring highest privileges
- **Dangerous Operations**: Logged and restricted to super admins

### Security Considerations
- **Permission Granularity**: Use specific permissions rather than broad roles
- **Principle of Least Privilege**: Grant minimum required permissions
- **Audit Logging**: All admin operations are logged
- **Role Validation**: Validate role assignments before applying

### Best Practices
- **Role Design**: Create roles with clear, specific purposes
- **Permission Groups**: Group related permissions logically
- **Default Roles**: Use default roles for common user types
- **Role Documentation**: Provide clear descriptions for all roles
- **Regular Review**: Periodically review and update role assignments

### Error Handling
- **Permission Errors**: Handle 403 responses for missing permissions
- **Role Validation**: Validate role existence before assignment
- **User Validation**: Ensure users exist before role assignment
- **System Errors**: Handle system initialization failures gracefully

### Monitoring and Auditing
- **Operation Logging**: All admin operations are logged
- **Permission Changes**: Track permission and role changes
- **User Activity**: Monitor user role assignments
- **System Health**: Regular system status checks 