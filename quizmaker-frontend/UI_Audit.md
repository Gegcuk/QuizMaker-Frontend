# UI Components, Forms, and Colors Audit

Date: 2025-11-12

This report scans components/pages under `src/` for:
- Raw HTML form elements (`input`, `select`, `textarea`, `button`, `label`, `form`) used outside the custom UI library.
- Hardcoded colors (hex codes, non-theme Tailwind color utilities).
- Usage of custom UI components (from `src/components/ui`).
- Forms that use the custom `Form` vs. raw `<form>`.

---

## Summary

- TSX files scanned: 218
- Files with raw HTML elements: 112
- Total raw element occurrences: 601
- Files with direct `<form>` usage: 14
- Files using custom `<Form>`: 3
- Hardcoded color occurrences in TSX (non-theme): 14

---

## Custom UI Components Inventory and Usage

Source of exports: `src/components/ui/index.ts`

Component usage counts (outside `src/components/ui/`):

- Button: 192
- Input: 40
- Modal: 7
- Dropdown: 13
- Tooltip: 0
- Alert: 20
- Badge: 51
- Card: 30
- Spinner: 34
- ToastProvider: 1
- Hint: 2
- Tabs: 2
- TabsList: 2
- TabsTrigger: 6
- TabsContent: 6
- Table: 2
- Chart: 0
- ProgressBar: 0
- Rating: 0
- Avatar: 0
- Pagination: 1
- GroupedList: 1
- SortDropdown: 1
- Form: 3
- FormField: 11
- ValidationMessage: 0
- FileUpload: 0
- Checkbox: 0
- InstructionsModal: 8
- QuestionEditorHeader: 0
- AddItemButton: 4
- QuestionPreviewSection: 2
- ItemManagementContainer: 2
- ThemeToggle: 0
- ThemeSelector: 0
- ColorSchemeSelector: 1
- ColorSchemeDropdown: 1

Unused or rarely used components (0 count):
- Tooltip, Chart, ProgressBar, Rating, Avatar, ValidationMessage, FileUpload, Checkbox, QuestionEditorHeader, ThemeToggle, ThemeSelector

Notes:
- `Form` is used in only 3 files; many forms use raw `<form>` and raw inputs.
- `Checkbox` exists but is not used; multiple raw `<input type="checkbox">` are present in forms.

---

## Forms Audit

Files using the custom `<Form>` component:
- src/components/examples/QuizCreationForm.tsx:32
- src/features/auth/components/RegisterForm.tsx:114
- src/features/auth/components/LoginForm.tsx:71

Files using raw `<form>` (consider migrating to custom `Form` where feasible):
- src/pages/CategoryManagementPage.tsx
- src/features/user/components/UserSettings.tsx
- src/features/user/components/UserProfile.tsx
- src/features/user/components/SearchBar.tsx
- src/features/tag/components/TagManagementPage.tsx
- src/features/tag/components/TagForm.tsx
- src/features/quiz/components/TextQuizConfigurationForm.tsx
- src/features/quiz/components/QuizForm.tsx
- src/features/quiz/components/ManualQuizConfigurationForm.tsx
- src/features/quiz/components/DocumentQuizConfigurationForm.tsx
- src/features/question/components/QuestionForm.tsx
- src/features/category/components/CategoryForm.tsx
- src/features/auth/components/ResetPasswordForm.tsx
- src/features/auth/components/ForgotPasswordForm.tsx

Mixed usage examples (custom `Form` plus raw elements inside):
- src/features/auth/components/LoginForm.tsx:105,128 — raw `<button>` for toggling visibility and raw `<input type="checkbox">` for Remember Me
- src/features/auth/components/RegisterForm.tsx:179,212,235 — raw `<button>` visibility toggles and raw `<input type="checkbox">` for Terms

---

## Raw HTML Elements by File (outside `src/components/ui/`)

Count of any `<input|select|textarea|button|label|form>` per file:

