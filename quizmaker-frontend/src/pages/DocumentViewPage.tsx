// src/pages/DocumentViewPage.tsx
// ---------------------------------------------------------------------------
// Document view page that wraps DocumentViewer component with standardized layout
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader, Spinner } from '@/components';
import { DocumentViewer } from '../features/document';
import { DocumentService } from '@/services';
import { api } from '@/services';
import { DocumentDto } from '@/types';

const DocumentViewPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const documentService = new DocumentService(api);

  useEffect(() => {
    const loadDocument = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        const doc = await documentService.getDocumentById(documentId);
        setDocument(doc);
      } catch (error) {
        console.error('Failed to load document:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [documentId]);

  const documentTitle = document?.originalFilename || 'Document';

  // Always provide custom breadcrumb items to avoid showing UUID
  const breadcrumbItems = [
    { label: 'Home', path: '/my-quizzes' },
    { label: 'Documents', path: '/documents' },
    { label: documentTitle, path: `/documents/${documentId}`, isCurrent: true }
  ];

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title={documentTitle}
        subtitle="View document content and navigate through chunks"
        showBreadcrumb={true}
        customBreadcrumbItems={breadcrumbItems}
        showBackButton={true}
        backTo="/documents"
      />

      {/* Page Content with same wrapper as MyQuizzesPage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <DocumentViewer documentId={documentId!} />
        )}
      </div>
    </>
  );
};

export default DocumentViewPage;

