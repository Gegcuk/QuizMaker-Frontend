# Tags Controller

## Overview
The TagController handles quiz tag management, allowing administrators to create, update, delete, and retrieve tags for categorizing and filtering quizzes.

**Base URL**: `/api/v1/tags`

**Authentication**: 
- Read operations: No authentication required
- Create/Update/Delete operations: ADMIN role required via Bearer token

## DTO Schemas

### TagDto
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",  // Tag identifier
  "name": "math",                                 // Tag name (3-50 characters)
  "description": "Questions related to mathematics" // Tag description (max 1000 characters)
}
```

### CreateTagRequest
```json
{
  "name": "science",                              // Required: Tag name (3-50 characters)
  "description": "Questions about scientific topics" // Optional: Tag description (max 1000 characters)
}
```

**Validation Rules**:
- `name`: Required, 3-50 characters
- `description`: Optional, max 1000 characters

### UpdateTagRequest
```json
{
  "name": "history",                              // Required: Updated tag name (3-50 characters)
  "description": "Questions about historical events" // Optional: Updated description (max 1000 characters)
}
```

**Validation Rules**:
- `name`: Required, 3-50 characters
- `description`: Optional, max 1000 characters

## Endpoints

### 1. List Tags
**GET** `/api/v1/tags`

Returns a paginated list of tags, sorted by name in ascending order.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort field (default: "name,asc")

**Example Request**:
```
GET /api/v1/tags?page=0&size=10&sort=name,asc
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "algebra",
      "description": "Questions about algebraic concepts"
    },
    {
      "id": "4fb96f75-6828-5673-c4gd-3d074f77bgb7",
      "name": "biology",
      "description": "Questions about biological sciences"
    },
    {
      "id": "5gc07g86-7939-6784-d5he-4e185g88chc8",
      "name": "chemistry",
      "description": "Questions about chemical reactions"
    },
    {
      "id": "6hd18h97-8040-7895-e6if-5f296h99did9",
      "name": "geometry",
      "description": "Questions about geometric shapes"
    },
    {
      "id": "7ie29i08-9151-8906-f7jg-6g307i09eje0",
      "name": "physics",
      "description": "Questions about physical laws"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 5,
    "totalPages": 1
  }
}
```

### 2. Create Tag
**POST** `/api/v1/tags`

Creates a new tag (ADMIN only).

**Request Body**:
```json
{
  "name": "programming",
  "description": "Questions about programming languages and concepts"
}
```

**Response** (201 Created):
```json
{
  "tagId": "8jf30j19-0262-9017-g8kh-7h418j10fkf1"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error (invalid name/description)
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role

### 3. Get Tag by ID
**GET** `/api/v1/tags/{tagId}`

Retrieves a specific tag by its UUID.

**Path Parameters**:
- `tagId`: UUID of the tag (required)

**Example Request**:
```
GET /api/v1/tags/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "algebra",
  "description": "Questions about algebraic concepts"
}
```

**Error Responses**:
- `404 Not Found`: Tag not found

### 4. Update Tag
**PATCH** `/api/v1/tags/{tagId}`

Updates an existing tag (ADMIN only).

**Path Parameters**:
- `tagId`: UUID of the tag (required)

**Request Body**:
```json
{
  "name": "advanced-algebra",
  "description": "Advanced questions about algebraic concepts and theories"
}
```

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "advanced-algebra",
  "description": "Advanced questions about algebraic concepts and theories"
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Tag not found

### 5. Delete Tag
**DELETE** `/api/v1/tags/{tagId}`

Deletes a tag by its UUID (ADMIN only).

**Path Parameters**:
- `tagId`: UUID of the tag (required)

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Tag not found

## Integration Notes

### Tag Management Workflow
1. **List Tags**: Display available tags for quiz categorization
2. **Create Tags**: Admin creates new tags for better organization
3. **Update Tags**: Admin modifies existing tag names/descriptions
4. **Delete Tags**: Admin removes unused tags

### Quiz-Tag Relationship
- Tags are used to categorize and filter quizzes
- Quizzes can be assigned multiple tags during creation
- Tags help users find relevant quizzes through search and filtering
- Tags provide more granular categorization than categories

### Permission Levels
- **Public Access**: List tags, get tag by ID
- **Admin Only**: Create, update, delete tags

### Tag vs Category Differences
- **Categories**: Broad organizational groups (e.g., "Science", "History")
- **Tags**: Specific topics or concepts (e.g., "algebra", "world-war-ii")
- **Multiple Tags**: Quizzes can have multiple tags but typically one category
- **Search**: Tags are more useful for detailed search and filtering

### Best Practices
- Use short, descriptive tag names (3-50 characters)
- Use lowercase with hyphens for multi-word tags (e.g., "world-war-ii")
- Provide helpful descriptions for better organization
- Consider tag popularity and usage patterns
- Avoid creating too many similar tags

### Error Handling
- Handle 401/403 responses for authentication/authorization
- Validate tag IDs before making requests
- Show appropriate error messages for validation failures
- Handle 404 responses when tags don't exist

### Data Validation
- Tag names must be 3-50 characters
- Descriptions must be under 1000 characters
- Both fields are required for create/update operations
- Tag names should be unique (backend validation)

### Pagination
- Default page size is 20 tags
- Tags are sorted by name ascending
- Use pagination for large tag lists
- Consider caching frequently accessed tags

### Search and Filtering
- Tags are commonly used for quiz search functionality
- Implement tag-based filtering in quiz listings
- Consider tag autocomplete for quiz creation
- Use tags for related quiz suggestions

### Tag Suggestions
- Consider implementing tag suggestions based on quiz content
- Show popular tags in tag selection interfaces
- Provide tag usage statistics for admins
- Implement tag merging for duplicate tags 