/**
 * Client-Side PDF Text Extractor
 *
 * Extracts text from PDFs in the browser using PDF.js
 * Works on all devices including phones and tablets
 * No server processing required
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface PDFExtractionResult {
  success: boolean;
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extract text from a PDF file in the browser
 */
export async function extractPDFText(file: File): Promise<PDFExtractionResult> {
  try {
    console.log('[ClientPDFExtractor] Starting extraction for:', file.name);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log('[ClientPDFExtractor] File loaded, size:', uint8Array.length, 'bytes');

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    const pageCount = pdf.numPages;
    console.log('[ClientPDFExtractor] PDF loaded, pages:', pageCount);

    let fullText = '';

    // Extract text from each page
    for (let i = 1; i <= pageCount; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n\n';

        console.log(`[ClientPDFExtractor] Page ${i}/${pageCount} extracted, length:`, pageText.length);
      } catch (pageError: any) {
        console.warn(`[ClientPDFExtractor] Failed to extract page ${i}:`, pageError.message);
      }
    }

    const trimmedText = fullText.trim();

    console.log('[ClientPDFExtractor] ✓ Extraction complete');
    console.log('[ClientPDFExtractor] Total text length:', trimmedText.length);
    console.log('[ClientPDFExtractor] Preview:', trimmedText.substring(0, 200));

    return {
      success: true,
      text: trimmedText,
      pageCount,
    };

  } catch (error: any) {
    console.error('[ClientPDFExtractor] ✗ Extraction failed:', error);

    return {
      success: false,
      text: '',
      pageCount: 0,
      error: error.message || 'PDF extraction failed',
    };
  }
}

/**
 * Check if a file is a PDF
 */
export function isPDF(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}
