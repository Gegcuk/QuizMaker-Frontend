# Quiz Attempts Controller

## Overview
The AttemptController handles quiz attempts, answer submission, progress tracking, and attempt completion.

**Base URL**: `/api/v1/attempts`

**Authentication**: All endpoints require authentication via Bearer token.

## Error Handling

All endpoints use a consistent error response format:

### ErrorResponse
```json
{
  "timestamp": "2025-01-27T10:30:00Z",   // Error timestamp
  "status": 400,                         // HTTP status code
  "error": "Bad Request",                // Error type
  "details": [                           // Error details
    "Validation failed for field 'questionId'",
    "Question not found in attempt"
  ]
}
```

### Common HTTP Status Codes
- **400 Bad Request**: Validation errors, invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but insufficient permissions
- **404 Not Found**: Resource not found (quiz, attempt, question)
- **409 Conflict**: State conflicts (attempt already completed, duplicate answers)
- **422 Unprocessable Entity**: Business logic validation failures
- **500 Internal Server Error**: Unexpected server errors

### Error Examples
```json
// 400 Bad Request - Validation Error
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "details": ["Question ID is required", "Response cannot be empty"]
}

// 404 Not Found - Resource Not Found
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 404,
  "error": "Not Found",
  "details": ["Attempt not found"]
}

// 409 Conflict - State Conflict
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "details": ["Attempt is already completed"]
}
```

## DTO Schemas

### StartAttemptRequest
```json
{
  "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED"  // Optional: defaults to ALL_AT_ONCE
}
```

**Validation Rules**:
- `mode`: Optional, if provided must be one of the valid attempt modes

### StartAttemptResponse
```json
{
  "attemptId": "uuid",                 // Attempt identifier
  "quizId": "uuid",                    // Quiz identifier
  "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED",
  "totalQuestions": 5,                  // Number of questions in the quiz
  "timeLimitMinutes": 30,               // Null when timer is disabled
  "startedAt": "2025-05-20T14:30:00Z"  // Start timestamp
}
```

### AttemptDto
```json
{
  "attemptId": "uuid",                    // Attempt identifier
  "quizId": "uuid",                       // Quiz identifier
  "userId": "uuid",                       // User identifier
  "startedAt": "2025-05-20T14:30:00Z",   // Start timestamp
  "status": "IN_PROGRESS|COMPLETED|ABANDONED|PAUSED",
  "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED"
}
```

### AnswerSubmissionRequest
```json
{
  "questionId": "uuid",                   // Question identifier
  "response": {}                          // Answer payload (JSON)
}
```

**Validation Rules**:
- `questionId`: Required, valid UUID
- `response`: Required, JSON object with answer data

### AnswerSubmissionDto
```json
{
  "answerId": "uuid",                     // Answer identifier
  "questionId": "uuid",                   // Question identifier
  "isCorrect": true,                      // Whether answer was correct
  "score": 1.0,                          // Score awarded
  "answeredAt": "2025-05-20T14:35:00Z",  // Answer timestamp
  "nextQuestion": {                       // Next question (ONE_BY_ONE mode)
    "id": "uuid",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "string",
    "safeContent": {},
    "hint": "string",
    "attachmentUrl": "string"
  }
}
```

### AttemptResultDto
```json
{
  "attemptId": "uuid",                    // Attempt identifier
  "quizId": "uuid",                       // Quiz identifier
  "userId": "uuid",                       // User identifier
  "startedAt": "2025-05-20T14:30:00Z",   // Start timestamp
  "completedAt": "2025-05-20T14:45:00Z", // Completion timestamp
  "totalScore": 5.0,                     // Total score achieved
  "correctCount": 5,                     // Number of correct answers
  "totalQuestions": 5,                   // Total number of questions
  "answers": [                           // Detailed answers
    {
      "answerId": "uuid",
      "questionId": "uuid",
      "isCorrect": true,
      "score": 1.0,
      "answeredAt": "2025-05-20T14:35:00Z"
    }
  ]
}
```

### QuestionForAttemptDto
```json
{
  "id": "uuid",                           // Question identifier
  "type": "MCQ_SINGLE|MCQ_MULTI|OPEN|FILL_GAP|COMPLIANCE|TRUE_FALSE|ORDERING|HOTSPOT",
  "difficulty": "EASY|MEDIUM|HARD",
  "questionText": "string",               // Question text
  "safeContent": {},                      // Safe content (no correct answers)
  "hint": "string",                       // Optional hint
  "attachmentUrl": "string"               // Optional attachment
}
```

