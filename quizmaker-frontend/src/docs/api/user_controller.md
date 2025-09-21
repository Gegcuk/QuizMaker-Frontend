# User Controller API

Base path: `/api/v1/users`

This document lists user profile endpoints and DTOs with payload examples, mirroring the style of `auth_controller.md`.

All endpoints require authentication with a JWT Bearer token.

## Endpoints

### GET `/me`
- Purpose: Get the authenticated user's profile
- Auth: Required
- Headers:
  - `Authorization: Bearer <accessToken>`
- Response: `200 OK` with `UserProfileResponse`
- Response headers: `ETag: "<version>"`, `Cache-Control: no-store`, `Pragma: no-cache`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "jdoe",
  "email": "jdoe@example.com",
  "displayName": "John Doe",
  "bio": "Frontend dev and quiz fan",
  "avatarUrl": "https://cdn.example.com/avatars/ab12cd34.png",
  "preferences": { "theme": "dark", "lang": "en" },
  "joinedAt": "2025-05-21T15:30:00",
  "verified": true,
  "roles": ["ADMIN", "USER"],
  "version": 3
}
```

---

### PATCH `/me`
- Purpose: Update profile fields (merge-patch semantics)
- Auth: Required
- Headers:
  - `Authorization: Bearer <accessToken>`
  - `If-Match: "<version>"` (optional but recommended for concurrency control)
- Content types: `application/json` or `application/merge-patch+json`
- Request body: Partial object; omitted field = no change, field set to `null` = clear, non-null = set sanitized
```json
{
  "displayName": "Jane D",
  "bio": "Builder of cool quizzes",
  "preferences": { "theme": "dark", "notifications": true }
}
```
- Response: `200 OK` with updated `UserProfileResponse` (and new `ETag`)
- Errors:
  - `400 Bad Request` for invalid lengths or preferences format
  - `401 Unauthorized` for missing or invalid authentication
  - `412 Precondition Failed` for `If-Match` version mismatch (when provided)

Notes:
- `displayName` max 50 chars; `bio` max 500 chars; `preferences` is an object capped at ~50 keys, keys up to 64 chars; values are stored as JSON.
- Server sanitizes `displayName` and `bio` to mitigate XSS and truncates to limits.

---

### POST `/me/avatar`
- Purpose: Upload a new avatar image; stored as a 512×512 (max) PNG
- Auth: Required
- Headers:
  - `Authorization: Bearer <accessToken>`
- Content type: `multipart/form-data`
- Form fields:
  - `file` (binary): image file
- Response: `200 OK` with `AvatarUploadResponse`
```json
{ "avatarUrl": "https://cdn.example.com/avatars/ab12cd34.png", "message": "Avatar updated successfully" }
```

Validation and limits:
- Max size 10 MB; max source dimensions 10,000×10,000; rejects corrupt images.
- Accepted types (effective): PNG, JPEG. Image is normalized to PNG and EXIF orientation is applied if present.

- Errors:
  - `400 Bad Request` for unsupported image type or size/dimensions invalid
  - `401 Unauthorized` for missing or invalid authentication
  - `500 Internal Server Error` for storage failure

## DTOs

### UpdateUserProfileRequest
```ts
type UpdateUserProfileRequest = {
  displayName?: string | null; // @Size(max = 50) - <= 50 chars; sanitized; null clears
  bio?: string | null;         // @Size(max = 500) - <= 500 chars; sanitized; null clears
  preferences?: Record<string, unknown> | null; // Map<String, Object> - object; null clears
};
```

### UserProfileResponse
```ts
type UserProfileResponse = {
  id: string;                // UUID
  username: string;
  email: string;
  displayName: string;       // falls back to username when unset
  bio?: string | null;
  avatarUrl?: string | null; // absolute URL
  preferences: Record<string, unknown>; // Map<String, Object> - parsed JSON or {}
  joinedAt: string;          // LocalDateTime - ISO date-time
  verified: boolean;
  roles: string[];           // List<String> - e.g., ["ADMIN", "USER"]
  version: number | null;    // Long in Java - optimistic lock version, also sent as ETag
};
```

### AvatarUploadResponse
```ts
type AvatarUploadResponse = {
  avatarUrl: string; // absolute URL to the uploaded PNG
  message: string;
};
```

## Notes for Frontend
- **Authentication**: All endpoints require `Authorization: Bearer <accessToken>` authentication.
- **Concurrency control**: Read `ETag` from GET `/me` and send `If-Match` on PATCH to prevent lost updates. Example: `If-Match: "3"`.
- **Merge patch semantics**: Omit fields you don't want to change; send `null` to clear a field; send non-null values to update.
- **Avatar upload**: Restrict file picker to PNG/JPEG/WEBP; expect server to return a PNG URL regardless of input type.
- **Caching**: Profile responses are marked `no-store`; use returned body instead of caching.
- **Data types**: All DTOs use Java records with proper type mappings (Long → number, LocalDateTime → string).
- **XSS protection**: Server sanitizes `displayName` and `bio` fields and truncates to limits.
- **Content types**: PATCH endpoint accepts both `application/json` and `application/merge-patch+json`.

## Known Issues and Limitations
- **OpenAPI security scheme name mismatch**:
  - Controller annotates `@SecurityRequirement(name = "Bearer Authentication")` while the configured scheme is `bearerAuth`
  - This may cause missing security documentation in Swagger UI
  - Recommendation: Change to `@SecurityRequirement(name = "bearerAuth")` for consistency
- **WEBP inconsistency in documentation vs implementation**:
  - Endpoint description mentions WEBP, but avatar service implementation may only accept PNG and JPEG
  - Uploading WEBP may be rejected depending on service implementation
  - Recommendation: Either allow `image/webp` in the service or remove WEBP from endpoint description
- **Optional `If-Match` may permit lost updates**:
  - PATCH proceeds without version when `If-Match` is absent or unparsable
  - Concurrent edits could overwrite changes without proper version checking
  - Recommendation: Consider enforcing `If-Match` server-side (412 when missing) or requiring clients to always send it
- **ETag with `no-store`**:
  - Responses include `ETag` but also set `Cache-Control: no-store`
  - The ETag is intended for optimistic concurrency control, not caching
- **Validation gaps**:
  - `UpdateUserProfileRequest` uses `@Size` only, not `@NotBlank` or `@NotNull`
  - This means `null` values can pass validation but may be handled differently in service logic
- **JsonNode usage**:
  - PATCH endpoint accepts `JsonNode` directly instead of validated DTO
  - This bypasses validation annotations and requires manual validation in service layer
- **Dead code**:
  - `ProfileController` exists but contains no endpoints; consider removing or implementing as intended
- **Missing validation for preferences**:
  - No size limits or structure validation for preferences object
  - Could lead to large payloads or malformed data
- **Inconsistent error handling**:
  - Some endpoints use `ResponseStatusException` while others may use different patterns
  - Consider standardizing error handling across all user endpoints
