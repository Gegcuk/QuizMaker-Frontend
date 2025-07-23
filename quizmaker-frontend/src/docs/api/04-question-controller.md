# Questions Controller

## Overview
The QuestionController handles question creation, management, and retrieval for quizzes.

**Base URL**: `/api/v1/questions`

**Authentication**: Most endpoints require ADMIN role authentication via Bearer token.

## DTO Schemas

### CreateQuestionRequest
```json
{
  "type": "MCQ_SINGLE|MCQ_MULTI|OPEN|FILL_GAP|COMPLIANCE|TRUE_FALSE|ORDERING|HOTSPOT",
  "difficulty": "EASY|MEDIUM|HARD",
  "questionText": "string",              // 3-1000 characters, required
  "content": {},                         // Question type-specific content, required
  "hint": "string",                      // Max 500 characters, optional
  "explanation": "string",               // Max 2000 characters, optional
  "attachmentUrl": "string",             // Max 2048 characters, optional
  "quizIds": ["uuid1", "uuid2"],         // Optional array
  "tagIds": ["uuid1", "uuid2"]           // Optional array
}
```

**Validation Rules**:
- `type`: Required, valid question type
- `difficulty`: Required, valid difficulty level
- `questionText`: Required, 3-1000 characters
- `content`: Required, valid JSON for question type
- `hint`: Optional, max 500 characters
- `explanation`: Optional, max 2000 characters
- `attachmentUrl`: Optional, max 2048 characters

### UpdateQuestionRequest
```json
{
  "type": "MCQ_SINGLE|MCQ_MULTI|OPEN|FILL_GAP|COMPLIANCE|TRUE_FALSE|ORDERING|HOTSPOT",
  "difficulty": "EASY|MEDIUM|HARD",
  "questionText": "string",              // 3-1000 characters, required
  "content": {},                         // Question type-specific content, required
  "hint": "string",                      // Max 500 characters, optional
  "explanation": "string",               // Max 2000 characters, optional
  "attachmentUrl": "string",             // Max 2048 characters, optional
  "quizIds": ["uuid1", "uuid2"],         // Optional array
  "tagIds": ["uuid1", "uuid2"]           // Optional array
}
```

### QuestionDto
```json
{
  "id": "uuid",                          // Question identifier
  "type": "MCQ_SINGLE|MCQ_MULTI|OPEN|FILL_GAP|COMPLIANCE|TRUE_FALSE|ORDERING|HOTSPOT",
  "difficulty": "EASY|MEDIUM|HARD",
  "questionText": "string",              // Question text
  "content": {},                         // Question type-specific content
  "hint": "string",                      // Optional hint
  "explanation": "string",               // Optional explanation
  "attachmentUrl": "string",             // Optional attachment URL
  "createdAt": "2025-05-21T14:30:00Z",  // Creation timestamp
  "updatedAt": "2025-05-22T09:15:00Z",  // Last update timestamp
  "quizIds": ["uuid1", "uuid2"],         // Associated quiz IDs
  "tagIds": ["uuid1", "uuid2"]           // Associated tag IDs
}
```

## Question Type-Specific Content Structures

### MCQ_SINGLE (Multiple Choice Single Answer)
```json
{
  "options": [
    {
      "id": "a",
      "text": "Option A text",
      "correct": false
    },
    {
      "id": "b", 
      "text": "Option B text",
      "correct": true
    },
    {
      "id": "c",
      "text": "Option C text", 
      "correct": false
    },
    {
      "id": "d",
      "text": "Option D text",
      "correct": false
    }
  ]
}
```

**Requirements**:
- Exactly 4 options (A, B, C, D)
- Only ONE option must be marked as `correct: true`
- All other options must be marked as `correct: false`

