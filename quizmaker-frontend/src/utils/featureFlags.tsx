// src/utils/featureFlags.tsx
// ---------------------------------------------------------------------------
// Feature flag system for controlling advanced features
// ---------------------------------------------------------------------------

import { createContext, useContext, ReactNode } from 'react';

export interface FeatureFlags {
  advancedAnalytics: boolean;
  realTimeStats: boolean;
  exportFeatures: boolean;
  aiGeneration: boolean;
  socialSharing: boolean;
}

// Default feature flags - can be overridden by environment variables
const defaultFlags: FeatureFlags = {
  advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true',
  realTimeStats: import.meta.env.VITE_FEATURE_REALTIME_STATS === 'true',
  exportFeatures: import.meta.env.VITE_FEATURE_EXPORT === 'true',
  aiGeneration: import.meta.env.VITE_FEATURE_AI_GENERATION === 'true',
  socialSharing: import.meta.env.VITE_FEATURE_SOCIAL_SHARING === 'true',
};

// Feature flag context and hook
interface FeatureFlagContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return defaultFlags[flag];
  };

  return (
    <FeatureFlagContext.Provider value={{ flags: defaultFlags, isEnabled }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    // Fallback to default if context is not available
    return defaultFlags[flag];
  }
  return context.isEnabled(flag);
};

export const useFeatureFlags = (): FeatureFlags => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    return defaultFlags;
  }
  return context.flags;
};
