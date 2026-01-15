// src/pages/DocumentUploadPage.tsx
// ---------------------------------------------------------------------------
// Document upload page that wraps DocumentUpload component with standardized layout
// ---------------------------------------------------------------------------

import React from 'react';
import { PageHeader } from '@/components';
import { Seo } from '@/features/seo';
import { DocumentUpload } from '../features/document';

const DocumentUploadPage: React.FC = () => {
  return (
    <>
      <Seo title="Upload Document | Quizzence" noindex />
      {/* Page Header */}
      <PageHeader
        title="Upload Document"
        subtitle="Upload a document to process and generate quiz questions"
        showBreadcrumb={true}
        showBackButton={true}
        backTo="/documents"
      />

      {/* Page Content with same wrapper as other pages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DocumentUpload />
      </div>
    </>
  );
};

export default DocumentUploadPage; 