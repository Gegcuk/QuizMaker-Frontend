# Quiz Controller

## Overview
The QuizController handles quiz creation, management, AI-powered generation from documents, and quiz analytics.

**Base URL**: `/api/v1/quizzes`

**Authentication**: Most endpoints require ADMIN role authentication via Bearer token.

## DTO Schemas

### CreateQuizRequest
```json
{
  "title": "string",              // 3-100 characters, required
  "description": "string",        // Max 1000 characters, optional
  "visibility": "PUBLIC|PRIVATE", // Defaults to PRIVATE
  "difficulty": "EASY|MEDIUM|HARD", // Defaults to MEDIUM
  "isRepetitionEnabled": true,    // Boolean
  "timerEnabled": true,           // Boolean
  "estimatedTime": 10,            // 1-180 minutes, required
  "timerDuration": 5,             // 1-180 minutes, required
  "categoryId": "uuid",           // Optional
  "tagIds": ["uuid1", "uuid2"]    // Optional array
}
```

**Validation Rules**:
- `title`: Required, 3-100 characters
- `description`: Optional, max 1000 characters
- `estimatedTime`: Required, 1-180 minutes
- `timerDuration`: Required, 1-180 minutes

### UpdateQuizRequest
```json
{
  "title": "string",              // 3-100 characters, optional
  "description": "string",        // Max 1000 characters, optional
  "visibility": "PUBLIC|PRIVATE", // Optional
  "difficulty": "EASY|MEDIUM|HARD", // Optional
  "isRepetitionEnabled": true,    // Optional boolean
  "timerEnabled": true,           // Optional boolean
  "estimatedTime": 20,            // 1-180 minutes, optional
  "timerDuration": 10,            // 1-180 minutes, optional
  "categoryId": "uuid",           // Optional
  "tagIds": ["uuid1", "uuid2"]    // Optional array
}
```

### QuizDto
```json
{
  "id": "uuid",                   // Quiz identifier
  "creatorId": "uuid",            // Creator user ID
  "categoryId": "uuid",           // Category ID
  "title": "string",              // Quiz title
  "description": "string",        // Quiz description
  "visibility": "PUBLIC|PRIVATE", // Quiz visibility
  "difficulty": "EASY|MEDIUM|HARD", // Quiz difficulty
  "status": "DRAFT|PUBLISHED|ARCHIVED", // Quiz status
  "estimatedTime": 15,            // Estimated time in minutes
  "isRepetitionEnabled": false,   // Repetition setting
  "timerEnabled": true,           // Timer setting
  "timerDuration": 10,            // Timer duration in minutes
  "tagIds": ["uuid1", "uuid2"],   // Associated tag IDs
  "createdAt": "2025-05-01T15:30:00Z", // Creation timestamp
  "updatedAt": "2025-05-10T12:00:00Z"  // Last update timestamp
}
```

### QuizSearchCriteria
```json
{
  "category": ["string"],         // Filter by category names
  "tag": ["string"],              // Filter by tag names
  "authorName": "string",         // Filter by author username
  "search": "string",             // Full-text search on title/description
  "difficulty": "EASY|MEDIUM|HARD" // Filter by difficulty
}
```

### GenerateQuizFromDocumentRequest
```json
{
  "documentId": "uuid",           // Required: Document ID
  "quizScope": "ENTIRE_DOCUMENT|SPECIFIC_CHUNKS|SPECIFIC_CHAPTER|SPECIFIC_SECTION", // Default: ENTIRE_DOCUMENT
  "chunkIndices": [0, 1, 2],      // Required for SPECIFIC_CHUNKS scope
  "chapterTitle": "string",       // Required for SPECIFIC_CHAPTER/SECTION scope
  "chapterNumber": 1,             // Alternative for SPECIFIC_CHAPTER/SECTION scope
  "quizTitle": "string",          // Optional: Custom title (max 100 chars)
  "quizDescription": "string",    // Optional: Custom description (max 500 chars)
  "questionsPerType": {           // Required: Questions per type per chunk
    "MCQ_SINGLE": 3,
    "TRUE_FALSE": 2,
    "OPEN": 1
  },
  "difficulty": "EASY|MEDIUM|HARD", // Required: Question difficulty
  "estimatedTimePerQuestion": 2,  // 1-10 minutes, default: 2
  "categoryId": "uuid",           // Optional: Category ID
  "tagIds": ["uuid1", "uuid2"]    // Optional: Tag IDs
}
```

**Available Question Types**:
- `MCQ_SINGLE`: Multiple choice single answer
- `MCQ_MULTI`: Multiple choice multiple answers
- `OPEN`: Open-ended questions
- `FILL_GAP`: Fill in the blank
- `COMPLIANCE`: Compliance questions
- `TRUE_FALSE`: True/False questions
- `ORDERING`: Ordering questions
- `HOTSPOT`: Hotspot questions

