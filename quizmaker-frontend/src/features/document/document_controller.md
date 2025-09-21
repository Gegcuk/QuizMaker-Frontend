# Document Controller API

Base path: `/api/documents`

This document lists endpoints for managing uploaded documents and their chunks. All endpoints require authentication.

## Endpoints

### POST `/upload`
- Purpose: Upload a document and process it into chunks
- Auth: Required
- Headers: `Authorization: Bearer <accessToken>`
- Content type: `multipart/form-data`
- Form fields:
  - `file` (binary, required): PDF, EPUB, or TXT
  - `chunkingStrategy` (string, optional): one of `AUTO`, `CHAPTER_BASED`, `SECTION_BASED`, `SIZE_BASED`, `PAGE_BASED`
  - `maxChunkSize` (number, optional): characters; default from server config
- Response: `201 Created` with `DocumentDto`
- Errors:
  - `400 Bad Request` for validation errors (empty file, invalid type/size/params)
  - `500 Internal Server Error` for storage or processing failures
```json
{
  "id": "14f4b4d4-66ab-4a2d-9f89-2a4b5f3d9c12",
  "originalFilename": "handbook.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576,
  "status": "PROCESSED",
  "uploadedAt": "2025-05-21T15:30:00",
  "processedAt": "2025-05-21T15:30:03",
  "title": "Team Handbook",
  "author": "ACME",
  "totalPages": 120,
  "totalChunks": 8,
  "processingError": null,
  "chunks": [
    { "id": "...", "chunkIndex": 0, "title": "Chapter 1", "content": "...", "startPage": 1, "endPage": 14, "wordCount": 2045, "characterCount": 11234, "createdAt": "2025-05-21T15:30:02", "chunkType": "CHAPTER" }
  ]
}
```

Validation and limits:
- Accepted types: `application/pdf`, `application/epub+zip`, `text/plain`
- Max file size: 150 MB
- `maxChunkSize` (if provided): 100–100000 characters
- `chunkingStrategy` (if provided): must be a valid enum value (case-insensitive)

Errors:
- `400 Bad Request` — empty file, invalid type/size/params
- `500 Internal Server Error` — storage or processing failures

---

### GET `/`
- Purpose: List documents uploaded by the authenticated user
- Auth: Required
- Query params:
  - `page` (number, default `0`)
  - `size` (number, default `10`)
- Response: `200 OK` with `Page<DocumentDto>`
```json
{
  "content": [
    { "id": "14f4b4d4-66ab-4a2d-9f89-2a4b5f3d9c12", "originalFilename": "handbook.pdf", "status": "PROCESSED", "totalChunks": 8 }
  ],
  "pageable": { "pageNumber": 0, "pageSize": 10 },
  "totalElements": 1,
  "totalPages": 1,
  "last": true,
  "size": 10,
  "number": 0,
  "sort": { "sorted": false, "unsorted": true, "empty": true },
  "first": true,
  "numberOfElements": 1,
  "empty": false
}
```

---

### GET `/{documentId}`
- Purpose: Get a document by ID (includes chunk metadata and content)
- Auth: Required; only the uploader may access
- Path params: `documentId` (UUID)
- Response: `200 OK` with `DocumentDto`
- Errors:
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document doesn't exist

---

### GET `/{documentId}/chunks`
- Purpose: List all chunks for a document
- Auth: Required; only the uploader may access
- Response: `200 OK` with `DocumentChunkDto[]`
- Errors:
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document doesn't exist
```json
[
  {
    "id": "0b5b9b4e-8c22-4e4a-8f0a-3f9a6d4b1e2c",
    "chunkIndex": 0,
    "title": "Chapter 1",
    "content": "...",
    "startPage": 1,
    "endPage": 14,
    "wordCount": 2045,
    "characterCount": 11234,
    "createdAt": "2025-05-21T15:30:02",
    "chapterTitle": "Intro",
    "sectionTitle": null,
    "chapterNumber": 1,
    "sectionNumber": null,
    "chunkType": "CHAPTER"
  }
]
```

---

### GET `/{documentId}/chunks/{chunkIndex}`
- Purpose: Get a specific chunk by index
- Auth: Required; only the uploader may access
- Path params: `chunkIndex` (number)
- Response: `200 OK` with `DocumentChunkDto`
- Errors:
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document or chunk doesn't exist

---

### DELETE `/{documentId}`
- Purpose: Delete a document and its chunks
- Auth: Required; only the uploader may delete
- Response: `204 No Content`
- Errors:
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document doesn't exist

---

