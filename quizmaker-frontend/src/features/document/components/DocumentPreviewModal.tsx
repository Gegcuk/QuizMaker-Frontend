// src/features/document/components/DocumentPreviewModal.tsx
// Pure document preview - shows actual PDF/images without any processing
// User selects pages visually, then we send selected pages to backend

import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Badge, useToast } from '@/components';
import { 
  XMarkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface DocumentPreviewModalProps {
  file: File;
  initialSelection?: number[];
  onConfirm: (selectedPageNumbers: number[]) => void;
  onCancel: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  file,
  initialSelection = [],
  onConfirm,
  onCancel
}) => {
  const { addToast } = useToast();
  
  const [pages, setPages] = useState<string[]>([]); // Array of page image URLs
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<Set<number>>(
    initialSelection.length > 0 ? new Set(initialSelection) : new Set()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [totalPages, setTotalPages] = useState(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    if (file) {
      loadDocument();
    }
  }, [file]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      if (file.type === 'application/pdf') {
        await loadPDF();
      } else if (file.type.startsWith('image/')) {
        await loadImage();
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        await loadDOCX();
      } else if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
        await loadDOC();
      } else {
        // For text files, show as single "page"
        await loadTextFile();
      }
    } catch (err: any) {
      console.error('Error loading document:', err);
      addToast({ type: 'error', message: err.message || 'Failed to load document' });
      // Show fallback text view
      await loadTextFile();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPDF = async () => {
    // Check if PDF.js is available
    if (typeof window === 'undefined' || !(window as any).pdfjsLib) {
      throw new Error('PDF.js not loaded');
    }

    const pdfjsLib = (window as any).pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = pdf.numPages;
    setTotalPages(numPages);
    
    // If no initial selection, select all by default
    if (initialSelection.length === 0) {
      const allPages = new Set(Array.from({ length: numPages }, (_, i) => i + 1));
      setSelectedPageNumbers(allPages);
    }

    const pageImages: string[] = [];
    canvasRefs.current = new Array(numPages);

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport }).promise;
      
      pageImages.push(canvas.toDataURL());
    }

    setPages(pageImages);
    addToast({ type: 'success', message: `PDF loaded: ${numPages} pages` });
  };

  const loadImage = async () => {
    const imageUrl = URL.createObjectURL(file);
    setPages([imageUrl]);
    setTotalPages(1);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set([1]));
    }
    addToast({ type: 'success', message: 'Image loaded' });
  };

  const loadDOCX = async () => {
    if (typeof window === 'undefined' || !(window as any).mammoth) {
      throw new Error('Mammoth.js not loaded');
    }

    const mammoth = (window as any).mammoth;
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    // Split into pages (approximately 2000 characters per page)
    const pageImages = await splitTextIntoPages(text);
    
    setPages(pageImages);
    setTotalPages(pageImages.length);
    if (initialSelection.length === 0) {
      const allPages = new Set(Array.from({ length: pageImages.length }, (_, i) => i + 1));
      setSelectedPageNumbers(allPages);
    }
    addToast({ type: 'success', message: `DOCX document loaded: ${pageImages.length} pages` });
  };

  const loadDOC = async () => {
    // Old .doc format is not easily parseable in browser
    // Show a message instead
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Legacy .DOC Format', 400, 200);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Preview not available for .doc files', 400, 250);
    ctx.fillText('Document will be processed on server', 400, 280);
    ctx.fillText('Click to include this document', 400, 310);
    
    setPages([canvas.toDataURL()]);
    setTotalPages(1);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set([1]));
    }
    addToast({ type: 'info', message: 'DOC file loaded - preview not available, but will work for quiz generation' });
  };

  const loadTextFile = async () => {
    const text = await file.text();
    
    // Split into pages
    const pageImages = await splitTextIntoPages(text);
    
    setPages(pageImages);
    setTotalPages(pageImages.length);
    if (initialSelection.length === 0) {
      const allPages = new Set(Array.from({ length: pageImages.length }, (_, i) => i + 1));
      setSelectedPageNumbers(allPages);
    }
    addToast({ type: 'success', message: `Text file loaded: ${pageImages.length} pages` });
  };

  const splitTextIntoPages = async (text: string): Promise<string[]> => {
    const CHARS_PER_PAGE = 2000;
    const LINES_PER_PAGE = 45;
    
    const pages: string[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentPageText = '';
    let currentPageLines = 0;
    
    for (const para of paragraphs) {
      const paraLines = Math.ceil(para.length / 80);
      
      // If adding this paragraph would exceed page size, create new page
      if ((currentPageText.length + para.length > CHARS_PER_PAGE || currentPageLines + paraLines > LINES_PER_PAGE) 
          && currentPageText.length > 0) {
        pages.push(await createTextPageImage(currentPageText, pages.length + 1));
        currentPageText = para;
        currentPageLines = paraLines;
      } else {
        currentPageText += (currentPageText ? '\n\n' : '') + para;
        currentPageLines += paraLines;
      }
    }
    
    // Add last page
    if (currentPageText) {
      pages.push(await createTextPageImage(currentPageText, pages.length + 1));
    }
    
    return pages.length > 0 ? pages : [await createTextPageImage(text.substring(0, 2000), 1)];
  };

  const createTextPageImage = async (text: string, pageNum: number): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 1100;
    const ctx = canvas.getContext('2d')!;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Page number at top
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`Page ${pageNum}`, 780, 20);
    
    // Content
    ctx.fillStyle = 'black';
    ctx.font = '13px Arial';
    ctx.textAlign = 'left';
    
    const lines = text.split('\n');
    let yPos = 50;
    
    for (let i = 0; i < lines.length && yPos < 1080; i++) {
      const line = lines[i];
      const wrappedLines = wrapText(ctx, line, 760);
      
      wrappedLines.forEach(wrappedLine => {
        if (yPos < 1080) {
          ctx.fillText(wrappedLine, 20, yPos);
          yPos += 18;
        }
      });
      
      yPos += 4; // Extra space between paragraphs
    }
    
    return canvas.toDataURL();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const togglePageSelection = (pageNum: number) => {
    const newSelection = new Set(selectedPageNumbers);
    if (newSelection.has(pageNum)) {
      newSelection.delete(pageNum);
    } else {
      newSelection.add(pageNum);
    }
    setSelectedPageNumbers(newSelection);
  };

  const selectAllPages = () => {
    const allPages = new Set(Array.from({ length: totalPages }, (_, i) => i + 1));
    setSelectedPageNumbers(allPages);
  };

  const deselectAllPages = () => {
    setSelectedPageNumbers(new Set());
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleConfirm = () => {
    if (selectedPageNumbers.size === 0) {
      addToast({ type: 'error', message: 'Please select at least one page' });
      return;
    }

    const sortedPages = Array.from(selectedPageNumbers).sort((a, b) => a - b);
    onConfirm(sortedPages);
  };

  const handleSaveSelection = () => {
    const sortedPages = Array.from(selectedPageNumbers).sort((a, b) => a - b);
    
    const metadata = {
      fileName: file.name,
      fileType: file.type,
      totalPages,
      selectedPages: sortedPages,
      selectedCount: sortedPages.length,
      timestamp: new Date().toISOString()
    };

    const content = JSON.stringify(metadata, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-pages-${file.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({ type: 'success', message: `Saved selection: ${sortedPages.length} pages` });
  };

  const getFilteredPages = () => {
    if (!searchTerm) return pages.map((_, i) => i + 1);
    
    // For now, just filter by page number
    const term = searchTerm.toLowerCase();
    return pages
      .map((_, i) => i + 1)
      .filter(num => num.toString().includes(term));
  };

  const filteredPageNumbers = getFilteredPages();
  const cardScale = zoomLevel / 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary rounded-xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-theme-border-primary flex items-center justify-between bg-theme-bg-secondary rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-theme-text-primary">{file.name}</h2>
            <p className="text-sm text-theme-text-secondary mt-1">
              Select pages to use for quiz generation • {selectedPageNumbers.size} of {totalPages} selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-theme-border-primary bg-theme-bg-primary flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[150px] max-w-[300px]">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Page number..."
              className="w-full"
              size="sm"
            />
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 bg-theme-bg-secondary px-2 py-1 rounded-lg">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
            >
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-theme-text-primary min-w-[2.5rem] text-center">
              {zoomLevel}%
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 200}
            >
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection Buttons */}
          <Button type="button" variant="secondary" size="sm" onClick={selectAllPages}>
            All
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={deselectAllPages}>
            None
          </Button>

          {/* Save Selection */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSaveSelection}
            disabled={selectedPageNumbers.size === 0}
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Save ({selectedPageNumbers.size})
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-theme-bg-primary">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-theme-interactive-primary mx-auto mb-4"></div>
                <p className="text-theme-text-secondary text-lg">Loading document...</p>
              </div>
            </div>
          ) : filteredPageNumbers.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-theme-text-secondary">No pages match your search</p>
            </div>
          ) : (
            <div 
              className="grid gap-4 justify-items-center"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(180 * cardScale)}px, 1fr))`
              }}
            >
              {filteredPageNumbers.map((pageNum) => (
                <div
                  key={pageNum}
                  onClick={() => togglePageSelection(pageNum)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden w-full max-w-full
                    ${selectedPageNumbers.has(pageNum)
                      ? 'border-theme-interactive-primary shadow-lg ring-2 ring-theme-interactive-primary'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:shadow-md'
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {selectedPageNumbers.has(pageNum) && (
                    <div className="absolute top-2 right-2 z-10">
                      <CheckCircleIcon className="h-7 w-7 text-white bg-theme-interactive-success rounded-full p-1 shadow-lg" />
                    </div>
                  )}

                  {/* Page Number Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="info" size="sm">
                      Page {pageNum}
                    </Badge>
                  </div>

                  {/* Page Image */}
                  <div className="bg-white w-full">
                    <img
                      src={pages[pageNum - 1]}
                      alt={`Page ${pageNum}`}
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-border-primary bg-theme-bg-secondary rounded-b-xl flex items-center justify-between">
          <div className="text-sm text-theme-text-secondary">
            <span className="font-semibold text-theme-text-primary">{selectedPageNumbers.size}</span> of{' '}
            <span className="font-semibold text-theme-text-primary">{totalPages}</span> pages selected
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleConfirm}
              disabled={selectedPageNumbers.size === 0}
            >
              Confirm Selection ({selectedPageNumbers.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;