### QuizGenerationResponse
```json
{
  "jobId": "uuid",                // Job identifier for tracking
  "status": "PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED",
  "message": "string",            // Status description
  "estimatedTimeSeconds": 300     // Estimated completion time
}
```

### QuizResultSummaryDto
```json
{
  "quizId": "uuid",               // Quiz identifier
  "attemptsCount": 150,           // Total attempts
  "averageScore": 75.5,           // Average score percentage
  "bestScore": 95.0,              // Best score achieved
  "worstScore": 25.0,             // Worst score achieved
  "passRate": 68.0,               // Pass rate percentage
  "questionStats": [               // Per-question statistics
    {
      "questionId": "uuid",
      "timesAsked": 150,
      "timesCorrect": 120,
      "correctRate": 80.0
    }
  ]
}
```

### LeaderboardEntryDto
```json
{
  "userId": "uuid",               // User identifier
  "username": "string",           // Username
  "bestScore": 95.0               // Best score for the quiz
}
```

## Enums

### Visibility
- `PUBLIC`: Quiz is visible to all users
- `PRIVATE`: Quiz is only visible to creator and admins

### QuizStatus
- `DRAFT`: Quiz is in draft state
- `PUBLISHED`: Quiz is published and available
- `ARCHIVED`: Quiz is archived

### Difficulty
- `EASY`: Easy difficulty level
- `MEDIUM`: Medium difficulty level
- `HARD`: Hard difficulty level

### GenerationStatus
- `PENDING`: Job is waiting to be processed
- `PROCESSING`: Job is currently being processed
- `COMPLETED`: Job has completed successfully
- `FAILED`: Job has failed
- `CANCELLED`: Job has been cancelled

### QuizScope
- `ENTIRE_DOCUMENT`: Generate quiz for entire document
- `SPECIFIC_CHUNKS`: Generate quiz for specific chunks
- `SPECIFIC_CHAPTER`: Generate quiz for specific chapter
- `SPECIFIC_SECTION`: Generate quiz for specific section

## Endpoints

### 1. Create Quiz
**POST** `/api/v1/quizzes`

Creates a new quiz (ADMIN only).

**Request Body**:
```json
{
  "title": "JavaScript Fundamentals",
  "description": "Test your knowledge of JavaScript basics",
  "visibility": "PUBLIC",
  "difficulty": "MEDIUM",
  "isRepetitionEnabled": false,
  "timerEnabled": true,
  "estimatedTime": 15,
  "timerDuration": 10,
  "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
}
```

**Response** (201 Created):
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role

### 2. List Quizzes
**GET** `/api/v1/quizzes`

Returns paginated list of quizzes with optional filtering.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `sort`: Sort field (default: createdAt,desc)
- `category`: Filter by category names (comma-separated)
- `tag`: Filter by tag names (comma-separated)
- `authorName`: Filter by author username
- `search`: Full-text search on title/description
- `difficulty`: Filter by difficulty

