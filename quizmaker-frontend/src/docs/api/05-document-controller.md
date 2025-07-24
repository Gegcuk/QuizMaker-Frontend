# Documents & AI Controller

## Overview
The DocumentController handles document upload, processing, and chunking, while the AiChatController provides AI chat functionality.

**Base URLs**: 
- DocumentController: `/api/documents`
- AiChatController: `/api/ai`

**Authentication**: All endpoints require authentication via Bearer token.

## DTO Schemas

### DocumentDto
```json
{
  "id": "uuid",                          // Document identifier
  "originalFilename": "string",          // Original file name
  "contentType": "string",               // MIME type (e.g., "application/pdf")
  "fileSize": 1024000,                   // File size in bytes
  "status": "UPLOADED|PROCESSING|PROCESSED|FAILED",
  "uploadedAt": "2025-05-21T14:30:00",   // Upload timestamp
  "processedAt": "2025-05-21T14:35:00",  // Processing completion timestamp
  "title": "string",                     // Document title (extracted)
  "author": "string",                    // Document author (extracted)
  "totalPages": 25,                      // Total number of pages
  "totalChunks": 10,                     // Total number of chunks
  "processingError": "string",           // Error message if processing failed
  "chunks": [                            // Array of document chunks
    {
      "id": "uuid",
      "chunkIndex": 0,
      "title": "string",
      "content": "string",
      "startPage": 1,
      "endPage": 3,
      "wordCount": 500,
      "characterCount": 2500,
      "createdAt": "2025-05-21T14:35:00",
      "chapterTitle": "string",
      "sectionTitle": "string",
      "chapterNumber": 1,
      "sectionNumber": 1,
      "chunkType": "CHAPTER|SECTION|PAGE_BASED|SIZE_BASED"
    }
  ]
}
```

### DocumentChunkDto
```json
{
  "id": "uuid",                          // Chunk identifier
  "chunkIndex": 0,                       // Zero-based chunk index
  "title": "string",                     // Chunk title
  "content": "string",                   // Chunk content text
  "startPage": 1,                        // Starting page number
  "endPage": 3,                          // Ending page number
  "wordCount": 500,                      // Number of words in chunk
  "characterCount": 2500,                // Number of characters in chunk
  "createdAt": "2025-05-21T14:35:00",    // Chunk creation timestamp
  "chapterTitle": "string",              // Chapter title (if applicable)
  "sectionTitle": "string",              // Section title (if applicable)
  "chapterNumber": 1,                    // Chapter number (if applicable)
  "sectionNumber": 1,                    // Section number (if applicable)
  "chunkType": "CHAPTER|SECTION|PAGE_BASED|SIZE_BASED"
}
```

### ProcessDocumentRequest
```json
{
  "chunkingStrategy": "AUTO|CHAPTER_BASED|SECTION_BASED|SIZE_BASED|PAGE_BASED",
  "maxChunkSize": 5000,                  // Maximum chunk size in characters
  "storeChunks": true                    // Whether to store chunks in database
}
```

**Chunking Strategies**:
- `AUTO`: Automatically determine best strategy
- `CHAPTER_BASED`: Split by chapters only
- `SECTION_BASED`: Split by sections only
- `SIZE_BASED`: Split by size only
- `PAGE_BASED`: Split by page count

### ChatRequestDto
```json
{
  "message": "string"                    // Chat message (max 2000 characters)
}
```

**Validation Rules**:
- `message`: Required, not blank, max 2000 characters

### ChatResponseDto
```json
{
  "message": "string",                   // AI response message
  "model": "string",                     // AI model used
  "latency": 1500,                       // Response time in milliseconds
  "tokensUsed": 150,                     // Number of tokens used
  "timestamp": "2025-05-21T14:30:00"    // Response timestamp
}
```

## Enums

### DocumentStatus
- `UPLOADED`: Document has been uploaded but not processed
- `PROCESSING`: Document is currently being processed
- `PROCESSED`: Document has been successfully processed
- `FAILED`: Document processing failed

