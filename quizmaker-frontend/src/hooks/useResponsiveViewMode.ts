// src/hooks/useResponsiveViewMode.ts
// ---------------------------------------------------------------------------
// Hook for responsive view mode management (grid/list)
// Automatically switches to grid view on mobile screens for better UX
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

interface UseResponsiveViewModeOptions {
  /** Default view mode for desktop (defaults to 'list') */
  defaultDesktopView?: ViewMode;
  /** Breakpoint in pixels (defaults to 768px / md breakpoint) */
  mobileBreakpoint?: number;
}

interface UseResponsiveViewModeReturn {
  /** Current view mode */
  viewMode: ViewMode;
  /** Manually set view mode (only works on desktop) */
  setViewMode: (mode: ViewMode) => void;
  /** Whether currently on mobile screen */
  isMobile: boolean;
}

/**
 * Hook to manage responsive view mode for list/grid layouts.
 * Automatically enforces grid view on mobile screens for better UX.
 * 
 * @example
 * ```tsx
 * const { viewMode, setViewMode, isMobile } = useResponsiveViewMode();
 * 
 * return (
 *   <>
 *     {!isMobile && <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />}
 *     {viewMode === 'grid' ? <GridView /> : <ListView />}
 *   </>
 * );
 * ```
 */
export const useResponsiveViewMode = (
  options: UseResponsiveViewModeOptions = {}
): UseResponsiveViewModeReturn => {
  const { 
    defaultDesktopView = 'list', 
    mobileBreakpoint = 768 
  } = options;

  const [viewMode, setViewModeState] = useState<ViewMode>(defaultDesktopView);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`).matches;
      setIsMobile(mobile);
      if (mobile) {
        // Force grid view on mobile
        setViewModeState('grid');
      }
    };

    // Check on mount
    checkMobile();

    // Listen for screen size changes
    const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      if (mobile) {
        // Force grid view when switching to mobile
        setViewModeState('grid');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mobileBreakpoint]);

  // Wrapper that prevents changing view mode on mobile
  const setViewMode = (mode: ViewMode) => {
    if (!isMobile) {
      setViewModeState(mode);
    }
    // Silently ignore attempts to change view mode on mobile
  };

  return {
    viewMode,
    setViewMode,
    isMobile
  };
};

