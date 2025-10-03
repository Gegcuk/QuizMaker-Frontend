// src/features/document/components/DocumentList.tsx
// ---------------------------------------------------------------------------
// Document list component for viewing and managing uploaded documents.
// Features:
// • Display all documents with pagination
// • Search and filter documents
// • Document status indicators
// • Actions: view, reprocess, delete
// • Integration with document service
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { DocumentService } from '@/services';
import { DocumentDto } from '@/types';
import { 
  Button, 
  Input, 
  Modal, 
  Dropdown, 
  Alert, 
  Badge, 
  Card, 
  Spinner,
  Table,
  Pagination
} from '@/components';
import { api } from '@/services';

interface DocumentListProps {
  className?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ className = '' }) => {
  const documentService = new DocumentService(api);
  const [allDocuments, setAllDocuments] = useState<DocumentDto[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<DocumentDto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 10;

  // Load documents only once on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Filter documents locally when search or status filter changes
  useEffect(() => {
    filterDocuments();
  }, [allDocuments, searchQuery, statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await documentService.getDocuments({
        page: 0, // Get all documents
        size: 1000 // Large size to get all documents
      });
      
      setAllDocuments(response.content);
    } catch (err) {
      setError('Failed to load documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...allDocuments];
    
    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredDocuments(filtered);
    
    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / pageSize);
    setTotalPages(totalPages);
  };

  const getPaginatedDocuments = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredDocuments.slice(startIndex, endIndex);
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;
    
    try {
      setDeleting(true);
      await documentService.deleteDocument(selectedDocument.id);
      setShowDeleteModal(false);
      setSelectedDocument(null);
      
      // Update local state instead of reloading from backend
      setAllDocuments(prev => prev.filter(doc => doc.id !== selectedDocument.id));
    } catch (err) {
      setError('Failed to delete document');
      console.error('Error deleting document:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleReprocess = async (documentId: string) => {
    try {
      await documentService.reprocessDocument(documentId, {
        chunkingStrategy: 'AUTO',
        maxChunkSize: 5000,
        storeChunks: true
      });
      
      // Update the document status locally
      setAllDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, status: 'PROCESSING' } : doc
      ));
    } catch (err) {
      setError('Failed to reprocess document');
      console.error('Error reprocessing document:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <DocumentArrowUpIcon className="h-5 w-5 text-theme-interactive-info" />;
      case 'PROCESSING':
        return <ClockIcon className="h-5 w-5 text-theme-interactive-warning" />;
      case 'PROCESSED':
        return <CheckCircleIcon className="h-5 w-5 text-theme-interactive-success" />;
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-theme-interactive-danger" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-theme-text-tertiary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UPLOADED':
        return <Badge variant="info">Uploaded</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">Processing</Badge>;
      case 'PROCESSED':
        return <Badge variant="success">Processed</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const columns = [
    {
      key: 'title',
      header: 'Document',
      render: (document: DocumentDto) => (
        <div className="flex items-center space-x-3">
          <DocumentTextIcon className="h-8 w-8 text-theme-text-tertiary" />
          <div>
            <div className="font-medium text-theme-text-primary">{document?.title || document?.originalFilename || 'Untitled Document'}</div>
            <div className="text-sm text-theme-text-tertiary">{document?.originalFilename || 'Unknown file'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (document: DocumentDto) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(document?.status || 'UPLOADED')}
          {getStatusBadge(document?.status || 'UPLOADED')}
        </div>
      )
    },
    {
      key: 'details',
      header: 'Details',
      render: (document: DocumentDto) => (
        <div className="text-sm text-theme-text-secondary">
          <div>{formatFileSize(document?.fileSize || 0)}</div>
          <div>{document?.totalPages || 0} pages</div>
          <div>{document?.totalChunks || 0} chunks</div>
        </div>
      )
    },
    {
      key: 'uploadedAt',
      header: 'Uploaded',
      render: (document: DocumentDto) => (
        <div className="text-sm text-theme-text-secondary">
          {document?.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString() : 'Unknown'}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (document: DocumentDto) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/documents/${document?.id}`}
            className="p-2 text-theme-interactive-primary hover:text-theme-interactive-info hover:bg-theme-bg-info rounded-md transition-colors"
            title="View document"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
          
          {document?.status === 'FAILED' && (
            <button
              onClick={() => handleReprocess(document.id)}
              className="p-2 text-theme-interactive-warning hover:text-theme-interactive-warning hover:bg-theme-bg-warning rounded-md transition-colors"
              title="Reprocess document"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => {
              setSelectedDocument(document);
              setShowDeleteModal(true);
            }}
            className="p-2 text-theme-interactive-danger hover:text-theme-interactive-danger hover:bg-theme-bg-danger rounded-md transition-colors"
            title="Delete document"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading && allDocuments.length === 0) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>

      {/* Error Alert */}
      {error && (
        <Alert type="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-theme-text-tertiary" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
           <div className="flex items-center space-x-2">
             <FunnelIcon className="h-5 w-5 text-theme-text-tertiary" />
             <Dropdown
               options={[
                 { value: 'ALL', label: 'All Status' },
                 { value: 'UPLOADED', label: 'Uploaded' },
                 { value: 'PROCESSING', label: 'Processing' },
                 { value: 'PROCESSED', label: 'Processed' },
                 { value: 'FAILED', label: 'Failed' }
               ]}
               value={statusFilter}
               onChange={(value) => setStatusFilter(value as string)}
               size="md"
               className="w-32 min-w-32 max-w-32"
             />
           </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <Table
          data={getPaginatedDocuments()}
          columns={columns}
          emptyMessage="No documents found"
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to delete "{selectedDocument?.title || selectedDocument?.originalFilename}"?
            This action cannot be undone.
          </p>
          
          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentList; 