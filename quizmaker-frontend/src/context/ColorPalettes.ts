// ---------------------------------------------------------------------------
// ColorPalettes.ts - Predefined color schemes for the theme system
// Supports multiple color schemes beyond just light/dark
// ---------------------------------------------------------------------------

export interface ColorPair {
  fill: string;
  foreground: string;
}

export type ControlTone = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

export interface ControlColors {
  default: ColorPair;
  hover: ColorPair;
}

export interface ColorPalette {
  id: string;
  appearance: 'light' | 'dark';
  name: string;
  description: string;
  colors: {
    controls: Record<ControlTone, ControlColors>;
    disabled: ColorPair;
    tooltip: ColorPair;
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
      inverse: string;    // Legacy compatibility; use an explicit fill/foreground pair
    };
    // Border colors
    border: {
      control: string;    // Required input/choice boundaries
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
    // Matching question pair colors
    matching: {
      pair1: {
        bg: string;
        border: string;
        badge: string;
        foreground: string;
        badgeForeground: string;
      };
      pair2: {
        bg: string;
        border: string;
        badge: string;
        foreground: string;
        badgeForeground: string;
      };
      pair3: {
        bg: string;
        border: string;
        badge: string;
        foreground: string;
        badgeForeground: string;
      };
      pair4: {
        bg: string;
        border: string;
        badge: string;
        foreground: string;
        badgeForeground: string;
      };
    };
    // Special colors
    accent: string;       // Accent color for highlights
    shadow: string;       // Shadow color
    overlay: string;      // Overlay color for modals/tooltips
  };
}

