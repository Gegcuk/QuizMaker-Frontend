// src/pages/DocumentListPage.tsx
// ---------------------------------------------------------------------------
// Document list page that wraps DocumentList component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '../components/layout';
import { DocumentList } from '../components/document';
import { PlusIcon } from '@heroicons/react/24/outline';

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
          href: '/documents/upload',
          icon: PlusIcon
        },

      ]}
    >
      <DocumentList />
    </PageContainer>
  );
};

export default DocumentListPage; 