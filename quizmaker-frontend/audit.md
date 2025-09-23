# Theme System Audit

## Summary
- ✅ Theme context now toggles the `dark` class and reapplies palette variables whenever the resolved theme or scheme changes, enabling Tailwind `dark:` utilities to work again.【F:src/context/ThemeContext.tsx†L70-L128】
- ✅ The palette contract includes focus, status, neutral, and accent tokens and Tailwind exposes them as `theme-*` utilities for components to consume.【F:src/context/ColorPalettes.ts†L6-L200】【F:tailwind.config.js†L14-L85】
- ✅ Theme toggles/selectors use the new tokenized classes and draw from the centralized icon set instead of inlining SVGs.【F:src/components/ui/ThemeToggle.tsx†L6-L72】【F:src/components/ui/ThemeSelector.tsx†L6-L74】【F:src/components/ui/ColorSchemeSelector.tsx†L6-L109】【F:src/components/ui/ThemeIcons.tsx†L1-L99】
- ✅ Analytics charts now use palette-aware colors instead of hardcoded hex values and white strokes.【F:src/components/ui/Chart.tsx†L118-L175】【F:src/features/tag/components/TagAnalytics.tsx†L325-L379】【F:src/features/category/components/CategoryAnalytics.tsx†L224-L278】
- ✅ Priority feature modules now use theme tokens instead of hardcoded Tailwind neutrals.【F:src/features/question/components/HotspotEditor.tsx†L283-L338】【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】
- ✅ `applyTheme` now uses targeted `classList` operations to safely manage theme classes without clobbering other libraries' classes.【F:src/context/ThemeContext.tsx†L70-L97】
- ✅ **SIGNIFICANT PROGRESS**: Core theme infrastructure is complete, and major components have been migrated. ~80+ files still contain hardcoded colors that need migration to theme tokens.

## Completed
- Theme provider now resolves system preference, updates `resolvedTheme`, toggles `dark`, and reapplies palette CSS variables on every theme/scheme change.【F:src/context/ThemeContext.tsx†L70-L128】
- Palette definitions gained status/background/focus/neutral tokens and `generateCSSVariables` exposes them for Tailwind `theme-*` utilities.【F:src/context/ColorPalettes.ts†L6-L200】
- Tailwind config maps the palette CSS variables to utilities (`bg-theme-*`, `text-theme-*`, `focus:ring-theme-*`, etc.) so components can use them consistently.【F:tailwind.config.js†L14-L85】
- Theme toggle, selector, and color scheme selector now rely on tokenized classes and share icons via `ThemeIcons` helpers.【F:src/components/ui/ThemeToggle.tsx†L45-L68】【F:src/components/ui/ThemeSelector.tsx†L49-L72】【F:src/components/ui/ColorSchemeSelector.tsx†L60-L107】【F:src/components/ui/ThemeIcons.tsx†L19-L99】
- Shared primitives such as `Card` and `Button` render palette-driven backgrounds, borders, and focus rings, enforcing token usage where they are adopted.【F:src/components/ui/Card.tsx†L41-L111】【F:src/components/ui/Button.tsx†L26-L76】
- `applyTheme` function now uses safe `classList` operations to manage theme classes without interfering with other libraries.【F:src/context/ThemeContext.tsx†L70-L97】
- Analytics charts and visualizations now use palette-aware colors for all stroke and fill operations.【F:src/components/ui/Chart.tsx†L118-L175】【F:src/features/tag/components/TagAnalytics.tsx†L325-L379】【F:src/features/category/components/CategoryAnalytics.tsx†L224-L278】
- Priority feature modules (TagList, QuizStats, HotspotEditor) now use theme tokens instead of hardcoded Tailwind neutrals.【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】【F:src/features/question/components/HotspotEditor.tsx†L283-L338】
- Centralized status helpers provide semantic color utilities for data displays, eliminating hardcoded Tailwind shades.【F:src/utils/statusHelpers.ts†L1-L120】
- Page-level components now use primitive components (Card, Table, Button) for consistent theming and reduced code duplication.【F:src/features/tag/components/TagList.tsx†L1-L240】【F:src/features/quiz/components/QuizStats.tsx†L1-L176】

