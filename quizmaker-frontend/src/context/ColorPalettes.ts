// ---------------------------------------------------------------------------
// ColorPalettes.ts - Predefined color schemes for the theme system
// Supports multiple color schemes beyond just light/dark
// ---------------------------------------------------------------------------

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: {
    // Background colors
    bg: {
      primary: string;    // Main background
      secondary: string;  // Secondary background (cards, panels)
      tertiary: string;   // Tertiary background (inputs, borders)
    };
    // Text colors
    text: {
      primary: string;    // Main text
      secondary: string;  // Secondary text
      tertiary: string;   // Muted text
      inverse: string;    // Text on primary background
    };
    // Border colors
    border: {
      primary: string;    // Main borders
      secondary: string;  // Subtle borders
      focus: string;      // Focus borders
    };
    // Interactive colors
    interactive: {
      primary: string;    // Primary buttons, links
      primaryHover: string; // Primary hover state
      secondary: string;  // Secondary buttons
      secondaryHover: string; // Secondary hover state
      danger: string;     // Danger/error states
      success: string;    // Success states
      warning: string;    // Warning states
      info: string;       // Info states
    };
    // Status colors (for backgrounds and text)
    status: {
      success: string;    // Success text color
      warning: string;    // Warning text color
      danger: string;     // Danger text color
      info: string;       // Info text color
      successBg: string;  // Success background
      warningBg: string;  // Warning background
      dangerBg: string;   // Danger background
      infoBg: string;     // Info background
    };
    // Focus colors
    focus: {
      ring: string;       // Focus ring color
      ringOffset: string; // Focus ring offset color
    };
    // Neutral/muted colors
    neutral: {
      muted: string;      // Muted background/text
      subtle: string;     // Subtle borders/separators
    };
    // Special colors
    accent: string;       // Accent color for highlights
    shadow: string;       // Shadow color
  };
}

// Light theme (default)
export const lightPalette: ColorPalette = {
  id: 'light',
  name: 'Light',
  description: 'Clean light theme with blue accents',
  colors: {
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#f1f5f9',
      focus: '#3b82f6',
    },
    interactive: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#64748b',
      secondaryHover: '#475569',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#dc2626',
      info: '#0369a1',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#3b82f6',
      ringOffset: '#ffffff',
    },
    neutral: {
      muted: '#f8fafc',
      subtle: '#f1f5f9',
    },
    accent: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
};

// Dark theme
export const darkPalette: ColorPalette = {
  id: 'dark',
  name: 'Dark',
  description: 'Modern dark theme with blue accents',
  colors: {
    bg: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      inverse: '#0f172a',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
      focus: '#60a5fa',
    },
    interactive: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      secondary: '#64748b',
      secondaryHover: '#475569',
      danger: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
      info: '#67e8f9',
    },
    status: {
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#67e8f9',
      successBg: '#064e3b',
      warningBg: '#451a03',
      dangerBg: '#450a0a',
      infoBg: '#0c4a6e',
    },
    focus: {
      ring: '#60a5fa',
      ringOffset: '#0f172a',
    },
    neutral: {
      muted: '#1e293b',
      subtle: '#334155',
    },
    accent: '#60a5fa',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

// Blue theme (your first color scheme)
export const bluePalette: ColorPalette = {
  id: 'blue',
  name: 'Ocean Blue',
  description: 'Calming blue theme inspired by ocean colors',
  colors: {
    bg: {
      primary: '#d2e0fb',      // rgb(210, 224, 251)
      secondary: '#fef9d9',    // rgb(254, 249, 217)
      tertiary: '#dee5d4',     // rgb(222, 229, 212)
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      primary: '#8eaccd',      // rgb(142, 172, 205)
      secondary: '#cbd5e1',
      focus: '#3b82f6',
    },
    interactive: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#64748b',
      secondaryHover: '#475569',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#dc2626',
      info: '#0369a1',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#3b82f6',
      ringOffset: '#d2e0fb',
    },
    neutral: {
      muted: '#fef9d9',
      subtle: '#dee5d4',
    },
    accent: '#8eaccd',
    shadow: 'rgba(142, 172, 205, 0.2)',
  },
};

