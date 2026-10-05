import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { UnsavedChangesContext, type Guard } from './useUnsavedChanges';
import { getSessionGeneration, subscribeToSessionTransitions } from '@/features/auth/services/sessionLifecycle';

interface PendingLeave {
  action: () => void;
  guards: symbol[];
}

export const UnsavedChangesProvider = ({ children }: { children: React.ReactNode }) => {
  const guards = useRef(new Map<symbol, Guard>());
  const [pending, setPending] = useState<PendingLeave | null>(null);
  const [sessionGeneration, setSessionGeneration] = useState(getSessionGeneration);
  const activeGuards = useCallback(() => [...guards.current.entries()].filter(
    ([, guard]) => guard.dirty && guard.generation === getSessionGeneration(),
  ), []);
  const shouldBlock = useCallback<BlockerFunction>((navigation) =>
    activeGuards().some(([, guard]) => guard.losesInput(navigation)), [activeGuards]);
  // One router blocker coordinates every mounted authoring form.
  const blocker = useBlocker(shouldBlock);

  useEffect(() => subscribeToSessionTransitions((transition) => {
    guards.current.clear();
    setPending(null);
    setSessionGeneration(transition.generation);
  }), []);
  useEffect(() => {
    // Leaving an expired principal must never be held up by its form guard.
    if (blocker.state === 'blocked' && !activeGuards().length) {
      blocker.reset();
    }
  }, [blocker, sessionGeneration, activeGuards]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!activeGuards().length) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [activeGuards]);

  const register = useCallback((id: symbol, guard: Guard) => {
    guards.current.set(id, guard);
    return () => { guards.current.delete(id); };
  }, []);
  const clear = useCallback((id: symbol, expectedRevision?: unknown) => {
    const guard = guards.current.get(id);
    if (guard && (expectedRevision === undefined || guard.revision === expectedRevision)) guard.dirty = false;
  }, []);
  const confirmDiscard = useCallback((action: () => void, ids?: symbol[]) => {
    const affected = activeGuards().filter(([id, guard]) =>
      ids ? ids.includes(id) : guard.losesInputOnStepChange);
    if (!affected.length) {
      action();
      return;
    }
    // The first pending action owns the confirmation; repeated clicks cannot replace it.
    setPending((current) => current ?? { action, guards: affected.map(([id]) => id) });
  }, [activeGuards]);
  const context = useMemo(() => ({ register, clear, confirmDiscard }), [register, clear, confirmDiscard]);

  const stay = () => {
    setPending(null);
    if (blocker.state === 'blocked') blocker.reset();
  };
  const leave = () => {
    if (blocker.state === 'blocked') {
      blocker.proceed();
    } else if (pending) {
      pending.guards.forEach((id) => clear(id));
      setPending(null);
      pending.action();
    }
  };

  return (
    <UnsavedChangesContext.Provider value={context}>
      {children}
      <ConfirmationModal
        isOpen={blocker.state === 'blocked' || pending !== null}
        onClose={stay}
        onConfirm={leave}
        title="Leave without saving?"
        message="Your unsaved changes will be lost. Stay to keep editing, or leave without saving."
        confirmText="Leave without saving"
        cancelText="Stay"
        variant="warning"
      />
    </UnsavedChangesContext.Provider>
  );
};
