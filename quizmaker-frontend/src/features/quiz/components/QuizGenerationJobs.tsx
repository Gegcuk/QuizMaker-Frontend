import { QuizGenerationStatus } from './QuizGenerationStatus';

// Legacy callers keep their routes and props. The live collection has no source
// quiz filter, so they show the same account-owned observation as My Quizzes.
export default function QuizGenerationJobs({ className = '' }: { quizId?: string; className?: string }) {
  return <QuizGenerationStatus layout="panel" title="AI quiz generation" className={className} />;
}
