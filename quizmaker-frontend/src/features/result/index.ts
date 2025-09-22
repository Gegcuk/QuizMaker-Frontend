// Result feature exports
// This allows importing result functionality from a single location

// Services
export { ResultService } from './services/result.service';
export { 
  getQuizResults, 
  getAttemptResults, 
  getQuizLeaderboard, 
  getUserQuizAttempts, 
  getAttemptAnalysis 
} from './services/result.service';

// Types
export * from './types';

// Components
export * from './components';
