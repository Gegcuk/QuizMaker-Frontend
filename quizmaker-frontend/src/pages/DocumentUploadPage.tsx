// src/pages/DocumentUploadPage.tsx
// ---------------------------------------------------------------------------
// Document upload page that wraps DocumentUpload component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageContainer } from '../components/layout';
import { DocumentUpload } from '../features/document';

const DocumentUploadPage: React.FC = () => {
  return (
    <PageContainer
      title="Upload Document"
      subtitle="Upload a document to process and generate quiz questions"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/documents"
    >
      <DocumentUpload />
    </PageContainer>
  );
};

export default DocumentUploadPage; 