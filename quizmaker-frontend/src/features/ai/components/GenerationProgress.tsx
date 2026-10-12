import { QuizGenerationStatus } from '@/features/quiz/components/QuizGenerationStatus';

interface GenerationProgressProps {
  jobId: string;
  onGenerationComplete?: (quizId: string) => void;
  onGenerationError?: (error: string) => void;
  onGenerationCancelled?: () => void;
  className?: string;
}

export default function GenerationProgress({ jobId, onGenerationComplete, onGenerationError, onGenerationCancelled, className = '' }: GenerationProgressProps) {
  return <div className={className}><QuizGenerationStatus jobId={jobId} onComplete={onGenerationComplete} onError={onGenerationError} onCancel={onGenerationCancelled} /></div>;
}
