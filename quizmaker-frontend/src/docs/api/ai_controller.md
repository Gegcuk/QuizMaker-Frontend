# AI Controller APIs

This document covers the AI-related HTTP APIs exposed by the backend. There are two controllers:
- AI Chat
  - Base path: `/api/ai`
- AI Analysis
  - Base path: `/api/v1/ai-analysis`

Both controllers require authentication unless explicitly stated. The AI Analysis endpoint requires admin role.

## Endpoints

### POST `/chat`
- Purpose: Send a user message to the AI and receive a generated reply
- Auth: Required (`Authorization: Bearer <accessToken>`)
- Request body (JSON): `ChatRequestDto`
```json
{
  "message": "Summarize the core of quantum computing in 2 sentences."
}
```
- Response: `200 OK` with `ChatResponseDto`
```json
{
  "message": "Quantum computing leverages qubits...",
  "model": "gpt-3.5-turbo",
  "latency": 312,
  "tokensUsed": 127,
  "timestamp": "2025-05-21T15:30:00"
}
```

Failure cases:
- `400 Bad Request` (validation) — empty or too long message
```json
{
  "timestamp": "2025-05-21T15:30:00",
  "status": 400,
  "error": "Validation Failed",
  "details": [
    "message: Message cannot be blank"
  ]
}
```
- `401 Unauthorized` — missing or invalid token
- `429 Too Many Requests` — rate limit exceeded (handled internally with retries)
- `500 Internal Server Error` — AI service errors after retries exhausted
```json
{
  "timestamp": "2025-05-21T15:30:00",
  "status": 500,
  "error": "AI Service Error",
  "message": "Failed to get AI response after 3 attempts: Rate limit exceeded after 3 attempts. Please try again later."
}
```

Notes:
- The server performs exponential backoff with jitter on AI rate limits; it retries up to a configured maximum before failing.
- `model` reflects what the AI provider reports; if unavailable, a fallback string like `gpt-3.5-turbo` is used.
- `tokensUsed` is provider-reported when available; otherwise it may be estimated (rough estimate: response length / 4).
- `timestamp` is automatically set to the current time when the response is created.
- Rate limiting: The service automatically detects rate limit errors (429, TPM, RPM) and implements exponential backoff with jitter.
- Retry behavior: Up to `maxRetries` attempts with configurable delays. Rate limit errors get special backoff treatment.

---

### POST `/analyze`
- Purpose: Analyze previously logged AI responses for JSON/formatting compliance (debug tool)
- Auth: Required + Role `ADMIN`
- Request body: none
- Response: `200 OK` with `Map<String, String>`
```json
{
  "status": "success",
  "message": "AI response analysis completed. Check application logs for details."
}
```
- Response (error): `500 Internal Server Error`
```json
{
  "status": "error",
  "message": "Error during analysis: <details>"
}
```

Notes:
- This endpoint does not return detailed findings in the HTTP response. Inspect application logs for per-response issues and the summary.
- If no historical AI response logs are present, the analyzer logs that information and completes successfully.

## DTOs

### ChatRequestDto
```ts
type ChatRequestDto = {
  message: string; // required, 1..2000 chars
};
```

Validation:
- `message`: required, not blank, max length 2000

### ChatResponseDto
```ts
type ChatResponseDto = {
  message: string;       // AI response text
  model: string;         // provider model identifier
  latency: number;       // milliseconds (long in Java)
  tokensUsed: number;    // total tokens used (approx if provider omits)
  timestamp: string;     // ISO date-time (LocalDateTime in Java) - auto-generated
};
```

### AnalysisResponse (Map<String, String>)
```ts
type AnalysisResponse = {
  status: "success" | "error";
  message: string;
};
```

## Notes for Frontend
- Auth header: include `Authorization: Bearer <accessToken>` for all AI endpoints; admin role needed for analysis.
- Content type: send `application/json` for chat requests.
- User input limits: enforce 1..2000 chars for `message` to avoid validation errors.
- Error handling: surface generic errors for 500; for 400, show field-level validation messages from `details`.
- Resilience: chat calls automatically retry internally on rate limits with exponential backoff; handle eventual failures gracefully.
- Rate limiting: The service handles rate limits transparently with retries, but may eventually return 500 errors if all retries are exhausted.

## Configuration
The AI chat service uses configurable rate limiting parameters:
- `maxRetries`: Maximum number of retry attempts (default: 3)
- `baseDelayMs`: Base delay for exponential backoff (default: 1000ms)
- `maxDelayMs`: Maximum delay cap (default: 30000ms)
- `jitterFactor`: Jitter factor to prevent thundering herd (default: 0.1)

## Known Issues and Limitations

- Analysis endpoint returns `Map<String, String>` instead of a dedicated DTO class for consistency.
- Error responses for AI service failures include retry attempt information but could be more specific about failure types.
- Rate limiting detection relies on error message parsing (429, TPM, RPM keywords) rather than HTTP status codes.
- Token usage estimation uses a rough heuristic (response length / 4) when provider metadata is unavailable.
- The chat endpoint doesn't include explicit rate limiting headers in responses; rate limiting is handled transparently.