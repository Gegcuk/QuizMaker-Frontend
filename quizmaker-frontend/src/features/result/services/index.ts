// Result feature services exports
// This allows importing result services from a single location

export { ResultService } from './result.service';
export { 
  getQuizResults, 
  getAttemptResults, 
  getQuizLeaderboard, 
  getUserQuizAttempts, 
  getAttemptAnalysis 
} from './result.service';
