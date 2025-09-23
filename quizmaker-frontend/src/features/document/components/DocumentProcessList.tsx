// src/features/document/components/DocumentProcessList.tsx
// ---------------------------------------------------------------------------
// Component for displaying and managing document process documents
// Shows document list with status, actions, and structure management
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentProcessService } from '@/services';
import { 
  DocumentProcessViewDto, 
  DocumentStructureNodeDto,
  StructureTreeResponseDto,
  StructureFlatResponseDto,
  ExtractResponseDto
} from '@/types';
import { api } from '@/services';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Alert, Spinner } from '@/components';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  TrashIcon, 
  CogIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentMagnifyingGlassIcon,
  PlayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface DocumentProcessListProps {
  documents: DocumentProcessViewDto[];
  onDocumentUpdated?: (document: DocumentProcessViewDto) => void;
  onDocumentDeleted?: (documentId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

const DocumentProcessList: React.FC<DocumentProcessListProps> = ({
  documents,
  onDocumentUpdated,
  onDocumentDeleted,
  isLoading = false,
  error = null
}) => {
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set());
  const [documentStructures, setDocumentStructures] = useState<Record<string, DocumentStructureNodeDto[]>>({});
  const [extractedContent, setExtractedContent] = useState<Record<string, ExtractResponseDto | null>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const documentProcessService = new DocumentProcessService(api);

  const toggleDocumentExpansion = (documentId: string) => {
    const newExpanded = new Set(expandedDocuments);
    if (newExpanded.has(documentId)) {
      newExpanded.delete(documentId);
    } else {
      newExpanded.add(documentId);
    }
    setExpandedDocuments(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INGESTED':
        return <Badge variant="outline" className="text-theme-interactive-primary border-theme-interactive-primary">Ingested</Badge>;
      case 'NORMALIZED':
        return <Badge variant="outline" className="text-theme-text-primary border-theme-border-primary">Normalized</Badge>;
      case 'STRUCTURED':
        return <Badge variant="outline" className="text-theme-interactive-success border-theme-border-success">Structured</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="text-theme-interactive-danger border-theme-border-danger">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INGESTED':
        return <ClockIcon className="h-5 w-5 text-theme-interactive-info" />;
      case 'NORMALIZED':
        return <CheckCircleIcon className="h-5 w-5 text-theme-interactive-primary" />;
      case 'STRUCTURED':
        return <CheckCircleIcon className="h-5 w-5 text-theme-interactive-success" />;
      case 'FAILED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-theme-interactive-danger" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-theme-text-tertiary" />;
    }
  };

  const handleBuildStructure = async (documentId: string) => {
    setLoadingStates(prev => ({ ...prev, [documentId]: 'building' }));
    setErrors(prev => ({ ...prev, [documentId]: '' }));

    try {
      const result = await documentProcessService.buildDocumentStructure(documentId);
      
      if (result.status === 'STRUCTURED') {
        // Refresh document status
        const updatedDoc = await documentProcessService.getDocumentById(documentId);
        if (onDocumentUpdated) {
          onDocumentUpdated(updatedDoc);
        }
        
        // Load structure
        await loadDocumentStructure(documentId);
      } else {
        setErrors(prev => ({ 
          ...prev, 
          [documentId]: result.message || 'Structure building failed' 
        }));
      }
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        [documentId]: err.message || 'Failed to build structure' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [documentId]: '' }));
    }
  };

  const loadDocumentStructure = async (documentId: string) => {
    setLoadingStates(prev => ({ ...prev, [documentId]: 'loading-structure' }));
    setErrors(prev => ({ ...prev, [documentId]: '' }));

    try {
      const structure = await documentProcessService.getDocumentStructure(documentId, 'tree');
      const nodes = 'structure' in structure ? structure.structure : structure.nodes;
      setDocumentStructures(prev => ({ ...prev, [documentId]: nodes }));
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        [documentId]: err.message || 'Failed to load structure' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [documentId]: '' }));
    }
  };

  const handleExtractContent = async (documentId: string, nodeId: string) => {
    setLoadingStates(prev => ({ ...prev, [`${documentId}-${nodeId}`]: 'extracting' }));

    try {
      const content = await documentProcessService.extractContent(documentId, nodeId);
      setExtractedContent(prev => ({ 
        ...prev, 
        [`${documentId}-${nodeId}`]: content 
      }));
    } catch (err: any) {
      setErrors(prev => ({ 
        ...prev, 
        [`${documentId}-${nodeId}`]: err.message || 'Failed to extract content' 
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${documentId}-${nodeId}`]: '' }));
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      setLoadingStates(prev => ({ ...prev, [documentId]: 'deleting' }));
      
      try {
        // Note: The API documentation doesn't show a delete endpoint
        // This would need to be implemented on the backend
        if (onDocumentDeleted) {
          onDocumentDeleted(documentId);
        }
      } catch (err: any) {
        setErrors(prev => ({ 
          ...prev, 
          [documentId]: err.message || 'Failed to delete document' 
        }));
      } finally {
        setLoadingStates(prev => ({ ...prev, [documentId]: '' }));
      }
    }
  };

  const formatFileSize = (charCount?: number): string => {
    if (!charCount) return 'Unknown size';
    
    const sizeInKB = charCount / 1024;
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(1)} KB`;
    }
    const sizeInMB = sizeInKB / 1024;
    return `${sizeInMB.toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <div>
          <h3 className="text-sm font-medium">Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-theme-text-tertiary" />
            <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No documents yet</h3>
            <p className="mt-1 text-sm text-theme-text-tertiary">
              Upload your first document using the "Upload & Process" tab to get started with document processing.
            </p>
            <div className="mt-4">
              <p className="text-xs text-theme-text-tertiary">
                Documents you upload will appear here for management and structure building.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {documents.map((document) => (
        <Card key={document.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-6 w-6 text-theme-text-tertiary" />
                <div>
                                     <CardTitle className="text-lg">{document.name || `Document ${document.id.slice(0, 8)}`}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(document.status)}
                    {getStatusBadge(document.status)}
                    <span className="text-sm text-theme-text-tertiary">
                      {formatFileSize(document.charCount)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDocumentExpansion(document.id)}
                >
                  {expandedDocuments.has(document.id) ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </Button>
                
                                 {(document.status === 'INGESTED' || document.status === 'NORMALIZED') && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => handleBuildStructure(document.id)}
                     disabled={loadingStates[document.id] === 'building'}
                   >
                     {loadingStates[document.id] === 'building' ? (
                       <Spinner className="h-4 w-4" />
                     ) : (
                       <CogIcon className="h-4 w-4" />
                     )}
                     <span className="ml-1">Build Structure</span>
                   </Button>
                 )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteDocument(document.id)}
                  disabled={loadingStates[document.id] === 'deleting'}
                >
                  {loadingStates[document.id] === 'deleting' ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Error Display */}
          {errors[document.id] && (
            <div className="px-6 pb-3">
              <Alert type="error">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <p className="text-sm">{errors[document.id]}</p>
              </Alert>
            </div>
          )}

          {/* Expanded Content */}
          {expandedDocuments.has(document.id) && (
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Document Structure */}
                {document.status === 'STRUCTURED' && (
                  <div>
                    <h4 className="text-sm font-medium text-theme-text-primary mb-3">Document Structure</h4>
                    {documentStructures[document.id] ? (
                      <div className="space-y-2">
                        {documentStructures[document.id].map((node) => (
                          <div key={node.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{node.title}</h5>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {node.type}
                                  </Badge>
                                  <span className="text-xs text-theme-text-tertiary">
                                    Confidence: {(node.aiConfidence * 100).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-theme-text-tertiary">
                                    {node.endOffset - node.startOffset} chars
                                  </span>
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExtractContent(document.id, node.id)}
                                disabled={loadingStates[`${document.id}-${node.id}`] === 'extracting'}
                              >
                                {loadingStates[`${document.id}-${node.id}`] === 'extracting' ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                                )}
                                <span className="ml-1">Extract</span>
                              </Button>
                            </div>
                            
                            {/* Extracted Content */}
                            {extractedContent[`${document.id}-${node.id}`] && (
                              <div className="mt-3 p-3 bg-theme-bg-secondary rounded border border-theme-border-primary">
                                <h6 className="text-sm font-medium mb-2">Content Preview</h6>
                                <p className="text-sm text-theme-text-secondary line-clamp-3">
                                  {extractedContent[`${document.id}-${node.id}`]?.content}
                                </p>
                                <div className="mt-2 text-xs text-theme-text-tertiary">
                                  Length: {extractedContent[`${document.id}-${node.id}`]?.contentLength} characters
                                </div>
                              </div>
                            )}
                            
                            {errors[`${document.id}-${node.id}`] && (
                              <div className="mt-2">
                                <Alert type="error" className="text-xs">
                                  <ExclamationTriangleIcon className="h-3 w-3" />
                                  <p className="text-xs">{errors[`${document.id}-${node.id}`]}</p>
                                </Alert>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Button
                          variant="outline"
                          onClick={() => loadDocumentStructure(document.id)}
                          disabled={loadingStates[document.id] === 'loading-structure'}
                        >
                          {loadingStates[document.id] === 'loading-structure' ? (
                            <Spinner className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                          <span className="ml-1">Load Structure</span>
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Actions */}
                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to document viewer or open in new tab
                      window.open(`/documents/${document.id}`, '_blank');
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                    <span className="ml-1">View Document</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default DocumentProcessList;
