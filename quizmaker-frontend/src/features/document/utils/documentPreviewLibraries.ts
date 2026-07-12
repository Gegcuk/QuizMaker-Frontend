type PreviewWindow = Window & {
  pdfjsLib?: {
    GlobalWorkerOptions?: {
      workerSrc: string;
    };
  };
  mammoth?: unknown;
  JSZip?: unknown;
};

export type DocumentPreviewLibrary = 'pdf' | 'docx' | 'epub';

interface LibraryDefinition {
  label: string;
  src: string;
  isAvailable: (browserWindow: PreviewWindow) => boolean;
  configure?: (browserWindow: PreviewWindow) => void;
}

const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const LIBRARIES: Record<DocumentPreviewLibrary, LibraryDefinition> = {
  pdf: {
    label: 'PDF preview',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    isAvailable: (browserWindow) => Boolean(browserWindow.pdfjsLib),
    configure: (browserWindow) => {
      if (browserWindow.pdfjsLib?.GlobalWorkerOptions) {
        browserWindow.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
      }
    },
  },
  docx: {
    label: 'DOCX preview',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
    isAvailable: (browserWindow) => Boolean(browserWindow.mammoth),
  },
  epub: {
    label: 'EPUB preview',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    isAvailable: (browserWindow) => Boolean(browserWindow.JSZip),
  },
};

export const createDocumentPreviewLibraryLoader = (
  getDocument: () => Document = () => document,
  getWindow: () => PreviewWindow = () => window as PreviewWindow,
) => {
  const pendingLoads = new Map<DocumentPreviewLibrary, Promise<void>>();

  return async (library: DocumentPreviewLibrary): Promise<void> => {
    let browserDocument: Document;
    let browserWindow: PreviewWindow;

    try {
      browserDocument = getDocument();
      browserWindow = getWindow();
    } catch {
      throw new Error(`${LIBRARIES[library].label} is only available in a browser.`);
    }

    const definition = LIBRARIES[library];

    if (definition.isAvailable(browserWindow)) {
      definition.configure?.(browserWindow);
      return;
    }

    const pendingLoad = pendingLoads.get(library);
    if (pendingLoad) {
      return pendingLoad;
    }

    const load = new Promise<void>((resolve, reject) => {
      const script = browserDocument.createElement('script');
      script.async = true;
      script.src = definition.src;
      script.dataset.documentPreviewLibrary = library;

      const cleanupListeners = () => {
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };

      const fail = (error: Error) => {
        cleanupListeners();
        script.remove();
        pendingLoads.delete(library);
        reject(error);
      };

      const handleLoad = () => {
        if (!definition.isAvailable(browserWindow)) {
          fail(new Error(`${definition.label} loaded but is unavailable. Please reload and try again.`));
          return;
        }

        try {
          definition.configure?.(browserWindow);
          cleanupListeners();
          pendingLoads.delete(library);
          resolve();
        } catch (error) {
          fail(error instanceof Error ? error : new Error(`Unable to configure ${definition.label}.`));
        }
      };

      const handleError = () => {
        fail(new Error(`Unable to load ${definition.label}. Check your connection and try again.`));
      };

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      browserDocument.head.appendChild(script);
    });

    pendingLoads.set(library, load);
    return load;
  };
};

export const loadDocumentPreviewLibrary = createDocumentPreviewLibraryLoader();