// Purple theme (your second color scheme)
export const purplePalette: ColorPalette = {
  id: 'purple',
  name: 'Royal Purple',
  description: 'Rich purple theme with deep tones',
  colors: {
    bg: {
      primary: '#17133b',      // rgb(23, 21, 59)
      secondary: '#2e236c',    // rgb(46, 35, 108)
      tertiary: '#433d8b',     // rgb(67, 61, 139)
    },
    text: {
      primary: '#f8fafc',
      secondary: '#c8acd6',    // rgb(200, 172, 214)
      tertiary: '#a78bfa',
      inverse: '#17133b',
    },
    border: {
      primary: '#433d8b',
      secondary: '#6366f1',
      focus: '#a78bfa',
    },
    interactive: {
      primary: '#a78bfa',
      primaryHover: '#8b5cf6',
      secondary: '#c8acd6',
      secondaryHover: '#a78bfa',
      danger: '#f87171',
      success: '#4ade80',
      warning: '#fbbf24',
      info: '#67e8f9',
    },
    status: {
      success: '#4ade80',
      warning: '#fbbf24',
      danger: '#f87171',
      info: '#67e8f9',
      successBg: '#064e3b',
      warningBg: '#451a03',
      dangerBg: '#450a0a',
      infoBg: '#0c4a6e',
    },
    focus: {
      ring: '#a78bfa',
      ringOffset: '#17133b',
    },
    neutral: {
      muted: '#2e236c',
      subtle: '#433d8b',
    },
    accent: '#c8acd6',
    shadow: 'rgba(23, 21, 59, 0.4)',
  },
};

// Green theme (additional option)
export const greenPalette: ColorPalette = {
  id: 'green',
  name: 'Forest Green',
  description: 'Natural green theme with earthy tones',
  colors: {
    bg: {
      primary: '#f0fdf4',
      secondary: '#dcfce7',
      tertiary: '#bbf7d0',
    },
    text: {
      primary: '#14532d',
      secondary: '#166534',
      tertiary: '#16a34a',
      inverse: '#ffffff',
    },
    border: {
      primary: '#bbf7d0',
      secondary: '#dcfce7',
      focus: '#22c55e',
    },
    interactive: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      secondary: '#64748b',
      secondaryHover: '#475569',
      danger: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#dc2626',
      info: '#0369a1',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#22c55e',
      ringOffset: '#f0fdf4',
    },
    neutral: {
      muted: '#dcfce7',
      subtle: '#bbf7d0',
    },
    accent: '#22c55e',
    shadow: 'rgba(34, 197, 94, 0.2)',
  },
};

// All available palettes
export const colorPalettes: ColorPalette[] = [
  lightPalette,
  darkPalette,
  bluePalette,
  purplePalette,
  greenPalette,
];

// Helper function to get palette by ID
export const getPaletteById = (id: string): ColorPalette => {
  return colorPalettes.find(palette => palette.id === id) || lightPalette;
};

// Helper function to generate CSS custom properties
export const generateCSSVariables = (palette: ColorPalette): Record<string, string> => {
  return {
    '--color-bg-primary': palette.colors.bg.primary,
    '--color-bg-secondary': palette.colors.bg.secondary,
    '--color-bg-tertiary': palette.colors.bg.tertiary,
    '--color-text-primary': palette.colors.text.primary,
    '--color-text-secondary': palette.colors.text.secondary,
    '--color-text-tertiary': palette.colors.text.tertiary,
    '--color-text-inverse': palette.colors.text.inverse,
    '--color-border-primary': palette.colors.border.primary,
    '--color-border-secondary': palette.colors.border.secondary,
    '--color-border-focus': palette.colors.border.focus,
    '--color-interactive-primary': palette.colors.interactive.primary,
    '--color-interactive-primary-hover': palette.colors.interactive.primaryHover,
    '--color-interactive-secondary': palette.colors.interactive.secondary,
    '--color-interactive-secondary-hover': palette.colors.interactive.secondaryHover,
    '--color-interactive-danger': palette.colors.interactive.danger,
    '--color-interactive-success': palette.colors.interactive.success,
    '--color-interactive-warning': palette.colors.interactive.warning,
    '--color-interactive-info': palette.colors.interactive.info,
    '--color-status-success': palette.colors.status.success,
    '--color-status-warning': palette.colors.status.warning,
    '--color-status-danger': palette.colors.status.danger,
    '--color-status-info': palette.colors.status.info,
    '--color-status-success-bg': palette.colors.status.successBg,
    '--color-status-warning-bg': palette.colors.status.warningBg,
    '--color-status-danger-bg': palette.colors.status.dangerBg,
    '--color-status-info-bg': palette.colors.status.infoBg,
    '--color-focus-ring': palette.colors.focus.ring,
    '--color-focus-ring-offset': palette.colors.focus.ringOffset,
    '--color-neutral-muted': palette.colors.neutral.muted,
    '--color-neutral-subtle': palette.colors.neutral.subtle,
    '--color-accent': palette.colors.accent,
    '--color-shadow': palette.colors.shadow,
  };
};
