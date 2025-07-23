# API Service Layer Enhancement - Implementation Plan

## Overview
This plan breaks down the API Service Layer Enhancement into smaller, manageable steps. Each service creation includes its own DTO definitions as a sub-step, ensuring type safety and proper structure throughout the implementation.

## File Structure & Best Practices

### Directory Structure
```
src/
├── api/
│   ├── axiosInstance.ts (existing - enhanced)
│   ├── base.service.ts (new - base service class)
│   ├── endpoints.ts (new - path constants)
│   ├── auth.service.ts (enhance existing)
│   ├── attempt.service.ts (new)
│   ├── document.service.ts (new)
│   ├── ai.service.ts (new)
│   ├── admin.service.ts (new)
│   ├── superAdmin.service.ts (new - dangerous operations)
│   ├── user.service.ts (new)
│   ├── result.service.ts (new)
│   ├── quiz.service.ts (existing - enhanced)
│   ├── question.service.ts (existing - enhanced)
│   ├── category.service.ts (existing - enhanced)
│   └── tag.service.ts (existing - enhanced)
├── types/
│   ├── index.ts (re-exports all types)
│   ├── common.types.ts (shared types like pagination, responses)
│   ├── auth.types.ts
│   ├── attempt.types.ts
│   ├── document.types.ts
│   ├── ai.types.ts
│   ├── admin.types.ts
│   ├── user.types.ts
│   ├── result.types.ts
│   ├── quiz.types.ts
│   ├── question.types.ts
│   ├── category.types.ts
│   └── tag.types.ts
├── hooks/ (optional - if using TanStack Query)
│   ├── useAuth.ts
│   ├── useQuiz.ts
│   ├── useAttempt.ts
│   └── ...
└── utils/
    ├── tokenStorage.ts (new - abstract token storage)
    ├── polling.ts (new - job status polling)
    └── mockServer.ts (new - testing utilities)
```

### Best Practices
1. **Consistent Naming**: All service functions follow camelCase with descriptive names
2. **Type Safety**: Full TypeScript integration with proper interfaces
3. **Error Handling**: Leverage existing axios interceptor for auth errors
4. **Pagination Support**: Consistent pagination parameters across all list endpoints
5. **Modular Design**: Each service handles one domain area
6. **Response Types**: Proper typing for all API responses
7. **Query Parameters**: Structured approach for filtering and sorting
8. **Base Service Class**: All services extend BaseService for common CRUD operations
9. **Response Envelopes**: Consistent ApiResponse<T> and Paginated<T> patterns
10. **Path Constants**: Centralized endpoint definitions for maintainability
11. **Error Domain Typing**: Proper error classification and handling
12. **Token Storage Abstraction**: Future-proof token management

---

## Step-by-Step Implementation Plan

### Step 0: Foundation Setup (Phase 0)
**Priority: Critical**

#### 0.1 Create Common Types and Utilities
**Files**: 
- `src/types/common.types.ts`
- `src/api/base.service.ts`
- `src/api/endpoints.ts`
- `src/utils/tokenStorage.ts`
- `src/utils/polling.ts`

**Description**: Set up foundational types and utilities that all services will use

**Types to Add**:
- `ApiResponse<T>`
- `Paginated<T>`
- `ApiError` (union type)
- `PaginationParams`
- `BaseService<T>` class
- `TokenStorage` interface
- `pollJobStatus` utility

#### 0.2 Enhance Axios Instance
**File**: `src/api/axiosInstance.ts`

**Enhancements**:
- Add support for file uploads (multipart/form-data)
- Enhanced error handling for new endpoints
- Request/response logging for debugging
- Timeout configurations for long-running operations
- Progress tracking for file uploads
- Throttled refresh calls to prevent race conditions

---

### Step 1: Authentication Service Enhancement
**Priority: High**

#### 1.1 Create Authentication DTOs
**File**: `src/types/auth.types.ts`

**Description**: Create authentication-related type definitions

