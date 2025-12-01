// ---------------------------------------------------------------------------
// Token Estimation Service
// Estimates token usage for quiz generation based on backend logic
// See docs/api/token-estimation-logic.md for detailed documentation
// ---------------------------------------------------------------------------

import { QuestionType, Difficulty, QuizScope } from '@/types';
import { DocumentChunkDto } from '@/features/document/types/document.types';

/**
 * Token estimation result
 */
export interface TokenEstimationResult {
  /** Estimated LLM tokens (input + output, with safety factor applied) */
  estimatedLlmTokens: number;
  /** Estimated billing tokens (LLM tokens / ratio) */
  estimatedBillingTokens: number;
  /** Breakdown of input tokens */
  inputTokens: number;
  /** Breakdown of completion tokens */
  completionTokens: number;
}

/**
 * Token estimation configuration
 */
export interface TokenEstimationConfig {
  /** Characters per token ratio (default: 4.0) */
  charsPerToken?: number;
  /** Token to LLM ratio for billing (default: 1000) */
  tokenToLlmRatio?: number;
  /** Safety factor to apply to estimates (default: 1.2) */
  safetyFactor?: number;
  /** Approximate system prompt tokens (default: 300) */
  systemPromptTokens?: number;
  /** Approximate context template tokens (default: 150) */
  contextTemplateTokens?: number;
  /** Approximate question template tokens per type */
  questionTemplateTokens?: Record<QuestionType, number>;
}

/**
 * Question type distribution for estimation
 */
export type QuestionsPerType = Partial<Record<QuestionType, number>>;

// Constants
const CHARS_PER_TOKEN = 4.0;

const COMPLETION_TOKENS_PER_QUESTION: Record<QuestionType, number> = {
  MCQ_SINGLE: 120,
  MCQ_MULTI: 140,
  TRUE_FALSE: 60,
  OPEN: 180,
  FILL_GAP: 120,
  ORDERING: 140,
  COMPLIANCE: 160,
  MATCHING: 160,
  // HOTSPOT removed from frontend - keeping for type compatibility but won't be used
  HOTSPOT: 160,
};

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  EASY: 0.9,
  MEDIUM: 1.0,
  HARD: 1.15,
};

// Additional coefficient to account for estimation inaccuracies
const ESTIMATION_COEFFICIENT = 1.3;

// Default configuration
const DEFAULT_CONFIG: Required<TokenEstimationConfig> = {
  charsPerToken: CHARS_PER_TOKEN,
  tokenToLlmRatio: 1000,
  safetyFactor: 1.2,
  systemPromptTokens: 300,
  contextTemplateTokens: 150,
  questionTemplateTokens: {
    MCQ_SINGLE: 80,
    MCQ_MULTI: 90,
    TRUE_FALSE: 60,
    OPEN: 100,
    FILL_GAP: 85,
    ORDERING: 95,
    COMPLIANCE: 100,
    MATCHING: 100,
    HOTSPOT: 100,
  },
};

/**
 * Estimates token count from character count
 */
function estimateTokensFromCharCount(
  charCount: number,
  charsPerToken: number = CHARS_PER_TOKEN
): number {
  if (!charCount || charCount <= 0) {
    return 0;
  }
  return Math.ceil(charCount / charsPerToken);
}

/**
 * Estimates token count from text
 */
function estimateTokens(
  text: string | null | undefined,
  charsPerToken: number = CHARS_PER_TOKEN
): number {
  if (!text || text.trim().length === 0) {
    return 0;
  }
  return estimateTokensFromCharCount(text.length, charsPerToken);
}

/**
 * Calculates completion tokens based on question counts, types, and difficulty
 */
function calculateCompletionTokens(
  questionsPerType: QuestionsPerType,
  difficulty: Difficulty,
  config: Required<TokenEstimationConfig>
): number {
  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] || 1.0;
  let totalCompletionTokens = 0;

  for (const [questionType, count] of Object.entries(questionsPerType)) {
    if (!count || count <= 0) continue;

    const type = questionType as QuestionType;
    const baseTokens = COMPLETION_TOKENS_PER_QUESTION[type] || 120;
    const completionTokens = Math.ceil(count * baseTokens * multiplier);
    totalCompletionTokens += completionTokens;
  }

  return totalCompletionTokens;
}

/**
 * Converts LLM tokens to billing tokens
 */
