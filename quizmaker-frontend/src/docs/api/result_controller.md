# Result Controller API

Base path: `/api/v1/quizzes/{quizId}`

This document lists result-related endpoints (summary and leaderboard) and their DTOs with payload examples, mirroring the style of `auth_controller.md`.

These endpoints require authentication. Result endpoints are accessible to authenticated users, while attempt inspection endpoints are owner-only.

## Endpoints

### GET `/{quizId}/results`
- Purpose: Get aggregated results summary for a quiz
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Response: `200 OK` with `QuizResultSummaryDto`
```json
{
  "quizId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "attemptsCount": 42,
  "averageScore": 7.3,
  "bestScore": 10.0,
  "worstScore": 2.0,
  "passRate": 61.9,
  "questionStats": [
    {
      "questionId": "9a1b2c3d-4e5f-6789-a0b1-c2d3e4f56789",
      "timesAsked": 40,
      "timesCorrect": 31,
      "correctRate": 77.5
    }
  ]
}
```
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if quiz doesn't exist

Notes:
- Aggregations are based on completed attempts only.
- Pass rate is computed as percentage of completed attempts with >=50% correct answers.

---

### GET `/{quizId}/leaderboard`
- Purpose: Retrieve top participants for a quiz ranked by best score
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Path params: `quizId` (UUID)
- Query params:
  - `top` (number, default `10`) — number of entries to return
- Response: `200 OK` with `LeaderboardEntryDto[]`
```json
[
  { "userId": "1d0a9f8e-7d6c-5b4a-3c2d-1b0a9f8e7d6c", "username": "alice", "bestScore": 9.5 },
  { "userId": "2e1b0a9f-8e7d-6c5b-4a3c-2d1b0a9f8e7d", "username": "bob",   "bestScore": 9.0 }
]
```
- Errors:
  - `401 Unauthorized` for missing or invalid authentication
  - `404 Not Found` if quiz doesn't exist

Notes:
- Only completed attempts are considered. If a user has multiple attempts, the highest score is used.
- If `top <= 0`, an empty list is returned.

## DTOs

### QuizResultSummaryDto
```ts
type QuizResultSummaryDto = {
  quizId: string;          // UUID
  attemptsCount: number;   // Long in Java - completed attempts only
  averageScore: number;    // Double in Java - average of totalScore across completed attempts (0.0 if none)
  bestScore: number;       // Double in Java - max totalScore (0.0 if none)
  worstScore: number;      // Double in Java - min totalScore (0.0 if none)
  passRate: number;        // Double in Java - percentage of completed attempts with >=50% correct
  questionStats: QuestionStatsDto[];
};

type QuestionStatsDto = {
  questionId: string;   // UUID
  timesAsked: number;   // long in Java - how many completed attempts included this question
  timesCorrect: number; // long in Java - how many times answered correctly
  correctRate: number;  // double in Java - (timesCorrect / timesAsked) * 100.0, or 0.0
};
```

### LeaderboardEntryDto
```ts
type LeaderboardEntryDto = {
  userId: string;     // UUID
  username: string;   // public username
  bestScore: number;  // Double in Java - user's highest score for the quiz
};
```

## Notes for Frontend
- **Authentication**: Both endpoints require Bearer token authentication.
- **Formatting**: Scores are `number` (floating-point). Consider rounding for display.
- **Empty states**: When there are no completed attempts, summary numbers are 0 and arrays empty.
- **Rate limiting**: No specific rate limiting on these endpoints; handle normally with caching if needed.
- **Data types**: All numeric fields use Java `Long`/`Double` types, mapped to JavaScript `number`.

## Known Issues and Limitations
- **Authentication requirement**: Both endpoints now require authentication, which may limit public access scenarios that were previously possible.
- **Privacy and visibility**: 
  - Result endpoints are accessible to all authenticated users, which may leak aggregated data, usernames, and user IDs for private quizzes.
  - Recommendation: Consider adding ownership checks for private quizzes or anonymizing leaderboard entries.
- **Unbounded `top` parameter**: 
  - `top` parameter is not clamped server-side; very large values may increase response size and DB load.
  - Recommendation: Enforce a maximum (e.g., 100) and validate input.
- **In-memory question stats computation**: 
  - Per-question stats iterate over all completed attempts in memory, which can be heavy for very popular quizzes.
  - Recommendation: Pre-aggregate at the DB level or introduce time-bounded queries.
- **Fixed pass threshold**: 
  - Pass rate uses a hardcoded threshold of 50% correct. Projects with variable pass marks may require configurability.
- **No rate limiting**: Unlike other endpoints, these result endpoints don't have specific rate limiting, which could lead to abuse.
- **Data type precision**: Using `Long`/`Double` for counts and scores may lead to precision issues in JavaScript when dealing with very large numbers.
