# Category Controller API

Base path: `/api/v1/categories`

This document lists all category endpoints and DTOs with payload examples, mirroring the style of `auth_controller.md`.

Public GET access is allowed; create/update/delete require Admin role.

## Endpoints

### GET `/`
- Purpose: List categories (paginated)
- Auth: Not required
- Query params (Spring Pageable):
  - `page`: number, default `0`
  - `size`: number, default `20`
  - `sort`: string, default `name,asc`
- Response: `200 OK` with `Page<CategoryDto>`
```json
{
  "content": [
    { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "General", "description": "General knowledge topics" },
    { "id": "d290f1ee-6c54-4b01-90e6-d701748f0851", "name": "Science", "description": "All science-related quizzes" }
  ],
  "pageable": { "pageNumber": 0, "pageSize": 20 },
  "totalElements": 2,
  "totalPages": 1,
  "last": true,
  "size": 20,
  "number": 0,
  "sort": { "sorted": true, "unsorted": false, "empty": false },
  "first": true,
  "numberOfElements": 2,
  "empty": false
}
```

---

### GET `/{categoryId}`
- Purpose: Retrieve a single category by UUID
- Auth: Not required
- Path params: `categoryId` (UUID)
- Response: `200 OK` with `CategoryDto`
```json
{ "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "General", "description": "General knowledge topics" }
```
- Not found: `404 Not Found`
```json
{
  "timestamp": "2025-05-21T15:30:00",
  "status": 404,
  "error": "Not Found",
  "details": ["Category 3fa85f64-5717-4562-b3fc-2c963f66afa6 not found"]
}
```

---

### POST `/`
- Purpose: Create a new category
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Request body (JSON): `CreateCategoryRequest`
```json
{
  "name": "Science",
  "description": "All science-related quizzes"
}
```
- Response: `201 Created`
```json
{ "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851" }
```
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)
  - `409 Conflict` for duplicate name or database constraint violations

Validation/Conflict examples:
- `400 Bad Request` (validation)
```json
{
  "timestamp": "2025-05-21T15:30:00",
  "status": 400,
  "error": "Validation Failed",
  "details": [
    "name: Category name length must be between 3 and 100 characters"
  ]
}
```
- `409 Conflict` (duplicate name or DB constraint)
```json
{
  "timestamp": "2025-05-21T15:30:00",
  "status": 409,
  "error": "Conflict",
  "details": ["Database error: duplicate key value violates unique constraint 'categories_category_name_key'"]
}
```

---

### PATCH `/{categoryId}`
- Purpose: Update name and/or description of a category
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `categoryId` (UUID)
- Request body (JSON): `UpdateCategoryRequest`
```json
{
  "name": "History",
  "description": "Historical events and figures"
}
```
- Response: `200 OK` with updated `CategoryDto`
```json
{ "id": "d290f1ee-6c54-4b01-90e6-d701748f0851", "name": "History", "description": "Historical events and figures" }
```
- Errors:
  - `400 Bad Request` for validation errors
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)
  - `404 Not Found` if category doesn't exist
  - `409 Conflict` for duplicate name or database constraint violations

---

### DELETE `/{categoryId}`
- Purpose: Delete a category
- Auth: Required (Admin)
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `categoryId` (UUID)
- Response: `204 No Content`
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `403 Forbidden` for insufficient permissions (non-admin users)
  - `404 Not Found` if category doesn't exist
  - `409 Conflict` if the category is referenced by quizzes

## DTOs

### CreateCategoryRequest
```ts
type CreateCategoryRequest = {
  name: string;        // 3-100 chars (@Size only, allows null)
  description?: string; // <= 1000 chars (@Size only)
};
```

### UpdateCategoryRequest
```ts
type UpdateCategoryRequest = {
  name?: string;        // 3-100 chars (@Size only, allows null)
  description?: string; // <= 1000 chars (@Size only)
};
```

### CategoryDto
```ts
type CategoryDto = {
  id: string;         // UUID
  name: string;
  description?: string; // nullable in Java
};
```

## Notes for Frontend
- **Public reads**: both `GET /` and `GET /{id}` are public; no token required.
- **Admin writes**: `POST`, `PATCH`, `DELETE` require Admin role; send `Authorization: Bearer <accessToken>`.
- **Pagination**: use `page`, `size`, and `sort` (e.g., `sort=name,asc`). Defaults are page 0, size 20, `name,asc`.
- **Conflicts**: duplicate `name` or deleting categories in use returns `409 Conflict`. Display a friendly message.
- **Swagger/OpenAPI**: The controller includes comprehensive OpenAPI annotations with detailed descriptions and examples.
- **Validation**: All input validation uses `@Size` constraints only - `null` values are not rejected at validation level but will cause database errors.

## Known Issues and Limitations
- **Missing NotNull/NotBlank on `name`**:
  - `CreateCategoryRequest` and `UpdateCategoryRequest` use only `@Size`, which does not reject `null`. Submitting `name: null` passes validation, then fails at the DB layer (`nullable=false`) with `409 Conflict` from `DataIntegrityViolationException`.
  - Recommendation: add `@NotBlank` (or at least `@NotNull`) to `name` in both requests.

- **PATCH overwrites fields with nulls**:
  - `CategoryMapper.updateCategory` unconditionally sets both `name` and `description`. If a field is omitted (sent as `null`), it can overwrite existing values, and `name=null` causes a DB error.
  - Recommendation: treat PATCH as partial update (only apply non-null fields) or make fields required and use PUT semantics.

- **Duplicate name handling is DB-driven**:
  - Unique constraint on `Category.name` triggers a `409 Conflict` with a raw DB message.
  - Recommendation: pre-check `findByName(...)` and return a user-friendly `409` like "Category name already exists".

- **Deleting categories referenced by quizzes**:
  - `Quiz` has a non-null `@ManyToOne` to `Category` (`quiz.category_id`), so deleting a category that is in use will likely raise a foreign-key `DataIntegrityViolationException` → `409 Conflict`.
  - Recommendation: block deletion when in use and return a clear error (e.g., "Category is assigned to existing quizzes"). Consider a soft delete or reassignment flow.

- **Unused `username` parameters in service methods**:
  - `createCategory`, `updateCategoryById`, `deleteCategoryById` accept `username` but do not use it.
  - Recommendation: either use for auditing/ownership checks or remove to reduce noise.

- **Swagger documentation mismatch**:
  - The controller uses `@SecurityRequirement(name = "bearerAuth")` but the actual security configuration may use different naming conventions.
  - The `@Tag` description is incomplete in the controller annotation.

- **Validation message inconsistencies**:
  - Validation messages are hardcoded in the DTOs rather than using externalized message properties.