## Outstanding / Next Steps
1. ✅ ~~Replace `root.className = …` in `applyTheme` with targeted `classList` operations to avoid clobbering classes that other systems add to `<html>`.~~ **COMPLETED**【F:src/context/ThemeContext.tsx†L70-L97】
2. ✅ ~~Continue migrating analytics/visualizations to palette-aware colors (including replacing pie-slice `stroke="white"` and `#3B82F6` trend lines).~~ **COMPLETED**【F:src/components/ui/Chart.tsx†L118-L175】【F:src/features/tag/components/TagAnalytics.tsx†L325-L379】【F:src/features/category/components/CategoryAnalytics.tsx†L224-L278】
3. ✅ **SIGNIFICANT PROGRESS** ~~Audit feature modules for Tailwind defaults (`bg-white`, `border-gray-200`, `text-gray-500`, inline hex codes) and swap them to theme tokens or palette-derived helpers. Priorities include tag tables, quiz stats, and hotspot overlays.~~ **MAJOR COMPONENTS COMPLETED**【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】【F:src/features/question/components/HotspotEditor.tsx†L283-L338】【F:src/components/ui/Spinner.tsx†L18】【F:src/features/quiz/components/QuizGenerationJobs.tsx†L227-L437】【F:src/pages/QuizQuestionPage.tsx†L286-L620】【F:src/pages/LoginPage.tsx†L10-L23】【F:src/pages/RegisterPage.tsx†L15-L23】【F:src/features/attempt/components/AttemptStats.tsx†L76-L114】【F:src/components/ui/Input.tsx†L65-L103】【F:src/components/ui/Table.tsx†L130-L177】**REMAINING**: ~80+ files still need migration
4. ✅ ~~Expose semantic status helpers (success/warning/etc.) from the palette for data displays so features stop duplicating Tailwind shades like `text-green-600` and `bg-yellow-100`.~~ **COMPLETED**【F:src/components/ui/Chart.tsx†L39-L58】【F:src/features/quiz/components/QuizStats.tsx†L20-L113】
5. ⚠️ **PARTIAL** ~~Once primitives cover the palette, refactor page-level shells and tables that still use static neutrals to compose the updated `Card`, `Table`, and `Button` components for consistency.~~ **SOME COMPLETED**【F:src/features/tag/components/TagList.tsx†L122-L178】【F:src/features/quiz/components/QuizStats.tsx†L34-L120】**REMAINING**: Many pages still use hardcoded colors

## Current Status Assessment
**Core Infrastructure**: ✅ **COMPLETE** - Theme system foundation is solid
**Priority Components**: ✅ **COMPLETE** - Key components use theme tokens  
**Remaining Work**: ⚠️ **MODERATE** - ~80+ files need color migration (major components completed)

### Recently Completed ✅
- `src/pages/QuizQuestionPage.tsx` - Quiz management interface
- `src/features/quiz/components/QuizGenerationJobs.tsx` - AI generation status
- `src/components/ui/Spinner.tsx` - Loading indicators
- `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx` - Auth pages
- `src/features/attempt/components/AttemptStats.tsx` - Attempt statistics
- `src/components/ui/Input.tsx` - Form inputs
- `src/components/ui/Table.tsx` - Data tables
- `src/features/user/components/UserProfile.tsx` - User profile management
- `src/features/user/components/UserStats.tsx` - User statistics
- `src/features/user/components/UserSettings.tsx` - User settings
- `src/features/document/components/DocumentList.tsx` - Document listing
- `src/features/document/components/DocumentUpload.tsx` - Document upload
- `src/features/category/components/CategoryList.tsx` - Category listing
- `src/features/category/components/CategoryForm.tsx` - Category forms
- `src/features/attempt/components/AnswerReview.tsx` - Answer review
- `src/features/attempt/components/QuestionTiming.tsx` - Question timing
- `src/components/ui/Dropdown.tsx` - Dropdown components
- `src/components/ui/Pagination.tsx` - Pagination components

### High Priority Remaining Files
- `src/features/attempt/components/*` - Quiz attempt interfaces (partially done)
- `src/pages/QuizAttemptPage.tsx` - Main attempt interface (mostly done)
- `src/features/result/components/*` - Results display (mostly done)
- `src/features/user/components/*` - User management
- `src/features/document/components/*` - Document processing
- `src/features/category/components/*` - Category management

### Migration Strategy
1. **Batch migration by feature area** (attempts, results, auth, etc.)
2. **Use search/replace patterns** for common hardcoded colors
3. **Test each batch** to ensure theme switching works correctly
4. **Focus on user-facing components first**