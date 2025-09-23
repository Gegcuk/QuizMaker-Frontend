// ---------------------------------------------------------------------------
// ThemeContext.tsx - Multi-color scheme theme management
// Provides theme state and utilities throughout the app
// ---------------------------------------------------------------------------

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ColorPalette, colorPalettes, getPaletteById, generateCSSVariables } from './ColorPalettes';

type Theme = 'light' | 'dark' | 'auto';

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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'auto',
  defaultColorScheme = 'light'
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quizmaker-theme') as Theme;
      return (saved && ['light', 'dark', 'auto'].includes(saved)) ? saved : defaultTheme;
    }
    return defaultTheme;
  });
  
  const [colorScheme, setColorScheme] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quizmaker-color-scheme');
      return (saved && colorPalettes.find(p => p.id === saved)) ? saved : defaultColorScheme;
    }
    return defaultColorScheme;
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(getPaletteById(colorScheme));

  // Get system theme preference
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Resolve the actual theme based on user preference
  const resolveTheme = (userTheme: Theme): 'light' | 'dark' => {
    if (userTheme === 'auto') {
      return getSystemTheme();
    }
    return userTheme;
  };

  // Apply theme to document
  const applyTheme = (palette: ColorPalette) => {
    const root = document.documentElement;
    
    // Apply color scheme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${palette.id}`);
    
    // Apply CSS custom properties
    const cssVariables = generateCSSVariables(palette);
    Object.entries(cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', palette.colors.bg.primary);
    }
  };

  // Apply initial theme on mount
  useEffect(() => {
    const palette = getPaletteById(colorScheme);
    applyTheme(palette);
  }, []);

  // Update current palette when color scheme changes
  useEffect(() => {
    const palette = getPaletteById(colorScheme);
    setCurrentPalette(palette);
    applyTheme(palette);
  }, [colorScheme]);

  // Update resolved theme when theme or system preference changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(theme);
    setResolvedTheme(newResolvedTheme);

    // Listen for system theme changes when using 'auto'
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const autoResolvedTheme = resolveTheme('auto');
        setResolvedTheme(autoResolvedTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('quizmaker-theme', newTheme);
  };

  const handleSetColorScheme = (newScheme: string) => {
    setColorScheme(newScheme);
    localStorage.setItem('quizmaker-color-scheme', newScheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    handleSetTheme(newTheme);
    
    // Also toggle color scheme if it's currently light/dark
    if (colorScheme === 'light' || colorScheme === 'dark') {
      const newColorScheme = colorScheme === 'light' ? 'dark' : 'light';
      handleSetColorScheme(newColorScheme);
    }
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    colorScheme,
    currentPalette,
    setTheme: handleSetTheme,
    setColorScheme: handleSetColorScheme,
    toggleTheme,
    availablePalettes: colorPalettes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;
