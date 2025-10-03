/**
 * PDF to Image Converter
 *
 * Automatically converts scanned PDFs to images for OCR processing
 * Works in both browser (client-side) and server (Railway)
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFToImageResult {
  success: boolean;
  images: Array<{
    pageNumber: number;
    dataUrl: string; // Base64 data URL
    width: number;
    height: number;
  }>;
  totalPages: number;
  error?: string;
}

/**
 * Convert PDF to images (one image per page)
 * Works in browser using Canvas API
 */
export async function convertPDFToImages(
  file: File,
  options: {
    scale?: number; // Default 2.0 for good quality
    maxPages?: number; // Limit pages to prevent memory issues
    onProgress?: (page: number, total: number) => void;
  } = {}
): Promise<PDFToImageResult> {
  const { scale = 2.0, maxPages = 10, onProgress } = options;

  console.log('[PDFToImage] Starting PDF to image conversion');
  console.log('[PDFToImage] File:', file.name, 'Size:', file.size);

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[PDFToImage] Loading PDF document...');

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    console.log('[PDFToImage] PDF loaded, total pages:', totalPages);

    // Limit pages to prevent memory issues
    const pagesToProcess = Math.min(totalPages, maxPages);
    if (totalPages > maxPages) {
      console.warn(`[PDFToImage] Limiting to first ${maxPages} pages (total: ${totalPages})`);
    }

    const images: PDFToImageResult['images'] = [];

    // Process each page
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
      try {
        console.log(`[PDFToImage] Processing page ${pageNum}/${pagesToProcess}...`);

        // Notify progress
        if (onProgress) {
          onProgress(pageNum, pagesToProcess);
        }

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        // Convert canvas to data URL (JPEG for smaller size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

        images.push({
          pageNumber: pageNum,
          dataUrl,
          width: viewport.width,
          height: viewport.height,
        });

        console.log(`[PDFToImage] ✓ Page ${pageNum} converted (${(dataUrl.length / 1024).toFixed(1)} KB)`);

      } catch (pageError: any) {
        console.error(`[PDFToImage] Failed to process page ${pageNum}:`, pageError.message);
        // Continue with other pages
      }
    }

    console.log(`[PDFToImage] ✓ Conversion complete: ${images.length}/${pagesToProcess} pages`);

    return {
      success: true,
      images,
      totalPages,
    };

  } catch (error: any) {
    console.error('[PDFToImage] Conversion failed:', error);
    return {
      success: false,
      images: [],
      totalPages: 0,
      error: error.message || 'PDF to image conversion failed',
    };
  }
}

/**
 * Convert data URL to File object
 */
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Check if PDF likely has no text (scanned document)
 */
export async function isPDFScanned(file: File): Promise<boolean> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    // Check first page for text
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();

    const textLength = textContent.items
      .map((item: any) => item.str)
      .join('')
      .trim().length;

    console.log('[PDFToImage] First page text length:', textLength);

    // If less than 50 characters, likely scanned
    return textLength < 50;

  } catch (error) {
    console.error('[PDFToImage] Failed to check if PDF is scanned:', error);
    return true; // Assume scanned if we can't check
  }
}
