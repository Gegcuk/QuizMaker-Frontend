# Theme System Audit

## Summary
- Many UI primitives and feature components still hard-code Tailwind's default grays/brand colors instead of the new theme tokens, so switching palettes barely affects large areas of the interface.
- The theme context never toggles Tailwind's `dark` class or reapplies palettes when the resolved theme changes, leaving every `dark:` style and status color tied to the light palette.
- Visual patterns (cards, analytics blocks, sun/moon icons) are reimplemented in multiple places rather than reusing shared building blocks, which makes palette adoption harder and creates inconsistent UX.

## Color Scheme Adoption Gaps
- **Theme controls ignore palette tokens.** `ThemeToggle`, `ThemeSelector`, and `ColorSchemeSelector` all ship Tailwind grays/blue focus rings via `dark:` classes and static hexes. Because the theme provider never adds a `dark` class, these controls stay in light-mode styling and ignore the active palette's variables.【F:src/components/ui/ThemeToggle.tsx†L68-L93】【F:src/components/ui/ThemeSelector.tsx†L55-L84】【F:src/components/ui/ColorSchemeSelector.tsx†L94-L145】  
  *Fix:* Replace hard-coded Tailwind color utilities with the `theme-*` CSS variable classes (e.g., `bg-theme-bg-primary`, `text-theme-text-secondary`, `focus:ring-theme-border-focus`). Add palette-provided focus colors instead of `focus:ring-blue-500`, and expose neutral shades (e.g., `theme-muted`) from the palette for radio borders.
- **Shared primitives bake in light palette tokens.** The `Card` and `Button` primitives default to `bg-white`, `border-gray-200`, or `bg-cyan-600`, which means every consumer inherits light colors even on purple/green schemes.【F:src/components/ui/Card.tsx†L41-L155】【F:src/components/ui/Button.tsx†L30-L63】  
  *Fix:* Convert base/variant classes to theme variables (e.g., `bg-theme-bg-primary`, `border-theme-border-primary`) and add palette-driven info colors to `ColorPalettes` so `Button` variants can stay tokenized.
- **Charts and analytics hard-code brand hexes.** Reusable charts, tag/category analytics, and hotspot overlays draw with literal hex values (`#3B82F6`, `#EF4444`, etc.), so palette changes only recolor backgrounds while insights stay blue/red.【F:src/components/ui/Chart.tsx†L37-L248】【F:src/features/tag/components/TagAnalytics.tsx†L300-L377】【F:src/features/category/components/CategoryAnalytics.tsx†L282-L320】【F:src/features/question/components/HotspotEditor.tsx†L283-L307】【F:src/features/attempt/components/HotspotAnswer.tsx†L74-L105】  
  *Fix:* Generate chart/overlay colors from the active `currentPalette` (expose `interactive`/`accent` scales for data series). Pass theme tokens down as props or context, and fall back to palette-defined status colors instead of Tailwind defaults.

## Component Reuse & Consistency
- **Repeated card skeletons.** Analytics pages and pagination toolbars recreate `div` blocks with `bg-white rounded-lg border` instead of using the `Card` primitive, leading to scattered light palette classes and inconsistent padding.【F:src/features/tag/components/TagAnalytics.tsx†L300-L377】  
  *Fix:* Refactor these blocks to compose `Card`, `CardHeader`, and `CardBody`. Update `Card` to emit theme-token colors first so reusing it enforces palette compliance.
- **Duplicated theme icons.** Sun/moon/device SVG paths live in every theme-related control, so any icon update must be repeated three times.【F:src/components/ui/ThemeToggle.tsx†L24-L53】【F:src/components/ui/ThemeSelector.tsx†L21-L47】【F:src/components/ui/ColorSchemeSelector.tsx†L20-L58】  
  *Fix:* Export shared `ThemeIcon`/`ColorSchemeIcon` components (or a small icon map) from a single module and reuse them across controls.
- **Status color enums stay Tailwind-bound.** Category analytics map difficulty/visibility to `bg-green-500`/`bg-red-500`, bypassing the palette's `interactive.success/warning/danger` tokens.【F:src/features/category/components/CategoryAnalytics.tsx†L313-L320】  
  *Fix:* Move these status palettes into `ColorPalettes` (e.g., `status.success`) and consume them via CSS variables or helper utilities.

