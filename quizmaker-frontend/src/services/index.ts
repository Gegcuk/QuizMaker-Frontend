// Centralized services exports
// This allows importing services from a single location

// Auth services
export { AuthService } from '../features/auth/services/auth.service';

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

// API services
export { default as api } from '../api/axiosInstance';
export { BaseService } from '../api/base.service';
export { QuizService, getAllQuizzes, getMyQuizzes, getQuizById, createQuiz, updateQuiz, updateQuizStatus, deleteQuiz, getQuizResults } from '../api/quiz.service';
export { TagService, getAllTags } from '../api/tag.service';
export { UserService, userService } from '../api/user.service';
