import { createContext, useContext, useLayoutEffect, useState } from 'react';
import type { BlockerFunction } from 'react-router-dom';
import { getSessionGeneration } from '@/features/auth/services/sessionLifecycle';

export type NavigationAttempt = Parameters<BlockerFunction>[0];
export interface Guard {
  dirty: boolean;
  revision?: unknown;
  generation: number;
  losesInput: (navigation: NavigationAttempt) => boolean;
  losesInputOnStepChange: boolean;
}
interface UnsavedChangesContextValue {
  register: (id: symbol, guard: Guard) => () => void;
  clear: (id: symbol, expectedRevision?: unknown) => void;
  confirmDiscard: (action: () => void, ids?: symbol[]) => void;
}
export const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);
const leavesPage = ({ currentLocation, nextLocation }: NavigationAttempt) =>
  currentLocation.pathname !== nextLocation.pathname;

export const useUnsavedChangesController = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) throw new Error('Authoring forms require UnsavedChangesProvider.');
  return context;
};

interface UnsavedChangesOptions {
  losesInput?: Guard['losesInput'];
  losesInputOnStepChange?: boolean;
  revision?: unknown;
}

export const useUnsavedChanges = (
  dirty: boolean,
  { losesInput = leavesPage, losesInputOnStepChange = false, revision }: UnsavedChangesOptions = {},
) => {
  const context = useUnsavedChangesController();
  const [id] = useState(() => Symbol('unsaved-form'));
  const [generation] = useState(getSessionGeneration);
  useLayoutEffect(() => context.register(id, { dirty, revision, generation, losesInput, losesInputOnStepChange }),
    [context, id, dirty, generation, losesInput, losesInputOnStepChange, revision]);
  return {
    markClean: () => context.clear(id, revision),
    confirmDiscard: (action: () => void) => context.confirmDiscard(action, [id]),
  };
};
