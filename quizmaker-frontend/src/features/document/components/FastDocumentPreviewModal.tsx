// src/features/document/components/FastDocumentPreviewModal.tsx
// Fast document preview using direct HTML/iframe rendering instead of canvas conversion

import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
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
  onConfirm: (data: {
    selectedPageNumbers: number[];
    selectedContent: string;
    pages: DocumentPage[];
  }) => void;
  onCancel: () => void;
}

interface DocumentPage {
  pageNum: number;
  content: string; // HTML or text content (for display)
  textContent?: string; // Extracted text (for sending to server)
  type: 'html' | 'image' | 'text';
}

export const FastDocumentPreviewModal: React.FC<FastDocumentPreviewModalProps> = ({
  file,
  initialSelection = [],
  onConfirm,
  onCancel
}) => {
  const { addToast } = useToast();
  const imageUrlRef = useRef<string | null>(null);
  
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
    
    // Cleanup: revoke blob URLs when component unmounts or file changes
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
        imageUrlRef.current = null;
      }
    };
  }, [file]);

  const loadDocument = async () => {
    setIsLoading(true);
    try {
      if (file.type === 'application/pdf') {
        await loadPDF();
      } else if (file.type.startsWith('image/')) {
        await loadImage();
      } else if (file.type === 'application/epub+zip' || file.name.endsWith('.epub')) {
        await loadEPUB();
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
      
      // Render page to canvas for visual preview
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context!, viewport }).promise;
      
      // Extract text content from PDF page
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      
      pdfPages.push({
        pageNum,
        content: canvas.toDataURL(),
        textContent: pageText,
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
    // Revoke previous URL if it exists
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
    }
    
    const imageUrl = URL.createObjectURL(file);
    imageUrlRef.current = imageUrl; // Store for cleanup
    
    setPages([{ 
      pageNum: 1, 
      content: imageUrl, 
      textContent: '[Image file - no text content]',
      type: 'image' 
    }]);
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
    
    // Extract HTML for display
    const htmlResult = await mammoth.convertToHtml({ 
      arrayBuffer,
      convertImage: mammoth.images.imgElement((image: any) => {
        return image.read("base64").then((imageBuffer: string) => {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer
          };
        });
      })
    });
    
    // Extract raw text for sending to server
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    
    const html = htmlResult.value;
    const fullText = textResult.value;
    const htmlPages = splitHtmlByContent(html, fullText);
    
    setPages(htmlPages);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set(Array.from({ length: htmlPages.length }, (_, i) => i + 1)));
    }
    addToast({ type: 'success', message: `DOCX loaded: ${htmlPages.length} sections` });
  };

  const loadEPUB = async () => {
    if (typeof window === 'undefined' || !(window as any).JSZip) {
      throw new Error('JSZip not loaded - EPUB preview requires JSZip library');
    }

    const JSZip = (window as any).JSZip;
    const zip = new JSZip();
    const arrayBuffer = await file.arrayBuffer();
    const unzipped = await zip.loadAsync(arrayBuffer);
    
    // Find content.opf to get proper reading order
    let contentOpfFile = null;
    let contentOpfPath = '';
    for (const [path, file] of Object.entries(unzipped.files)) {
      if (path.endsWith('.opf') || path.includes('content.opf') || path.includes('package.opf')) {
        contentOpfFile = file as any;
        contentOpfPath = path;
        break;
      }
    }
    
    let htmlFiles = [];
    
    if (contentOpfFile) {
      // Parse content.opf to get reading order
      const opfContent = await contentOpfFile.async('text');
      const parser = new DOMParser();
      const opfDoc = parser.parseFromString(opfContent, 'text/xml');
      
      // Get base path for resolving relative paths
      const basePath = contentOpfPath.substring(0, contentOpfPath.lastIndexOf('/') + 1);
      
      // Get spine items (reading order)
      const spineItems = opfDoc.querySelectorAll('spine itemref');
      const manifest = opfDoc.querySelectorAll('manifest item');
      
      // Build manifest map
      const manifestMap = new Map();
      manifest.forEach((item) => {
        const id = item.getAttribute('id');
        const href = item.getAttribute('href');
        if (id && href) {
          manifestMap.set(id, basePath + href);
        }
      });
      
      // Get files in spine order
      for (const spineItem of Array.from(spineItems)) {
        const idref = spineItem.getAttribute('idref');
        if (idref && manifestMap.has(idref)) {
          const filePath = manifestMap.get(idref);
          const zipFile = unzipped.files[filePath];
          if (zipFile && !zipFile.dir) {
            htmlFiles.push({ path: filePath, file: zipFile });
          }
        }
      }
    }
    
    // Fallback: if no spine found or empty, get all HTML files
    if (htmlFiles.length === 0) {
      for (const [path, file] of Object.entries(unzipped.files)) {
        const zipFile = file as any;
        if (!zipFile.dir && (path.endsWith('.html') || path.endsWith('.xhtml') || path.endsWith('.htm'))) {
          htmlFiles.push({ path, file: zipFile });
        }
      }
      htmlFiles.sort((a, b) => a.path.localeCompare(b.path));
    }
    
    // Extract and combine all HTML content
    let combinedHtml = '';
    let combinedText = '';
    
    for (const { file: zipFile, path } of htmlFiles) {
      const content = await zipFile.async('text');
      // Extract text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const pageText = tempDiv.textContent || tempDiv.innerText || '';
      combinedText += pageText + '\n\n';
      combinedHtml += content + '<hr class="my-4"/>';
    }
    
    // Split by text content to get ~827 pages (like PDF)
    // Using 1150 chars per page (accounts for paragraph boundaries keeping pages together)
    const textPages = splitTextByContent(combinedText, 1150);
    
    // Convert text pages to HTML type (content will show as text but preserve selection)
    const allPages = textPages.map((page, idx) => ({
      pageNum: idx + 1,
      content: page.content,
      textContent: page.textContent,
      type: 'text' as const
    }));
    
    setPages(allPages);
    if (initialSelection.length === 0) {
      setSelectedPageNumbers(new Set(Array.from({ length: allPages.length }, (_, i) => i + 1)));
    }
    addToast({ type: 'success', message: `EPUB loaded: ${allPages.length} pages from ${htmlFiles.length} chapters (${Math.round(combinedText.length / 1000)}K chars)` });
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

  const splitHtmlByContent = (html: string, rawText: string, charsPerPage: number = 1400): DocumentPage[] => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    const elements = Array.from(tempDiv.children);
    const pages: DocumentPage[] = [];
    
    const CHARS_PER_PAGE = charsPerPage;
    let currentPageElements: Element[] = [];
    let currentPageChars = 0;
    let textOffset = 0;
    
    for (const element of elements) {
      const elementText = element.textContent || '';
      const elementChars = elementText.length;
      const imageCount = element.getElementsByTagName('img').length;
      
      const effectiveChars = elementChars + (imageCount * 300);
      
      if (currentPageChars + effectiveChars > CHARS_PER_PAGE && currentPageElements.length > 0) {
        const pageHtml = currentPageElements.map(el => el.outerHTML).join('');
        const pageTextLength = currentPageElements.reduce((sum, el) => sum + (el.textContent?.length || 0), 0);
        const pageText = rawText.substring(textOffset, textOffset + pageTextLength);
        
        pages.push({
          pageNum: pages.length + 1,
          content: pageHtml,
          textContent: pageText,
          type: 'html'
        });
        
        textOffset += pageTextLength;
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
      const pageText = rawText.substring(textOffset);
      
      pages.push({
        pageNum: pages.length + 1,
        content: pageHtml,
        textContent: pageText,
        type: 'html'
      });
    }
    
    return pages.length > 0 ? pages : [{ pageNum: 1, content: html, textContent: rawText, type: 'html' }];
  };

  const splitHtmlIntoPages = (html: string, text: string, charsPerPage: number = 2800): DocumentPage[] => {
    const CHARS_PER_PAGE = charsPerPage;
    const pages: DocumentPage[] = [];
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    // Use only top-level children for better performance (like DOCX does)
    const elements = Array.from(tempDiv.children);
    
    let currentHtml = '';
    let currentText = '';
    
    for (const element of elements) {
      const elementHtml = element.outerHTML;
      const elementText = element.textContent || '';
      
      // If adding this element would exceed page size, save current page
      if (currentText.length + elementText.length > CHARS_PER_PAGE && currentText) {
        pages.push({
          pageNum: pages.length + 1,
          content: `<div class="epub-page">${currentHtml}</div>`,
          textContent: currentText,
          type: 'html'
        });
        currentHtml = elementHtml;
        currentText = elementText;
      } else {
        currentHtml += elementHtml;
        currentText += elementText;
      }
    }
    
    // Add last page
    if (currentText) {
      pages.push({
        pageNum: pages.length + 1,
        content: `<div class="epub-page">${currentHtml}</div>`,
        textContent: currentText,
        type: 'html'
      });
    }
    
    return pages.length > 0 ? pages : [{ pageNum: 1, content: html, textContent: text, type: 'html' }];
  };

  const splitTextByContent = (text: string, charsPerPage: number = 1400): DocumentPage[] => {
    const CHARS_PER_PAGE = charsPerPage;
    const pages: DocumentPage[] = [];
    const paragraphs = text.split(/\n\n+/);
    
    let currentText = '';
    
    for (const para of paragraphs) {
      if (currentText.length + para.length > CHARS_PER_PAGE && currentText) {
        pages.push({
          pageNum: pages.length + 1,
          content: currentText,
          textContent: currentText, // Same for text files
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
        textContent: currentText,
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

    const sortedPageNumbers = Array.from(selectedPageNumbers).sort((a, b) => a - b);
    const selectedPages = pages.filter(p => selectedPageNumbers.has(p.pageNum));
    
    // Extract actual text content from selected pages
    const selectedContent = selectedPages.map(page => {
      // Use pre-extracted text content if available
      if (page.textContent) {
        return page.textContent;
      }
      
      if (page.type === 'html') {
        // Remove HTML tags to get clean text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = page.content;
        return tempDiv.textContent || tempDiv.innerText || '';
      } else if (page.type === 'text') {
        return page.content;
      } else {
        // For images without text, return a placeholder
        return `[Image: Page ${page.pageNum}]`;
      }
    }).join('\n\n');

    onConfirm({
      selectedPageNumbers: sortedPageNumbers,
      selectedContent,
      pages: selectedPages
    });
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
    
    // Clean up the blob URL after download (delay to ensure download starts)
    setTimeout(() => URL.revokeObjectURL(url), 100);

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
                        style={{ fontSize: `${9 * cardScale}px`, color: '#000' }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content) }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full p-3 text-xs overflow-hidden whitespace-pre-wrap bg-white leading-tight"
                        style={{ fontSize: `${8 * cardScale}px`, color: '#333' }}
                      >
                        {page.content.substring(0, 1000)}...
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