// Light theme (default)
export const lightPalette: ColorPalette = {
  id: 'light',
  appearance: 'light',
  name: 'Light',
  description: 'Clean light theme with blue accents',
  colors: {
    controls: {
      primary: {
        default: { fill: '#2563eb', foreground: '#ffffff' },
        hover: { fill: '#1d4ed8', foreground: '#ffffff' },
      },
      secondary: {
        default: { fill: '#475569', foreground: '#ffffff' },
        hover: { fill: '#334155', foreground: '#ffffff' },
      },
      success: {
        default: { fill: '#166534', foreground: '#ffffff' },
        hover: { fill: '#14532d', foreground: '#ffffff' },
      },
      danger: {
        default: { fill: '#b91c1c', foreground: '#ffffff' },
        hover: { fill: '#991b1b', foreground: '#ffffff' },
      },
      warning: {
        default: { fill: '#92400e', foreground: '#ffffff' },
        hover: { fill: '#78350f', foreground: '#ffffff' },
      },
      info: {
        default: { fill: '#0369a1', foreground: '#ffffff' },
        hover: { fill: '#075985', foreground: '#ffffff' },
      },
    },
    disabled: { fill: '#e2e8f0', foreground: '#334155' },
    tooltip: { fill: '#0f172a', foreground: '#f8fafc' },
    bg: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569',
      tertiary: '#475569',
      inverse: '#ffffff',
    },
    border: {
      control: '#64748b',
      primary: '#e2e8f0',
      secondary: '#f1f5f9',
      focus: '#1d4ed8',
    },
    interactive: {
      primary: '#1d4ed8',
      primaryHover: '#2563eb',
      secondary: '#475569',
      secondaryHover: '#475569',
      danger: '#b91c1c',
      success: '#166534',
      warning: '#92400e',
      info: '#0369a1',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#b91c1c',
      info: '#0369a1',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#1d4ed8',
      ringOffset: '#ffffff',
    },
    neutral: {
      muted: '#f8fafc',
      subtle: '#f1f5f9',
    },
    matching: {
      pair1: { bg: '#dbeafe', border: '#2563eb', badge: '#2563eb', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair2: { bg: '#ccfbf1', border: '#0f766e', badge: '#0f766e', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair3: { bg: '#e0e7ff', border: '#4f46e5', badge: '#4f46e5', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair4: { bg: '#e2e8f0', border: '#475569', badge: '#475569', foreground: '#0f172a', badgeForeground: '#ffffff' },
    },
    accent: '#1d4ed8',
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
};

// Dark theme
export const darkPalette: ColorPalette = {
  id: 'dark',
  appearance: 'dark',
  name: 'Dark',
  description: 'Modern dark theme with blue accents',
  colors: {
    controls: {
      primary: {
        default: { fill: '#93c5fd', foreground: '#0f172a' },
        hover: { fill: '#60a5fa', foreground: '#0f172a' },
      },
      secondary: {
        default: { fill: '#cbd5e1', foreground: '#0f172a' },
        hover: { fill: '#94a3b8', foreground: '#0f172a' },
      },
      success: {
        default: { fill: '#86efac', foreground: '#0f172a' },
        hover: { fill: '#4ade80', foreground: '#0f172a' },
      },
      danger: {
        default: { fill: '#fca5a5', foreground: '#0f172a' },
        hover: { fill: '#f87171', foreground: '#0f172a' },
      },
      warning: {
        default: { fill: '#fde68a', foreground: '#0f172a' },
        hover: { fill: '#fbbf24', foreground: '#0f172a' },
      },
      info: {
        default: { fill: '#a5f3fc', foreground: '#0f172a' },
        hover: { fill: '#67e8f9', foreground: '#0f172a' },
      },
    },
    disabled: { fill: '#334155', foreground: '#f8fafc' },
    tooltip: { fill: '#0f172a', foreground: '#f8fafc' },
    bg: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#cbd5e1',
      inverse: '#0f172a',
    },
    border: {
      control: '#94a3b8',
      primary: '#334155',
      secondary: '#94a3b8',
      focus: '#93c5fd',
    },
    interactive: {
      primary: '#93c5fd',
      primaryHover: '#93c5fd',
      secondary: '#cbd5e1',
      secondaryHover: '#cbd5e1',
      danger: '#fca5a5',
      success: '#86efac',
      warning: '#fde68a',
      info: '#a5f3fc',
    },
    status: {
      success: '#86efac',
      warning: '#fde68a',
      danger: '#fca5a5',
      info: '#a5f3fc',
      successBg: '#064e3b',
      warningBg: '#451a03',
      dangerBg: '#450a0a',
      infoBg: '#0c4a6e',
    },
    focus: {
      ring: '#93c5fd',
      ringOffset: '#0f172a',
    },
    neutral: {
      muted: '#1e293b',
      subtle: '#334155',
    },
    matching: {
      pair1: { bg: '#1e3a8a', border: '#93c5fd', badge: '#93c5fd', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair2: { bg: '#134e4a', border: '#2dd4bf', badge: '#2dd4bf', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair3: { bg: '#312e81', border: '#818cf8', badge: '#818cf8', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair4: { bg: '#334155', border: '#cbd5e1', badge: '#cbd5e1', foreground: '#f8fafc', badgeForeground: '#0f172a' },
    },
    accent: '#93c5fd',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Blue theme (your first color scheme)
export const bluePalette: ColorPalette = {
  id: 'blue',
  appearance: 'light',
  name: 'Ocean Blue',
  description: 'Calming blue theme inspired by ocean colors',
  colors: {
    controls: {
      primary: {
        default: { fill: '#1d4ed8', foreground: '#ffffff' },
        hover: { fill: '#1e40af', foreground: '#ffffff' },
      },
      secondary: {
        default: { fill: '#475569', foreground: '#ffffff' },
        hover: { fill: '#334155', foreground: '#ffffff' },
      },
      success: {
        default: { fill: '#166534', foreground: '#ffffff' },
        hover: { fill: '#14532d', foreground: '#ffffff' },
      },
      danger: {
        default: { fill: '#b91c1c', foreground: '#ffffff' },
        hover: { fill: '#991b1b', foreground: '#ffffff' },
      },
      warning: {
        default: { fill: '#92400e', foreground: '#ffffff' },
        hover: { fill: '#78350f', foreground: '#ffffff' },
      },
      info: {
        default: { fill: '#0369a1', foreground: '#ffffff' },
        hover: { fill: '#075985', foreground: '#ffffff' },
      },
    },
    disabled: { fill: '#dee5d4', foreground: '#334155' },
    tooltip: { fill: '#0f172a', foreground: '#f8fafc' },
    bg: {
      primary: '#d2e0fb',      // rgb(210, 224, 251)
      secondary: '#fef9d9',    // rgb(254, 249, 217)
      tertiary: '#dee5d4',     // rgb(222, 229, 212)
    },
    text: {
      primary: '#1e293b',
      secondary: '#475569',
      tertiary: '#475569',
      inverse: '#ffffff',
    },
    border: {
      control: '#475569',
      primary: '#8eaccd',      // rgb(142, 172, 205)
      secondary: '#cbd5e1',
      focus: '#1d4ed8',
    },
    interactive: {
      primary: '#1d4ed8',
      primaryHover: '#1e40af',
      secondary: '#475569',
      secondaryHover: '#475569',
      danger: '#b91c1c',
      success: '#166534',
      warning: '#92400e',
      info: '#075985',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#b91c1c',
      info: '#075985',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#1d4ed8',
      ringOffset: '#d2e0fb',
    },
    neutral: {
      muted: '#fef9d9',
      subtle: '#dee5d4',
    },
    matching: {
      pair1: { bg: '#bfdbfe', border: '#1d4ed8', badge: '#2563eb', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair2: { bg: '#ccfbf1', border: '#0f766e', badge: '#0f766e', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair3: { bg: '#e0e7ff', border: '#4338ca', badge: '#4f46e5', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair4: { bg: '#e2e8f0', border: '#475569', badge: '#475569', foreground: '#0f172a', badgeForeground: '#ffffff' },
    },
    accent: '#8eaccd',
    shadow: 'rgba(142, 172, 205, 0.2)',
    overlay: 'rgba(142, 172, 205, 0.6)',
  },
};

// Purple theme (your second color scheme)
export const purplePalette: ColorPalette = {
  id: 'purple',
  appearance: 'dark',
  name: 'Royal Purple',
  description: 'Rich purple theme with deep tones',
  colors: {
    controls: {
      primary: {
        default: { fill: '#c4b5fd', foreground: '#17133b' },
        hover: { fill: '#a78bfa', foreground: '#17133b' },
      },
      secondary: {
        default: { fill: '#c8acd6', foreground: '#17133b' },
        hover: { fill: '#a78bfa', foreground: '#17133b' },
      },
      success: {
        default: { fill: '#86efac', foreground: '#17133b' },
        hover: { fill: '#4ade80', foreground: '#17133b' },
      },
      danger: {
        default: { fill: '#fca5a5', foreground: '#17133b' },
        hover: { fill: '#f87171', foreground: '#17133b' },
      },
      warning: {
        default: { fill: '#fde68a', foreground: '#17133b' },
        hover: { fill: '#fbbf24', foreground: '#17133b' },
      },
      info: {
        default: { fill: '#a5f3fc', foreground: '#17133b' },
        hover: { fill: '#67e8f9', foreground: '#17133b' },
      },
    },
    disabled: { fill: '#433d8b', foreground: '#f8fafc' },
    tooltip: { fill: '#0f172a', foreground: '#f8fafc' },
    bg: {
      primary: '#17133b',      // rgb(23, 21, 59)
      secondary: '#2e236c',    // rgb(46, 35, 108)
      tertiary: '#433d8b',     // rgb(67, 61, 139)
    },
    text: {
      primary: '#f8fafc',
      secondary: '#c8acd6',    // rgb(200, 172, 214)
      tertiary: '#c4b5fd',
      inverse: '#17133b',
    },
    border: {
      control: '#c4b5fd',
      primary: '#433d8b',
      secondary: '#6366f1',
      focus: '#c4b5fd',
    },
    interactive: {
      primary: '#c4b5fd',
      primaryHover: '#c4b5fd',
      secondary: '#c8acd6',
      secondaryHover: '#c4b5fd',
      danger: '#fca5a5',
      success: '#86efac',
      warning: '#fde68a',
      info: '#a5f3fc',
    },
    status: {
      success: '#86efac',
      warning: '#fde68a',
      danger: '#fca5a5',
      info: '#a5f3fc',
      successBg: '#064e3b',
      warningBg: '#451a03',
      dangerBg: '#450a0a',
      infoBg: '#0c4a6e',
    },
    focus: {
      ring: '#c4b5fd',
      ringOffset: '#17133b',
    },
    neutral: {
      muted: '#2e236c',
      subtle: '#433d8b',
    },
    matching: {
      pair1: { bg: '#312e81', border: '#93c5fd', badge: '#93c5fd', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair2: { bg: '#164e63', border: '#a5f3fc', badge: '#a5f3fc', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair3: { bg: '#4c1d95', border: '#c4b5fd', badge: '#c4b5fd', foreground: '#f8fafc', badgeForeground: '#0f172a' },
      pair4: { bg: '#334155', border: '#cbd5e1', badge: '#cbd5e1', foreground: '#f8fafc', badgeForeground: '#0f172a' },
    },
    accent: '#c8acd6',
    shadow: 'rgba(23, 21, 59, 0.4)',
    overlay: 'rgba(23, 21, 59, 0.8)',
  },
};

// Green theme (additional option)
export const greenPalette: ColorPalette = {
  id: 'green',
  appearance: 'light',
  name: 'Forest Green',
  description: 'Natural green theme with earthy tones',
  colors: {
    controls: {
      primary: {
        default: { fill: '#166534', foreground: '#ffffff' },
        hover: { fill: '#14532d', foreground: '#ffffff' },
      },
      secondary: {
        default: { fill: '#475569', foreground: '#ffffff' },
        hover: { fill: '#334155', foreground: '#ffffff' },
      },
      success: {
        default: { fill: '#166534', foreground: '#ffffff' },
        hover: { fill: '#14532d', foreground: '#ffffff' },
      },
      danger: {
        default: { fill: '#b91c1c', foreground: '#ffffff' },
        hover: { fill: '#991b1b', foreground: '#ffffff' },
      },
      warning: {
        default: { fill: '#92400e', foreground: '#ffffff' },
        hover: { fill: '#78350f', foreground: '#ffffff' },
      },
      info: {
        default: { fill: '#0369a1', foreground: '#ffffff' },
        hover: { fill: '#075985', foreground: '#ffffff' },
      },
    },
    disabled: { fill: '#bbf7d0', foreground: '#14532d' },
    tooltip: { fill: '#0f172a', foreground: '#f8fafc' },
    bg: {
      primary: '#f0fdf4',
      secondary: '#dcfce7',
      tertiary: '#bbf7d0',
    },
    text: {
      primary: '#14532d',
      secondary: '#166534',
      tertiary: '#166534',
      inverse: '#ffffff',
    },
    border: {
      control: '#166534',
      primary: '#bbf7d0',
      secondary: '#dcfce7',
      focus: '#166534',
    },
    interactive: {
      primary: '#166534',
      primaryHover: '#166534',
      secondary: '#475569',
      secondaryHover: '#475569',
      danger: '#b91c1c',
      success: '#166534',
      warning: '#92400e',
      info: '#0369a1',
    },
    status: {
      success: '#166534',
      warning: '#92400e',
      danger: '#b91c1c',
      info: '#0369a1',
      successBg: '#f0fdf4',
      warningBg: '#fffbeb',
      dangerBg: '#fef2f2',
      infoBg: '#f0f9ff',
    },
    focus: {
      ring: '#166534',
      ringOffset: '#f0fdf4',
    },
    neutral: {
      muted: '#dcfce7',
      subtle: '#bbf7d0',
    },
    matching: {
      pair1: { bg: '#bbf7d0', border: '#166534', badge: '#166534', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair2: { bg: '#ccfbf1', border: '#0f766e', badge: '#0f766e', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair3: { bg: '#dbeafe', border: '#1d4ed8', badge: '#2563eb', foreground: '#0f172a', badgeForeground: '#ffffff' },
      pair4: { bg: '#e2e8f0', border: '#475569', badge: '#475569', foreground: '#0f172a', badgeForeground: '#ffffff' },
    },
    accent: '#166534',
    shadow: 'rgba(34, 197, 94, 0.2)',
    overlay: 'rgba(34, 197, 94, 0.6)',
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
  const controls = Object.fromEntries(
    Object.entries(palette.colors.controls).flatMap(([tone, states]) =>
      Object.entries(states).flatMap(([state, pair]) => [
        [`--color-control-${tone}-${state}-fill`, pair.fill],
        [`--color-control-${tone}-${state}-foreground`, pair.foreground],
      ]),
    ),
  );
  const matching = Object.fromEntries(
    Object.entries(palette.colors.matching).flatMap(([name, pair]) => [
      [`--color-matching-pair-${name.slice(-1)}-foreground`, pair.foreground],
      [`--color-matching-pair-${name.slice(-1)}-badge-foreground`, pair.badgeForeground],
    ]),
  );
  return {
    ...controls,
    ...matching,
    '--color-disabled-fill': palette.colors.disabled.fill,
    '--color-disabled-foreground': palette.colors.disabled.foreground,
    '--color-tooltip-fill': palette.colors.tooltip.fill,
    '--color-tooltip-foreground': palette.colors.tooltip.foreground,
    '--color-bg-primary': palette.colors.bg.primary,
    '--color-bg-secondary': palette.colors.bg.secondary,
    '--color-bg-tertiary': palette.colors.bg.tertiary,
    '--color-text-primary': palette.colors.text.primary,
    '--color-text-secondary': palette.colors.text.secondary,
    '--color-text-tertiary': palette.colors.text.tertiary,
    '--color-text-inverse': palette.colors.text.inverse,
    '--color-border-control': palette.colors.border.control,
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
    '--color-matching-pair-1-bg': palette.colors.matching.pair1.bg,
    '--color-matching-pair-1-border': palette.colors.matching.pair1.border,
    '--color-matching-pair-1-badge': palette.colors.matching.pair1.badge,
    '--color-matching-pair-2-bg': palette.colors.matching.pair2.bg,
    '--color-matching-pair-2-border': palette.colors.matching.pair2.border,
    '--color-matching-pair-2-badge': palette.colors.matching.pair2.badge,
    '--color-matching-pair-3-bg': palette.colors.matching.pair3.bg,
    '--color-matching-pair-3-border': palette.colors.matching.pair3.border,
    '--color-matching-pair-3-badge': palette.colors.matching.pair3.badge,
    '--color-matching-pair-4-bg': palette.colors.matching.pair4.bg,
    '--color-matching-pair-4-border': palette.colors.matching.pair4.border,
    '--color-matching-pair-4-badge': palette.colors.matching.pair4.badge,
    '--color-accent': palette.colors.accent,
    '--color-shadow': palette.colors.shadow,
    '--color-bg-overlay': palette.colors.overlay,
  };
};
