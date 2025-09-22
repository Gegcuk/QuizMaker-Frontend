// Centralized components exports
// This allows importing components from a single location

// UI Components
export { default as Badge } from './ui/Badge';
export { default as Button } from './ui/Button';
export { default as Input } from './ui/Input';
export { default as Alert } from './ui/Alert';
export { default as Spinner } from './ui/Spinner';
export { default as Modal } from './ui/Modal';
export { default as Card, CardHeader, CardContent, CardTitle } from './ui/Card';
export { default as Table } from './ui/Table';
export { default as Pagination } from './ui/Pagination';
export { default as Dropdown } from './ui/Dropdown';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
export { useToast } from './ui/Toast';

// Form Components
export { default as Form, useFormContext } from './ui/Form';
export { default as FormField } from './ui/FormField';

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

// Quiz Components
export * from '../features/quiz/components';

// Tag Components
export * from '../features/tag/components';

// User Components
export * from '../features/user/components';

// Result Components
export * from '../features/result/components';