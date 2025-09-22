// src/pages/DocumentProcessPage.tsx
// ---------------------------------------------------------------------------
// Document process page that provides document upload, processing, and structure management
// Implements the document process API functionality as documented
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { PageContainer, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components';
import { DocumentProcessUpload, DocumentProcessList, DocumentProcessor, DocumentProcessViewDto, DocumentProcessService } from '../features/document';
import { api } from '@/services';

const DocumentProcessPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentProcessViewDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // Note: The API doesn't provide a list endpoint, so we start with an empty list
  // Documents will be added to the list as they are uploaded

  const handleDocumentUploaded = (document: DocumentProcessViewDto) => {
    setDocuments(prev => [document, ...prev]);
  };

  const handleDocumentUpdated = (updatedDocument: DocumentProcessViewDto) => {
    setDocuments(prev => 
      prev.map(doc => 
        doc.id === updatedDocument.id ? updatedDocument : doc
      )
    );
  };

  const handleDocumentDeleted = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  return (
    <PageContainer
      title="Document Processing"
      subtitle="Upload, process, and structure documents for AI-powered analysis"
      showBreadcrumb={true}
      showBackButton={true}
      backTo="/documents"
    >
      <div className="space-y-6">
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
            <TabsTrigger value="documents">My Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <DocumentProcessUpload 
              onUploadSuccess={handleDocumentUploaded}
              onUploadError={setError}
            />
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-4">
            <DocumentProcessList 
              documents={documents}
              onDocumentUpdated={handleDocumentUpdated}
              onDocumentDeleted={handleDocumentDeleted}
              isLoading={isLoading}
              error={error}
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default DocumentProcessPage;