### AttemptDetailsDto
```json
{
  "attemptId": "uuid",                    // Attempt identifier
  "quizId": "uuid",                       // Quiz identifier
  "userId": "uuid",                       // User identifier
  "startedAt": "2025-05-20T14:30:00Z",   // Start timestamp
  "completedAt": "2025-05-20T14:45:00Z", // Completion timestamp
  "status": "IN_PROGRESS|COMPLETED|ABANDONED|PAUSED",
  "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED",
  "answers": [                            // All submitted answers
    {
      "answerId": "uuid",
      "questionId": "uuid",
      "isCorrect": true,
      "score": 1.0,
      "answeredAt": "2025-05-20T14:35:00Z"
    }
  ]
}
```

### CurrentQuestionDto
```json
{
  "question": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "What is the capital of France?",
    "safeContent": {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"]
    },
    "hint": "Think about European geography",
    "attachmentUrl": null
  },
  "questionNumber": 3,
  "totalQuestions": 10,
  "attemptStatus": "IN_PROGRESS"
}
```

### BatchAnswerSubmissionRequest
```json
{
  "answers": [                            // Array of answers
    {
      "questionId": "uuid",
      "response": {}
    }
  ]
}
```

**Validation Rules**:
- `answers`: Required, non-empty array of AnswerSubmissionRequest

### AttemptStatsDto
```json
{
  "attemptId": "uuid",                    // Attempt identifier
  "totalTime": "PT15M30S",               // Total time spent
  "averageTimePerQuestion": "PT3M6S",    // Average time per question
  "questionsAnswered": 5,                // Questions answered
  "correctAnswers": 4,                   // Correct answers
  "accuracyPercentage": 80.0,            // Accuracy percentage
  "completionPercentage": 100.0,         // Completion percentage
  "questionTimings": [                   // Individual question timing stats
    {
      "questionId": "uuid",
      "questionType": "MCQ_SINGLE",
      "difficulty": "MEDIUM",
      "timeSpent": "PT2M30S",
      "isCorrect": true,
      "questionStartedAt": "2025-01-27T10:30:00Z",
      "answeredAt": "2025-01-27T10:32:30Z"
    }
  ],
  "startedAt": "2025-01-27T10:30:00Z",   // Start timestamp
  "completedAt": "2025-01-27T10:45:30Z"  // Completion timestamp
}
```

## Enums

### AttemptMode
- `ONE_BY_ONE`: Questions are presented one at a time
- `ALL_AT_ONCE`: All questions are presented together
- `TIMED`: Timed attempt with countdown

### AttemptStatus
- `IN_PROGRESS`: Attempt is currently active
- `COMPLETED`: Attempt has been finished
- `ABANDONED`: Attempt was abandoned by user
- `PAUSED`: Attempt is temporarily paused

## 📋 **Endpoints**

### **🎯 Start Attempt**
```http
POST /api/v1/attempts/quizzes/{quizId}
```

**Description:** Start a new attempt for a quiz.

**Request Body (Optional):**
```json
{
  "mode": "ONE_BY_ONE"
}
```

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "mode": "ALL_AT_ONCE",
  "totalQuestions": 10,
  "timeLimitMinutes": null,
  "startedAt": "2025-05-20T14:30:00Z"
}
```

**Error Responses:** 400, 403, 404

### **📋 List Attempts**
```http
GET /api/v1/attempts?page=0&size=20&quizId={quizId}&userId={userId}
```

**Description:** Get paginated list of attempts with optional filtering.

**Response:**
```json
{
  "content": [
    {
      "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
      "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
      "startedAt": "2025-05-20T14:30:00Z",
      "status": "IN_PROGRESS",
      "mode": "ONE_BY_ONE"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0
}
```

**Error Responses:** 400, 403

### **🔍 Get Attempt Details**
```http
GET /api/v1/attempts/{attemptId}
```

**Description:** Get detailed information about a specific attempt including all answers.

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
  "startedAt": "2025-05-20T14:30:00Z",
  "completedAt": "2025-05-20T14:45:00Z",
  "status": "COMPLETED",
  "mode": "ONE_BY_ONE",
  "answers": [
    {
      "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "isCorrect": true,
      "score": 1.0,
      "answeredAt": "2025-05-20T14:35:00Z",
      "nextQuestion": null
    }
  ]
}
```

**Error Responses:** 400, 401, 404

### **❓ Get Current Question**
```http
GET /api/v1/attempts/{attemptId}/current-question
```

**Description:** Get the current question for an in-progress attempt. This is useful when resuming an attempt after closing the browser or when the frontend needs to determine which question to display next.

**Parameters:**
- `attemptId` (path): UUID of the attempt

**Response:**
```json
{
  "question": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "What is the capital of France?",
    "safeContent": {
      "options": [
        {"id": "1", "text": "London", "correct": false},
        {"id": "2", "text": "Berlin", "correct": false},
        {"id": "3", "text": "Paris", "correct": true},
        {"id": "4", "text": "Madrid", "correct": false}
      ]
    },
    "hint": "Think about European geography",
    "attachmentUrl": null
  },
  "questionNumber": 3,
  "totalQuestions": 10,
  "attemptStatus": "IN_PROGRESS"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid attempt ID format
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User does not own the attempt
- **404 Not Found**: Attempt not found
- **409 Conflict**: Attempt is not in progress or all questions have already been answered

**Error Examples:**
```json
// 403 Forbidden - User does not own the attempt
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 403,
  "error": "Forbidden",
  "details": ["You do not have access to attempt 3fa85f64-5717-4562-b3fc-2c963f66afa6"]
}

// 409 Conflict - Attempt not in progress
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "details": ["Can only get current question for attempts that are in progress"]
}

