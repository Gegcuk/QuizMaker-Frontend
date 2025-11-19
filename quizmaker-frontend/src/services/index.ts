// Centralized services exports
// This allows importing services from a single location

// Auth services
export { AuthService, authService } from '../features/auth/services/auth.service';

// Admin services
export { AdminService } from '../features/admin/services/admin.service';

// Billing services
export { billingService } from '../features/billing/services/billing.service';
export { BillingService } from '../features/billing/services/billing.service';

// Category services
export { categoryService, getAllCategories, createCategory, updateCategory, deleteCategory } from '../features/category/services/category.service';
export { CategoryService } from '../features/category/services/category.service';

// Document services
export { DocumentService } from '../features/document/services/document.service';
export { DocumentProcessService } from '../features/document/services/documentProcess.service';

// Question services
export { QuestionService } from '../features/question/services/question.service';

// Attempt services
export { AttemptService } from '../features/attempt/services/attempt.service';

// Result services
export { ResultService, getQuizResults, getQuizLeaderboard } from '../features/result/services/result.service';

// API services
export { default as api } from '../api/axiosInstance';
export { BaseService } from '../api/base.service';
export { QuizService, getAllQuizzes, getMyQuizzes, getQuizById, createQuiz, updateQuiz, updateQuizStatus, deleteQuiz } from '../features/quiz/services/quiz.service';
export { TagService, getAllTags } from '../features/tag/services/tag.service';
export { UserService, userService } from '../features/user/services/user.service';

// Token estimation service
export {
  TokenEstimationService,
  tokenEstimationService,
  estimateQuizGenerationFromText,
  estimateQuizGenerationFromChunks,
  estimateQuizGenerationFromDocument,
} from './tokenEstimation.service';
export type {
  TokenEstimationResult,
  TokenEstimationConfig,
  QuestionsPerType,
} from './tokenEstimation.service';
