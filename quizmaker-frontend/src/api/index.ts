// API Services exports
// Centralized export point for all API services

// Auth service (class-based)
export { AuthService } from './auth.service';

// Quiz service (class-based)
export { QuizService } from './quiz.service';

// Attempt service (class-based)
export { AttemptService } from './attempt.service';

// Question service (class-based)
export { QuestionService } from './question.service';

// Document service (class-based)
export { DocumentService } from './document.service';

// Document Process service (class-based)
export { DocumentProcessService } from './documentProcess.service';

// Category service (class-based)
export { CategoryService } from './category.service';

// Tag service (class-based)
export { TagService } from './tag.service';

// Admin service (class-based)
export { AdminService } from './admin.service';

export { BillingService } from './billing.service';

// Base service and utilities
export { BaseService } from './base.service';
export { default as axiosInstance } from './axiosInstance';

// Endpoints
export * from './endpoints'; 