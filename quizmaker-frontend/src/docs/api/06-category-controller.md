# Categories Controller

## Overview
The CategoryController handles quiz category management, allowing administrators to create, update, delete, and retrieve categories for organizing quizzes.

**Base URL**: `/api/v1/categories`

**Authentication**: 
- Read operations: No authentication required
- Create/Update/Delete operations: ADMIN role required via Bearer token

## DTO Schemas

### CategoryDto
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",  // Category identifier
  "name": "Science",                              // Category name (3-100 characters)
  "description": "All science-related quizzes"    // Category description (max 1000 characters)
}
```

### CreateCategoryRequest
```json
{
  "name": "Science",                              // Required: Category name (3-100 characters)
  "description": "All science-related quizzes"    // Optional: Category description (max 1000 characters)
}
```

**Validation Rules**:
- `name`: Required, 3-100 characters
- `description`: Optional, max 1000 characters

### UpdateCategoryRequest
```json
{
  "name": "History",                              // Required: Updated category name (3-100 characters)
  "description": "Historical events and figures"  // Optional: Updated description (max 1000 characters)
}
```

**Validation Rules**:
- `name`: Required, 3-100 characters
- `description`: Optional, max 1000 characters

## Endpoints

### 1. List Categories
**GET** `/api/v1/categories`

Returns a paginated list of categories, sorted by name in ascending order.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort field (default: "name,asc")

**Example Request**:
```
GET /api/v1/categories?page=0&size=10&sort=name,asc
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "General",
      "description": "General knowledge topics"
    },
    {
      "id": "4fb96f75-6828-5673-c4gd-3d074f77bgb7",
      "name": "History",
      "description": "Historical events and figures"
    },
    {
      "id": "5gc07g86-7939-6784-d5he-4e185g88chc8",
      "name": "Science",
      "description": "All science-related quizzes"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 3,
    "totalPages": 1
  }
}
```

### 2. Create Category
**POST** `/api/v1/categories`

Creates a new category (ADMIN only).

**Request Body**:
```json
{
  "name": "Technology",
  "description": "Technology and computer science quizzes"
}
```

**Response** (201 Created):
```json
{
  "categoryId": "6hd18h97-8040-7895-e6if-5f296h99did9"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (invalid name/description)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role

### 3. Get Category by ID
**GET** `/api/v1/categories/{categoryId}`

Retrieves a specific category by its UUID.

**Path Parameters**:
- `categoryId`: UUID of the category (required)

**Example Request**:
```
GET /api/v1/categories/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Science",
  "description": "All science-related quizzes"
}
```

**Error Responses**:
- `404 Not Found`: Category not found

### 4. Update Category
**PATCH** `/api/v1/categories/{categoryId}`

Updates an existing category (ADMIN only).

**Path Parameters**:
- `categoryId`: UUID of the category (required)

**Request Body**:
```json
{
  "name": "Advanced Science",
  "description": "Advanced science topics and research"
}
```

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Advanced Science",
  "description": "Advanced science topics and research"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Category not found

### 5. Delete Category
**DELETE** `/api/v1/categories/{categoryId}`

Deletes a category by its UUID (ADMIN only).

**Path Parameters**:
- `categoryId`: UUID of the category (required)

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Category not found

## Integration Notes

### Category Management Workflow
1. **List Categories**: Display available categories for quiz organization
2. **Create Categories**: Admin creates new categories for better organization
3. **Update Categories**: Admin modifies existing category names/descriptions
4. **Delete Categories**: Admin removes unused categories

### Quiz-Category Relationship
- Categories are used to organize and filter quizzes
- Quizzes can be assigned to categories during creation
- Categories help users find relevant quizzes

### Permission Levels
- **Public Access**: List categories, get category by ID
- **Admin Only**: Create, update, delete categories

### Best Practices
- Use descriptive category names (3-100 characters)
- Provide helpful descriptions for better organization
- Consider category hierarchy for complex quiz systems
- Validate category existence before assigning to quizzes

### Error Handling
- Handle 401/403 responses for authentication/authorization
- Validate category IDs before making requests
- Show appropriate error messages for validation failures
- Handle 404 responses when categories don't exist

### Data Validation
- Category names must be 3-100 characters
- Descriptions must be under 1000 characters
- Both fields are required for create/update operations
- Category names should be unique (backend validation)

### Pagination
- Default page size is 20 categories
- Categories are sorted by name ascending
- Use pagination for large category lists
- Consider caching frequently accessed categories 