import { GenerationJobBlock } from './GenerationJobBlock';

// Legacy callers keep their routes and props. The live collection has no source
// quiz filter, so they show the same account-owned observation as My Quizzes.
export default function QuizGenerationJobs({ className = '' }: { quizId?: string; className?: string }) {
  return <GenerationJobBlock className={className} showEmpty />;
}
