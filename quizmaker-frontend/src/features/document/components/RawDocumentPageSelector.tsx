// src/features/document/components/RawDocumentPageSelector.tsx
// Shows raw document content without backend processing, lets users select pages visually

import React, { useState, useEffect } from 'react';
import { Button, Input, Badge, useToast } from '@/components';
import { 
  XMarkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface RawPage {
  index: number;
  content: string;
  startChar: number;
  endChar: number;
}

interface RawDocumentPageSelectorProps {
  file: File;
  onConfirm: (selectedPages: RawPage[]) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const RawDocumentPageSelector: React.FC<RawDocumentPageSelectorProps> = ({
  file,
  onConfirm,
  onCancel,
  isOpen
}) => {
  const { addToast } = useToast();
  
  const [pages, setPages] = useState<RawPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPageIndices, setSelectedPageIndices] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (isOpen && file) {
      loadDocument();
    }
  }, [isOpen, file]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      const text = await readFileAsText(file);
      
      // Split document into pages (simple approach: by paragraphs or fixed size)
      const rawPages = splitIntoPages(text);
      setPages(rawPages);
      
      // Select all by default
      const allIndices = new Set(rawPages.map(p => p.index));
      setSelectedPageIndices(allIndices);
      
      addToast({ 
        type: 'success', 
        message: `Document loaded: ${rawPages.length} sections found` 
      });
    } catch (err: any) {
      addToast({ type: 'error', message: err.message || 'Failed to load document' });
    } finally {
      setIsLoading(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // For PDFs, we'd need a PDF library here
      // For now, just read as text (works for .txt, .doc etc)
      if (file.type === 'application/pdf') {
        // In future: use PDF.js here
        addToast({ 
          type: 'info', 
          message: 'PDF preview coming soon. Showing text extraction.' 
        });
      }
      
      reader.readAsText(file);
    });
  };

  const splitIntoPages = (text: string): RawPage[] => {
    const pages: RawPage[] = [];
    const CHARS_PER_PAGE = 2000; // Approximate characters per page
    
    // Split by double line breaks (paragraphs) first
    const paragraphs = text.split(/\n\n+/);
    
    let currentPage: string[] = [];
    let currentLength = 0;
    let charOffset = 0;
    
    paragraphs.forEach((para, idx) => {
      const paraLength = para.length;
      
      // If adding this paragraph exceeds page size, save current page
      if (currentLength + paraLength > CHARS_PER_PAGE && currentPage.length > 0) {
        const pageContent = currentPage.join('\n\n');
        pages.push({
          index: pages.length,
          content: pageContent,
          startChar: charOffset,
          endChar: charOffset + pageContent.length
        });
        
        charOffset += pageContent.length;
        currentPage = [para];
        currentLength = paraLength;
      } else {
        currentPage.push(para);
        currentLength += paraLength;
      }
    });
    
    // Add last page
    if (currentPage.length > 0) {
      const pageContent = currentPage.join('\n\n');
      pages.push({
        index: pages.length,
        content: pageContent,
        startChar: charOffset,
        endChar: charOffset + pageContent.length
      });
    }
    
    return pages;
  };

  const togglePageSelection = (index: number) => {
    const newSelection = new Set(selectedPageIndices);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedPageIndices(newSelection);
  };

  const selectAllPages = () => {
    const allIndices = new Set(pages.map(p => p.index));
    setSelectedPageIndices(allIndices);
  };

  const deselectAllPages = () => {
    setSelectedPageIndices(new Set());
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleConfirm = () => {
    if (selectedPageIndices.size === 0) {
      addToast({ type: 'error', message: 'Please select at least one section' });
      return;
    }

    const selectedPages = pages.filter(p => selectedPageIndices.has(p.index));
    onConfirm(selectedPages);
  };

  const handleSavePages = () => {
    const selectedPages = pages.filter(p => selectedPageIndices.has(p.index));
    
    if (selectedPages.length === 0) {
      addToast({ type: 'error', message: 'No sections selected to save' });
      return;
    }

    const content = selectedPages.map((page, idx) => {
      return `
=================================================
SECTION ${idx + 1}
=================================================
Characters: ${page.startChar} - ${page.endChar}
Length: ${page.content.length} characters

CONTENT:
-------------------------------------------------
${page.content}

`;
    }).join('\n\n');

    const metadata = {
      fileName: file.name,
      totalSections: pages.length,
      selectedSections: selectedPages.length,
      selectedIndices: selectedPages.map(p => p.index),
      timestamp: new Date().toISOString()
    };

    const fullContent = `RAW DOCUMENT SELECTION\n${JSON.stringify(metadata, null, 2)}\n\n${content}`;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-sections-${file.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({ type: 'success', message: `Downloaded ${selectedPages.length} sections` });
  };

  const getFilteredPages = () => {
    if (!searchTerm) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter(page => page.content.toLowerCase().includes(term));
  };

  if (!isOpen) return null;

  const filteredPages = getFilteredPages();
  const cardScale = zoomLevel / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-bg-primary rounded-xl w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-theme-border-primary flex items-center justify-between bg-theme-bg-secondary rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-theme-text-primary">Select Document Sections</h2>
            <p className="text-sm text-theme-text-secondary mt-1">
              {file.name} • {selectedPageIndices.size} of {pages.length} sections selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-theme-border-primary bg-theme-bg-primary flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search content..."
              className="w-full"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-theme-bg-secondary px-3 py-2 rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium text-theme-text-primary min-w-[3rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* View Mode */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
          </div>

          {/* Selection Buttons */}
          <Button type="button" variant="secondary" size="sm" onClick={selectAllPages}>
            Select All
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={deselectAllPages}>
            Deselect All
          </Button>

          {/* Save Pages */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSavePages}
            disabled={selectedPageIndices.size === 0}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Save ({selectedPageIndices.size})
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-theme-bg-primary">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-theme-interactive-primary mx-auto mb-4"></div>
                <p className="text-theme-text-secondary text-lg">Loading document...</p>
              </div>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-theme-text-secondary">No sections match your search</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${200 * cardScale}px, 1fr))`
              }}
            >
              {filteredPages.map((page) => (
                <div
                  key={page.index}
                  onClick={() => togglePageSelection(page.index)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 transition-all duration-200
                    ${selectedPageIndices.has(page.index)
                      ? 'border-theme-interactive-primary bg-theme-bg-info shadow-lg'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:shadow-md'
                    }
                  `}
                  style={{
                    transform: selectedPageIndices.has(page.index) ? `scale(${1.05 * cardScale})` : `scale(${cardScale})`,
                    transformOrigin: 'center'
                  }}
                >
                  {/* Selection Indicator */}
                  {selectedPageIndices.has(page.index) && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircleIcon className="h-8 w-8 text-theme-interactive-success bg-white rounded-full" />
                    </div>
                  )}

                  {/* Page Preview */}
                  <div className="aspect-[8.5/11] bg-white rounded-t-lg p-4 overflow-hidden relative">
                    {/* Section number badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="info" size="sm">
                        Section {page.index + 1}
                      </Badge>
                    </div>

                    {/* Content preview */}
                    <div className="text-gray-800 text-xs leading-relaxed overflow-hidden h-full pt-8">
                      <div className="text-[10px] line-clamp-[25]">
                        {page.content}
                      </div>
                    </div>
                  </div>

                  {/* Page Info */}
                  <div className="p-3 bg-theme-bg-secondary rounded-b-lg">
                    <div className="text-xs font-medium text-theme-text-primary mb-1">
                      Section {page.index + 1}
                    </div>
                    <div className="text-[10px] text-theme-text-tertiary">
                      {page.content.length} characters
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredPages.map((page) => (
                <div
                  key={page.index}
                  onClick={() => togglePageSelection(page.index)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-4
                    ${selectedPageIndices.has(page.index)
                      ? 'border-theme-interactive-primary bg-theme-bg-info'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:bg-theme-bg-secondary'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  <div className="flex-shrink-0">
                    <CheckCircleIcon 
                      className={`h-6 w-6 ${
                        selectedPageIndices.has(page.index) 
                          ? 'text-theme-interactive-success' 
                          : 'text-theme-text-tertiary'
                      }`}
                    />
                  </div>

                  {/* Page preview thumbnail */}
                  <div className="w-16 h-20 bg-white rounded border border-gray-300 flex-shrink-0 p-1 overflow-hidden">
                    <div className="text-[6px] text-gray-700 leading-tight">
                      {page.content.substring(0, 150)}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-theme-text-primary">
                        Section {page.index + 1}
                      </h4>
                      <Badge variant="info" size="sm">
                        {page.content.length} chars
                      </Badge>
                    </div>
                    <div className="text-xs text-theme-text-secondary truncate">
                      {page.content.substring(0, 100)}...
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-theme-border-primary bg-theme-bg-secondary rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-theme-text-secondary">
            <span className="font-semibold text-theme-text-primary">{selectedPageIndices.size}</span> of{' '}
            <span className="font-semibold text-theme-text-primary">{pages.length}</span> sections selected
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirm}
              disabled={selectedPageIndices.size === 0}
            >
              Confirm Selection ({selectedPageIndices.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RawDocumentPageSelector;