// 409 Conflict - All questions answered
{
  "timestamp": "2025-01-27T10:30:00Z",
  "status": 409,
  "error": "Conflict",
  "details": ["All questions have already been answered"]
}
```

### **✏️ Submit Answer**
```http
POST /api/v1/attempts/{attemptId}/answers
```

**Description:** Submit an answer to a specific question within an attempt.

**Request Body:**
```json
{
  "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
  "response": { "selectedOptionId": "2" }
}
```

**Response:**
```json
{
  "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
  "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
  "isCorrect": true,
  "score": 1.0,
  "answeredAt": "2025-05-20T14:35:00Z",
  "nextQuestion": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "MCQ_SINGLE",
    "questionText": "What is 2+2?",
    "safeContent": {
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"]
    }
  }
}
```

**Error Responses:** 400, 403, 404, 409

### **📦 Submit Batch Answers**
```http
POST /api/v1/attempts/{attemptId}/answers/batch
```

**Description:** Submit multiple answers at once (only for ALL_AT_ONCE mode).

**Request Body:**
```json
{
  "answers": [
    {
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "response": { "selectedOptionId": "2" }
    },
    {
      "questionId": "fedcba21-6543-0987-badc-fe6543210987",
      "response": { "selectedOptionId": "A" }
    }
  ]
}
```

**Response:**
```json
[
  {
    "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
    "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
    "isCorrect": true,
    "score": 1.0,
    "answeredAt": "2025-05-20T14:35:00Z",
    "nextQuestion": null
  },
  {
    "answerId": "5c4b3a2e-1g0f-9h8i-7j6k-5l4m3n2o1p0q",
    "questionId": "fedcba21-6543-0987-badc-fe6543210987",
    "isCorrect": true,
    "score": 1.0,
    "answeredAt": "2025-05-20T14:35:00Z",
    "nextQuestion": null
  }
]
```

**Error Responses:** 400, 401, 404, 409

### **✅ Complete Attempt**
```http
POST /api/v1/attempts/{attemptId}/complete
```

**Description:** Mark an attempt as completed and get results.

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
  "startedAt": "2025-05-20T14:30:00Z",
  "completedAt": "2025-05-20T14:45:00Z",
  "totalScore": 8.5,
  "correctAnswers": 8,
  "totalQuestions": 10,
  "answers": [
    {
      "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "isCorrect": true,
      "score": 1.0,
      "answeredAt": "2025-05-20T14:35:00Z",
      "nextQuestion": null
    }
  ]
}
```

**Error Responses:** 400, 401, 404, 409

### **📊 Get Attempt Statistics**
```http
GET /api/v1/attempts/{attemptId}/stats
```

