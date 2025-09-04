# Frontend UI Style Guide

This guide documents the visual and interaction standards used across the QuizMaker frontend. Follow these guidelines when building new pages and components to keep the UI consistent and maintainable.

## Core Principles

- Prefer shared UI primitives in `src/components/ui` over ad‑hoc Tailwind classes.
- Keep interaction affordances consistent (hover, focus, disabled states).
- Use semantic variants (primary, secondary, danger, success…) to convey intent.
- Use consistent spacing, borders and rounded corners to reduce visual noise.

## Design Tokens (Tailwind)

- Colors (semantic)
  - Primary: `bg-blue-600 hover:bg-blue-700` (text `text-white`)
  - Secondary: `bg-gray-600 hover:bg-gray-700` (text `text-white`)
  - Danger: `bg-red-600 hover:bg-red-700` (text `text-white`)
  - Success: `bg-green-600 hover:bg-green-700` (text `text-white`)
  - Info: `bg-cyan-600 hover:bg-cyan-700` (text `text-white`)
  - Warning: `bg-yellow-600 hover:bg-yellow-700` (text `text-white`)

- Borders & Radius
  - Borders: `border border-gray-200` (containers), `border-gray-300` (inputs)
  - Radius: default `rounded-md`, fully rounded `rounded-full` for chips/buttons as needed

- Shadows: `shadow` (light), `shadow-sm` for subtle depth; avoid heavy shadows unless needed

- Spacing: default gaps `space-y-3/4/6` and grids `gap-3/4/6`; horizontal paddings `px-4/6`

- Hover/Focus: rows use `hover:bg-gray-50`; inputs use `focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`

## Shared Components (preferred)

- Button (`src/components/ui/Button.tsx`)
  - Variants: `primary | secondary | success | danger | warning | info | outline | ghost`
  - Sizes: `sm | md | lg | xl`
  - Icon‑only: use `variant="ghost" size="sm"`, add `title` for a11y
  - Always set `type="button"` for non‑submit actions inside forms

- Badge (`src/components/ui/Badge.tsx`)
  - Variants: `primary | secondary | success | danger | warning | info | outline`
  - Sizes: `sm | md | lg`
  - Usage: status chips, difficulty/type badges, labels

- Modal (`src/components/ui/Modal.tsx`)
  - Sizes: `sm | md | lg | xl | 2xl | full`
  - Use `size="2xl"` for the question create/edit form (two‑column or large forms)

- Input (`src/components/ui/Input.tsx`)
  - Use for standard text inputs; for `textarea/select` keep Tailwind but use consistent classes

- Tabs (`src/components/ui/Tabs.tsx`)
  - Use shared Tabs for navigation within panels/pages (when applicable)

## Common Patterns

### Lists with inline actions

- Row container: `p-3 group hover:bg-gray-50 transition-colors`
- Row text: `text-sm text-gray-900 group-hover:text-indigo-700`
- Right actions: icon‑only Buttons (`variant="ghost" size="sm"`)
- Badges (type/difficulty) placed before actions; use `Badge` with:
  - Type: `variant="info"`
  - Difficulty: EASY→`success`, MEDIUM→`warning`, HARD→`danger`

### Action bars (cards/forms)

- Primary action: Button `variant="primary"`
- Secondary: `variant="secondary"`
- Destructive: `variant="danger"`
- Disabled: use `disabled` attribute (Button handles reduced opacity/interaction)

### Forms

- Labels: `block text-sm font-medium text-gray-700 mb-2`
- Inputs: use `Input` when possible; otherwise `border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`
- Sections: wrap in `bg-white shadow rounded-lg border border-gray-200`
- Spacing: use `space-y-6` within sections; `gap-6` for grid layouts

### Question creation/editing

- Modal size: `2xl`
- Type selector: tile grid (`grid grid-cols-1 sm:grid-cols-2 gap-3`), clickable tiles (button with border-2)
- Live preview: single preview at the bottom using attempt‑like Answer components:
  - MCQ → `McqAnswer` (single/multi)
  - TRUE_FALSE → `TrueFalseAnswer`
  - OPEN → `OpenAnswer`
  - FILL_GAP → `FillGapAnswer`
  - COMPLIANCE → `ComplianceAnswer`
  - ORDERING → `OrderingAnswer`
  - HOTSPOT → `HotspotAnswer`
- Editor internal previews: disabled during form use to avoid duplicates

### Attempt view parity

- When previewing a question in forms, use the attempt Answer components with `safeContent` (no correct answers). Do not reveal correct answers.

## Semantic Mappings (recommended)

Use a central mapping for consistency when converting domain to UI props.

```ts
// Difficulty → Badge variant
const difficultyToBadge = (d: 'EASY'|'MEDIUM'|'HARD') => (
  d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'danger'
);

// Question type → Human label
const typeToLabel = (t: string) => t.replace(/_/g, ' ');
```

## Accessibility

- Icon‑only buttons must have `title` and/or `aria-label`
- Maintain visible focus rings on interactive elements
- Ensure sufficient contrast for badges and text

## Do / Don’t

- Do: use `Button` and `Badge` instead of hand‑rolled Tailwind buttons/chips
- Do: set `type="button"` for non‑submit actions inside forms to prevent accidental submits
- Do: standardize hover states (`hover:bg-gray-50` for rows)
- Don’t: mix colors or one‑off styles that deviate from semantic variants
- Don’t: include multiple previews of the same content in a single view

## Examples

### Icon‑only actions in a list row

```tsx
<div className="p-3 group hover:bg-gray-50 flex items-center justify-between">
  <p className="text-sm text-gray-900 group-hover:text-indigo-700">Question text…</p>
  <div className="flex items-center space-x-2">
    <Badge variant="info" size="sm">Multiple Choice</Badge>
    <Badge variant={difficultyToBadge('MEDIUM')} size="sm">MEDIUM</Badge>
    <Button type="button" variant="ghost" size="sm" title="Edit">…</Button>
    <Button type="button" variant="ghost" size="sm" title="Delete">…</Button>
  </div>
  </div>
```

### Action bar

```tsx
<div className="flex justify-end space-x-3">
  <Button variant="secondary" type="button">Cancel</Button>
  <Button variant="primary" type="submit">Save</Button>
  <Button variant="danger" type="button">Delete</Button>
</div>
```

### Section card

```tsx
<div className="bg-white shadow rounded-lg border border-gray-200">
  <div className="px-6 py-4 border-b border-gray-200">
    <h3 className="text-lg font-medium text-gray-900">Section Title</h3>
  </div>
  <div className="px-6 py-6 space-y-6">…</div>
</div>
```

## Adoption Plan

1) Prefer `Button` and `Badge` across new work; refactor existing raw buttons/badges when touched.
2) Use the form/preview pattern documented above for all question editors.
3) Use consistent row patterns and hover states for lists.
4) Keep accessibility in mind (titles/aria‑labels for icon buttons).

## Files of Interest

- UI primitives: `src/components/ui/`
- Attempt components: `src/components/attempt/`
- Question editors: `src/components/question/`
- Quiz form tabs & lists: `src/components/quiz/`