### MCQ_MULTI (Multiple Choice Multiple Answers)
```json
{
  "options": [
    {
      "id": "a",
      "text": "Option A text",
      "correct": true
    },
    {
      "id": "b",
      "text": "Option B text", 
      "correct": false
    },
    {
      "id": "c",
      "text": "Option C text",
      "correct": true
    },
    {
      "id": "d",
      "text": "Option D text",
      "correct": false
    }
  ]
}
```

**Requirements**:
- Exactly 4 options (A, B, C, D)
- At least 2 options must be marked as `correct: true`
- At least 1 option must be marked as `correct: false`

### TRUE_FALSE (True/False Questions)
```json
{
  "answer": true
}
```

**Requirements**:
- `answer` must be either `true` or `false`
- Question text should be a clear, unambiguous statement

### OPEN (Open-Ended Questions)
```json
{
  "answer": "A comprehensive model answer that demonstrates expected depth and understanding"
}
```

**Requirements**:
- `answer` should be a comprehensive model answer
- Questions should require detailed explanations
- Avoid yes/no or short answer questions

### FILL_GAP (Fill in the Blank)
```json
{
  "text": "The sentence with ___ gaps to fill",
  "gaps": [
    {
      "id": 1,
      "answer": "correct answer"
    }
  ]
}
```

**Requirements**:
- `text` should contain gaps marked with underscores (`___`)
- `gaps` array should contain objects with `id` and `answer`
- 1-3 gaps per question recommended
- Each gap should have only one correct answer

### COMPLIANCE (Compliance Questions)
```json
{
  "statements": [
    {
      "id": 1,
      "text": "Statement to evaluate",
      "compliant": true
    },
    {
      "id": 2,
      "text": "Another statement to evaluate",
      "compliant": false
    }
  ]
}
```

**Requirements**:
- 2-4 statements to evaluate
- Each statement should be clearly compliant or non-compliant
- `compliant` must be either `true` or `false`

### ORDERING (Ordering Questions)
```json
{
  "items": [
    {
      "id": 1,
      "text": "First item"
    },
    {
      "id": 2,
      "text": "Second item"
    },
    {
      "id": 3,
      "text": "Third item"
    },
    {
      "id": 4,
      "text": "Fourth item"
    }
  ]
}
```

**Requirements**:
- 3-5 items to order
- Items should have a logical sequence
- Only one correct order should be possible

### HOTSPOT (Hotspot Questions)
```json
{
  "imageUrl": "http://example.com/image.png",
  "regions": [
    {
      "id": 1,
      "x": 10,
      "y": 20,
      "width": 30,
      "height": 40,
      "correct": true
    },
    {
      "id": 2,
      "x": 50,
      "y": 60,
      "width": 25,
      "height": 35,
      "correct": false
    }
  ]
}
```

**Requirements**:
- `imageUrl` must be valid and accessible
- 2-4 clickable regions
- At least one region must be marked as `correct: true`
- Coordinates (x, y, width, height) must be valid

## Enums

### QuestionType
- `MCQ_SINGLE`: Multiple choice single answer
- `MCQ_MULTI`: Multiple choice multiple answers
- `OPEN`: Open-ended questions
- `FILL_GAP`: Fill in the blank
- `COMPLIANCE`: Compliance questions
- `TRUE_FALSE`: True/False questions
- `ORDERING`: Ordering questions
- `HOTSPOT`: Hotspot questions

### Difficulty
- `EASY`: Basic facts, definitions, simple recall
- `MEDIUM`: Application of concepts, analysis of relationships
- `HARD`: Complex analysis, synthesis of multiple concepts

## Endpoints

### 1. Create Question
**POST** `/api/v1/questions`

Creates a new question (ADMIN only).

