# Quiz Attempts Controller

## Overview
The AttemptController handles quiz attempts, answer submission, progress tracking, and attempt completion.

**Base URL**: `/api/v1/attempts`

**Authentication**: All endpoints require authentication via Bearer token.

## DTO Schemas

### StartAttemptRequest
```json
{
  "mode": "ONE_BY_ONE|ALL_AT_ONCE|TIMED"  // Required: Attempt mode
}
```

**Validation Rules**:
- `mode`: Required, must be one of the valid attempt modes

### StartAttemptResponse
```json
{
  "attemptId": "uuid",                    // Attempt identifier
  "firstQuestion": {                      // First question (if any)
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

## Endpoints

### 1. Start Attempt
**POST** `/api/v1/attempts/quizzes/{quizId}`

Starts a new attempt for a quiz.

**Path Parameters**:
- `quizId`: UUID of the quiz to attempt

**Request Body** (Optional):
```json
{
  "mode": "ONE_BY_ONE"
}
```

**Response** (201 Created):
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "firstQuestion": {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "What is the capital of France?",
    "safeContent": {
      "options": ["London", "Paris", "Berlin", "Madrid"]
    },
    "hint": "Think about famous landmarks",
    "attachmentUrl": null
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Quiz not found

### 2. List Attempts
**GET** `/api/v1/attempts`

Returns paginated list of user's attempts.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 20)
- `quizId`: Filter by quiz UUID (optional)
- `userId`: Filter by user UUID (optional)

**Response** (200 OK):
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
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 3. Get Attempt Details
**GET** `/api/v1/attempts/{attemptId}`

Returns detailed information about a specific attempt.

**Response** (200 OK):
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
      "answeredAt": "2025-05-20T14:35:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found

### 4. Submit Single Answer
**POST** `/api/v1/attempts/{attemptId}/answers`

Submits an answer to a specific question.

**Path Parameters**:
- `attemptId`: UUID of the attempt

**Request Body**:
```json
{
  "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
  "response": {
    "answer": "Paris"
  }
}
```

**Response** (200 OK):
```json
{
  "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
  "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
  "isCorrect": true,
  "score": 1.0,
  "answeredAt": "2025-05-20T14:35:00Z",
  "nextQuestion": {
    "id": "ghijkl34-5678-9012-ghij-kl3456789012",
    "type": "TRUE_FALSE",
    "difficulty": "EASY",
    "questionText": "Is the Earth round?",
    "safeContent": {},
    "hint": null,
    "attachmentUrl": null
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt or question not found

### 5. Submit Batch Answers
**POST** `/api/v1/attempts/{attemptId}/answers/batch`

Submits multiple answers at once (ALL_AT_ONCE mode only).

**Path Parameters**:
- `attemptId`: UUID of the attempt

**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "response": {
        "answer": "Paris"
      }
    },
    {
      "questionId": "ghijkl34-5678-9012-ghij-kl3456789012",
      "response": {
        "answer": true
      }
    }
  ]
}
```

**Response** (200 OK):
```json
[
  {
    "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
    "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
    "isCorrect": true,
    "score": 1.0,
    "answeredAt": "2025-05-20T14:35:00Z"
  },
  {
    "answerId": "5c4b3d2e-1g0f-9e8d-7c6b-5d4c3b2e1f0g",
    "questionId": "ghijkl34-5678-9012-ghij-kl3456789012",
    "isCorrect": true,
    "score": 1.0,
    "answeredAt": "2025-05-20T14:35:00Z"
  }
]
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found
- `409 Conflict`: Invalid attempt mode or duplicate answers

### 6. Complete Attempt
**POST** `/api/v1/attempts/{attemptId}/complete`

Marks the attempt as completed and returns results.

**Path Parameters**:
- `attemptId`: UUID of the attempt

**Response** (200 OK):
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quizId": "1c2d3e4f-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "userId": "9f8e7d6c-5b4a-3c2d-1b0a-9f8e7d6c5b4a",
  "startedAt": "2025-05-20T14:30:00Z",
  "completedAt": "2025-05-20T14:45:00Z",
  "totalScore": 5.0,
  "correctCount": 5,
  "totalQuestions": 5,
  "answers": [
    {
      "answerId": "4b3a2c1d-0f9e-8d7c-6b5a-4c3b2a1d0e9f",
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "isCorrect": true,
      "score": 1.0,
      "answeredAt": "2025-05-20T14:35:00Z"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found
- `409 Conflict`: Attempt in invalid state

### 7. Get Attempt Statistics
**GET** `/api/v1/attempts/{attemptId}/stats`

Returns detailed statistics for an attempt.

**Response** (200 OK):
```json
{
  "attemptId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "totalTime": "PT15M30S",
  "averageTimePerQuestion": "PT3M6S",
  "questionsAnswered": 5,
  "correctAnswers": 4,
  "accuracyPercentage": 80.0,
  "completionPercentage": 100.0,
  "questionTimings": [
    {
      "questionId": "abcdef12-3456-7890-abcd-ef1234567890",
      "questionType": "MCQ_SINGLE",
      "difficulty": "MEDIUM",
      "timeSpent": "PT2M30S",
      "isCorrect": true,
      "questionStartedAt": "2025-01-27T10:30:00Z",
      "answeredAt": "2025-01-27T10:32:30Z"
    }
  ],
  "startedAt": "2025-01-27T10:30:00Z",
  "completedAt": "2025-01-27T10:45:30Z"
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found

### 8. Pause Attempt
**POST** `/api/v1/attempts/{attemptId}/pause`

Pauses an in-progress attempt.

**Response** (200 OK): Returns updated AttemptDto

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found
- `409 Conflict`: Attempt cannot be paused

### 9. Resume Attempt
**POST** `/api/v1/attempts/{attemptId}/resume`

Resumes a paused attempt.

**Response** (200 OK): Returns updated AttemptDto

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Attempt not found
- `409 Conflict`: Attempt cannot be resumed

### 10. Get Shuffled Questions
**GET** `/api/v1/attempts/quizzes/{quizId}/questions/shuffled`

Gets questions for a quiz in randomized order (safe, without answers).

**Path Parameters**:
- `quizId`: UUID of the quiz

**Response** (200 OK):
```json
[
  {
    "id": "abcdef12-3456-7890-abcd-ef1234567890",
    "type": "MCQ_SINGLE",
    "difficulty": "MEDIUM",
    "questionText": "What is the capital of France?",
    "safeContent": {
      "options": ["London", "Paris", "Berlin", "Madrid"]
    },
    "hint": "Think about famous landmarks",
    "attachmentUrl": null
  }
]
```
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

### Real-time Features
- Consider implementing WebSocket connections for real-time updates
- Show live progress indicators
- Implement auto-save functionality for long attempts 