### ChunkType
- `CHAPTER`: Chunk represents a chapter
- `SECTION`: Chunk represents a section
- `PAGE_BASED`: Chunk based on page boundaries
- `SIZE_BASED`: Chunk based on size limits

### ChunkingStrategy
- `AUTO`: Automatically determine best strategy
- `CHAPTER_BASED`: Split by chapters only
- `SECTION_BASED`: Split by sections only
- `SIZE_BASED`: Split by size only
- `PAGE_BASED`: Split by page count

## DocumentController Endpoints

### 1. Upload Document
**POST** `/api/documents/upload`

Uploads and processes a document.

**Content-Type**: `multipart/form-data`

**Form Parameters**:
- `file`: Document file (required)
- `chunkingStrategy`: Chunking strategy (optional)
- `maxChunkSize`: Maximum chunk size in characters (optional)

**Example Request**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('chunkingStrategy', 'AUTO');
formData.append('maxChunkSize', '5000');
```

**Response** (201 Created):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "originalFilename": "sample-document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1024000,
  "status": "PROCESSING",
  "uploadedAt": "2025-05-21T14:30:00",
  "processedAt": "2025-05-21T14:30:00",
  "title": "Sample Document",
  "author": "John Doe",
  "totalPages": 25,
  "totalChunks": 0,
  "processingError": null,
  "chunks": []
}
```

**Error Responses**:
- `400 Bad Request`: Invalid file or parameters
- `401 Unauthorized`: Not authenticated
- `413 Payload Too Large`: File too large

### 2. Get Document
**GET** `/api/documents/{documentId}`

Retrieves a specific document by its ID.

