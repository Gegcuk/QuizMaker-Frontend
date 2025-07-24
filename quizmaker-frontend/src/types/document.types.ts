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