function llmTokensToBillingTokens(
  llmTokens: number,
  tokenToLlmRatio: number
): number {
  const ratio = Math.max(1, tokenToLlmRatio);
  return Math.ceil(llmTokens / ratio);
}

/**
 * Estimates token usage for quiz generation from text
 * Simplified formula: 0.35 tokens per 1,000 characters (rounded up) * number of question types
 * 
 * @param text - The text content to generate quiz from
 * @param questionsPerType - Distribution of questions per type
 * @param difficulty - Question difficulty level (not used in simplified calculation)
 * @param config - Optional configuration overrides (not used in simplified calculation)
 * @returns Token estimation result
 */
export function estimateQuizGenerationFromText(
  text: string,
  questionsPerType: QuestionsPerType,
  difficulty: Difficulty,
  config: TokenEstimationConfig = {}
): TokenEstimationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // If no content, return minimal estimate (0 + 3 = 3 tokens)
  if (!text || text.trim().length === 0) {
    const minBillingTokens = 3;
    return {
      estimatedLlmTokens: minBillingTokens * fullConfig.tokenToLlmRatio,
      estimatedBillingTokens: minBillingTokens,
      inputTokens: 0,
      completionTokens: 0,
    };
  }

  // Count number of question types with count > 0
  const numberOfQuestionTypes = Object.values(questionsPerType).filter(count => count && count > 0).length;

  // If no question types selected, return minimal estimate (0 + 3 = 3 tokens)
  if (numberOfQuestionTypes === 0) {
    const minBillingTokens = 3;
    return {
      estimatedLlmTokens: minBillingTokens * fullConfig.tokenToLlmRatio,
      estimatedBillingTokens: minBillingTokens,
      inputTokens: 0,
      completionTokens: 0,
    };
  }

  // Simplified calculation: 0.35 tokens per 1,000 characters, rounded up, multiplied by number of question types
  const charCount = text.trim().length;
  const tokensPerThousand = 0.35;
  const calculatedTokens = Math.ceil((charCount / 1000) * tokensPerThousand) * numberOfQuestionTypes;
  const billingTokens = calculatedTokens + 3;

  // Convert to LLM tokens
  const estimatedLlmTokens = billingTokens * fullConfig.tokenToLlmRatio;

  return {
    estimatedLlmTokens,
    estimatedBillingTokens: billingTokens,
    inputTokens: 0,
    completionTokens: 0,
  };
}

/**
 * Estimates token usage for quiz generation from document chunks
 * Simplified formula: 0.35 tokens per 1,000 characters (rounded up) * number of question types
 * 
 * @param chunks - Document chunks to generate quiz from
 * @param questionsPerType - Distribution of questions per type
 * @param difficulty - Question difficulty level (not used in simplified calculation)
 * @param config - Optional configuration overrides
 * @returns Token estimation result
 */
export function estimateQuizGenerationFromChunks(
  chunks: DocumentChunkDto[],
  questionsPerType: QuestionsPerType,
  difficulty: Difficulty,
  config: TokenEstimationConfig = {}
): TokenEstimationResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // If no chunks, return minimal estimate (0 + 3 = 3 tokens)
  if (!chunks || chunks.length === 0) {
    const minBillingTokens = 3;
    return {
      estimatedLlmTokens: minBillingTokens * fullConfig.tokenToLlmRatio,
      estimatedBillingTokens: minBillingTokens,
      inputTokens: 0,
      completionTokens: 0,
    };
  }

  // Count number of question types with count > 0
  const numberOfQuestionTypes = Object.values(questionsPerType).filter(count => count && count > 0).length;

  // If no question types selected, return minimal estimate (0 + 3 = 3 tokens)
  if (numberOfQuestionTypes === 0) {
    const minBillingTokens = 3;
    return {
      estimatedLlmTokens: minBillingTokens * fullConfig.tokenToLlmRatio,
      estimatedBillingTokens: minBillingTokens,
      inputTokens: 0,
      completionTokens: 0,
    };
  }

  // Calculate total character count from all chunks
  const totalCharCount = chunks.reduce((sum, chunk) => {
    return sum + (chunk.content?.length || chunk.characterCount || 0);
  }, 0);

  // Simplified calculation: 0.35 tokens per 1,000 characters, rounded up, multiplied by number of question types
  const tokensPerThousand = 0.35;
  const calculatedTokens = Math.ceil((totalCharCount / 1000) * tokensPerThousand) * numberOfQuestionTypes;
  const billingTokens = calculatedTokens + 3;

  // Convert to LLM tokens
  const estimatedLlmTokens = billingTokens * fullConfig.tokenToLlmRatio;

  return {
    estimatedLlmTokens,
    estimatedBillingTokens: billingTokens,
    inputTokens: 0,
    completionTokens: 0,
  };
}

