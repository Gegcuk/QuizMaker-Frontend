# Quiz Controller

## Overview
The QuizController handles quiz creation, management, AI-powered generation from documents, and quiz analytics.

**Base URL**: `/api/v1/quizzes`

**Authentication**: Most endpoints require ADMIN role authentication via Bearer token.

## Error Handling

All endpoints use a consistent error response format:

### ErrorResponse
```json
{
  "timestamp": "2025-01-27T10:30:00Z",   // Error timestamp
  "status": 400,                         // HTTP status code
  "error": "Bad Request",                // Error type
  "details": [                           // Error details
    "Validation failed for field 'title'",
    "Quiz not found"
  ]
}
```

### Common HTTP Status Codes
- **400 Bad Request**: Validation errors, invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but insufficient permissions (ADMIN required)
- **404 Not Found**: Resource not found (quiz, document, job)
- **409 Conflict**: State conflicts (duplicate quiz title, active generation job)
- **422 Unprocessable Entity**: Business logic validation failures
- **500 Internal Server Error**: Unexpected server errors

### Error Examples
```json
// 400 Bad Request - Validation Error
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "details": ["Title is required", "Estimated time must be between 1 and 180 minutes"]
}

// 404 Not Found - Resource Not Found
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "details": ["Quiz not found"]
}

// 409 Conflict - State Conflict
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "details": ["User already has an active generation job"]
}
```

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

### BulkQuizUpdateRequest
```json
{
  "quizIds": ["uuid1", "uuid2"],  // Array of quiz IDs to update
  "update": {                     // UpdateQuizRequest fields
    "visibility": "PUBLIC",
    "difficulty": "HARD"
  }
}
```

