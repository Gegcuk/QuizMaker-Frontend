# Theme System Audit

## Summary
- ✅ Theme context now toggles the `dark` class and reapplies palette variables whenever the resolved theme or scheme changes, enabling Tailwind `dark:` utilities to work again.【F:src/context/ThemeContext.tsx†L70-L128】
- ✅ The palette contract includes focus, status, neutral, and accent tokens and Tailwind exposes them as `theme-*` utilities for components to consume.【F:src/context/ColorPalettes.ts†L6-L200】【F:tailwind.config.js†L14-L85】
- ✅ Theme toggles/selectors use the new tokenized classes and draw from the centralized icon set instead of inlining SVGs.【F:src/components/ui/ThemeToggle.tsx†L6-L72】【F:src/components/ui/ThemeSelector.tsx†L6-L74】【F:src/components/ui/ColorSchemeSelector.tsx†L6-L109】【F:src/components/ui/ThemeIcons.tsx†L1-L99】
- ⚠️ Analytics charts still rely on fixed brand hex values (`#3B82F6`) and white strokes rather than palette-provided colors.【F:src/components/ui/Chart.tsx†L118-L175】【F:src/features/tag/components/TagAnalytics.tsx†L325-L379】【F:src/features/category/components/CategoryAnalytics.tsx†L224-L278】
- ⚠️ Hotspot previews and most feature pages continue to hard-code Tailwind neutrals (`bg-white`, `border-gray-200`, `text-gray-500`, etc.), so palette swaps leave large surfaces unchanged.【F:src/features/question/components/HotspotEditor.tsx†L283-L338】【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】
- ⚠️ `applyTheme` still rewrites `root.className`, risking removal of unrelated classes other libraries inject.【F:src/context/ThemeContext.tsx†L70-L97】

## Completed
- Theme provider now resolves system preference, updates `resolvedTheme`, toggles `dark`, and reapplies palette CSS variables on every theme/scheme change.【F:src/context/ThemeContext.tsx†L70-L128】
- Palette definitions gained status/background/focus/neutral tokens and `generateCSSVariables` exposes them for Tailwind `theme-*` utilities.【F:src/context/ColorPalettes.ts†L6-L200】
- Tailwind config maps the palette CSS variables to utilities (`bg-theme-*`, `text-theme-*`, `focus:ring-theme-*`, etc.) so components can use them consistently.【F:tailwind.config.js†L14-L85】
- Theme toggle, selector, and color scheme selector now rely on tokenized classes and share icons via `ThemeIcons` helpers.【F:src/components/ui/ThemeToggle.tsx†L45-L68】【F:src/components/ui/ThemeSelector.tsx†L49-L72】【F:src/components/ui/ColorSchemeSelector.tsx†L60-L107】【F:src/components/ui/ThemeIcons.tsx†L19-L99】
- Shared primitives such as `Card` and `Button` render palette-driven backgrounds, borders, and focus rings, enforcing token usage where they are adopted.【F:src/components/ui/Card.tsx†L41-L111】【F:src/components/ui/Button.tsx†L26-L76】

## Outstanding / Next Steps
1. Replace `root.className = …` in `applyTheme` with targeted `classList` operations to avoid clobbering classes that other systems add to `<html>`.【F:src/context/ThemeContext.tsx†L70-L97】
2. Continue migrating analytics/visualizations to palette-aware colors (including replacing pie-slice `stroke="white"` and `#3B82F6` trend lines).【F:src/components/ui/Chart.tsx†L118-L175】【F:src/features/tag/components/TagAnalytics.tsx†L325-L379】【F:src/features/category/components/CategoryAnalytics.tsx†L224-L278】
3. Audit feature modules for Tailwind defaults (`bg-white`, `border-gray-200`, `text-gray-500`, inline hex codes) and swap them to theme tokens or palette-derived helpers. Priorities include tag tables, quiz stats, and hotspot overlays.【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】【F:src/features/question/components/HotspotEditor.tsx†L283-L338】
4. Expose semantic status helpers (success/warning/etc.) from the palette for data displays so features stop duplicating Tailwind shades like `text-green-600` and `bg-yellow-100`.【F:src/components/ui/Chart.tsx†L39-L58】【F:src/features/quiz/components/QuizStats.tsx†L20-L113】
5. Once primitives cover the palette, refactor page-level shells and tables that still use static neutrals to compose the updated `Card`, `Table`, and `Button` components for consistency.【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】