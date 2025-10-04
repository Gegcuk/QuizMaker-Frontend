import { CreateQuizRequest } from '@/types';

export type QuizWizardDraft = Partial<CreateQuizRequest> & {
  generationRequest?: unknown;
  generationConfig?: unknown;
};