**Request Body**:
```json
{
  "type": "MCQ_SINGLE",
  "difficulty": "MEDIUM",
  "questionText": "What is the primary function of the mitochondria in a cell?",
  "content": {
    "options": [
      {
        "id": "a",
        "text": "To store genetic information",
        "correct": false
      },
      {
        "id": "b",
        "text": "To produce energy through cellular respiration",
        "correct": true
      },
      {
        "id": "c",
        "text": "To transport proteins throughout the cell",
        "correct": false
      },
      {
        "id": "d",
        "text": "To break down waste materials",
        "correct": false
      }
    ]
  },
  "hint": "Think about what process provides energy for cellular activities",
  "explanation": "Mitochondria are known as the powerhouse of the cell because they produce energy through cellular respiration.",
  "quizIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
}
```

**Response** (201 Created):
```json
{
  "questionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role

### 2. List Questions
**GET** `/api/v1/questions`

Returns paginated list of questions with optional filtering.

**Query Parameters**:
- `quizId`: Filter by quiz UUID (optional)
- `pageNumber`: Page number (default: 0)
- `size`: Page size (default: 20)

**Example Request**:
```
GET /api/v1/questions?quizId=3fa85f64-5717-4562-b3fc-2c963f66afa6&pageNumber=0&size=10
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "type": "MCQ_SINGLE",
      "difficulty": "MEDIUM",
      "questionText": "What is the primary function of the mitochondria in a cell?",
      "content": {
        "options": [
          {
            "id": "a",
            "text": "To store genetic information",
            "correct": false
          },
          {
            "id": "b",
            "text": "To produce energy through cellular respiration",
            "correct": true
          },
          {
            "id": "c",
            "text": "To transport proteins throughout the cell",
            "correct": false
          },
          {
            "id": "d",
            "text": "To break down waste materials",
            "correct": false
          }
        ]
      },
      "hint": "Think about what process provides energy for cellular activities",
      "explanation": "Mitochondria are known as the powerhouse of the cell because they produce energy through cellular respiration.",
      "attachmentUrl": null,
      "createdAt": "2025-05-21T14:30:00Z",
      "updatedAt": "2025-05-22T09:15:00Z",
      "quizIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
      "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
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

### 3. Get Question by ID
**GET** `/api/v1/questions/{id}`

