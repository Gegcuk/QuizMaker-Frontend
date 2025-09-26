// Quiz feature exports
// This allows importing quiz functionality from a single location

// Services
export { QuizService } from './services/quiz.service';
export { 
  getAllQuizzes, 
  getMyQuizzes, 
  getQuizById, 
  createQuiz, 
  updateQuiz, 
  updateQuizStatus, 
  deleteQuiz, 
  getQuizResults 
} from './services/quiz.service';

// Types
export * from './types/quiz.types';

// Hooks
export { useQuizMetadata } from './hooks/useQuizMetadata';
export { useQuizFiltering } from './hooks/useQuizFiltering';

// Components
export * from './components';

// Re-export QuizGenerationStatus component with explicit name to avoid conflict
export { QuizGenerationStatus as QuizGenerationStatusComponent } from './components/QuizGenerationStatus';