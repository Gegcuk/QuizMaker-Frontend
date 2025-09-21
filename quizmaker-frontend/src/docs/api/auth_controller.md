# Auth Controller API

Base path: `/api/v1/auth`

This document lists all authentication endpoints and the DTOs used in requests and responses, with payload examples suitable for frontend integration.

## Endpoints

### POST `/register`
- Purpose: Register a new user
- Auth: Not required
- Request body (JSON): `RegisterRequest`
```json
{
  "username": "newUser",
  "email": "user@example.com",
  "password": "P@ssw0rd!"
}
```
- Response: `201 Created` with `AuthenticatedUserDto`
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
- Errors:
  - `400 Bad Request` for validation errors
  - `409 Conflict` if username or email already in use

Validation highlights:
- `username`: 4–20 chars, no leading/trailing spaces
- `email`: valid email, max 254 chars, no leading/trailing spaces
- `password`: 8–100 chars; must contain at least 1 uppercase, 1 lowercase, 1 digit, 1 special character; no spaces

---

### POST `/login`
- Purpose: Authenticate and obtain JWTs
- Auth: Not required
- Request body (JSON): `LoginRequest`
```json
{
  "username": "newUser",
  "password": "P@ssw0rd!"
}
```
- Response: `200 OK` with `JwtResponse`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==",
  "accessExpiresInMs": 3600000,
  "refreshExpiresInMs": 864000000
}
```
- Errors: `401 Unauthorized` for invalid credentials

---

### POST `/refresh`
- Purpose: Exchange a refresh token for new tokens
- Auth: Not required
- Request body (JSON): `RefreshRequest`
```json
{ "refreshToken": "dGhpc2lzYXJlZnJlc2h0b2tlbg==" }
```
- Response: `200 OK` with `JwtResponse`
- Errors: `401 Unauthorized` for invalid or expired refresh token

---

### POST `/logout`
- Purpose: Revoke current access token
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Request body: none
- Response: `204 No Content`
- Errors: `401 Unauthorized` if invalid or missing token

---

### GET `/me`
- Purpose: Get the authenticated user
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Response: `200 OK` with `AuthenticatedUserDto`
- Errors: `401 Unauthorized` if not authenticated

---

### POST `/forgot-password`
- Purpose: Initiate password reset flow
- Auth: Not required
- Request body (JSON): `ForgotPasswordRequest`
```json
{ "email": "user@example.com" }
```
- Response: `202 Accepted` with `ForgotPasswordResponse`
```json
{ "message": "If the email exists, a reset link was sent." }
```
- Errors:
  - `400 Bad Request` for invalid email format
  - `429 Too Many Requests` for rate limit exceeded
- Notes: Rate limited by email + client IP

---

### POST `/reset-password`
- Purpose: Reset password using a reset token
- Auth: Not required
- Query params: `token=<string>` (token from email link)
- Request body (JSON): `ResetPasswordRequest`
```json
{ "newPassword": "NewP@ssw0rd!" }
```
- Response: `200 OK` with `ResetPasswordResponse`
```json
{ "message": "Password updated successfully" }
```
- Errors:
  - `400 Bad Request` for invalid or expired token
  - `429 Too Many Requests` for rate limit exceeded
- Notes: Rate limited by client IP + token

---

### POST `/verify-email`
- Purpose: Verify email using a verification token
- Auth: Not required
- Request body (JSON): `VerifyEmailRequest`
```json
{ "token": "l7UumEXn0GtNrrBQRg7kWGdOmP7WkTHUbqkENk2U1Oo" }
```
- Response: `200 OK` with `VerifyEmailResponse`
```json
{
  "verified": true,
  "message": "Email verified successfully",
  "verifiedAt": "2025-05-21T15:30:00"
}
```
- Errors: `400 Bad Request` for invalid or expired token
- Notes: Rate limited by client IP

---

### POST `/resend-verification`
- Purpose: Resend email verification link (if applicable)
- Auth: Not required
- Request body (JSON): `ResendVerificationRequest`
```json
{ "email": "user@example.com" }
```
- Response: `202 Accepted` with `ResendVerificationResponse`
```json
{ "message": "If the email exists and is not verified, a verification link was sent." }
```
- Errors: `429 Too Many Requests` for rate limit exceeded
- Notes: Rate limited by email + client IP

## DTOs

### RegisterRequest
```ts
type RegisterRequest = {
  username: string; // 4-20 chars, no leading/trailing spaces
  email: string;    // valid email, <=254 chars, no leading/trailing spaces
  password: string; // 8-100 chars, 1 upper, 1 lower, 1 digit, 1 special, no spaces
};
```

### LoginRequest
```ts
type LoginRequest = {
  username: string; // username or email
  password: string;
};
```

### RefreshRequest
```ts
type RefreshRequest = {
  refreshToken: string;
};
```

### JwtResponse
```ts
type JwtResponse = {
  accessToken: string;
  refreshToken: string;
  accessExpiresInMs: number;
  refreshExpiresInMs: number;
};
```

### AuthenticatedUserDto
```ts
type AuthenticatedUserDto = {
  id: string;              // UUID
  username: string;
  email: string;
  isActive: boolean;
  roles: ("ROLE_USER" | "ROLE_QUIZ_CREATOR" | "ROLE_MODERATOR" | "ROLE_ADMIN" | "ROLE_SUPER_ADMIN")[]; // Set<RoleName> in Java
  createdAt: string;           // ISO date-time (LocalDateTime in Java)
  lastLoginDate: string | null; // ISO date-time (LocalDateTime in Java)
  updatedAt: string;           // ISO date-time (LocalDateTime in Java)
};
```

### ForgotPasswordRequest
```ts
type ForgotPasswordRequest = {
  email: string; // valid email
};
```

### ForgotPasswordResponse
```ts
type ForgotPasswordResponse = {
  message: string;
};
```

### ResetPasswordRequest
```ts
type ResetPasswordRequest = {
  newPassword: string; // same password rules as register
};
```

### ResetPasswordResponse
```ts
type ResetPasswordResponse = {
  message: string;
};
```

### VerifyEmailRequest
```ts
type VerifyEmailRequest = {
  token: string; // <=512 chars
};
```

### VerifyEmailResponse
```ts
type VerifyEmailResponse = {
  verified: boolean;
  message: string;
  verifiedAt: string; // ISO date-time (LocalDateTime in Java)
};
```

### ResendVerificationRequest
```ts
type ResendVerificationRequest = {
  email: string; // valid email
};
```

### ResendVerificationResponse
```ts
type ResendVerificationResponse = {
  message: string;
};
```

## Notes for Frontend
- Use `Authorization: Bearer <accessToken>` for authorized calls (`/me`, `/logout`, and any other protected endpoints outside this controller).
- After `/login` or `/refresh`, store tokens securely and track `expiresInMs` to refresh before expiry.
- Password composition: at least 1 uppercase, 1 lowercase, 1 digit, 1 special character, no spaces; length 8–100.
- Rate limiting is enforced on forgot/reset/verify/resend; surface generic messages to avoid leaking account existence.
- Trusted proxy support: The system supports trusted proxy headers for accurate client IP detection in rate limiting.

## Rate Limiting Details
The auth controller implements comprehensive rate limiting using client IP addresses and email addresses:

- **Forgot Password**: Rate limited by email + client IP combination
- **Reset Password**: Rate limited by client IP + token combination  
- **Verify Email**: Rate limited by client IP only
- **Resend Verification**: Rate limited by email + client IP combination

Rate limits help prevent abuse while maintaining security through generic error messages that don't reveal whether accounts exist.

## Known Issues and Limitations
- **Missing 2FA endpoints**: The SecurityConfig references `/api/v1/auth/2fa/setup` and `/api/v1/auth/2fa/verify` endpoints that don't exist in the AuthController. These endpoints are marked as permitAll in the security configuration but are not implemented.
- **Logout implementation**: The logout endpoint currently has an empty implementation in the service layer, so tokens are not actually revoked. This means tokens remain valid until they expire naturally.
- **Refresh token behavior**: The refresh endpoint returns the same refresh token rather than generating a new one, which may not follow best security practices for token rotation.
- **Rate limiting configuration**: Rate limiting thresholds and time windows are configurable but not documented in this API specification.
