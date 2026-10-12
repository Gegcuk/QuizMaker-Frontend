import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/AuthContext';
import { GenerationOperationBoundary } from '@/features/quiz/components/GenerationOperationBoundary';
import { GenerationObserverProvider } from '@/features/quiz/providers/GenerationObserverProvider';
import { QueryProvider } from './QueryProvider';

// Authentication survives principal transitions; account-owned queries and drafts
// still remount inside QueryProvider's generation boundary.
export function SessionProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><GenerationOperationBoundary><QueryProvider><GenerationObserverProvider>{children}</GenerationObserverProvider></QueryProvider></GenerationOperationBoundary></AuthProvider>;
}