**Types to Add**:
- `RegisterRequest`
- `LoginRequest` 
- `JwtResponse`
- `UserDto`
- `RefreshTokenRequest`

#### 1.2 Create Authentication Service
**File**: `src/api/auth.service.ts`

**Description**: Comprehensive authentication service covering all auth endpoints

**Endpoints to Implement**:
- `POST /v1/auth/register` - User registration
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Token refresh
- `POST /v1/auth/logout` - User logout
- `GET /v1/auth/me` - Get current user

**Key Features**:
- JWT token management integration
- Automatic token refresh handling
- User session management
- Error handling for auth failures

---

### Step 2: Attempt Service Creation
**Priority: High**

#### 2.1 Create Attempt DTOs
**File**: `src/types/attempt.types.ts`

**Description**: Create attempt-related type definitions

**Types to Add**:
- `StartAttemptRequest`
- `StartAttemptResponse`
- `QuestionForAttemptDto`
- `AttemptStatisticsDto`
- `BatchAnswerSubmissionRequest`
- `BatchAnswerSubmissionResponse`
- `AttemptPauseResponse`
- `AttemptResumeResponse`

#### 2.2 Create Attempt Service
**File**: `src/api/attempt.service.ts`

**Description**: Complete attempt management for quiz taking experience

**Endpoints to Implement**:
- `POST /v1/attempts/quizzes/{quizId}` - Start attempt
- `GET /v1/attempts` - List user attempts
- `GET /v1/attempts/{attemptId}` - Get attempt details
- `POST /v1/attempts/{attemptId}/answers` - Submit single answer (immediate feedback)
- `POST /v1/attempts/{attemptId}/progress` - Save progress (no feedback, debounced)
- `POST /v1/attempts/{attemptId}/answers/batch` - Submit batch answers
- `POST /v1/attempts/{attemptId}/complete` - Complete attempt
- `GET /v1/attempts/{attemptId}/stats` - Get attempt statistics
- `POST /v1/attempts/{attemptId}/pause` - Pause attempt
- `POST /v1/attempts/{attemptId}/resume` - Resume attempt
- `GET /v1/attempts/quizzes/{quizId}/questions/shuffled` - Get shuffled questions

**Key Features**:
- Real-time attempt tracking
- Answer submission with immediate feedback
- Progress monitoring with autosave
- Pause/resume functionality
- Question shuffling support
- Debounced progress saving

---

### Step 3: Document Service Creation
**Priority: Medium**

#### 3.1 Create Document DTOs
**File**: `src/types/document.types.ts`

**Description**: Create document-related type definitions

**Types to Add**:
- `DocumentDto`
- `DocumentChunkDto`
- `DocumentUploadRequest`
- `DocumentReprocessRequest`
- `DocumentConfigDto`
- `PageDocumentDto`

#### 3.2 Create Document Service
**File**: `src/api/document.service.ts`

**Description**: Document upload and processing for AI quiz generation

