// Re-exports all types for convenient imports
// This allows importing multiple types from a single location

// Common types
export * from './common.types';

// Domain-specific types (to be created in future steps)
export * from './auth.types';
export * from './quiz.types';
export * from './attempt.types';
export * from './question.types';
export * from './document.types';
export * from './category.types';
export * from './tag.types';
export * from '../features/admin/types/admin.types';
// export * from './user.types';
// export * from './result.types';
// export * from './category.types';
// export * from './tag.types';

// Note: api.d.ts contains legacy types that conflict with new comprehensive types
// Use the new domain-specific type files instead 