Returns a specific question by its ID.

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "type": "MCQ_SINGLE",
  "difficulty": "MEDIUM",
  "questionText": "What is the primary function of the mitochondria in a cell?",
  "content": {
    "options": [
      {
        "id": "a",
        "text": "To store genetic information",
        "correct": false
      },
      {
        "id": "b",
        "text": "To produce energy through cellular respiration",
        "correct": true
      },
      {
        "id": "c",
        "text": "To transport proteins throughout the cell",
        "correct": false
      },
      {
        "id": "d",
        "text": "To break down waste materials",
        "correct": false
      }
    ]
  },
  "hint": "Think about what process provides energy for cellular activities",
  "explanation": "Mitochondria are known as the powerhouse of the cell because they produce energy through cellular respiration.",
  "attachmentUrl": null,
  "createdAt": "2025-05-21T14:30:00Z",
  "updatedAt": "2025-05-22T09:15:00Z",
  "quizIds": ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  "tagIds": ["a1b2c3d4-0000-0000-0000-000000000000"]
}
```

**Error Responses**:
- `404 Not Found`: Question not found

### 4. Update Question
**PATCH** `/api/v1/questions/{id}`

Updates an existing question (ADMIN only).

**Request Body**:
```json
{
  "type": "MCQ_SINGLE",
  "difficulty": "HARD",
  "questionText": "Updated question text",
  "content": {
    "options": [
      {
        "id": "a",
        "text": "Updated option A",
        "correct": false
      },
      {
        "id": "b",
        "text": "Updated option B",
        "correct": true
      },
      {
        "id": "c",
        "text": "Updated option C",
        "correct": false
      },
      {
        "id": "d",
        "text": "Updated option D",
        "correct": false
      }
    ]
  },
  "hint": "Updated hint",
  "explanation": "Updated explanation"
}
```

**Response** (200 OK): Returns updated QuestionDto

**Error Responses**:
- `400 Bad Request`: Validation errors
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Question not found

### 5. Delete Question
**DELETE** `/api/v1/questions/{id}`

Deletes a question (ADMIN only).

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not ADMIN role
- `404 Not Found`: Question not found

## Frontend Integration Examples

### JavaScript/TypeScript Examples

#### Create MCQ Single Question
```javascript
const createMcqSingleQuestion = async (questionData) => {
  const response = await fetch('/api/v1/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      type: 'MCQ_SINGLE',
      difficulty: 'MEDIUM',
      questionText: 'What is the capital of France?',
      content: {
        options: [
          { id: 'a', text: 'London', correct: false },
          { id: 'b', text: 'Paris', correct: true },
          { id: 'c', text: 'Berlin', correct: false },
          { id: 'd', text: 'Madrid', correct: false }
        ]
      },
      hint: 'Think about famous landmarks',
      explanation: 'Paris is the capital and largest city of France.',
      quizIds: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
      ...questionData
    })
  });
  
  const { questionId } = await response.json();
  return questionId;
};
```

#### Create True/False Question
```javascript
const createTrueFalseQuestion = async (questionData) => {
  const response = await fetch('/api/v1/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      type: 'TRUE_FALSE',
      difficulty: 'EASY',
      questionText: 'The Earth is round.',
      content: {
        answer: true
      },
      hint: 'Consider the shape of the Earth',
      explanation: 'The Earth is approximately spherical in shape.',
      ...questionData
    })
  });
  
  const { questionId } = await response.json();
  return questionId;
};
```

#### Create Open Question
```javascript
const createOpenQuestion = async (questionData) => {
  const response = await fetch('/api/v1/questions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      type: 'OPEN',
      difficulty: 'HARD',
      questionText: 'Explain the process of photosynthesis.',
      content: {
        answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy...'
      },
      hint: 'Consider the role of sunlight and chlorophyll',
      explanation: 'A comprehensive answer should include the role of sunlight, chlorophyll, and the production of glucose and oxygen.',
      ...questionData
    })
  });
  
  const { questionId } = await response.json();
  return questionId;
};
```

#### Get Questions for Quiz
```javascript
const getQuestionsForQuiz = async (quizId, page = 0, size = 20) => {
  const params = new URLSearchParams({
    quizId,
    pageNumber: page.toString(),
    size: size.toString()
  });
  
  const response = await fetch(`/api/v1/questions?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
  
  return await response.json();
};
```

#### Update Question
```javascript
const updateQuestion = async (questionId, updates) => {
  const response = await fetch(`/api/v1/questions/${questionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(updates)
  });
  
  return await response.json();
};
```

#### Delete Question
```javascript
const deleteQuestion = async (questionId) => {
  await fetch(`/api/v1/questions/${questionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
  });
};
```

## Integration Notes

### Question Content Validation
- Each question type has specific content structure requirements
- Validate content structure before sending to API
- Ensure correct answers are properly marked

### Question Types
- **MCQ_SINGLE**: Use for single correct answer scenarios
- **MCQ_MULTI**: Use for "select all that apply" scenarios
- **TRUE_FALSE**: Use for binary choice questions
- **OPEN**: Use for detailed explanation questions
- **FILL_GAP**: Use for completion questions
- **COMPLIANCE**: Use for regulatory/standards questions
- **ORDERING**: Use for sequence/process questions
- **HOTSPOT**: Use for image-based questions

### Content Structure
- All question types use JSON content structure
- Content must match the expected format for each type
- Validation occurs on both client and server side

### Error Handling
- Handle 401/403 responses for authentication/authorization
- Validate content structure before submission
- Show appropriate error messages for validation failures

### Best Practices
- Use appropriate difficulty levels for target audience
- Provide helpful hints and explanations
- Ensure questions test understanding, not just memorization
- Use attachments sparingly and ensure accessibility 