**Example Request**:
```
GET /api/v1/quizzes?page=0&size=10&category=Programming&difficulty=MEDIUM&search=JavaScript
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "creatorId": "123e4567-e89b-12d3-a456-426614174000",
      "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "title": "JavaScript Fundamentals",
      "description": "Test your knowledge of JavaScript basics",
      "visibility": "PUBLIC",
      "difficulty": "MEDIUM",
      "status": "PUBLISHED",
      "estimatedTime": 15,
      "isRepetitionEnabled": false,
      "timerEnabled": true,
      "timerDuration": 10,
      "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"],
      "createdAt": "2025-05-01T15:30:00Z",
      "updatedAt": "2025-05-10T12:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 3. Get Quiz by ID
**GET** `/api/v1/quizzes/{quizId}`

Returns a specific quiz by its ID.

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "creatorId": "123e4567-e89b-12d3-a456-426614174000",
  "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "title": "JavaScript Fundamentals",
  "description": "Test your knowledge of JavaScript basics",
  "visibility": "PUBLIC",
  "difficulty": "MEDIUM",
  "status": "PUBLISHED",
  "estimatedTime": 15,
  "isRepetitionEnabled": false,
  "timerEnabled": true,
  "timerDuration": 10,
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"],
  "createdAt": "2025-05-01T15:30:00Z",
  "updatedAt": "2025-05-10T12:00:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Quiz not found

### 4. Update Quiz
**PATCH** `/api/v1/quizzes/{quizId}`

Updates an existing quiz (ADMIN only).

**Request Body**:
```json
{
  "title": "Updated JavaScript Fundamentals",
  "description": "Updated description",
  "difficulty": "HARD",
  "timerEnabled": false
}
```

**Response** (200 OK): Returns updated QuizDto

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Quiz not found

### 5. Delete Quiz
**DELETE** `/api/v1/quizzes/{quizId}`

Deletes a quiz (ADMIN only).

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Quiz not found

### 6. Generate Quiz from Document
**POST** `/api/v1/quizzes/generate-from-document`

Starts AI-powered quiz generation from document (ADMIN only).

**Request Body**:
```json
{
  "documentId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "quizScope": "ENTIRE_DOCUMENT",
  "quizTitle": "Machine Learning Fundamentals Quiz",
  "quizDescription": "Test your knowledge of ML basics",
  "questionsPerType": {
    "MCQ_SINGLE": 3,
    "TRUE_FALSE": 2,
    "OPEN": 1
  },
  "difficulty": "MEDIUM",
  "estimatedTimePerQuestion": 2,
  "categoryId": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
}
```

**Response** (202 Accepted):
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "PROCESSING",
  "message": "Quiz generation started successfully",
  "estimatedTimeSeconds": 300
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Document not found
- `409 Conflict`: User already has active generation job

### 7. Get Generation Status
**GET** `/api/v1/quizzes/generation-status/{jobId}`

Gets the status of a quiz generation job.

**Response** (200 OK):
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "PROCESSING",
  "message": "Processing chunk 3 of 10",
  "estimatedTimeSeconds": 180,
  "progress": {
    "processedChunks": 3,
    "totalChunks": 10,
    "percentage": 30.0
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to access this job
- `404 Not Found`: Generation job not found

### 8. Get Generated Quiz
**GET** `/api/v1/quizzes/generated-quiz/{jobId}`

Retrieves the generated quiz once generation is completed.

**Response** (200 OK): Returns QuizDto

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to access this quiz
- `404 Not Found`: Generation job or quiz not found
- `409 Conflict`: Generation job not yet completed

### 9. Cancel Generation Job
**DELETE** `/api/v1/quizzes/generation-status/{jobId}`

Cancels an active quiz generation job (ADMIN only).

**Response** (200 OK): Returns updated QuizGenerationStatus

**Error Responses**:
- `400 Bad Request`: Job cannot be cancelled
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Generation job not found

### 10. Get Quiz Results Summary
**GET** `/api/v1/quizzes/{quizId}/results`

Gets aggregated quiz results and statistics.

**Response** (200 OK):
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "attemptsCount": 150,
  "averageScore": 75.5,
  "bestScore": 95.0,
  "worstScore": 25.0,
  "passRate": 68.0,
  "questionStats": [
    {
      "questionId": "a1b2c3d4-0000-0000-0000-000000000000",
      "timesAsked": 150,
      "timesCorrect": 120,
      "correctRate": 80.0
    }
  ]
}
```

### 11. Get Quiz Leaderboard
**GET** `/api/v1/quizzes/{quizId}/leaderboard`

Gets the leaderboard for a quiz.

**Query Parameters**:
- `top`: Number of top entries (default: 10)

**Response** (200 OK):
```json
[
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "topUser",
    "bestScore": 95.0
  },
  {
    "userId": "456e7890-e89b-12d3-a456-426614174000",
    "username": "secondUser",
    "bestScore": 88.0
  }
]
```

### 12. Update Quiz Visibility
**PATCH** `/api/v1/quizzes/{quizId}/visibility`

Changes quiz visibility (ADMIN only).

**Request Body**:
```json
{
  "visibility": "PUBLIC"
}
```

**Response** (200 OK): Returns updated QuizDto

### 13. Update Quiz Status
**PATCH** `/api/v1/quizzes/{quizId}/status`

Changes quiz status (ADMIN only).

**Request Body**:
```json
{
  "status": "PUBLISHED"
}
```

**Response** (200 OK): Returns updated QuizDto

### 14. Get Public Quizzes
**GET** `/api/v1/quizzes/public`

Returns paginated list of public quizzes.

**Query Parameters**: Same as List Quizzes endpoint

**Response** (200 OK): Same format as List Quizzes endpoint

## Integration Notes

### Quiz Generation Workflow
1. Upload and process document via DocumentController
2. Start quiz generation with `generate-from-document` endpoint
3. Poll generation status until completed
4. Retrieve generated quiz once status is `COMPLETED`

### Pagination
- Use `page` and `size` parameters for paginated results
- Response includes pagination metadata
- Default page size is 20

### Error Handling
- Handle 401/403 responses for authentication/authorization
- Implement retry logic for generation status polling
- Show appropriate error messages for validation failures

### Real-time Updates
- Consider implementing WebSocket connections for generation status updates
- Poll generation status every 5-10 seconds for long-running jobs
- Show progress indicators for better user experience 