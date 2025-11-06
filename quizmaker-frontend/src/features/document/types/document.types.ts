// Document and AI-related type definitions
// Used for document upload, processing, and chunking as documented in the API specification

/**
 * Document status enum
 */
export type DocumentStatus = 
  | 'UPLOADED'     // Document has been uploaded but not processed
  | 'PROCESSING'   // Document is currently being processed
  | 'PROCESSED'    // Document has been successfully processed
  | 'FAILED';      // Document processing failed

/**
 * Document Process status enum
 * Matches API documentation enum
 */
export type DocumentProcessStatus = 
  | 'PENDING'      // Document pending processing
  | 'NORMALIZED'   // Document has been normalized
  | 'STRUCTURED'   // Document has been processed and structured
  | 'FAILED';      // Processing failed

/**
 * Node type enum for document structure
 */
export type NodeType = 
  | 'CHAPTER';     // Individual chapter with clear title

/**
 * Structure format enum
 */
export type StructureFormat = 
  | 'tree'         // Hierarchical structure format (default)
  | 'flat';        // Linear structure format

/**
 * Chunk type enum
 */
export type ChunkType = 
  | 'CHAPTER'      // Chunk represents a chapter
  | 'SECTION'      // Chunk represents a section
  | 'PAGE_BASED'   // Chunk based on page boundaries
  | 'SIZE_BASED';  // Chunk based on size limits

/**
 * Chunking strategy enum
 */
export type ChunkingStrategy = 
  | 'AUTO'           // Automatically determine best strategy
  | 'CHAPTER_BASED'  // Split by chapters only
  | 'SECTION_BASED'  // Split by sections only
  | 'SIZE_BASED'     // Split by size only
  | 'PAGE_BASED';    // Split by page count

/**
 * Document DTO
 * Matches DocumentDto from API documentation
 */
export interface DocumentDto {
  id: string;                 // UUID
  originalFilename: string;
  contentType: string;        // e.g., application/pdf
  fileSize: number | null;    // bytes (Long in Java)
  status: DocumentStatus;
  uploadedAt: string;         // ISO date-time (LocalDateTime in Java)
  processedAt: string | null; // ISO date-time (LocalDateTime in Java)
  title?: string | null;
  author?: string | null;
  totalPages?: number | null; // Integer in Java
  totalChunks?: number | null; // Integer in Java
  processingError?: string | null;
  chunks?: DocumentChunkDto[]; // may include full content; prefer chunk endpoints if large
}

/**
 * Document Process DTO
 * Matches actual API response structure
 */
export interface DocumentProcessDto {
  id: string;                            // UUID of the document
  name?: string;                         // Document name (optional)
  charCount?: number;                    // Character count (optional)
  status: DocumentProcessStatus;         // Document status
}

/**
 * Document Process View DTO
 * Matches actual API response structure
 */
export interface DocumentProcessViewDto {
  id: string;                            // UUID of the document
  name?: string;                         // Document name (optional)
  charCount?: number;                    // Character count (optional)
  status: DocumentProcessStatus;         // Document status
}

/**
 * Ingest Request DTO
 * Matches IngestRequest from API documentation
 */
export interface IngestRequestDto {
  text: string;                          // Document content as text (required)
  language: string;                      // Language code (ISO 639-1, e.g., 'en')
}

/**
 * Ingest Response DTO
 * Matches IngestResponse from API documentation
 */
export interface IngestResponseDto {
  id: string;                            // UUID of the ingested document
  status: DocumentProcessStatus;         // Document processing status
}

/**
 * Text Slice Response DTO
 * Matches TextSliceResponse from API documentation
 */
export interface TextSliceResponseDto {
  documentId: string;                    // UUID of the document
  start: number;                         // Starting character position
  end: number;                           // Ending character position
  text: string;                          // Extracted text content
}

/**
 * Document Structure Node DTO
 */
export interface DocumentStructureNodeDto {
  id: string;                            // UUID of the node
  title: string;                         // Node title
  type: NodeType;                        // Node type
  depth: number;                         // Depth in hierarchy
  startOffset: number;                   // Starting character offset
  endOffset: number;                     // Ending character offset
  startAnchor?: string;                  // Start anchor text (tree format only)
  endAnchor?: string;                    // End anchor text (tree format only)
  aiConfidence: number;                  // AI confidence score (0.0-1.0)
}

/**
 * Structure Tree Response DTO
 * Matches StructureTreeResponse from API documentation
 */
export interface StructureTreeResponseDto {
  documentId: string;                    // UUID of the document
  structure: DocumentStructureNodeDto[]; // Hierarchical structure
}

/**
 * Structure Flat Response DTO
 * Matches StructureFlatResponse from API documentation
 */
export interface StructureFlatResponseDto {
  documentId: string;                    // UUID of the document
  nodes: DocumentStructureNodeDto[];     // Linear structure
}

/**
 * Structure Build Response DTO
 * Matches StructureBuildResponse from API documentation
 */
export interface StructureBuildResponseDto {
  status: string;                        // Status (STRUCTURED, FAILED, ERROR)
  message: string;                       // Status message
}

/**
 * Extract Response DTO
 * Matches ExtractResponse from API documentation
 */
export interface ExtractResponseDto {
  documentId: string;                    // UUID of the document
  nodeId: string;                        // UUID of the node
  title: string;                         // Node title
  start: number;                         // Start offset in document text (inclusive)
  end: number;                           // End offset in document text (exclusive)
  text: string;                          // Extracted text content for this node
}

/**
 * Document chunk DTO
 * Matches DocumentChunkDto from API documentation
 */
export interface DocumentChunkDto {
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
  chunkType: ChunkType;
}

/**
 * Process document request
 * Matches ProcessDocumentRequest from API documentation
 */
export interface ProcessDocumentRequest {
  chunkingStrategy: ChunkingStrategy;    // required for reprocess; optional when uploading if you want defaults
  maxChunkSize?: number;                 // 100..100000 characters
  minChunkSize?: number;                 // default 1000
  aggressiveCombinationThreshold?: number; // default 3000
  storeChunks?: boolean;                 // default true
}

/**
 * Document configuration DTO
 * Matches DocumentConfigDto from API documentation
 */
export interface DocumentConfigDto {
  defaultMaxChunkSize: number;           // Integer in Java
  defaultStrategy: string;               // one of the chunking strategies
}

/**
 * Page DTO for paginated responses
 */
export interface Page<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}
