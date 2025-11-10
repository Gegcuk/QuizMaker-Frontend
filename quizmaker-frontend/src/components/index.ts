// Centralized components exports
// This allows importing components from a single location

// UI Components
export { default as Badge } from './ui/Badge';
export { default as Button } from './ui/Button';
export { default as Input } from './ui/Input';
export { default as Alert } from './ui/Alert';
export { default as Spinner } from './ui/Spinner';
export { default as Modal } from './ui/Modal';
export { default as Card, CardHeader, CardBody, CardFooter, CardActions } from './ui/Card';
export { default as Table } from './ui/Table';
export { default as Pagination } from './ui/Pagination';
export { default as Dropdown } from './ui/Dropdown';
export { default as SortDropdown } from './ui/SortDropdown';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
export { useToast } from './ui/Toast';
export { GroupedList } from './ui/GroupedList';
export { default as Hint } from './ui/Hint';
export type { GroupedListGroup, GroupedListProps } from './ui/GroupedList';
export type { SortOption } from './ui/SortDropdown';
export type { HintProps } from './ui/Hint';

// Form Components
export { default as Form, useFormContext } from './ui/Form';
export { default as FormField } from './ui/FormField';
export { default as InstructionsModal } from './ui/InstructionsModal';
export { default as QuestionEditorHeader } from './ui/QuestionEditorHeader';
export { default as AddItemButton } from './ui/AddItemButton';
export { default as QuestionPreviewSection } from './ui/QuestionPreviewSection';
export { default as ItemManagementContainer } from './ui/ItemManagementContainer';
export * from './ui/ThemeIcons';

// Example Components
export { default as QuizCreationForm } from './examples/QuizCreationForm';

// Layout Components
export { default as Layout } from './layout/Layout';
export { default as Navbar } from './layout/Navbar';
export { default as Sidebar } from './layout/Sidebar';
export { default as Footer } from './layout/Footer';
export { default as PageContainer } from './layout/PageContainer';
export { default as PageHeader } from './layout/PageHeader';
export { default as Breadcrumb } from './layout/Breadcrumb';
export { default as ProtectedRoute } from './layout/ProtectedRoute';

// Common Components
export { default as ConfirmationModal } from './common/ConfirmationModal';
export { default as ErrorBoundary } from './common/ErrorBoundary';
export { default as SafeContent, SafeLink } from './common/SafeContent';
export { default as InsufficientBalanceModal } from './common/InsufficientBalanceModal';

// Quiz Components
export * from '../features/quiz/components';

// Tag Components
export * from '../features/tag/components';

// User Components
export * from '../features/user/components';

// Result Components
export * from '../features/result/components';