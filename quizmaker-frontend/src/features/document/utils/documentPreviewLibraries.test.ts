import { afterEach, describe, expect, it } from 'vitest';
import { createDocumentPreviewLibraryLoader } from './documentPreviewLibraries';

type PreviewTestWindow = Window & {
  pdfjsLib?: { GlobalWorkerOptions?: { workerSrc: string } };
  mammoth?: unknown;
};

const previewWindow = window as PreviewTestWindow;

const getScript = (library: string) =>
  document.head.querySelector<HTMLScriptElement>(`script[data-document-preview-library="${library}"]`);

afterEach(() => {
  document.head.querySelectorAll('script[data-document-preview-library]').forEach((script) => script.remove());
  delete previewWindow.pdfjsLib;
  delete previewWindow.mammoth;
});

describe('document preview library loader', () => {
  it('loads PDF.js once and configures its worker after the script becomes available', async () => {
    const loadLibrary = createDocumentPreviewLibraryLoader();

    const firstLoad = loadLibrary('pdf');
    const script = getScript('pdf');

    expect(script).toHaveAttribute(
      'src',
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    );

    previewWindow.pdfjsLib = { GlobalWorkerOptions: { workerSrc: '' } };
    script?.dispatchEvent(new Event('load'));

    await expect(firstLoad).resolves.toBeUndefined();
    expect(previewWindow.pdfjsLib.GlobalWorkerOptions?.workerSrc).toBe(
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    );

    await expect(loadLibrary('pdf')).resolves.toBeUndefined();
    expect(document.head.querySelectorAll('script[data-document-preview-library="pdf"]')).toHaveLength(1);
  });

  it('removes failed scripts so a document preview load can be retried', async () => {
    const loadLibrary = createDocumentPreviewLibraryLoader();

    const failedLoad = loadLibrary('docx');
    getScript('docx')?.dispatchEvent(new Event('error'));

    await expect(failedLoad).rejects.toThrow('Unable to load DOCX preview');
    expect(getScript('docx')).toBeNull();

    const retry = loadLibrary('docx');
    previewWindow.mammoth = {};
    getScript('docx')?.dispatchEvent(new Event('load'));

    await expect(retry).resolves.toBeUndefined();
  });
});