- 30 src/features/quiz/components/DocumentUploadTab.tsx
- 29 src/features/quiz/components/TextGenerationTab.tsx
- 20 src/features/user/components/SearchBar.tsx
- 19 src/features/user/components/UserSettings.tsx
- 18 src/features/quiz/components/QuizManagementTab.tsx
- 17 src/features/question/components/QuestionForm.tsx
- 15 src/features/quiz/components/QuizFilters.tsx
- 15 src/features/quiz/components/QuizExportModal.tsx
- 14 src/features/document/components/DocumentUpload.tsx
- 13 src/features/quiz/components/QuizTagManager.tsx
- 13 src/features/question/components/QuestionEditor.tsx
- 12 src/features/quiz/components/QuizSettings.tsx
- 12 src/features/quiz/components/QuizConfigurationForm.tsx
- 12 src/features/quiz/components/DocumentQuizConfigurationForm.tsx
- 12 src/features/question/components/QuestionPreview.tsx
- 12 src/features/question/components/HotspotEditor.tsx
- 11 src/pages/QuizQuestionPage.tsx
- 11 src/features/quiz/components/QuizFilterDropdown.tsx
- 11 src/features/quiz/components/QuizCategoryManager.tsx
- 10 src/features/document/components/ChunkSelector.tsx
- 10 src/features/category/components/CategoryList.tsx
- 9 src/features/document/components/DocumentReprocess.tsx
- 7 src/features/user/components/UserMenu.tsx
- 7 src/features/quiz/components/TextQuizConfigurationForm.tsx
- 7 src/features/question/components/QuestionBank.tsx
- 7 src/features/question/components/ComplianceEditor.tsx
- 7 src/features/document/components/DocumentConfig.tsx
- 6 src/features/user/components/UserProfile.tsx
- 6 src/features/quiz/components/QuizSort.tsx
- 6 src/features/quiz/components/QuizShare.tsx
- 6 src/features/quiz/components/QuizAIGenerationStep.tsx
- 6 src/features/quiz/components/ManualQuizConfigurationForm.tsx
- 6 src/features/question/components/TrueFalseEditor.tsx
- 6 src/features/question/components/FillGapEditor.tsx
- 5 src/features/user/components/UserActivation.tsx
- 5 src/features/tag/components/TagSelector.tsx
- 5 src/features/tag/components/TagList.tsx
- 5 src/features/quiz/components/QuizGenerationJobs.tsx
- 5 src/features/quiz/components/QuizCard.tsx
- 5 src/features/document/components/DocumentProcessUpload.tsx
- 5 src/features/category/components/CategorySelector.tsx
- 5 src/features/billing/components/TransactionFilterDropdown.tsx
- 5 src/components/layout/Sidebar.tsx
- 4 src/pages/CategoryManagementPage.tsx
- 4 src/features/tag/components/TagManagementPage.tsx
- 4 src/features/tag/components/TagForm.tsx
- 4 src/features/result/components/QuizResultsSummaryPage.tsx
- 4 src/features/quiz/components/QuizPublishModal.tsx
- 4 src/features/quiz/components/QuizBasicInfo.tsx
- 4 src/features/category/components/CategoryForm.tsx
- 4 src/features/auth/components/RegisterForm.tsx
- 4 src/features/attempt/components/McqAnswer.tsx
- 4 src/features/attempt/components/ComplianceAnswer.tsx
- 4 src/features/attempt/components/AttemptPause.tsx
- 3 src/features/user/components/UserActivity.tsx
- 3 src/features/quiz/components/QuizList.tsx
- 3 src/features/quiz/components/QuizAnalytics.tsx
- 3 src/features/question/components/OpenQuestionEditor.tsx
- 3 src/features/question/components/McqQuestionEditor.tsx
- 3 src/features/auth/components/ResetPasswordForm.tsx
- 3 src/features/auth/components/LoginForm.tsx
- 3 src/features/attempt/components/OrderingAnswer.tsx
- 3 src/features/attempt/components/AttemptStart.tsx
- 3 src/features/attempt/components/AttemptNavigation.tsx
- 3 src/features/ai/components/GenerationProgress.tsx
- 3 src/components/layout/Navbar.tsx
- 2 src/pages/ThemeDemoPage.tsx
- 2 src/pages/MyAttemptsPage.tsx
- 2 src/features/tag/components/TagAnalytics.tsx
- 2 src/features/quiz/components/QuizQuestionManager.tsx
- 2 src/features/quiz/components/QuizPagination.tsx
- 2 src/features/quiz/components/QuizLeaderboard.tsx
- 2 src/features/quiz/components/QuizGrid.tsx
- 2 src/features/question/components/TrueFalseQuestion.tsx
- 2 src/features/question/components/QuestionTypeSelector.tsx
- 2 src/features/question/components/QuestionAnalytics.tsx
- 2 src/features/question/components/OrderingEditor.tsx
- 2 src/features/question/components/OpenQuestion.tsx
- 2 src/features/question/components/MatchingQuestionForm.tsx
- 2 src/features/category/components/CategoryAnalytics.tsx
- 2 src/features/billing/components/TransactionPagination.tsx
- 2 src/features/auth/components/EmailVerification.tsx
- 2 src/features/attempt/components/UserAttempts.tsx
- 2 src/features/attempt/components/TrueFalseAnswer.tsx
- 2 src/features/attempt/components/OpenAnswer.tsx
- 2 src/features/attempt/components/MatchingAnswer.tsx
- 2 src/features/attempt/components/FillGapAnswer.tsx
- 2 src/features/attempt/components/AttemptShuffledQuestions.tsx
- 2 src/features/attempt/components/AttemptSaveProgress.tsx
- 2 src/features/attempt/components/AttemptContinuation.tsx
- 2 src/features/attempt/components/AnswerReview.tsx
- 2 src/components/layout/PageHeader.tsx
- 2 src/components/examples/QuizCreationForm.tsx
- 2 src/components/common/ConfirmationModal.tsx
- 1 src/features/tag/components/TagCloud.tsx
- 1 src/features/quiz/components/QuizSortDropdown.tsx
- 1 src/features/quiz/components/QuizPreview.tsx
- 1 src/features/quiz/components/QuizForm.tsx
- 1 src/features/quiz/components/QuizExport.tsx
- 1 src/features/quiz/components/QuizCreationTabs.tsx
- 1 src/features/question/components/McqQuestion.tsx
- 1 src/features/question/components/FillGapQuestion.tsx
- 1 src/features/question/components/ComplianceQuestion.tsx
- 1 src/features/billing/components/TransactionSortDropdown.tsx
- 1 src/features/billing/components/TokenTopUp.tsx
- 1 src/features/auth/components/OAuthButton.tsx
- 1 src/features/auth/components/ForgotPasswordForm.tsx
- 1 src/features/attempt/components/QuestionTiming.tsx
- 1 src/features/attempt/components/HotspotAnswer.tsx
- 1 src/features/attempt/components/HintDisplay.tsx
- 1 src/features/attempt/components/AttemptBatchAnswers.tsx
- 1 src/components/common/ErrorBoundary.tsx

