// src/features/document/components/FastDocumentPreviewModal.tsx
// Fast document preview using direct HTML/iframe rendering instead of canvas conversion

import React, { useState, useEffect } from 'react';
import { Button, Input, Badge, Spinner, useToast } from '@/components';
import { 
  XMarkIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

interface FastDocumentPreviewModalProps {
  file: File;
  initialSelection?: number[];
  onConfirm: (selectedPageNumbers: number[]) => void;
  onCancel: () => void;
}

interface DocumentPage {
  pageNum: number;
  content: string; // HTML or text content
  type: 'html' | 'image' | 'text';
}

export const FastDocumentPreviewModal: React.FC<FastDocumentPreviewModalProps> = ({
  file,
  initialSelection = [],
  onConfirm,
  onCancel
}) => {
  const { addToast } = useToast();
  
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPageNumbers, setSelectedPageNumbers] = useState<Set<number>>(
    initialSelection.length > 0 ? new Set(initialSelection) : new Set()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

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
      } else {
        await loadTextFile();
      }
    } catch (err: any) {
      console.error('Error loading document:', err);
      addToast({ type: 'error', message: err.message || 'Failed to load document' });
      await loadTextFile();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPDF = async () => {
    if (typeof window === 'undefined' || !(window as any).pdfjsLib) {
      throw new Error('PDF.js not loaded');
    }

    const pdfjsLib = (window as any).pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const numPages = pdf.numPages;
    const pdfPages: DocumentPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context!, viewport }).promise;
      
      pdfPages.push({
        pageNum,
        content: canvas.toDataURL(),
        type: 'image'
      });
    }

    setPages(pdfPages);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set(Array.from({ length: numPages }, (_, i) => i + 1)));
    }
    addToast({ type: 'success', message: `PDF loaded: ${numPages} pages` });
  };

  const loadImage = async () => {
    const imageUrl = URL.createObjectURL(file);
    setPages([{ pageNum: 1, content: imageUrl, type: 'image' }]);
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
    
    const result = await mammoth.convertToHtml({ 
      arrayBuffer,
      convertImage: mammoth.images.imgElement((image: any) => {
        return image.read("base64").then((imageBuffer: string) => {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    
    const html = result.value;
    const htmlPages = splitHtmlByContent(html);
    
    setPages(htmlPages);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set(Array.from({ length: htmlPages.length }, (_, i) => i + 1)));
    }
    addToast({ type: 'success', message: `DOCX loaded: ${htmlPages.length} sections` });
  };

  const loadTextFile = async () => {
    const text = await file.text();
    const textPages = splitTextByContent(text);
    
    setPages(textPages);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set(Array.from({ length: textPages.length }, (_, i) => i + 1)));
    }
    addToast({ type: 'success', message: `Text loaded: ${textPages.length} sections` });
  };

  const splitHtmlByContent = (html: string): DocumentPage[] => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elements = Array.from(tempDiv.children);
    const pages: DocumentPage[] = [];
    
    // Microsoft Word A4 page with 12pt font, normal margins: ~250-300 words = ~1500-1800 chars
    // Adjusted based on your data: 558 real pages showing as 137 = 4x too few pages
    // 5500 / 4 ≈ 1375, so let's use 1400
    const CHARS_PER_PAGE = 1400;
    let currentPageElements: Element[] = [];
    let currentPageChars = 0;
    
    for (const element of elements) {
      const elementText = element.textContent || '';
      const elementChars = elementText.length;
      const imageCount = element.getElementsByTagName('img').length;
      
      // Images take significant space: count each as ~300 characters (about 1/5 of a page)
      const effectiveChars = elementChars + (imageCount * 300);
      
      // Start new page if we exceed limit
      if (currentPageChars + effectiveChars > CHARS_PER_PAGE && currentPageElements.length > 0) {
        const pageHtml = currentPageElements.map(el => el.outerHTML).join('');
        pages.push({
          pageNum: pages.length + 1,
          content: pageHtml,
          type: 'html'
        });
        currentPageElements = [element];
        currentPageChars = effectiveChars;
      } else {
        currentPageElements.push(element);
        currentPageChars += effectiveChars;
      }
    }
    
    // Add last page
    if (currentPageElements.length > 0) {
      const pageHtml = currentPageElements.map(el => el.outerHTML).join('');
      pages.push({
        pageNum: pages.length + 1,
        content: pageHtml,
        type: 'html'
      });
    }
    
    return pages.length > 0 ? pages : [{ pageNum: 1, content: html, type: 'html' }];
  };

  const splitTextByContent = (text: string): DocumentPage[] => {
    const CHARS_PER_PAGE = 1400;
    const pages: DocumentPage[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentText = '';
    
    for (const para of paragraphs) {
      if (currentText.length + para.length > CHARS_PER_PAGE && currentText) {
        pages.push({
          pageNum: pages.length + 1,
          content: currentText,
          type: 'text'
        });
        currentText = para;
      } else {
        currentText += (currentText ? '\n\n' : '') + para;
      }
    }
    
    if (currentText) {
      pages.push({
        pageNum: pages.length + 1,
        content: currentText,
        type: 'text'
      });
    }
    
    return pages;
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
    setSelectedPageNumbers(new Set(pages.map(p => p.pageNum)));
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
      totalPages: pages.length,
      selectedPages: sortedPages,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
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
    if (!searchTerm) return pages;
    const term = searchTerm.toLowerCase();
    return pages.filter(page => 
      page.pageNum.toString().includes(term) ||
      (page.type === 'text' && page.content.toLowerCase().includes(term))
    );
  };

  const filteredPages = getFilteredPages();
  const cardScale = zoomLevel / 100;

  return (
    <div className="fixed inset-0 bg-theme-bg-overlay bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary rounded-xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl border border-theme-border-primary">
        {/* Header */}
        <div className="p-4 border-b border-theme-border-primary flex items-center justify-between bg-theme-bg-secondary rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-theme-text-primary">{file.name}</h2>
            <p className="text-sm text-theme-text-secondary mt-1">
              {selectedPageNumbers.size} of {pages.length} selected
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <XMarkIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-theme-border-primary bg-theme-bg-primary flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[150px] max-w-[300px]">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Page number..."
              size="sm"
            />
          </div>

          <div className="flex items-center gap-2 bg-theme-bg-secondary px-2 py-1 rounded-lg">
            <Button type="button" variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoomLevel <= 50}>
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-theme-text-primary min-w-[2.5rem] text-center">
              {zoomLevel}%
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoomLevel >= 200}>
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={selectAllPages}>All</Button>
          <Button type="button" variant="secondary" size="sm" onClick={deselectAllPages}>None</Button>
          <Button type="button" variant="secondary" size="sm" onClick={handleSaveSelection} disabled={selectedPageNumbers.size === 0}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
            Save ({selectedPageNumbers.size})
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-theme-bg-primary">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-theme-text-secondary text-lg">Loading document...</p>
              </div>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-theme-text-secondary">No pages match your search</p>
            </div>
          ) : (
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(250 * cardScale)}px, 1fr))`
              }}
            >
              {filteredPages.map((page) => (
                <div
                  key={page.pageNum}
                  onClick={() => togglePageSelection(page.pageNum)}
                  className={`
                    relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden
                    ${selectedPageNumbers.has(page.pageNum)
                      ? 'border-theme-interactive-primary shadow-lg ring-2 ring-theme-interactive-primary'
                      : 'border-theme-border-primary hover:border-theme-interactive-primary hover:shadow-md'
                    }
                  `}
                >
                  {/* Selection Indicator */}
                  {selectedPageNumbers.has(page.pageNum) && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-theme-bg-primary rounded-full p-0.5 shadow-lg">
                        <CheckCircleIcon className="h-7 w-7 text-theme-interactive-success" />
                      </div>
                    </div>
                  )}

                  {/* Page Number */}
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="info" size="sm">
                      Page {page.pageNum}
                    </Badge>
                  </div>

                  {/* Content Preview */}
                  <div className="bg-theme-bg-primary aspect-[8.5/11] overflow-hidden">
                    {page.type === 'image' ? (
                      <img src={page.content} alt={`Page ${page.pageNum}`} className="w-full h-full object-contain bg-white" />
                    ) : page.type === 'html' ? (
                      <div 
                        className="w-full h-full overflow-hidden p-4 bg-white"
                        style={{ fontSize: `${12 * cardScale}px`, color: '#000' }}
                        dangerouslySetInnerHTML={{ __html: page.content }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full p-4 font-mono text-xs overflow-hidden whitespace-pre-wrap bg-white"
                        style={{ fontSize: `${11 * cardScale}px`, color: '#333' }}
                      >
                        {page.content.substring(0, 800)}
                      </div>
                    )}
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
            <span className="font-semibold text-theme-text-primary">{pages.length}</span> selected
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={selectedPageNumbers.size === 0}>
              Confirm Selection ({selectedPageNumbers.size})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastDocumentPreviewModal;

