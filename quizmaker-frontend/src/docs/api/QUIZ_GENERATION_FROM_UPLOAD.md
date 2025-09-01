# Quiz Generation from Text - Frontend API Documentation

## Overview

The `POST /api/v1/quizzes/generate-from-text` endpoint allows frontend applications to generate quizzes directly from plain text content. This endpoint processes the text, chunks it appropriately, and starts an asynchronous quiz generation process.

**Endpoint:** `POST /api/v1/quizzes/generate-from-text`  
**Authentication:** Required (Admin role)  
**Content-Type:** `application/json`

## Request Format

### Request Body Schema

```typescript
interface GenerateQuizFromTextRequest {
  // Required fields
  text: string;                                    // Plain text content (1-300,000 characters)
  questionsPerType: Record<QuestionType, number>; // Question types and counts
  difficulty: Difficulty;                          // Question difficulty level
  
  // Optional fields
  language?: string;                              // Language code (e.g., "en", "es")
  chunkingStrategy?: ChunkingStrategy;            // Document processing strategy
  maxChunkSize?: number;                          // Max characters per chunk (1000-300000)
  quizScope?: QuizScope;                          // Quiz generation scope
  chunkIndices?: number[];                        // Specific chunk indices (for SPECIFIC_CHUNKS scope)
  chapterTitle?: string;                          // Chapter title (for SPECIFIC_CHAPTER/SECTION scope)
  chapterNumber?: number;                         // Chapter number (for SPECIFIC_CHAPTER/SECTION scope)
  quizTitle?: string;                             // Custom quiz title (max 100 chars)
  quizDescription?: string;                       // Custom quiz description (max 500 chars)
  estimatedTimePerQuestion?: number;              // Minutes per question (1-10)
  categoryId?: string;                            // Category UUID
  tagIds?: string[];                              // Array of tag UUIDs
}

// Enums
enum QuestionType {
  MCQ_SINGLE = "MCQ_SINGLE",      // Single choice multiple choice
  MCQ_MULTI = "MCQ_MULTI",        // Multiple choice multiple answers
  TRUE_FALSE = "TRUE_FALSE",      // True/False questions
  OPEN = "OPEN",                  // Open-ended questions
  FILL_GAP = "FILL_GAP",         // Fill in the blank
  COMPLIANCE = "COMPLIANCE",      // Compliance questions
  ORDERING = "ORDERING",         // Ordering questions
  HOTSPOT = "HOTSPOT",           // Hotspot questions
  MATCHING = "MATCHING"          // Matching questions
}

enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM", 
  HARD = "HARD"
}

enum ChunkingStrategy {
  CHAPTER_BASED = "CHAPTER_BASED",   // Default: Chunk by chapters
  SECTION_BASED = "SECTION_BASED",   // Chunk by sections
  SIZE_BASED = "SIZE_BASED",         // Chunk by size
  PAGE_BASED = "PAGE_BASED"          // Chunk by pages
}

enum QuizScope {
  ENTIRE_DOCUMENT = "ENTIRE_DOCUMENT",           // Default: Generate for entire document
  SPECIFIC_CHUNKS = "SPECIFIC_CHUNKS",           // Generate for specific chunks
  SPECIFIC_CHAPTER = "SPECIFIC_CHAPTER",         // Generate for specific chapter
  SPECIFIC_SECTION = "SPECIFIC_SECTION"          // Generate for specific section
}
```

### Default Values

If not provided, the following defaults are applied:
- `chunkingStrategy`: `CHAPTER_BASED`
- `maxChunkSize`: `50000`
- `quizScope`: `ENTIRE_DOCUMENT`
- `estimatedTimePerQuestion`: `2`
- `tagIds`: `[]`
- `quizTitle`: AI will generate a title based on the content
- `quizDescription`: AI will generate a description based on the content

## Response Format

### Success Response (202 Accepted)

```typescript
interface QuizGenerationResponse {
  jobId: string;                    // UUID for tracking the generation job
  status: "PROCESSING";             // Always "PROCESSING" for this endpoint
  message: string;                  // Human-readable message
  estimatedTimeSeconds: number;     // Estimated completion time in seconds
}
```

### Example Success Response

```json
{
  "jobId": "d9e0c623-1a6f-4103-9a02-dd623c026c4f",
  "status": "PROCESSING",
  "message": "Quiz generation started successfully",
  "estimatedTimeSeconds": 60
}
```

## Error Responses

### 400 Bad Request - Validation Errors

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation failed",
  "instance": "/api/v1/quizzes/generate-from-text",
  "errors": {
    "text": "Text content must not be blank",
    "questionsPerType": "At least one question type must be specified",
    "difficulty": "Difficulty must not be null"
  }
}
```

### 401 Unauthorized

```json
{
  "type": "about:blank",
  "title": "Unauthorized",
  "status": 401,
  "detail": "JWT token missing or expired",
  "instance": "/api/v1/quizzes/generate-from-text"
}
```

### 403 Forbidden

```json
{
  "type": "about:blank",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access denied - ADMIN role required",
  "instance": "/api/v1/quizzes/generate-from-text"
}
```

### 409 Conflict

```json
{
  "type": "about:blank",
  "title": "Conflict",
  "status": 409,
  "detail": "User already has an active generation job",
  "instance": "/api/v1/quizzes/generate-from-text"
}
```

### 422 Unprocessable Entity

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Text processing failed: [specific error message]",
  "instance": "/api/v1/quizzes/generate-from-text"
}
```
## Usage Examples

### Basic Usage with Custom Title