Breakdowns by tag type are available on request.

---

## Raw Element Breakdowns (selected)

Raw `<button>` usage (files with counts):

- 13 src/features/question/components/QuestionEditor.tsx
- 8 src/features/category/components/CategoryList.tsx
- 7 src/features/user/components/UserMenu.tsx
- 7 src/features/question/components/QuestionForm.tsx
- 6 src/features/user/components/SearchBar.tsx
- 6 src/features/quiz/components/QuizTagManager.tsx
- 6 src/features/quiz/components/QuizFilterDropdown.tsx
- 6 src/features/document/components/ChunkSelector.tsx
- 5 src/features/quiz/components/QuizShare.tsx
- 5 src/features/quiz/components/QuizGenerationJobs.tsx
- 5 src/features/quiz/components/QuizCategoryManager.tsx
- 4 src/features/tag/components/TagSelector.tsx
- 4 src/features/result/components/QuizResultsSummaryPage.tsx
- 4 src/features/quiz/components/QuizSort.tsx
- 4 src/features/quiz/components/QuizPublishModal.tsx
- 4 src/features/quiz/components/QuizManagementTab.tsx
- 4 src/features/category/components/CategorySelector.tsx
- 4 src/features/attempt/components/AttemptPause.tsx
- 4 src/components/layout/Sidebar.tsx
- 3 src/features/user/components/UserActivation.tsx
- 3 src/features/tag/components/TagList.tsx
- 3 src/features/quiz/components/QuizFilters.tsx
- 3 src/features/quiz/components/QuizCard.tsx
- 3 src/features/quiz/components/QuizAnalytics.tsx
- 3 src/features/document/components/DocumentReprocess.tsx
- 3 src/features/document/components/DocumentConfig.tsx
- 3 src/features/billing/components/TransactionFilterDropdown.tsx
- 3 src/features/attempt/components/OrderingAnswer.tsx
- 3 src/features/attempt/components/AttemptNavigation.tsx
- 3 src/features/ai/components/GenerationProgress.tsx
- 3 src/components/layout/Navbar.tsx
- 2 src/features/quiz/components/QuizQuestionManager.tsx
- 2 src/features/quiz/components/QuizLeaderboard.tsx
- 2 src/features/quiz/components/DocumentUploadTab.tsx
- 2 src/features/question/components/HotspotEditor.tsx
- 2 src/features/question/components/FillGapEditor.tsx
- 2 src/features/auth/components/ResetPasswordForm.tsx
- 2 src/features/auth/components/RegisterForm.tsx
- 2 src/features/auth/components/EmailVerification.tsx
- 2 src/features/attempt/components/UserAttempts.tsx
- 2 src/features/attempt/components/TrueFalseAnswer.tsx
- 2 src/features/attempt/components/McqAnswer.tsx
- 2 src/features/attempt/components/MatchingAnswer.tsx
- 2 src/features/attempt/components/ComplianceAnswer.tsx
- 2 src/features/attempt/components/AttemptShuffledQuestions.tsx
- 2 src/features/attempt/components/AttemptSaveProgress.tsx
- 2 src/features/attempt/components/AttemptContinuation.tsx
- 2 src/features/attempt/components/AnswerReview.tsx
- 2 src/components/layout/PageHeader.tsx
- 2 src/components/examples/QuizCreationForm.tsx
- 2 src/components/common/ConfirmationModal.tsx
- 1 src/features/tag/components/TagCloud.tsx
- 1 src/features/quiz/components/QuizSortDropdown.tsx
- 1 src/features/quiz/components/QuizPreview.tsx
- 1 src/features/quiz/components/QuizExportModal.tsx
- 1 src/features/quiz/components/QuizExport.tsx
- 1 src/features/quiz/components/QuizCreationTabs.tsx
- 1 src/features/question/components/QuestionTypeSelector.tsx
- 1 src/features/question/components/OrderingEditor.tsx
- 1 src/features/question/components/McqQuestionEditor.tsx
- 1 src/features/question/components/ComplianceEditor.tsx
- 1 src/features/billing/components/TransactionSortDropdown.tsx
- 1 src/features/billing/components/TokenTopUp.tsx
- 1 src/features/auth/components/OAuthButton.tsx
- 1 src/features/auth/components/LoginForm.tsx
- 1 src/features/attempt/components/QuestionTiming.tsx
- 1 src/features/attempt/components/OpenAnswer.tsx
- 1 src/features/attempt/components/HotspotAnswer.tsx
- 1 src/features/attempt/components/HintDisplay.tsx
- 1 src/features/attempt/components/FillGapAnswer.tsx
- 1 src/features/attempt/components/AttemptBatchAnswers.tsx
- 1 src/components/common/ErrorBoundary.tsx

