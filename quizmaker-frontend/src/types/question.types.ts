// Question-related type definitions
// Used for question creation, management, and retrieval for quizzes as documented in the API specification

import { BaseEntity, AuditableEntity } from './common.types';

/**
 * Question types
 */
export type QuestionType = 
  | 'MCQ_SINGLE'    // Multiple choice single answer
  | 'MCQ_MULTI'     // Multiple choice multiple answers
  | 'OPEN'          // Open-ended questions
  | 'FILL_GAP'      // Fill in the blank
  | 'COMPLIANCE'    // Compliance questions
  | 'TRUE_FALSE'    // True/False questions
  | 'ORDERING'      // Ordering questions
  | 'HOTSPOT';      // Hotspot questions

/**
 * Question difficulty levels
 */
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Create question request
 * Matches CreateQuestionRequest DTO from API documentation
 */
export interface CreateQuestionRequest {
  type: QuestionType;                    // Required, valid question type
  difficulty: QuestionDifficulty;        // Required, valid difficulty level
  questionText: string;                  // 3-1000 characters, required
  content: QuestionContent;              // Question type-specific content, required
  hint?: string;                         // Max 500 characters, optional
  explanation?: string;                  // Max 2000 characters, optional
  attachmentUrl?: string;                // Max 2048 characters, optional
  quizIds?: string[];                    // Optional array
  tagIds?: string[];                     // Optional array
}

/**
 * Update question request
 * Matches UpdateQuestionRequest DTO from API documentation
 */
export interface UpdateQuestionRequest {
  type?: QuestionType;                   // Optional
  difficulty?: QuestionDifficulty;       // Optional
  questionText?: string;                 // 3-1000 characters, optional
  content?: QuestionContent;             // Question type-specific content, optional
  hint?: string;                         // Max 500 characters, optional
  explanation?: string;                  // Max 2000 characters, optional
  attachmentUrl?: string;                // Max 2048 characters, optional
  quizIds?: string[];                    // Optional array
  tagIds?: string[];                     // Optional array
}

/**
 * Question DTO
 * Matches QuestionDto from API documentation
 */
export interface QuestionDto extends BaseEntity, AuditableEntity {
  type: QuestionType;                    // Question type
  difficulty: QuestionDifficulty;        // Question difficulty
  questionText: string;                  // Question text
  content: QuestionContent;              // Question type-specific content
  hint?: string;                         // Optional hint
  explanation?: string;                  // Optional explanation
  attachmentUrl?: string;                // Optional attachment URL
  quizIds: string[];                     // Associated quiz IDs
  tagIds: string[];                      // Associated tag IDs
}

/**
 * Question content union type for all question types
 */
export type QuestionContent = 
  | McqSingleContent
  | McqMultiContent
  | TrueFalseContent
  | OpenContent
  | FillGapContent
  | ComplianceContent
  | OrderingContent
  | HotspotContent;

/**
 * MCQ Single content structure
 */
export interface McqSingleContent {
  options: McqOption[];
}

/**
 * MCQ Multi content structure
 */
export interface McqMultiContent {
  options: McqOption[];
}

/**
 * MCQ option structure
 */
export interface McqOption {
  id: string;                            // Option identifier (a, b, c, d)
  text: string;                          // Option text
  correct: boolean;                      // Whether this option is correct
}

/**
 * True/False content structure
 */
export interface TrueFalseContent {
  answer: boolean;                       // True or false answer
}

/**
 * Open-ended content structure
 */
export interface OpenContent {
  answer: string;                        // Model answer
}

/**
 * Fill in the gap content structure
 */
export interface FillGapContent {
  text: string;                          // Text with gaps marked with ___
  gaps: GapAnswer[];
}

/**
 * Gap answer structure
 */
export interface GapAnswer {
  id: number;                            // Gap identifier
  answer: string;                        // Correct answer for this gap
}

/**
 * Compliance content structure
 */
export interface ComplianceContent {
  statements: ComplianceStatement[];
}

/**
 * Compliance statement structure
 */
export interface ComplianceStatement {
  id: number;                            // Statement identifier
  text: string;                          // Statement text
  compliant: boolean;                    // Whether statement is compliant
}

/**
 * Ordering content structure
 */
export interface OrderingContent {
  items: OrderingItem[];
}

/**
 * Ordering item structure
 */
export interface OrderingItem {
  id: number;                            // Item identifier
  text: string;                          // Item text
}

/**
 * Hotspot content structure
 */
export interface HotspotContent {
  imageUrl: string;                      // Image URL
  regions: HotspotRegion[];
}

/**
 * Hotspot region structure
 */
export interface HotspotRegion {
  id: number;                            // Region identifier
  x: number;                             // X coordinate
  y: number;                             // Y coordinate
  width: number;                         // Width
  height: number;                        // Height
  correct: boolean;                      // Whether this region is correct
} 