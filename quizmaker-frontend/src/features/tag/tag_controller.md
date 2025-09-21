# Tag Controller API

Base path: `/api/v1/tags`

This document lists all tag endpoints and the DTOs for requests and responses, with payload examples for frontend integration.

## Endpoints

### GET `/`
- Purpose: List tags with pagination (sorted by `name` ascending by default)
- Auth: Not required
- Query params:
  - `page` (number, default `0`)
  - `size` (number, default `20`)
  - `sort` (string, e.g., `name,asc`)
- Response: `200 OK` with `Page<TagDto>`
- Errors: None (public endpoint)
```json
{
  "content": [
    { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "math", "description": "Questions related to mathematics" },
    { "id": "2fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "science", "description": "Questions about scientific topics" }
  ],
  "pageable": {
    "sort": { "sorted": true, "unsorted": false, "empty": false },
    "pageNumber": 0,
    "pageSize": 20,
    "offset": 0,
    "paged": true,
    "unpaged": false
  },
  "totalPages": 1,
  "totalElements": 2,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "numberOfElements": 2,
  "first": true,
  "empty": false
}
```

---

### POST `/`
- Purpose: Create a new tag
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Request body (JSON): `CreateTagRequest`
```json
{
  "name": "science",
  "description": "Questions about scientific topics"
}
```
- Response: `201 Created`
```json
{ "tagId": "3fa85f64-5717-4562-b3fc-2c963f66afa6" }
```
- Errors:
  - `400 Bad Request` for validation errors (invalid name/description length)
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)

---

### GET `/{tagId}`
- Purpose: Get a tag by ID
- Auth: Not required
- Path params: `tagId` (UUID)
- Response: `200 OK` with `TagDto`
```json
{ "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "math", "description": "Questions related to mathematics" }
```
- Errors:
  - `404 Not Found` if tag doesn't exist

---

### PATCH `/{tagId}`
- Purpose: Update an existing tag
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `tagId` (UUID)
- Request body (JSON): `UpdateTagRequest`
```json
{
  "name": "history",
  "description": "Questions about historical events"
}
```
- Response: `200 OK` with updated `TagDto`
- Errors:
  - `400 Bad Request` for validation errors (invalid name/description length)
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)
  - `404 Not Found` if tag doesn't exist

---

### DELETE `/{tagId}`
- Purpose: Delete a tag
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `tagId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)
  - `404 Not Found` if tag doesn't exist

## DTOs

### TagDto
```ts
type TagDto = {
  id: string;         // UUID
  name: string;       // 3-50 chars
  description?: string | null; // optional (server may return null)
};
```

### CreateTagRequest
```ts
type CreateTagRequest = {
  name: string;        // @Size(min = 3, max = 50) - 3-50 chars
  description?: string; // @Size(max = 1000) - optional, <= 1000 chars
};
```

### UpdateTagRequest
```ts
type UpdateTagRequest = {
  name?: string;        // @Size(min = 3, max = 50) - 3-50 chars
  description?: string; // @Size(max = 1000) - optional, <= 1000 chars
};
```

### CreateTagResponse
```ts
type CreateTagResponse = {
  tagId: string; // UUID
};
```

### Page<T>
```ts
type Sort = { sorted: boolean; unsorted: boolean; empty: boolean };

type Pageable = {
  sort: Sort;
  pageNumber: number;
  pageSize: number;
  offset: number;
  paged: boolean;
  unpaged: boolean;
};

type Page<T> = {
  content: T[];
  pageable: Pageable;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};
```

## Notes for Frontend
- **Authentication**: Admin-only endpoints (`POST /`, `PATCH /{tagId}`, `DELETE /{tagId}`) require `Authorization: Bearer <accessToken>` and `ROLE_ADMIN`.
- **Public endpoints**: `GET /` and `GET /{tagId}` are publicly accessible without authentication.
- **Pagination defaults**: `page=0`, `size=20`, `sort=name,asc`.
- **Validation**: 
  - `name`: `@Size(min = 3, max = 50)` - 3-50 characters
  - `description`: `@Size(max = 1000)` - up to 1000 characters
- **Error handling**: All admin endpoints return `403 Forbidden` for non-admin users.
- **Data types**: All DTOs use Java records with proper validation annotations.

## Known Issues and Limitations
- **Validation gaps**: 
  - `CreateTagRequest` and `UpdateTagRequest` use `@Size` only, not `@NotBlank` or `@NotNull`
  - This means `null` values for `name` can pass validation but may fail at the database level
  - Consider adding `@NotBlank` for required fields in future updates
- **PATCH semantics**: 
  - `UpdateTagRequest` fields are optional, but the mapper may unconditionally set fields
  - This could potentially overwrite existing values with `null` if not handled properly
- **Database constraints**: 
  - Tag names likely have unique constraints at the database level
  - Deletion may fail if tags are referenced by quizzes due to foreign key constraints
  - Consider adding `409 Conflict` error handling for constraint violations
- **Admin-only operations**: 
  - All CUD (Create, Update, Delete) operations require admin privileges
  - No granular permissions for tag management
  - Consider adding moderator-level permissions for tag editing
- **Unused parameters**: 
  - Service methods accept `username` parameters but don't use them for ownership checks
  - This suggests tags are not user-owned, which may be intentional
- **Swagger documentation**: 
  - Uses `bearerAuth` security requirement name, should be consistent across controllers
  - Some `@Tag` descriptions could be more descriptive
- **Error handling**: 
  - Generic error responses without detailed validation messages
  - Consider using externalized validation messages like other controllers
- **No rate limiting**: 
  - Unlike other controllers, tag endpoints don't have specific rate limiting
  - Could lead to abuse, especially for public endpoints
