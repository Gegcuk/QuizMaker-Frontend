import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { colorPalettes, getPaletteById } from './ColorPalettes';
import type { ColorPalette } from './ColorPalettes';
import { createThemeRuntime, startupPalettes } from './themeRuntime';
import type { Theme, ThemePreferences } from './themeRuntime';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  colorScheme: string;
  currentPalette: ColorPalette;
  setTheme: (theme: Theme) => void;
  setColorScheme: (scheme: string) => void;
  toggleTheme: () => void;
  availablePalettes: ColorPalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultColorScheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, defaultTheme = 'auto', defaultColorScheme = 'light' }) => {
  const runtime = createThemeRuntime(startupPalettes, window, document);
  const [preferences, setPreferences] = useState<ThemePreferences>(() => runtime.readPreferences({ theme: defaultTheme, colorScheme: defaultColorScheme }));
  // A media subscription represents an external browser preference, not derived React state.
  const [systemDark, setSystemDark] = useState(() => runtime.resolve({ theme: 'auto', colorScheme: 'light' }).resolvedTheme === 'dark');
  const { resolvedTheme, colorScheme } = runtime.resolve(preferences, systemDark ? 'dark' : 'light');
  const currentPalette = getPaletteById(colorScheme);

  useEffect(() => {
    let media: MediaQueryList;
    try { media = window.matchMedia('(prefers-color-scheme: dark)'); } catch { return; }
    const update = () => setSystemDark(media.matches);
    update();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    // Older engines may only implement the legacy MediaQueryList subscription.
    if (typeof media.addListener === 'function') {
      media.addListener(update);
      return () => media.removeListener(update);
    }
  }, []);

  useLayoutEffect(() => {
    // The head bootstrap owns first paint; this synchronizes later React updates.
    createThemeRuntime(startupPalettes, window, document).apply({ theme: resolvedTheme, colorScheme });
  }, [resolvedTheme, colorScheme]);

  const updatePreferences = (next: ThemePreferences) => {
    setPreferences(next);
    runtime.persist(next);
  };
  const setTheme = (theme: Theme) => {
    if (theme !== 'light' && theme !== 'dark' && theme !== 'auto') return;
    updatePreferences({ theme, colorScheme: theme === 'dark' ? 'dark' : 'light' });
  };
  const setColorScheme = (scheme: string) => {
    if (!Object.prototype.hasOwnProperty.call(startupPalettes, scheme)) return;
    updatePreferences({ theme: scheme === 'light' || scheme === 'dark' ? scheme : preferences.theme, colorScheme: scheme });
  };

  return (
    <ThemeContext.Provider value={{
      theme: preferences.theme, resolvedTheme, colorScheme, currentPalette,
      setTheme, setColorScheme,
      toggleTheme: () => setTheme(resolvedTheme === 'light' ? 'dark' : 'light'),
      availablePalettes: colorPalettes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
export default ThemeProvider;