**Response** (200 OK):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "originalFilename": "sample-document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1024000,
  "status": "PROCESSED",
  "uploadedAt": "2025-05-21T14:30:00",
  "processedAt": "2025-05-21T14:35:00",
  "title": "Sample Document",
  "author": "John Doe",
  "totalPages": 25,
  "totalChunks": 10,
  "processingError": null,
  "chunks": [
    {
      "id": "a1b2c3d4-0000-0000-0000-000000000000",
      "chunkIndex": 0,
      "title": "Introduction",
      "content": "This is the introduction content...",
      "startPage": 1,
      "endPage": 3,
      "wordCount": 500,
      "characterCount": 2500,
      "createdAt": "2025-05-21T14:35:00",
      "chapterTitle": "Introduction",
      "sectionTitle": null,
      "chapterNumber": 1,
      "sectionNumber": null,
      "chunkType": "CHAPTER"
    }
  ]
}
```

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to access this document
- `404 Not Found`: Document not found

### 3. List User Documents
**GET** `/api/documents`

Returns paginated list of user's documents.

**Query Parameters**:
- `page`: Page number (default: 0)
- `size`: Page size (default: 10)

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "originalFilename": "sample-document.pdf",
      "contentType": "application/pdf",
      "fileSize": 1024000,
      "status": "PROCESSED",
      "uploadedAt": "2025-05-21T14:30:00",
      "processedAt": "2025-05-21T14:35:00",
      "title": "Sample Document",
      "author": "John Doe",
      "totalPages": 25,
      "totalChunks": 10,
      "processingError": null,
      "chunks": []
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

### 4. Get Document Chunks
**GET** `/api/documents/{documentId}/chunks`

Retrieves all chunks for a document.

**Response** (200 OK):
```json
[
  {
    "id": "a1b2c3d4-0000-0000-0000-000000000000",
    "chunkIndex": 0,
    "title": "Introduction",
    "content": "This is the introduction content...",
    "startPage": 1,
    "endPage": 3,
    "wordCount": 500,
    "characterCount": 2500,
    "createdAt": "2025-05-21T14:35:00",
    "chapterTitle": "Introduction",
    "sectionTitle": null,
    "chapterNumber": 1,
    "sectionNumber": null,
    "chunkType": "CHAPTER"
  },
  {
    "id": "b2c3d4e5-1111-1111-1111-111111111111",
    "chunkIndex": 1,
    "title": "Chapter 1: Getting Started",
    "content": "This chapter covers the basics...",
    "startPage": 4,
    "endPage": 8,
    "wordCount": 800,
    "characterCount": 4000,
    "createdAt": "2025-05-21T14:35:00",
    "chapterTitle": "Getting Started",
    "sectionTitle": null,
    "chapterNumber": 1,
    "sectionNumber": null,
    "chunkType": "CHAPTER"
  }
]
```

### 5. Get Specific Chunk
**GET** `/api/documents/{documentId}/chunks/{chunkIndex}`

Retrieves a specific chunk by its index.

**Response** (200 OK):
```json
{
  "id": "a1b2c3d4-0000-0000-0000-000000000000",
  "chunkIndex": 0,
  "title": "Introduction",
  "content": "This is the introduction content...",
  "startPage": 1,
  "endPage": 3,
  "wordCount": 500,
  "characterCount": 2500,
  "createdAt": "2025-05-21T14:35:00",
  "chapterTitle": "Introduction",
  "sectionTitle": null,
  "chapterNumber": 1,
  "sectionNumber": null,
  "chunkType": "CHAPTER"
}
```

### 6. Delete Document
**DELETE** `/api/documents/{documentId}`

Deletes a document and all its chunks.

**Response** (204 No Content): No response body

**Error Responses**:
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to delete this document
- `404 Not Found`: Document not found

### 7. Reprocess Document
**POST** `/api/documents/{documentId}/reprocess`

Reprocesses a document with new parameters.

**Request Body**:
```json
{
  "chunkingStrategy": "CHAPTER_BASED",
  "maxChunkSize": 3000,
  "storeChunks": true
}
```

**Response** (200 OK): Returns updated DocumentDto

**Error Responses**:
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized to reprocess this document
- `404 Not Found`: Document not found

### 8. Get Document Status
**GET** `/api/documents/{documentId}/status`

Gets the current processing status of a document.

**Response** (200 OK): Returns DocumentDto

### 9. Get Configuration
**GET** `/api/documents/config`

Gets the document processing configuration.

**Response** (200 OK):
```json
{
  "defaultMaxChunkSize": 50000,
  "defaultStrategy": "CHAPTER_BASED"
}
```

**Schema Description**: Document processing configuration

**Fields**:
- `defaultMaxChunkSize`: Default maximum chunk size in characters (example: 50000)
- `defaultStrategy`: Default chunking strategy (example: "CHAPTER_BASED")

## AiChatController Endpoints

### 1. Send Chat Message
**POST** `/api/ai/chat`

Sends a message to the AI and receives a response.

**Request Body**:
```json
{
  "message": "What is the capital of France?"
}
```

**Response** (200 OK):
```json
{
  "message": "The capital of France is Paris. It is the largest city in France and serves as the country's political, economic, and cultural center.",
  "model": "gpt-4",
  "latency": 1500,
  "tokensUsed": 150,
  "timestamp": "2025-05-21T14:30:00"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid message
- `401 Unauthorized`: Not authenticated
- `500 Internal Server Error`: AI service error

## Integration Notes

### Document Processing Workflow
1. Upload document via `POST /api/documents/upload`
2. Poll document status until `PROCESSED`
3. Retrieve document chunks for quiz generation
4. Use chunks with QuizController's AI generation

### File Upload
- Supported formats: PDF, DOCX, TXT
- Maximum file size: 10MB
- Use `multipart/form-data` for uploads
- Monitor upload progress for large files

### Chunking Strategies
- **AUTO**: Best for most documents
- **CHAPTER_BASED**: For well-structured documents
- **SECTION_BASED**: For detailed documents
- **SIZE_BASED**: For consistent chunk sizes
- **PAGE_BASED**: For page-specific processing

### AI Chat
- Messages limited to 2000 characters
- Responses include model info and token usage
- Handle rate limiting and service errors
- Consider implementing chat history

### Error Handling
- Handle 401/403 responses for authentication/authorization
- Monitor document processing status
- Implement retry logic for failed uploads
- Show appropriate error messages for processing failures

### Best Practices
- Use appropriate chunking strategy for document type
- Monitor processing status for large documents
- Implement progress indicators for uploads
- Cache document chunks for better performance
- Handle AI service availability gracefully 