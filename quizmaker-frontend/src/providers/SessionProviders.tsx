import type { ReactNode } from 'react';
import { AuthProvider } from '@/features/auth/AuthContext';
import { QueryProvider } from './QueryProvider';

// Authentication survives principal transitions; account-owned queries and drafts
// still remount inside QueryProvider's generation boundary.
export function SessionProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><QueryProvider>{children}</QueryProvider></AuthProvider>;
}