Raw `<input>` usage (files with counts):

- 10 src/features/quiz/components/DocumentUploadTab.tsx
- 9 src/features/quiz/components/TextGenerationTab.tsx
- 6 src/features/user/components/UserSettings.tsx
- 6 src/features/quiz/components/QuizExportModal.tsx
- 6 src/features/question/components/QuestionPreview.tsx
- 5 src/features/question/components/HotspotEditor.tsx
- 4 src/features/user/components/SearchBar.tsx
- 4 src/features/quiz/components/QuizSettings.tsx
- 4 src/features/quiz/components/QuizFilters.tsx
- 4 src/features/question/components/TrueFalseEditor.tsx
- 3 src/features/quiz/components/QuizTagManager.tsx
- 3 src/features/quiz/components/QuizManagementTab.tsx
- 3 src/features/quiz/components/QuizCategoryManager.tsx
- 3 src/features/question/components/ComplianceEditor.tsx
- 2 src/features/user/components/UserActivation.tsx
- 2 src/features/quiz/components/QuizList.tsx
- 2 src/features/quiz/components/QuizCard.tsx
- 2 src/features/question/components/TrueFalseQuestion.tsx
- 2 src/features/question/components/QuestionBank.tsx
- 2 src/features/question/components/FillGapEditor.tsx
- 2 src/features/document/components/DocumentReprocess.tsx
- 2 src/features/document/components/ChunkSelector.tsx
- 1 src/pages/MyAttemptsPage.tsx
- 1 src/features/user/components/UserActivity.tsx
- 1 src/features/tag/components/TagSelector.tsx
- 1 src/features/tag/components/TagList.tsx
- 1 src/features/quiz/components/QuizSort.tsx
- 1 src/features/quiz/components/QuizShare.tsx
- 1 src/features/quiz/components/QuizPagination.tsx
- 1 src/features/quiz/components/QuizGrid.tsx
- 1 src/features/quiz/components/QuizConfigurationForm.tsx
- 1 src/features/quiz/components/QuizBasicInfo.tsx
- 1 src/features/quiz/components/DocumentQuizConfigurationForm.tsx
- 1 src/features/question/components/McqQuestionEditor.tsx
- 1 src/features/question/components/McqQuestion.tsx
- 1 src/features/question/components/FillGapQuestion.tsx
- 1 src/features/question/components/ComplianceQuestion.tsx
- 1 src/features/document/components/DocumentUpload.tsx
- 1 src/features/document/components/DocumentProcessUpload.tsx
- 1 src/features/document/components/DocumentConfig.tsx
- 1 src/features/category/components/CategorySelector.tsx
- 1 src/features/category/components/CategoryList.tsx
- 1 src/features/billing/components/TransactionPagination.tsx
- 1 src/features/auth/components/RegisterForm.tsx
- 1 src/features/auth/components/LoginForm.tsx
- 1 src/features/attempt/components/McqAnswer.tsx
- 1 src/features/attempt/components/FillGapAnswer.tsx
- 1 src/features/attempt/components/ComplianceAnswer.tsx
- 1 src/features/attempt/components/AttemptStart.tsx
- 1 src/components/layout/Sidebar.tsx

