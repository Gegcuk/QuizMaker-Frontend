import forms from "@tailwindcss/forms";          // ← plugin import

/** @type {import('tailwindcss').Config} */
export default {
  /*  Tell Tailwind where to look for class names  */
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],

  /* Enable dark mode with class strategy */
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        // CSS Custom Properties for dynamic theming
        'theme-bg-primary': 'var(--color-bg-primary)',
        'theme-bg-secondary': 'var(--color-bg-secondary)',
        'theme-bg-tertiary': 'var(--color-bg-tertiary)',
        'theme-text-primary': 'var(--color-text-primary)',
        'theme-text-secondary': 'var(--color-text-secondary)',
        'theme-text-tertiary': 'var(--color-text-tertiary)',
        'theme-text-inverse': 'var(--color-text-inverse)',
        'theme-border-primary': 'var(--color-border-primary)',
        'theme-border-secondary': 'var(--color-border-secondary)',
        'theme-border-focus': 'var(--color-border-focus)',
        'theme-interactive-primary': 'var(--color-interactive-primary)',
        'theme-interactive-primary-hover': 'var(--color-interactive-primary-hover)',
        'theme-interactive-secondary': 'var(--color-interactive-secondary)',
        'theme-interactive-secondary-hover': 'var(--color-interactive-secondary-hover)',
        'theme-interactive-danger': 'var(--color-interactive-danger)',
        'theme-interactive-success': 'var(--color-interactive-success)',
        'theme-interactive-warning': 'var(--color-interactive-warning)',
        'theme-interactive-info': 'var(--color-interactive-info)',
        'theme-status-success': 'var(--color-status-success)',
        'theme-status-warning': 'var(--color-status-warning)',
        'theme-status-danger': 'var(--color-status-danger)',
        'theme-status-info': 'var(--color-status-info)',
        'theme-status-success-bg': 'var(--color-status-success-bg)',
        'theme-status-warning-bg': 'var(--color-status-warning-bg)',
        'theme-status-danger-bg': 'var(--color-status-danger-bg)',
        'theme-status-info-bg': 'var(--color-status-info-bg)',
        
        // Additional theme tokens used throughout the app
        'theme-bg-success': 'var(--color-status-success-bg)',
        'theme-bg-danger': 'var(--color-status-danger-bg)',
        'theme-bg-warning': 'var(--color-status-warning-bg)',
        'theme-bg-info': 'var(--color-status-info-bg)',
        'theme-bg-overlay': 'var(--color-bg-overlay)',
        
        'theme-text-success': 'var(--color-status-success)',
        'theme-text-danger': 'var(--color-status-danger)',
        'theme-text-warning': 'var(--color-status-warning)',
        'theme-text-info': 'var(--color-status-info)',
        
        'theme-border-success': 'var(--color-status-success)',
        'theme-border-danger': 'var(--color-status-danger)',
        'theme-border-warning': 'var(--color-status-warning)',
        'theme-border-info': 'var(--color-status-info)',
        
        'theme-focus-ring': 'var(--color-focus-ring)',
        'theme-focus-ring-offset': 'var(--color-focus-ring-offset)',
        'theme-neutral-muted': 'var(--color-neutral-muted)',
        'theme-neutral-subtle': 'var(--color-neutral-subtle)',
        'theme-accent': 'var(--color-accent)',
        'theme-shadow': 'var(--color-shadow)',
        
        // Legacy color palette for backward compatibility
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'theme': '0 1px 3px 0 var(--color-shadow), 0 1px 2px 0 var(--color-shadow)',
        'theme-lg': '0 10px 15px -3px var(--color-shadow), 0 4px 6px -2px var(--color-shadow)',
      },
    },
  },

  /*  Register plugins here  */
  plugins: [forms],
};