**Description:** Get detailed statistics for a specific attempt.

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "totalTime": "PT15M30S",
  "averageTimePerQuestion": "PT1M33S",
  "questionsAnswered": 10,
  "correctAnswers": 8,
  "accuracyPercentage": 80.0,
  "completionPercentage": 100.0,
  "questionTimings": [
    {
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "questionType": "MCQ_SINGLE",
      "difficulty": "MEDIUM",
      "timeSpent": "PT1M30S",
      "isCorrect": true,
      "startedAt": "2025-05-20T14:30:00Z",
      "answeredAt": "2025-05-20T14:31:30Z"
    }
  ],
  "startedAt": "2025-05-20T14:30:00Z",
  "completedAt": "2025-05-20T14:45:30Z"
}
```

**Error Responses:** 400, 403, 404

### **⏸️ Pause Attempt**
```http
POST /api/v1/attempts/{attemptId}/pause
```

**Description:** Pause an in-progress attempt.

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
  "startedAt": "2025-05-20T14:30:00Z",
  "status": "PAUSED",
  "mode": "ONE_BY_ONE"
}
```

**Error Responses:** 400, 401, 404, 409

### **▶️ Resume Attempt**
```http
POST /api/v1/attempts/{attemptId}/resume
```

**Description:** Resume a paused attempt.

**Response:**
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
  "startedAt": "2025-05-20T14:30:00Z",
  "status": "IN_PROGRESS",
  "mode": "ONE_BY_ONE"
}
```

**Error Responses:** 400, 401, 404, 409

### **🎲 Get Shuffled Questions**
```http
GET /api/v1/attempts/quizzes/{quizId}/questions/shuffled
```

**Description:** Get questions for a quiz in randomized order (safe, without answers).

**Response:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "What is the capital of France?",
    "safeContent": {
      "question": "What is the capital of France?",
      "options": ["London", "Berlin", "Paris", "Madrid"]
    },
    "hint": "Think about European geography",
    "attachmentUrl": null
  }
]
```

**Error Responses:** 400, 401, 404

## Integration Notes

### Attempt Modes
- **ONE_BY_ONE**: Questions presented sequentially, immediate feedback
- **ALL_AT_ONCE**: All questions visible, submit all at once
- **TIMED**: Timed attempt with countdown timer

### Answer Submission
- Use single answer submission for ONE_BY_ONE mode
- Use batch submission for ALL_AT_ONCE mode
- Response format varies by question type

### Progress Tracking
- Track attempt status and progress
- Implement pause/resume functionality
- Show completion statistics

### Error Handling
- Handle 401/403 responses for authentication
- Implement retry logic for network failures
- Show appropriate error messages for validation failures
- All errors return consistent ErrorResponse format

### Real-time Features
- Consider implementing WebSocket connections for real-time updates
- Show live progress indicators
- Implement auto-save functionality for long attempts

### Security Considerations
- All endpoints require authentication
- Users can only access their own attempts
- Attempt ownership is validated on each request
- Question content is sanitized to prevent answer leakage

### Performance Considerations
- Pagination for large attempt lists
- Efficient querying with proper indexing
- Caching for frequently accessed data
- Optimized batch operations for answer submission 

## Business Rules (Implementation Notes)

- Ownership enforcement: Users may only access their own attempts. All read/write operations validate the authenticated user against the attempt owner and return 403 when mismatched.
- Timer validation (TIMED mode): When `mode` is TIMED and the quiz has timer enabled, the server enforces a timeout window of `timerDuration` minutes starting from `startedAt`. Submissions after the timeout result in attempt status transitioning to ABANDONED and a 409 Conflict response for further submissions.
- Duplicate answer prevention: The same question cannot be answered twice within a single attempt. Subsequent submissions for an already-answered question return 409 Conflict.
- Safe question payloads: Any question content returned by attempt endpoints omits correct answers and other sensitive fields.
- Scoring: Scores are computed from saved answers. Completion aggregates total score and correct count based on the attempt’s answers.

## End-to-End Flows

### Start Attempt

1. Client sends optional `{ "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED" }` to `POST /api/v1/attempts/quizzes/{quizId}`.
2. Server creates an `IN_PROGRESS` attempt and returns metadata only:
   - `attemptId`, `quizId`, `mode`, `totalQuestions`, `timeLimitMinutes` (nullable), `startedAt`.

### Submit Answer

1. Client posts `{ "questionId": "...", "response": { ... } }` to `POST /api/v1/attempts/{attemptId}/answers`.
2. Server validates ownership, status, timer (if applicable), question membership, and duplicates.
3. Server persists the answer, returns result with `isCorrect`, `score`, and `nextQuestion` in ONE_BY_ONE mode.

### Complete Attempt

1. Client calls `POST /api/v1/attempts/{attemptId}/complete`.
2. Server verifies status, computes total score and correct count, sets `COMPLETED`, and returns aggregated results.