/**
 * Estimates token usage for quiz generation from document
 * Handles different quiz scopes (ENTIRE_DOCUMENT, SPECIFIC_CHAPTER, etc.)
 * 
 * @param documentContent - Full document content (for ENTIRE_DOCUMENT scope)
 * @param chunks - Document chunks (for chunk-based scopes)
 * @param quizScope - The scope of quiz generation
 * @param questionsPerType - Distribution of questions per type
 * @param difficulty - Question difficulty level
 * @param config - Optional configuration overrides
 * @returns Token estimation result
 */
export function estimateQuizGenerationFromDocument(
  documentContent: string | null | undefined,
  chunks: DocumentChunkDto[] | null | undefined,
  quizScope: QuizScope,
  questionsPerType: QuestionsPerType,
  difficulty: Difficulty,
  config: TokenEstimationConfig = {}
): TokenEstimationResult {
  // For chunk-based scopes, use chunk-based estimation
  if (
    chunks &&
    chunks.length > 0 &&
    (quizScope === 'SPECIFIC_CHUNKS' ||
      quizScope === 'SPECIFIC_CHAPTER' ||
      quizScope === 'SPECIFIC_SECTION')
  ) {
    return estimateQuizGenerationFromChunks(
      chunks,
      questionsPerType,
      difficulty,
      config
    );
  }

  // For ENTIRE_DOCUMENT scope, use content-based estimation
  // If chunks are available but content is not, calculate content size from chunks
  let content: string;
  if (documentContent) {
    content = documentContent;
  } else if (chunks && chunks.length > 0) {
    // Sum up character counts from chunks
    const totalCharCount = chunks.reduce((sum, chunk) => {
      return sum + (chunk.content?.length || chunk.characterCount || 0);
    }, 0);
    // Use a placeholder content for estimation purposes
    // This is a fallback - ideally we'd have the actual content
    content = ' '.repeat(totalCharCount);
  } else {
    // No content available - return minimal estimate (0 + 3 = 3 tokens)
    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const minBillingTokens = 3;
    return {
      estimatedLlmTokens: minBillingTokens * fullConfig.tokenToLlmRatio,
      estimatedBillingTokens: minBillingTokens,
      inputTokens: 0,
      completionTokens: 0,
    };
  }

  return estimateQuizGenerationFromText(
    content,
    questionsPerType,
    difficulty,
    config
  );
}

/**
 * Token Estimation Service
 * Main service class that provides token estimation functionality
 */
export class TokenEstimationService {
  private config: Required<TokenEstimationConfig>;

  constructor(config: TokenEstimationConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Updates the service configuration
   */
  updateConfig(config: Partial<TokenEstimationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): Required<TokenEstimationConfig> {
    return { ...this.config };
  }

  /**
   * Estimates tokens for text-based quiz generation
   */
  estimateFromText(
    text: string,
    questionsPerType: QuestionsPerType,
    difficulty: Difficulty
  ): TokenEstimationResult {
    return estimateQuizGenerationFromText(
      text,
      questionsPerType,
      difficulty,
      this.config
    );
  }

  /**
   * Estimates tokens for chunk-based quiz generation
   */
  estimateFromChunks(
    chunks: DocumentChunkDto[],
    questionsPerType: QuestionsPerType,
    difficulty: Difficulty
  ): TokenEstimationResult {
    return estimateQuizGenerationFromChunks(
      chunks,
      questionsPerType,
      difficulty,
      this.config
    );
  }

  /**
   * Estimates tokens for document-based quiz generation
   */
  estimateFromDocument(
    documentContent: string | null | undefined,
    chunks: DocumentChunkDto[] | null | undefined,
    quizScope: QuizScope,
    questionsPerType: QuestionsPerType,
    difficulty: Difficulty
  ): TokenEstimationResult {
    return estimateQuizGenerationFromDocument(
      documentContent,
      chunks,
      quizScope,
      questionsPerType,
      difficulty,
      this.config
    );
  }
}

// Export default singleton instance
export const tokenEstimationService = new TokenEstimationService();