```javascript
// Generate quiz with custom title
const response = await fetch('/api/v1/quizzes/generate-from-text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: "Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.",
    quizTitle: "Machine Learning Fundamentals Quiz",  // Custom title
    quizDescription: "Test your knowledge of machine learning basics",  // Custom description
    questionsPerType: {
      "MCQ_SINGLE": 3,
      "TRUE_FALSE": 2
    },
    difficulty: "MEDIUM"
  })
});

const result = await response.json();
console.log('Job ID:', result.jobId);
```

### Advanced Usage with All Custom Fields

```javascript
// Advanced quiz generation with custom title and all settings
const response = await fetch('/api/v1/quizzes/generate-from-text', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    text: "Your long text content here...",
    language: "en",
    chunkingStrategy: "SIZE_BASED",
    maxChunkSize: 25000,
    quizScope: "ENTIRE_DOCUMENT",
    quizTitle: "Advanced Machine Learning Concepts",  // Custom title
    quizDescription: "Comprehensive assessment of advanced ML algorithms and techniques",  // Custom description
    questionsPerType: {
      "MCQ_SINGLE": 5,
      "MCQ_MULTI": 2,
      "TRUE_FALSE": 3,
      "OPEN": 1
    },
    difficulty: "HARD",
    estimatedTimePerQuestion: 3,
    categoryId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
    tagIds: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"]
  })
});
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/v1/quizzes/generate-from-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    
    switch (response.status) {
      case 400:
        console.error('Validation error:', errorData.errors);
        // Handle validation errors
        break;
      case 401:
        console.error('Authentication required');
        // Redirect to login
        break;
      case 403:
        console.error('Admin access required');
        // Show access denied message
        break;
      case 409:
        console.error('User has active job');
        // Show job in progress message
        break;
      case 422:
        console.error('Processing failed:', errorData.detail);
        // Show processing error
        break;
      default:
        console.error('Unexpected error:', errorData);
    }
    return;
  }

  const result = await response.json();
  console.log('Quiz generation started:', result.jobId);
  
} catch (error) {
  console.error('Network error:', error);
}
```

## Custom Quiz Title Guidelines

### When to Use Custom Titles
- **Specific Topics**: Use descriptive titles like "JavaScript Fundamentals Quiz"
- **Course Content**: Match course/module titles like "Module 3: Database Design"
- **Assessment Types**: Indicate purpose like "Final Exam: Advanced Algorithms"
- **Difficulty Levels**: Include difficulty like "Beginner Python Quiz"

### Title Best Practices
- **Keep it concise**: Maximum 100 characters
- **Be descriptive**: Clearly indicate the quiz content
- **Use consistent naming**: Follow your application's naming conventions
- **Include context**: Add course/module information when relevant

### Examples of Good Custom Titles
```javascript
// Good examples
quizTitle: "JavaScript ES6 Features Quiz"
quizTitle: "Module 2: Object-Oriented Programming"
quizTitle: "Final Assessment: Machine Learning Basics"
quizTitle: "Quick Check: Database Normalization"
quizTitle: "Advanced Topics: Neural Networks"

// Avoid these
quizTitle: "Quiz"  // Too generic
quizTitle: "Test"  // Too generic
quizTitle: "A very long title that exceeds the maximum character limit and should be avoided"  // Too long
```

## Job Tracking

After receiving a successful response with a `jobId`, you can track the quiz generation progress using the existing job tracking endpoints:

- `GET /api/v1/quizzes/generation-jobs/{jobId}` - Get job status
- `GET /api/v1/quizzes/generation-jobs` - List user's jobs

### Job Status Values

```typescript
enum JobStatus {
  PENDING = "PENDING",           // Job created, waiting to start
  PROCESSING = "PROCESSING",     // Job is running
  COMPLETED = "COMPLETED",       // Job finished successfully
  FAILED = "FAILED",            // Job failed
  CANCELLED = "CANCELLED"       // Job was cancelled
}
```

## Validation Rules

### Text Content
- **Required**: Yes
- **Min length**: 1 character
- **Max length**: 300,000 characters
- **Cannot be**: Empty or whitespace-only

### Questions Per Type
- **Required**: Yes
- **Min entries**: 1 question type
- **Max per type**: 10 questions
- **Min per type**: 1 question
- **Valid types**: All QuestionType enum values

### Difficulty
- **Required**: Yes
- **Valid values**: EASY, MEDIUM, HARD

### Optional Fields
- **quizTitle**: Max 100 characters
- **quizDescription**: Max 500 characters
- **estimatedTimePerQuestion**: 1-10 minutes
- **maxChunkSize**: 1000-300000 characters

### Scope-Specific Validation
- **SPECIFIC_CHUNKS**: `chunkIndices` must be provided and non-negative
- **SPECIFIC_CHAPTER/SECTION**: Either `chapterTitle` or `chapterNumber` must be provided

## Best Practices

1. **Text Length**: For best results, provide at least 500 characters of meaningful content
2. **Question Distribution**: Balance question types based on content complexity
3. **Chunking Strategy**: Use `CHAPTER_BASED` for structured content, `SIZE_BASED` for unstructured text
4. **Error Handling**: Always implement proper error handling for network and validation errors
5. **Job Tracking**: Implement job status polling to show progress to users
6. **Rate Limiting**: Be mindful of API rate limits when making multiple requests

## Integration Notes

- This endpoint is **asynchronous** - it returns immediately with a job ID
- The actual quiz generation happens in the background
- Use the job tracking endpoints to monitor progress and retrieve results
- The generated quiz will be available through the standard quiz endpoints once the job completes
- Failed jobs should be handled gracefully with user-friendly error messages