### POST `/{documentId}/reprocess`
- Purpose: Reprocess an existing document using new settings
- Auth: Required; only the uploader may reprocess
- Request body (JSON): `ProcessDocumentRequest`
```json
{
  "chunkingStrategy": "SECTION_BASED",
  "maxChunkSize": 50000,
  "minChunkSize": 1000,
  "aggressiveCombinationThreshold": 3000,
  "storeChunks": true
}
```
- Response: `200 OK` with updated `DocumentDto`
- Errors:
  - `400 Bad Request` for invalid request parameters
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document doesn't exist
  - `500 Internal Server Error` for storage or processing failures

---

### GET `/{documentId}/status`
- Purpose: Get current processing status and metadata
- Auth: Required; only the uploader may access
- Response: `200 OK` with `DocumentDto`
- Errors:
  - `403 Forbidden` for unauthorized access (not the uploader)
  - `404 Not Found` if document doesn't exist

---

### GET `/config`
- Purpose: Get server defaults for processing
- Auth: Required
- Response: `200 OK` with `DocumentConfigDto`
- Errors: `500 Internal Server Error` for configuration retrieval failures
```json
{ "defaultMaxChunkSize": 50000, "defaultStrategy": "CHAPTER_BASED" }
```

## DTOs

### ProcessDocumentRequest
```ts
type ProcessDocumentRequest = {
  chunkingStrategy: "AUTO" | "CHAPTER_BASED" | "SECTION_BASED" | "SIZE_BASED" | "PAGE_BASED"; // required for reprocess; optional when uploading if you want defaults
  maxChunkSize?: number;                    // 100..100000 characters
  minChunkSize?: number;                    // default 1000
  aggressiveCombinationThreshold?: number;  // default 3000
  storeChunks?: boolean;                    // default true
};
```

### DocumentDto
```ts
type DocumentDto = {
  id: string;                 // UUID
  originalFilename: string;
  contentType: string;        // e.g., application/pdf
  fileSize: number | null;    // bytes (Long in Java)
  status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
  uploadedAt: string;         // ISO date-time (LocalDateTime in Java)
  processedAt: string | null; // ISO date-time (LocalDateTime in Java)
  title?: string | null;
  author?: string | null;
  totalPages?: number | null; // Integer in Java
  totalChunks?: number | null; // Integer in Java
  processingError?: string | null;
  chunks?: DocumentChunkDto[]; // may include full content; prefer chunk endpoints if large
};
```

### DocumentChunkDto
```ts
type DocumentChunkDto = {
  id: string;                 // UUID
  chunkIndex: number;         // Integer in Java
  title: string;
  content: string;            // text content of the chunk
  startPage: number | null;   // Integer in Java
  endPage: number | null;     // Integer in Java
  wordCount: number | null;   // Integer in Java
  characterCount: number | null; // Integer in Java
  createdAt: string;          // ISO date-time (LocalDateTime in Java)
  chapterTitle?: string | null;
  sectionTitle?: string | null;
  chapterNumber?: number | null; // Integer in Java
  sectionNumber?: number | null; // Integer in Java
  chunkType: "CHAPTER" | "SECTION" | "PAGE_BASED" | "SIZE_BASED";
};
```

### DocumentConfigDto
```ts
type DocumentConfigDto = {
  defaultMaxChunkSize: number; // Integer in Java
  defaultStrategy: string; // one of the chunking strategies
};
```

## Notes for Frontend
- **Authentication**: all endpoints require `Authorization: Bearer <accessToken>`.
- **File types**: accept PDF, EPUB, TXT; other types are rejected with 400.
- **Large documents**: `DocumentDto.chunks` may include full content; for efficient pagination or streaming, call the chunk endpoints.
- **Reprocess**: send `chunkingStrategy` and optional sizes to change splitting; previous chunks are replaced.
- **Error handling**: 
  - `400` for invalid input parameters
  - `403` for unauthorized access (not the document uploader)
  - `404` for missing documents/chunks
  - `500` for storage/processing failures
- **Ownership**: Users can only access documents they uploaded; all operations are restricted to document owners.
- **Processing**: Document processing is asynchronous; check status endpoint for current processing state.

## Known Issues and Limitations
- **Error handling inconsistencies**: Some endpoints catch and rethrow exceptions with generic messages, potentially losing specific error details.
- **Missing validation**: The upload endpoint doesn't validate file content, only file extensions and size.
- **Chunking strategy validation**: Enum validation is case-insensitive but doesn't handle invalid values gracefully.
- **Document ownership**: No audit trail for document access or modifications.
- **File size limits**: Hardcoded 150MB limit may not be configurable per environment.
- **Processing status**: No real-time updates for processing status; clients must poll the status endpoint.
- **Chunk content size**: Large chunk content in responses may cause performance issues; consider streaming for large documents.
- **Missing Swagger documentation**: The controller lacks comprehensive OpenAPI annotations for better API documentation.
