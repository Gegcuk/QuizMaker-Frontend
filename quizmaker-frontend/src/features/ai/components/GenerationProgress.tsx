import { QuizGenerationStatus } from '@/features/quiz/components/QuizGenerationStatus';

interface GenerationProgressProps {
  jobId: string;
  onGenerationComplete?: (quizId: string) => void;
  onGenerationError?: (error: string) => void;
  onGenerationCancelled?: () => void;
  className?: string;
}

export default function GenerationProgress({ jobId, onGenerationComplete, onGenerationError, onGenerationCancelled, className = '' }: GenerationProgressProps) {
  return <QuizGenerationStatus layout="panel" className={className} jobId={jobId} onComplete={onGenerationComplete} onError={onGenerationError} onCancel={onGenerationCancelled} />;
}
