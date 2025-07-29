# Authentication Controller

## Overview
The AuthController handles user authentication, registration, and session management using JWT tokens.

**Base URL**: `/api/v1/auth`

**Authentication**: Most endpoints require authentication via Bearer token in Authorization header.

## Error Handling

All endpoints use a consistent error response format:

### ErrorResponse
```json
{
  "timestamp": "2025-01-27T10:30:00Z",   // Error timestamp
  "status": 400,                         // HTTP status code
  "error": "Bad Request",                // Error type
  "details": [                           // Error details
    "Username is required",
    "Invalid credentials"
  ]
}
```

### Common HTTP Status Codes
- **400 Bad Request**: Validation errors, invalid request data
- **401 Unauthorized**: Missing or invalid authentication token, invalid credentials
- **403 Forbidden**: Authenticated but insufficient permissions
- **409 Conflict**: Username or email already exists
- **500 Internal Server Error**: Unexpected server errors

### Error Examples
```json
// 400 Bad Request - Validation Error
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "details": ["Username is required", "Password must be at least 8 characters"]
}

// 401 Unauthorized - Invalid Credentials
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 401,
  "error": "Unauthorized",
  "details": ["Invalid username or password"]
}

// 409 Conflict - User Already Exists
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "details": ["Username already exists"]
}
```

## DTO Schemas

### LoginRequest
```json
{
  "username": "string",  // Username or email
  "password": "string"   // User password
}
```

**Validation Rules**:
- `username`: Required, not blank
- `password`: Required, not blank

### RegisterRequest
```json
{
  "username": "string",     // 4-20 characters
  "email": "string",        // Valid email format
  "password": "string"      // 8-100 characters
}
```

**Validation Rules**:
- `username`: Required, 4-20 characters, unique
- `email`: Required, valid email format, unique
- `password`: Required, 8-100 characters

### RefreshRequest
```json
{
  "refreshToken": "string"  // Valid refresh token
}
```

### JwtResponse
```json
{
  "accessToken": "string",      // JWT access token
  "refreshToken": "string",     // JWT refresh token
  "accessExpiresInMs": 3600000, // Access token validity (ms)
  "refreshExpiresInMs": 864000000 // Refresh token validity (ms)
}
```

### UserDto
```json
{
  "id": "uuid",                    // Unique user identifier
  "username": "string",            // Username
  "email": "string",               // Email address
  "isActive": true,                // Account status
  "roles": ["ROLE_USER"],          // User roles
  "createdAt": "2025-05-21T15:30:00", // Account creation time
  "lastLoginDate": "2025-05-21T16:00:00", // Last login time
  "updatedAt": "2025-05-21T16:10:00" // Last update time
}
```

**Available Roles**:
- `ROLE_USER`: Basic user - can take quizzes, view public content
- `ROLE_QUIZ_CREATOR`: Can create and manage their own quizzes
- `ROLE_MODERATOR`: Can moderate content, manage reported items
- `ROLE_ADMIN`: Can manage users, categories, and system settings
- `ROLE_SUPER_ADMIN`: Full system access

### ChangePasswordRequest
```json
{
  "currentPassword": "string",  // Current password
  "newPassword": "string"       // New password (8-100 characters)
}
```

**Validation Rules**:
- `currentPassword`: Required, not blank
- `newPassword`: Required, 8-100 characters, must be different from current password

### ForgotPasswordRequest
```json
{
  "email": "string"  // Email address associated with the account
}
```

**Validation Rules**:
- `email`: Required, valid email format, max 254 characters

### ResetPasswordRequest
```json
{
  "token": "string",      // Password reset token
  "newPassword": "string" // New password (8-100 characters)
}
```

**Validation Rules**:
- `token`: Required, not blank, max 512 characters
- `newPassword`: Required, 8-100 characters

## Endpoints

### 1. Register User
**POST** `/api/v1/auth/register`

Creates a new user account.

**Request Body**:
```json
{
  "username": "newUser",
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```

**Response** (201 Created):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "newUser",
  "email": "user@example.com",
  "isActive": true,
  "roles": ["ROLE_USER"],
  "createdAt": "2025-05-21T15:30:00",
  "lastLoginDate": null,
  "updatedAt": "2025-05-21T15:30:00"
}
```

### 2. Login
**POST** `/api/v1/auth/login`

Authenticates user and returns JWT tokens.

**Request Body**:
```json
{
  "username": "newUser",
  "password": "P@ssw0rd!"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
  "accessExpiresInMs": 3600000,
  "refreshExpiresInMs": 864000000
}
```

### 3. Refresh Tokens
**POST** `/api/v1/auth/refresh`

Exchanges refresh token for new access token.

**Request Body**:
```json
{
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg=="
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
  "accessExpiresInMs": 3600000,
  "refreshExpiresInMs": 864000000
}
```

### 4. Logout
**POST** `/api/v1/auth/logout`

Revokes the provided access token.

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (204 No Content): No response body

### 5. Get Current User
**GET** `/api/v1/auth/me`

Returns details of the authenticated user.

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "newUser",
  "email": "user@example.com",
  "isActive": true,
  "roles": ["ROLE_USER"],
  "createdAt": "2025-05-21T15:30:00",
  "lastLoginDate": "2025-05-21T16:00:00",
  "updatedAt": "2025-05-21T16:10:00"
}
```

## Integration Notes

### Token Management
- Store tokens securely (localStorage/sessionStorage for web apps)
- Implement automatic token refresh before expiration
- Clear tokens on logout or 401 responses

### Error Handling
- Handle 401 responses by redirecting to login
- Implement retry logic for token refresh
- Show appropriate error messages for validation failures
- All errors return consistent ErrorResponse format

### Security Considerations
- Never store sensitive data in client-side storage
- Use HTTPS in production
- Implement proper token expiration handling
- Consider implementing refresh token rotation for enhanced security
- Validate passwords on both client and server side
- Implement rate limiting for login attempts

### Best Practices
- Use strong password requirements (8+ characters, mixed case, numbers, symbols)
- Implement account lockout after failed login attempts
- Store refresh tokens securely with proper expiration
- Log authentication events for security monitoring
- Implement proper session management
- Consider implementing 2FA for enhanced security 