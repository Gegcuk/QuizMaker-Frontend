// src/pages/DocumentListPage.tsx
// ---------------------------------------------------------------------------
// Document list page that wraps DocumentList component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '../components/layout';
import { DocumentList } from '../components/document';

const DocumentListPage: React.FC = () => {
  return (
    <PageContainer
      title="Document Management"
      subtitle="Upload, view, and manage your documents for quiz generation"
      showBreadcrumb={true}
      actions={[
        {
          label: 'Upload Document',
          type: 'create',
          variant: 'primary',
          href: '/documents/upload'
        },
        {
          label: 'Upload with Quiz',
          type: 'create',
          variant: 'secondary',
          href: '/documents/upload-with-quiz'
        }
      ]}
    >
      <DocumentList />
    </PageContainer>
  );
};

export default DocumentListPage; 