Raw `<select>` usage (files with counts):

- 3 src/features/user/components/UserSettings.tsx
- 3 src/features/quiz/components/TextGenerationTab.tsx
- 3 src/features/quiz/components/DocumentUploadTab.tsx
- 2 src/features/user/components/UserActivity.tsx
- 2 src/features/user/components/SearchBar.tsx
- 2 src/features/quiz/components/QuizSettings.tsx
- 2 src/features/quiz/components/QuizConfigurationForm.tsx
- 2 src/features/question/components/QuestionBank.tsx
- 1 src/pages/QuizQuestionPage.tsx
- 1 src/features/tag/components/TagList.tsx
- 1 src/features/tag/components/TagAnalytics.tsx
- 1 src/features/quiz/components/QuizFilters.tsx
- 1 src/features/quiz/components/QuizAIGenerationStep.tsx
- 1 src/features/quiz/components/DocumentQuizConfigurationForm.tsx
- 1 src/features/question/components/QuestionAnalytics.tsx
- 1 src/features/document/components/DocumentReprocess.tsx
- 1 src/features/document/components/DocumentProcessUpload.tsx
- 1 src/features/document/components/DocumentConfig.tsx
- 1 src/features/document/components/ChunkSelector.tsx
- 1 src/features/category/components/CategoryList.tsx
- 1 src/features/category/components/CategoryAnalytics.tsx

Raw `<textarea>` usage (files with counts):

