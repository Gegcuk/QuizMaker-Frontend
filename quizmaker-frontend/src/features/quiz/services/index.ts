// Quiz feature services exports
// This allows importing quiz services from a single location

export { QuizService } from './quiz.service';
export { 
  getAllQuizzes, 
  getMyQuizzes, 
  getQuizById, 
  createQuiz, 
  updateQuiz, 
  updateQuizStatus, 
  deleteQuiz, 
  getQuizResults 
} from './quiz.service';
