// Document and AI-related type definitions
// Used for document upload, processing, and chunking as documented in the API specification

import { BaseEntity, AuditableEntity } from './common.types';

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
 */
export type DocumentProcessStatus = 
  | 'INGESTED'     // Document uploaded and ingested successfully
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
export interface DocumentDto extends BaseEntity, AuditableEntity {
  originalFilename: string;              // Original file name
  contentType: string;                   // MIME type (e.g., "application/pdf")
  fileSize: number;                      // File size in bytes
  status: DocumentStatus;                // Document processing status
  uploadedAt: string;                    // Upload timestamp
  processedAt?: string;                  // Processing completion timestamp
  title?: string;                        // Document title (extracted)
  author?: string;                       // Document author (extracted)
  totalPages?: number;                   // Total number of pages
  totalChunks?: number;                  // Total number of chunks
  processingError?: string;              // Error message if processing failed
  chunks?: DocumentChunkDto[];           // Array of document chunks
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
  text: string;                          // Document content as text
  language: string;                      // Language code (e.g., 'en')
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
  nodeTitle: string;                     // Node title
  nodeType: NodeType;                    // Node type
  startOffset: number;                   // Starting character offset
  endOffset: number;                     // Ending character offset
  content: string;                       // Extracted content
  contentLength: number;                 // Content length
}

/**
 * Document chunk DTO
 * Matches DocumentChunkDto from API documentation
 */
export interface DocumentChunkDto extends BaseEntity, AuditableEntity {
  chunkIndex: number;                    // Zero-based chunk index
  title: string;                         // Chunk title
  content: string;                       // Chunk content text
  startPage: number;                     // Starting page number
  endPage: number;                       // Ending page number
  wordCount: number;                     // Number of words in chunk
  characterCount: number;                // Number of characters in chunk
  chapterTitle?: string;                 // Chapter title (if applicable)
  sectionTitle?: string;                 // Section title (if applicable)
  chapterNumber?: number;                // Chapter number (if applicable)
  sectionNumber?: number;                // Section number (if applicable)
  chunkType: ChunkType;                  // Type of chunk
}

/**
 * Process document request
 * Matches ProcessDocumentRequest from API documentation
 */
export interface ProcessDocumentRequest {
  chunkingStrategy: ChunkingStrategy;    // Chunking strategy
  maxChunkSize: number;                  // Maximum chunk size in characters
  storeChunks: boolean;                  // Whether to store chunks in database
}

/**
 * Document configuration DTO
 * Matches DocumentConfigDto from API documentation
 */
export interface DocumentConfig {
  defaultMaxChunkSize: number;           // Default maximum chunk size in characters
  defaultStrategy: string;               // Default chunking strategy
} 