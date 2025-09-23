// src/utils/questionUtils.ts
// ---------------------------------------------------------------------------
// Shared utilities for question-related functionality
// ---------------------------------------------------------------------------

export const getQuestionTypeIcon = (type: string): string => {
  switch (type) {
    case 'MCQ_SINGLE':
      return '🔘';
    case 'MCQ_MULTI':
      return '☑️';
    case 'TRUE_FALSE':
      return '✅';
    case 'OPEN':
      return '📝';
    case 'FILL_GAP':
      return '🔤';
    case 'COMPLIANCE':
      return '📋';
    case 'ORDERING':
      return '📊';
    case 'HOTSPOT':
      return '🎯';
    case 'MATCHING':
      return '🔗';
    default:
      return '❓';
  }
};

export const getQuestionTypeLabel = (type: string): string => {
  switch (type) {
    case 'MCQ_SINGLE':
      return 'Single Choice';
    case 'MCQ_MULTI':
      return 'Multiple Choice';
    case 'TRUE_FALSE':
      return 'True/False';
    case 'OPEN':
      return 'Open Ended';
    case 'FILL_GAP':
      return 'Fill in the Gap';
    case 'COMPLIANCE':
      return 'Compliance';
    case 'ORDERING':
      return 'Ordering';
    case 'HOTSPOT':
      return 'Hotspot';
    case 'MATCHING':
      return 'Matching';
    default:
      return 'Unknown';
  }
};
