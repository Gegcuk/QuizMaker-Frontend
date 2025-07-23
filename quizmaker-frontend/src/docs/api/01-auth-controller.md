# Authentication Controller

## Overview
The AuthController handles user authentication, registration, and session management using JWT tokens.

**Base URL**: `/api/v1/auth`

**Authentication**: Most endpoints require authentication via Bearer token in Authorization header.

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

**Error Responses**:
- `400 Bad Request`: Validation errors
- `409 Conflict`: Username or email already exists

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

**Error Responses**:
- `401 Unauthorized`: Invalid credentials

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

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token

### 4. Logout
**POST** `/api/v1/auth/logout`

Revokes the provided access token.

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token

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

**Error Responses**:
- `401 Unauthorized`: Not authenticated

## Integration Notes

### Token Management
- Store tokens securely (localStorage/sessionStorage for web apps)
- Implement automatic token refresh before expiration
- Clear tokens on logout or 401 responses

### Error Handling
- Handle 401 responses by redirecting to login
- Implement retry logic for token refresh
- Show appropriate error messages for validation failures

### Security Considerations
- Never store sensitive data in client-side storage
- Use HTTPS in production
- Implement proper token expiration handling
- Consider implementing refresh token rotation for enhanced security 