## UX & Accessibility Concerns
- **Palette contrast is not enforced.** Hard-coded gray borders/text (`border-gray-300`, `text-gray-600`) in selectors and analytics lead to poor contrast on darker schemes, and focus rings stay blue regardless of palette.【F:src/components/ui/ColorSchemeSelector.tsx†L94-L145】  
  *Fix:* Adopt palette-derived neutral and focus colors; add automated contrast tests (e.g., Storybook accessibility or axe) when switching schemes.
- **Charts ignore theme backgrounds.** Chart containers default to white cards, so in dark schemes they clash with surrounding surfaces.【F:src/components/ui/Chart.tsx†L244-L248】  
  *Fix:* Let charts inherit `bg-theme-bg-primary` and `text-theme-text-primary`, or expose props so pages can wrap them in a themed `Card`.
- **Hotspot placeholders choose fixed grays.** Canvas placeholders render with gray fills/strokes that disappear on darker schemes.【F:src/features/attempt/components/HotspotAnswer.tsx†L74-L105】  
  *Fix:* Pull placeholder fill/stroke colors from the palette (e.g., `theme-bg-tertiary`, `theme-border-secondary`) via context and pass them into drawing routines.

## Architecture & Logic Issues
- **`dark:` utilities never activate.** `ThemeContext` never toggles `document.documentElement.classList.contains('dark')`, so all existing `dark:` Tailwind styles remain inactive regardless of theme selection.【F:src/context/ThemeContext.tsx†L70-L140】  
  *Fix:* In the `theme`/`resolvedTheme` effect, call `root.classList.toggle('dark', resolvedTheme === 'dark')` before applying palette CSS variables.
- **Theme changes do not reapply palettes.** `applyTheme` only runs when `colorScheme` changes, so switching between light/dark mode without touching the scheme leaves stale palette variables (e.g., staying on the blue palette when forcing dark mode).【F:src/context/ThemeContext.tsx†L91-L140】  
  *Fix:* Invoke `applyTheme(currentPalette)` whenever `resolvedTheme` flips, or split palette data into light/dark variants per scheme.
- **`root.className` replacement risks stripping classes.** Using `root.className = root.className.replace(/theme-\w+/g, '')` overwrites the entire class list, which can drop classes injected by other libraries (e.g., fonts, layout locks).【F:src/context/ThemeContext.tsx†L74-L88】  
  *Fix:* Replace it with targeted `classList.remove`/`add` calls.
- **Palette state lacks semantic tokens for info/surface variants.** Components fall back to Tailwind (`bg-cyan-600`, `bg-blue-50`) because the palette interface omits equivalents.【F:src/components/ui/Button.tsx†L30-L63】【F:src/components/ui/ColorSchemeSelector.tsx†L104-L135】  
  *Fix:* Extend `ColorPalette` with secondary surface/info shades (e.g., `info`, `neutralMuted`) and update `generateCSSVariables` + Tailwind theme extensions so components never need raw Tailwind colors.

## Recommended Remediation Workflow
1. **Expand the palette contract.** Add neutral, focus, status, and info tokens to `ColorPalettes`, generate CSS variables, and surface them through Tailwind (`theme-border-focus`, `theme-status-success`, etc.).【F:src/context/ColorPalettes.ts†L7-L222】
2. **Update `ThemeContext`.** Ensure resolved theme toggles the `dark` class, rerun `applyTheme` on any theme/color-scheme change, and guard class manipulation with `classList` helpers.【F:src/context/ThemeContext.tsx†L70-L140】
3. **Refactor primitives.** Convert `Card`, `Button`, `Table`, pagination bars, and dropdowns to consume only theme tokens so the rest of the UI inherits correct colors.【F:src/components/ui/Card.tsx†L41-L155】【F:src/components/ui/Button.tsx†L30-L63】
4. **Centralize repeated assets.** Move shared theme icons and chart color helpers into dedicated utilities, and feed them palette-driven values so feature modules stay declarative.【F:src/components/ui/ThemeToggle.tsx†L24-L53】【F:src/components/ui/Chart.tsx†L37-L248】
5. **Audit feature modules.** Replace remaining `bg-white`/`text-gray-600`/hex usage with the updated primitives or palette helpers (tags, categories, quizzes, hotspots). Add lint rules (e.g., custom ESLint plugin or lint-staged script) that flag forbidden Tailwind color classes when a theme-token alternative exists.