- 3 src/pages/QuizQuestionPage.tsx
- 3 src/features/quiz/components/QuizManagementTab.tsx
- 3 src/features/question/components/QuestionForm.tsx
- 2 src/features/quiz/components/TextGenerationTab.tsx
- 2 src/features/question/components/OpenQuestionEditor.tsx
- 1 src/pages/ThemeDemoPage.tsx
- 1 src/pages/CategoryManagementPage.tsx
- 1 src/features/tag/components/TagManagementPage.tsx
- 1 src/features/tag/components/TagForm.tsx
- 1 src/features/quiz/components/TextQuizConfigurationForm.tsx
- 1 src/features/quiz/components/QuizTagManager.tsx
- 1 src/features/quiz/components/QuizConfigurationForm.tsx
- 1 src/features/quiz/components/QuizCategoryManager.tsx
- 1 src/features/quiz/components/QuizBasicInfo.tsx
- 1 src/features/quiz/components/QuizAIGenerationStep.tsx
- 1 src/features/quiz/components/ManualQuizConfigurationForm.tsx
- 1 src/features/quiz/components/DocumentUploadTab.tsx
- 1 src/features/question/components/QuestionPreview.tsx
- 1 src/features/question/components/OrderingEditor.tsx
- 1 src/features/question/components/OpenQuestion.tsx
- 1 src/features/question/components/McqQuestionEditor.tsx
- 1 src/features/question/components/FillGapEditor.tsx
- 1 src/features/question/components/ComplianceEditor.tsx
- 1 src/features/document/components/DocumentProcessUpload.tsx
- 1 src/features/category/components/CategoryForm.tsx
- 1 src/features/attempt/components/OpenAnswer.tsx

---

## Hardcoded Colors in Components/Pages

Hex color literals in inline SVGs:
- src/features/auth/components/OAuthButton.tsx:33 `fill="#4285F4"`
- src/features/auth/components/OAuthButton.tsx:34 `fill="#34A853"`
- src/features/auth/components/OAuthButton.tsx:35 `fill="#FBBC05"`
- src/features/auth/components/OAuthButton.tsx:36 `fill="#EA4335"`
- src/features/auth/components/OAuthButton.tsx:66 `fill="#f25022"`
- src/features/auth/components/OAuthButton.tsx:67 `fill="#00a4ef"`
- src/features/auth/components/OAuthButton.tsx:68 `fill="#7fba00"`
- src/features/auth/components/OAuthButton.tsx:69 `fill="#ffb900"`
- src/features/auth/components/LinkedAccounts.tsx:35 `fill="#4285F4"`
- src/features/auth/components/LinkedAccounts.tsx:36 `fill="#34A853"`
- src/features/auth/components/LinkedAccounts.tsx:37 `fill="#FBBC05"`
- src/features/auth/components/LinkedAccounts.tsx:38 `fill="#EA4335"`

Tailwind color utilities (non-theme):
- src/features/document/components/DocumentViewer.tsx:122 `bg-yellow-200 dark:bg-yellow-800`
- src/features/quiz/components/QuizConfigurationForm.tsx:207 `peer-focus:ring-blue-300`

Notes:
- The hex colors above are brand colors for Google/Microsoft logos; typically acceptable as exceptions.
- Consider replacing Tailwind color utilities with theme tokens/classes for consistency.

---

## Notable Findings and Suggestions

- Forms:
  - Many forms use raw `<form>` with raw inputs; consider migrating to `Form` + `FormField` to standardize validation and UI.
  - Replace raw checkboxes with the custom `Checkbox` component (unused currently), e.g., in LoginForm and RegisterForm.
  - Replace raw `<input>`/`<textarea>`/`<select>` with `Input` and `Dropdown` where applicable.
- Buttons:
  - Numerous raw `<button>` usages; prefer the custom `Button` for consistent styles and states.
- Textareas:
  - `QuizManagementTab.tsx` and several editors use raw `<textarea>`; if a custom textarea variant doesn’t exist, consider adding one to `Input` or a new `Textarea` component to centralize styles.
- Colors:
  - Replace ad-hoc Tailwind color classes with theme classes or CSS variables to align with the design system.
- Unused UI Components:
  - Tooltip, Chart, ProgressBar, Rating, Avatar, ValidationMessage, FileUpload, Checkbox, ThemeToggle, ThemeSelector appear unused; either remove if deprecated or adopt them where intended.

---

Generated by automated scan with ripgrep across `src/` (excluding `src/components/ui/` for raw element detection).