### BulkQuizUpdateOperationResultDto
```json
{
  "successes": ["uuid1", "uuid2"], // Successfully updated quiz IDs
  "failures": {                    // Failed updates with error messages
    "uuid3": "Quiz not found",
    "uuid4": "Validation failed"
  }
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

### GenerateQuizFromUploadRequest
```json
{
  "chunkingStrategy": "SENTENCE|PARAGRAPH|SECTION", // Document chunking strategy
  "maxChunkSize": 1000,           // Maximum chunk size in characters
  "quizScope": "ENTIRE_DOCUMENT|SPECIFIC_CHUNKS|SPECIFIC_CHAPTER|SPECIFIC_SECTION",
  "chunkIndices": [0, 1, 2],      // For SPECIFIC_CHUNKS scope
  "chapterTitle": "string",       // For SPECIFIC_CHAPTER/SECTION scope
  "chapterNumber": 1,             // Alternative for SPECIFIC_CHAPTER/SECTION scope
  "quizTitle": "string",          // Custom title (max 100 chars)
  "quizDescription": "string",    // Custom description (max 500 chars)
  "questionsPerType": {           // Questions per type per chunk
    "MCQ_SINGLE": 3,
    "TRUE_FALSE": 2,
    "OPEN": 1
  },
  "difficulty": "EASY|MEDIUM|HARD", // Question difficulty
  "estimatedTimePerQuestion": 2,  // 1-10 minutes, default: 2
  "categoryId": "uuid",           // Category ID
  "tagIds": ["uuid1", "uuid2"]    // Tag IDs
}
```

### QuizGenerationResponse
```json
{
  "jobId": "uuid",                // Job identifier for tracking
  "status": "PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED",
  "message": "string",            // Status description
  "estimatedTimeSeconds": 300     // Estimated completion time
}
```

### QuizGenerationStatus
```json
{
  "jobId": "string",              // Job identifier
  "status": "PENDING|PROCESSING|COMPLETED|FAILED|CANCELLED",
  "totalChunks": 10,              // Total chunks to process
  "processedChunks": 3,           // Chunks processed so far
  "progressPercentage": 30.0,     // Progress percentage
  "currentChunk": 3,              // Currently processing chunk
  "estimatedCompletion": "2025-01-27T10:45:00Z", // Estimated completion time
  "errorMessage": "string",       // Error message if failed
  "totalQuestionsGenerated": 15,  // Total questions generated
  "durationSeconds": 180,         // Time elapsed in seconds
  "estimatedTimeRemainingSeconds": 120, // Estimated time remaining
  "generatedQuizId": "uuid",      // Generated quiz ID (when completed)
  "startedAt": "2025-01-27T10:30:00Z", // Job start time
  "completedAt": "2025-01-27T10:45:00Z" // Job completion time
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

### VisibilityUpdateRequest
```json
{
  "visibility": "PUBLIC|PRIVATE"  // New visibility setting
}
```

### QuizStatusUpdateRequest
```json
{
  "status": "DRAFT|PUBLISHED|ARCHIVED"  // New status
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

### 5. Bulk Update Quizzes
**PATCH** `/api/v1/quizzes/bulk-update`

Updates multiple quizzes at once (ADMIN only).

**Request Body**:
```json
{
  "quizIds": ["uuid1", "uuid2", "uuid3"],
  "update": {
    "visibility": "PUBLIC",
    "difficulty": "HARD"
  }
}
```

**Response** (200 OK):
```json
{
  "successes": ["uuid1", "uuid2"],
  "failures": {
    "uuid3": "Quiz not found"
  }
}
```

### 6. Delete Quiz
**DELETE** `/api/v1/quizzes/{quizId}`

Deletes a quiz (ADMIN only).

**Response** (204 No Content): No response body

### 7. Bulk Delete Quizzes
**DELETE** `/api/v1/quizzes?ids=id1,id2,id3`

Deletes multiple quizzes by comma-separated IDs (ADMIN only).

**Response** (204 No Content): No response body

### 8. Add Question to Quiz
**POST** `/api/v1/quizzes/{quizId}/questions/{questionId}`

Associates an existing question with a quiz (ADMIN only).

**Response** (204 No Content): Question successfully added to quiz

### 9. Remove Question from Quiz
**DELETE** `/api/v1/quizzes/{quizId}/questions/{questionId}`

Removes a question from a quiz (ADMIN only).

**Response** (204 No Content): Question successfully removed from quiz

### 10. Add Tag to Quiz
**POST** `/api/v1/quizzes/{quizId}/tags/{tagId}`

Associates a tag with a quiz (ADMIN only).

**Response** (204 No Content): Tag successfully added to quiz

### 11. Remove Tag from Quiz
**DELETE** `/api/v1/quizzes/{quizId}/tags/{tagId}`

Removes a tag from a quiz (ADMIN only).

**Response** (204 No Content): Tag successfully removed from quiz

### 12. Change Quiz Category
**PATCH** `/api/v1/quizzes/{quizId}/category/{categoryId}`

Changes the category of a quiz (ADMIN only).

**Response** (204 No Content): Category successfully changed

### 13. Get Quiz Results Summary
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

### 14. Get Quiz Leaderboard
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

### 15. Update Quiz Visibility
**PATCH** `/api/v1/quizzes/{quizId}/visibility`

Changes quiz visibility (ADMIN only).

**Request Body**:
```json
{
  "visibility": "PUBLIC"
}
```

**Response** (200 OK): Returns updated QuizDto

### 16. Update Quiz Status
**PATCH** `/api/v1/quizzes/{quizId}/status`

Changes quiz status (ADMIN only).

**Request Body**:
```json
{
  "status": "PUBLISHED"
}
```

**Response** (200 OK): Returns updated QuizDto

### 17. Get Public Quizzes
**GET** `/api/v1/quizzes/public`

Returns paginated list of public quizzes.

**Query Parameters**: Same as List Quizzes endpoint

**Response** (200 OK): Same format as List Quizzes endpoint

### 18. Generate Quiz from Document
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

### 19. Generate Quiz from Upload
**POST** `/api/v1/quizzes/generate-from-upload`

Uploads document and generates quiz in one operation (ADMIN only).

**Request**: Multipart form data with file and parameters

**Response** (202 Accepted): Same as Generate Quiz from Document

### 20. Get Generation Status
**GET** `/api/v1/quizzes/generation-status/{jobId}`

Gets the status of a quiz generation job.

**Response** (200 OK):
```json
{
  "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "PROCESSING",
  "totalChunks": 10,
  "processedChunks": 3,
  "progressPercentage": 30.0,
  "currentChunk": 3,
  "estimatedCompletion": "2025-01-27T10:45:00Z",
  "totalQuestionsGenerated": 15,
  "durationSeconds": 180,
  "estimatedTimeRemainingSeconds": 120,
  "startedAt": "2025-01-27T10:30:00Z"
}
```

### 21. Get Generated Quiz
**GET** `/api/v1/quizzes/generated-quiz/{jobId}`

Retrieves the generated quiz once generation is completed.

**Response** (200 OK): Returns QuizDto

### 22. Cancel Generation Job
**DELETE** `/api/v1/quizzes/generation-status/{jobId}`

Cancels an active quiz generation job (ADMIN only).

**Response** (200 OK): Returns updated QuizGenerationStatus

### 23. List Generation Jobs
**GET** `/api/v1/quizzes/generation-jobs`

Gets paginated list of user's quiz generation jobs.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)

**Response** (200 OK): Page of QuizGenerationStatus objects

### 24. Get Generation Job Statistics
**GET** `/api/v1/quizzes/generation-jobs/statistics`

Gets statistics about user's quiz generation jobs.

**Response** (200 OK):
```json
{
  "totalJobs": 25,
  "completedJobs": 20,
  "failedJobs": 3,
  "cancelledJobs": 2,
  "averageGenerationTimeSeconds": 180,
  "successRate": 80.0
}
```

### 25. Cleanup Stale Jobs
**POST** `/api/v1/quizzes/generation-jobs/cleanup-stale`

Cleans up pending jobs that have been pending for too long.

**Response** (200 OK):
```json
"Cleaned up 3 stale jobs"
```

### 26. Force Cancel Job
**POST** `/api/v1/quizzes/generation-jobs/{jobId}/force-cancel`

Force cancels a specific generation job (ADMIN only).

**Response** (200 OK):
```json
"Job force cancelled successfully"
```

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
- All errors return consistent ErrorResponse format

### Real-time Updates
- Consider implementing WebSocket connections for generation status updates
- Poll generation status every 5-10 seconds for long-running jobs
- Show progress indicators for better user experience

### Security Considerations
- Most endpoints require ADMIN role
- Quiz ownership is validated for updates/deletes
- Generation jobs are user-scoped
- Public quizzes are accessible to all authenticated users

### Performance Considerations
- Pagination for large quiz lists
- Efficient querying with proper indexing
- Caching for frequently accessed data
- Asynchronous processing for quiz generation
- Bulk operations for multiple quiz updates 