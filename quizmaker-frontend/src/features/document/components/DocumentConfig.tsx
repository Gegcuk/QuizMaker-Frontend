// src/features/document/components/DocumentConfig.tsx
// ---------------------------------------------------------------------------
// Component for displaying and configuring document processing settings
// Shows current configuration and allows customization of processing parameters
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { DocumentService } from '@/services';
import { DocumentConfigDto as DocumentConfigType, ChunkingStrategy } from '@/types';
import { api } from '@/services';

interface DocumentConfigProps {
  onConfigChange?: (config: Partial<DocumentConfigType>) => void;
  className?: string;
}

const DocumentConfig: React.FC<DocumentConfigProps> = ({
  onConfigChange,
  className = ''
}) => {
  const [config, setConfig] = useState<DocumentConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<DocumentConfigType>>({});
  
  const documentService = new DocumentService(api);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const documentConfig = await documentService.getDocumentConfig();
      setConfig(documentConfig);
      setEditConfig({
        defaultStrategy: documentConfig.defaultStrategy,
        defaultMaxChunkSize: documentConfig.defaultMaxChunkSize
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load document configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onConfigChange?.(editConfig);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (config) {
      setEditConfig({
        defaultStrategy: config.defaultStrategy,
        defaultMaxChunkSize: config.defaultMaxChunkSize
      });
    }
    setIsEditing(false);
  };

  const getChunkingStrategyDescription = (strategy: ChunkingStrategy): string => {
    switch (strategy) {
      case 'AUTO':
        return 'Automatically determine the best chunking strategy based on document structure';
      case 'CHAPTER_BASED':
        return 'Split document by chapters for better topic organization';
      case 'SECTION_BASED':
        return 'Split document by sections for detailed content breakdown';
      case 'SIZE_BASED':
        return 'Split document by size limits for consistent chunk sizes';
      case 'PAGE_BASED':
        return 'Split document by page boundaries for page-based organization';
      default:
        return '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChunkingStrategyIcon = (strategy: ChunkingStrategy): string => {
    switch (strategy) {
      case 'AUTO':
        return '🤖';
      case 'CHAPTER_BASED':
        return '📖';
      case 'SECTION_BASED':
        return '📋';
      case 'SIZE_BASED':
        return '📏';
      case 'PAGE_BASED':
        return '📄';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-interactive-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Loading document configuration...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-theme-interactive-danger text-2xl mb-2">❌</div>
          <p className="text-theme-interactive-danger">{error}</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
        <div className="text-center">
          <p className="text-theme-text-secondary">No configuration available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Document Configuration</h2>
          <p className="text-theme-text-secondary">Configure document processing settings</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-theme-interactive-primary text-white rounded-md hover:bg-theme-interactive-primary focus:outline-none focus:ring-2 focus:ring-theme-interactive-primary focus:ring-offset-2 transition-colors"
          >
            Edit Configuration
          </button>
        )}
      </div>

      {/* Current Configuration */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Current Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Chunking Strategy */}
          <div className="p-4 border border-theme-border-primary rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getChunkingStrategyIcon(config.defaultStrategy as ChunkingStrategy)}</span>
              <h4 className="font-medium text-theme-text-primary">Default Chunking Strategy</h4>
            </div>
            <div className="text-sm text-theme-text-secondary mb-2">
              {config.defaultStrategy.replace('_', ' ')}
            </div>
            <div className="text-xs text-theme-text-tertiary">
              {getChunkingStrategyDescription(config.defaultStrategy as ChunkingStrategy)}
            </div>
          </div>

          {/* Default Max Chunk Size */}
          <div className="p-4 border border-theme-border-primary rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">📏</span>
              <h4 className="font-medium text-theme-text-primary">Default Max Chunk Size</h4>
            </div>
            <div className="text-2xl font-bold text-theme-interactive-primary mb-1">
              {config.defaultMaxChunkSize.toLocaleString()}
            </div>
            <div className="text-sm text-theme-text-secondary">characters</div>
          </div>
        </div>
      </div>

      {/* File Type Support */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Supported File Types</h3>
        <div className="p-4 bg-theme-bg-secondary rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium text-theme-text-secondary">PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium text-theme-text-secondary">DOCX</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium text-theme-text-secondary">TXT</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-lg">📄</span>
              <span className="text-sm font-medium text-theme-text-secondary">RTF</span>
            </div>
          </div>
        </div>
      </div>

      {/* File Size Limits */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">File Size Limits</h3>
        <div className="p-4 bg-theme-bg-info rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💾</span>
            <div>
              <div className="text-lg font-bold text-theme-text-primary">
                Maximum File Size: 130 MB
              </div>
              <div className="text-sm text-theme-interactive-primary">
                This limit applies to all uploaded documents
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Configuration Form */}
      {isEditing && (
        <div className="mb-6 p-4 bg-theme-bg-warning border border-theme-border-warning rounded-lg">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Edit Configuration</h3>
          
          <div className="space-y-4">
            {/* Chunking Strategy */}
            <div>
              <label className="block text-sm font-medium text-theme-interactive-warning mb-2">
                Default Chunking Strategy
              </label>
              <select
                value={editConfig.defaultStrategy || config.defaultStrategy}
                onChange={(e) => setEditConfig((prev: Partial<DocumentConfigType>) => ({
                  ...prev,
                  defaultStrategy: e.target.value as ChunkingStrategy
                }))}
                className="w-full px-3 py-2 border border-theme-border-warning rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-warning focus:border-theme-border-warning bg-theme-bg-primary"
              >
                <option value="AUTO">Auto - Best Strategy</option>
                <option value="CHAPTER_BASED">Chapter Based</option>
                <option value="SECTION_BASED">Section Based</option>
                <option value="SIZE_BASED">Size Based</option>
                <option value="PAGE_BASED">Page Based</option>
              </select>
              <p className="mt-1 text-xs text-theme-interactive-warning">
                {getChunkingStrategyDescription((editConfig.defaultStrategy || config.defaultStrategy) as ChunkingStrategy)}
              </p>
            </div>

            {/* Max Chunk Size */}
            <div>
              <label className="block text-sm font-medium text-theme-interactive-warning mb-2">
                Default Max Chunk Size (characters)
              </label>
              <input
                type="number"
                value={editConfig.defaultMaxChunkSize || config.defaultMaxChunkSize}
                onChange={(e) => setEditConfig((prev: Partial<DocumentConfigType>) => ({
                  ...prev,
                  defaultMaxChunkSize: parseInt(e.target.value) || config.defaultMaxChunkSize
                }))}
                min="100"
                max="10000"
                className="w-full px-3 py-2 border border-theme-border-warning rounded-md focus:outline-none focus:ring-2 focus:ring-theme-interactive-warning focus:border-theme-border-warning bg-theme-bg-primary"
              />
              <p className="mt-1 text-xs text-theme-interactive-warning">
                Recommended: 500-2000 characters for optimal quiz generation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-theme-bg-overlay text-white rounded-md hover:bg-theme-bg-overlay focus:outline-none focus:ring-2 focus:ring-theme-interactive-success focus:ring-offset-2 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-theme-bg-overlay text-white rounded-md hover:bg-theme-bg-overlay focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configuration Tips */}
      <div className="p-4 bg-theme-bg-primary border border-theme-border-primary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Configuration Tips:</h3>
        <ul className="text-sm text-theme-interactive-primary space-y-1">
          <li>• <strong>Auto Strategy:</strong> Best for most documents, automatically chooses optimal chunking</li>
          <li>• <strong>Chapter Based:</strong> Ideal for textbooks and structured documents</li>
          <li>• <strong>Section Based:</strong> Good for detailed technical documents</li>
          <li>• <strong>Size Based:</strong> Ensures consistent chunk sizes across all documents</li>
          <li>• <strong>Page Based:</strong> Useful for documents with clear page boundaries</li>
          <li>• <strong>Chunk Size:</strong> Larger chunks (1000-2000 chars) work better for comprehensive questions</li>
          <li>• <strong>Chunk Size:</strong> Smaller chunks (500-1000 chars) are better for focused, specific questions</li>
        </ul>
      </div>

      {/* Processing Information */}
      <div className="mt-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-2">Processing Information:</h3>
        <div className="space-y-1 text-sm text-theme-text-secondary">
          <div>• Configuration changes apply to new document uploads</div>
          <div>• Existing documents retain their original processing settings</div>
          <div>• You can reprocess existing documents with new settings</div>
          <div>• Processing time depends on document size and chosen strategy</div>
        </div>
      </div>
    </div>
  );
};

export default DocumentConfig; 