**Endpoints to Implement**:
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/config` - Get document configuration
- `GET /api/documents/{documentId}` - Get document details
- `GET /api/documents` - List user documents
- `GET /api/documents/{documentId}/chunks` - Get document chunks
- `GET /api/documents/{documentId}/chunks/{chunkIndex}` - Get specific chunk
- `DELETE /api/documents/{documentId}` - Delete document
- `POST /api/documents/{documentId}/reprocess` - Reprocess document
- `GET /api/documents/{documentId}/status` - Get document status

**Key Features**:
- File upload with progress tracking
- Document processing status monitoring with polling
- Chunk-based document access
- Reprocessing capabilities
- File management operations
- Job queue integration for long-running operations

---

### Step 4: AI Service Creation
**Priority: Medium**

#### 4.1 Create AI DTOs
**File**: `src/types/ai.types.ts`

**Description**: Create AI-related type definitions

**Types to Add**:
- `ChatRequestDto`
- `ChatResponseDto`
- `GenerateQuizFromDocumentRequest`
- `QuizGenerationResponse`
- `QuizGenerationStatus`
- `PageQuizGenerationJobDto`
- `QuizGenerationStatistics`

#### 4.2 Create AI Service
**File**: `src/api/ai.service.ts`

**Description**: AI-powered features including chat and quiz generation

**Endpoints to Implement**:
- `POST /api/ai/chat` - AI chat interface (with streaming support)
- `POST /v1/quizzes/generate-from-document` - Generate quiz from document
- `GET /v1/quizzes/generation-status/{jobId}` - Get generation status
- `GET /v1/quizzes/generated-quiz/{jobId}` - Get generated quiz
- `DELETE /v1/quizzes/generation-status/{jobId}` - Cancel generation
- `GET /v1/quizzes/generation-jobs` - List generation jobs
- `GET /v1/quizzes/generation-jobs/statistics` - Get generation statistics

**Key Features**:
- Real-time chat with AI (streaming support)
- Asynchronous quiz generation with polling
- Progress tracking for generation jobs
- Job management and cancellation
- Generation statistics and analytics
- SSE/WebSocket support for streaming responses

---

### Step 5: Result Service Creation
**Priority: Medium**

#### 5.1 Create Result DTOs
**File**: `src/types/result.types.ts`

**Description**: Create result-related type definitions

**Types to Add**:
- `LeaderboardEntryDto`
- `QuestionStatsDto`
- `QuizAnalyticsDto`
- `UserResultsDto`
- `GlobalStatisticsDto`
- `ResultsExportDto`

#### 5.2 Create Result Service
**File**: `src/api/result.service.ts`

**Description**: Quiz results, analytics, and leaderboards

**Endpoints to Implement**:
- `GET /v1/quizzes/{quizId}/results` - Get quiz results
- `GET /v1/quizzes/{quizId}/leaderboard` - Get quiz leaderboard
- `GET /v1/results/user/{userId}` - Get user results
- `GET /v1/results/quiz/{quizId}/analytics` - Get quiz analytics
- `GET /v1/results/statistics` - Get global statistics
- `GET /v1/results/export/{quizId}` - Export results (CSV, XLSX, PDF)

**Key Features**:
- Comprehensive result analytics
- Leaderboard functionality
- User performance tracking
- Data export capabilities with multiple formats
- Statistical reporting
- Future-proof export format support

---

### Step 6: Admin Service Creation
**Priority: Low**

#### 6.1 Create Admin DTOs
**File**: `src/types/admin.types.ts`

**Description**: Create admin-related type definitions

**Types to Add**:
- `CreateRoleRequest`
- `RoleDto`
- `UpdateRoleRequest`
- `RoleAssignmentDto`
- `SystemStatusDto`
- `SystemInitializationDto`
- `DangerousOperationRequest`
- `DangerousOperationResponse`
- `PageRoleDto`

#### 6.2 Create Admin Service
**File**: `src/api/admin.service.ts`

**Description**: Administrative functions for system management

**Endpoints to Implement**:
- `GET /v1/admin/roles` - List roles
- `GET /v1/admin/roles/{roleId}` - Get role details
- `POST /v1/admin/roles` - Create role
- `PUT /v1/admin/roles/{roleId}` - Update role
- `DELETE /v1/admin/roles/{roleId}` - Delete role
- `POST /v1/admin/users/{userId}/roles/{roleId}` - Assign role to user
- `DELETE /v1/admin/users/{userId}/roles/{roleId}` - Remove role from user
- `POST /v1/admin/system/initialize` - Initialize system
- `GET /v1/admin/system/status` - Get system status

**Key Features**:
- Role-based access control management
- User role assignment
- System initialization and status monitoring
- Administrative analytics

#### 6.3 Create Super Admin Service
**File**: `src/api/superAdmin.service.ts`

**Description**: Dangerous operations requiring super admin privileges

**Endpoints to Implement**:
- `POST /v1/admin/super/dangerous-operation` - Super admin operations
- `POST /v1/admin/super/bulk-operations` - Bulk dangerous operations

**Key Features**:
- Super admin operations with extra security
- Higher timeout configurations
- Stricter interceptor validation
- Audit logging for dangerous operations

---

### Step 7: User Service Creation
**Priority: Low**

#### 7.1 Create User DTOs
**File**: `src/types/user.types.ts`

**Description**: Create user-related type definitions

**Types to Add**:
- `UpdateUserProfileRequest`
- `UserProfileDto`
- `AdminUpdateUserRequest`
- `UserActivationResponse`
- `PageUserDto`

#### 7.2 Create User Service
**File**: `src/api/user.service.ts`

**Description**: User management and profile operations

**Endpoints to Implement**:
- `GET /v1/users/profile` - Get user profile
- `PATCH /v1/users/profile` - Update user profile
- `GET /v1/users/{userId}` - Get user by ID (admin)
- `GET /v1/users` - List users (admin)
- `PATCH /v1/users/{userId}` - Update user (admin)
- `DELETE /v1/users/{userId}` - Delete user (admin)
- `POST /v1/users/{userId}/activate` - Activate user (admin)
- `POST /v1/users/{userId}/deactivate` - Deactivate user (admin)
- `POST /v1/users/bulk-activate` - Bulk activate users (admin)
- `POST /v1/users/bulk-deactivate` - Bulk deactivate users (admin)

**Key Features**:
- Profile management
- User administration
- Account status management
- User search and filtering
- Bulk operations for mass migrations

---

### Step 8: Enhance Existing Services

#### 8.1 Enhance Quiz CRUD Operations
**File**: `src/api/quiz.service.ts`
**File**: `src/types/quiz.types.ts`

**New DTOs to Add**:
- `BulkUpdateQuizzesRequest`
- `BulkUpdateQuizzesResponse`
- `QuizVisibilityRequest`
- `QuizStatusRequest`

**New Endpoints to Add**:
- `PATCH /v1/quizzes/bulk-update` - Bulk update quizzes
- `DELETE /v1/quizzes?ids=id1,id2,id3` - Bulk delete quizzes
- `PATCH /v1/quizzes/{quizId}/visibility` - Toggle quiz visibility
- `PATCH /v1/quizzes/{quizId}/status` - Change quiz status
- `GET /v1/quizzes/public` - List public quizzes

#### 8.2 Enhance Quiz Relationships
**File**: `src/api/quiz.service.ts`
**File**: `src/types/quiz.types.ts`

**New DTOs to Add**:
- `QuizRelationshipsDto`

**New Endpoints to Add**:
- `POST /v1/quizzes/{quizId}/questions/{questionId}` - Add question to quiz
- `DELETE /v1/quizzes/{quizId}/questions/{questionId}` - Remove question from quiz
- `POST /v1/quizzes/{quizId}/tags/{tagId}` - Add tag to quiz
- `DELETE /v1/quizzes/{quizId}/tags/{tagId}` - Remove tag from quiz
- `PATCH /v1/quizzes/{quizId}/category/{categoryId}` - Change quiz category

#### 8.3 Enhance Question Service
**File**: `src/api/question.service.ts`
**File**: `src/types/question.types.ts`

**New DTOs to Add**:
- `QuestionAnalyticsDto`

**New Endpoints to Add**:
- Enhanced question management
- Question analytics
- Question relationships

#### 8.4 Enhance Category Service
**File**: `src/api/category.service.ts`
**File**: `src/types/category.types.ts`

**New DTOs to Add**:
- `CategoryAnalyticsDto`

**New Endpoints to Add**:
- Enhanced CRUD operations
- Category analytics
- Category relationships

#### 8.5 Enhance Tag Service
**File**: `src/api/tag.service.ts`
**File**: `src/types/tag.types.ts`

**New DTOs to Add**:
- `TagAnalyticsDto`

**New Endpoints to Add**:
- Enhanced CRUD operations
- Tag analytics
- Tag relationships

---

### Step 9: Testing & Documentation Setup
**Priority: Medium**

#### 9.1 Create Testing Utilities
**Files**: 
- `src/utils/mockServer.ts`
- `src/utils/testClient.ts`

**Description**: Set up testing infrastructure for all services

**Features**:
- MSW-powered mock server
- Test client wrapper around axios
- Contract testing utilities
- Coverage gates (>90% lines, >80% branches)

#### 9.2 Create Documentation
**Files**: 
- `src/docs/api-services.mdx`
- JSDoc comments in all services

**Description**: Generate documentation from JSDoc comments

**Features**:
- Storybook docs integration
- IDE-agnostic API reference
- Auto-generated from code

---

## Implementation Priority Order

### Phase 0: Foundation (Critical)
1. **Step 0**: Foundation Setup (Common types, base service, enhanced axios)

### Phase 1: Core Functionality (High Priority)
2. **Step 1**: Authentication Service Enhancement
3. **Step 2**: Attempt Service Creation
4. **Step 8.1**: Enhance Quiz CRUD Operations
5. **Step 8.2**: Enhance Quiz Relationships

### Phase 2: Advanced Features (Medium Priority)
6. **Step 3**: Document Service Creation
7. **Step 4**: AI Service Creation
8. **Step 5**: Result Service Creation
9. **Step 8.3-8.5**: Enhance Other Services
10. **Step 9**: Testing & Documentation Setup

### Phase 3: Administrative Features (Low Priority)
11. **Step 6**: Admin Service Creation
12. **Step 7**: User Service Creation

## Testing Strategy

Each step will include:
- Type safety validation
- Error handling verification
- Integration with existing auth system
- Pagination testing
- File upload testing (where applicable)

## Success Criteria

### Functional Requirements
- All API endpoints from documentation are covered
- Type safety maintained throughout
- Consistent error handling
- Seamless integration with existing auth system
- Proper pagination support
- File upload capabilities working
- Real-time features functional

### Non-Functional Requirements
- **P95 latency** for file uploads < 4s for documents ≤ 10MB
- **Concurrent attempts**: 50 simultaneous users must not exceed X network errors in soak test
- **Typed coverage**: `tsc --noEmit` passes with `strict` enabled and zero `any`s in `src/api`
- **Test coverage**: >90% lines, >80% branches for service layer
- **Bundle size**: No significant increase in bundle size from new services

## Notes

- Each step is self-contained with its own DTOs
- DTOs are added incrementally to avoid overwhelming changes
- Services build upon each other progressively
- Existing functionality is preserved and enhanced
- Type safety is maintained throughout the process

## Type Organization Best Practices

### Benefits of Split Type Files:
1. **Maintainability**: Each domain has its own type file
2. **Readability**: Smaller, focused files are easier to navigate
3. **Team Collaboration**: Multiple developers can work on different type files
4. **Tree Shaking**: Better bundling optimization
5. **Clear Dependencies**: Explicit imports show relationships

### Import Strategy:
```typescript
// In services
import { RegisterRequest, LoginRequest } from '../types/auth.types';

// In components
import { QuizDto, CreateQuizRequest } from '../types/quiz.types';

// Barrel export for convenience
import { QuizDto, UserDto, AttemptDto } from '../types';
```

### Common Types:
- `common.types.ts` contains shared types like pagination, error responses
- `index.ts` re-exports all types for convenient imports
- Domain-specific types stay in their respective files

## Data Fetching Strategy

### Recommended Approach:
- **TanStack Query** for caching, retries, and optimistic updates
- **Custom hooks** in `src/hooks/` for each service
- **MSW** for testing and development
- **Streaming support** for AI chat and real-time features

### Alternative Approaches:
- **Redux Toolkit Query** if already using Redux
- **SWR** for simpler caching needs
- **Raw hooks** for minimal overhead

## Future Considerations

### Optional Power-ups:
1. **Code generation** from OpenAPI spec
2. **Zod-powered parsing** for runtime validation
3. **GraphQL edge proxy** for complex queries
4. **WebSocket support** for real-time features
5. **Service Worker** for offline capabilities 