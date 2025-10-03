'use client';

/**
 * UnifiedAnalyzerModal Component
 *
 * Comprehensive document and photo analyzer that supports:
 * - PDFs, images, Word docs, Excel files
 * - Smart analysis type detection
 * - Drag-and-drop file upload
 * - File previews and thumbnails
 * - Multiple analysis modes:
 *   - Smart Analysis (auto-detect)
 *   - Denial Letter Review
 *   - Estimate Comparison
 *   - Email Analysis
 *   - Full Claims Package
 */

import { useState, useRef, DragEvent } from 'react';
import { extractPDFText, isPDF } from '@/lib/client-pdf-extractor';
import { convertPDFToImages, isPDFScanned, dataUrlToFile } from '@/lib/pdf-to-image-converter';

interface UnifiedAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzed: (result: any) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'pdf' | 'document' | 'spreadsheet' | 'text' | 'unknown';
}

export default function UnifiedAnalyzerModal({ isOpen, onClose, onAnalyzed }: UnifiedAnalyzerModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [analysisType, setAnalysisType] = useState<string>('smart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [conversionProgress, setConversionProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File type detection
  const detectFileType = (file: File): UploadedFile['type'] => {
    const mimeType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|heic|heif|webp)$/.test(fileName)) {
      return 'image';
    }
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return 'pdf';
    }
    if (mimeType.includes('wordprocessingml') || /\.(docx|doc)$/.test(fileName)) {
      return 'document';
    }
    if (mimeType.includes('spreadsheetml') || /\.(xlsx|xls|csv)$/.test(fileName)) {
      return 'spreadsheet';
    }
    if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
      return 'text';
    }
    return 'unknown';
  };

  // Create preview for images
  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Handle file selection
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Validation
    if (uploadedFiles.length + fileArray.length > 20) {
      setError('Maximum 20 files allowed');
      return;
    }

    const oversizedFiles = fileArray.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Files exceed 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Process files
    const processedFiles: UploadedFile[] = await Promise.all(
      fileArray.map(async (file) => ({
        file,
        type: detectFileType(file),
        preview: await createPreview(file)
      }))
    );

    setUploadedFiles([...uploadedFiles, ...processedFiles]);
    setError('');
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove file
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  // Get file icon
  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'pdf': return '📄';
      case 'document': return '📝';
      case 'spreadsheet': return '📊';
      case 'text': return '📃';
      default: return '📎';
    }
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please upload at least one file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      // Process PDFs with smart detection
      console.log('[UnifiedAnalyzer] Processing files...');
      let pdfCount = 0;
      let pdfExtractedCount = 0;
      let pdfConvertedCount = 0;

      for (const uf of uploadedFiles) {
        if (isPDF(uf.file)) {
          pdfCount++;
          console.log('[UnifiedAnalyzer] Processing PDF:', uf.file.name);

          try {
            // First, check if PDF is scanned (no text)
            setConversionProgress(`Analyzing ${uf.file.name}...`);
            const isScanned = await isPDFScanned(uf.file);

            if (isScanned) {
              // PDF is scanned - convert to images and OCR
              console.log('[UnifiedAnalyzer] 📷 Scanned PDF detected - converting to images...');
              setConversionProgress(`Converting ${uf.file.name} to images...`);

              const conversion = await convertPDFToImages(uf.file, {
                scale: 2.0,
                maxPages: 10,
                onProgress: (page, total) => {
                  setConversionProgress(`Converting page ${page}/${total} of ${uf.file.name}...`);
                }
              });

              if (conversion.success && conversion.images.length > 0) {
                pdfConvertedCount++;
                console.log(`[UnifiedAnalyzer] ✓ Converted to ${conversion.images.length} images`);

                // Upload each page as a separate image (will be OCR'd on server)
                for (const img of conversion.images) {
                  const imgFile = dataUrlToFile(
                    img.dataUrl,
                    `${uf.file.name.replace('.pdf', '')}_page${img.pageNumber}.jpg`
                  );
                  formData.append('files', imgFile);
                }

                setConversionProgress('');
              } else {
                console.warn('[UnifiedAnalyzer] Conversion failed, uploading original PDF');
                formData.append('files', uf.file);
              }

            } else {
              // PDF has text - try extracting it
              console.log('[UnifiedAnalyzer] Text-based PDF - extracting...');
              setConversionProgress(`Extracting text from ${uf.file.name}...`);

              const extracted = await extractPDFText(uf.file);

              if (extracted.success && extracted.text.length > 50) {
                pdfExtractedCount++;
                console.log('[UnifiedAnalyzer] ✓ PDF text extracted:', extracted.text.length, 'chars');

                // Create a text file with the extracted content
                const textBlob = new Blob([extracted.text], { type: 'text/plain' });
                const textFile = new File([textBlob], uf.file.name.replace('.pdf', '.txt'), { type: 'text/plain' });
                formData.append('files', textFile);
              } else {
                console.warn('[UnifiedAnalyzer] Text extraction returned minimal content');
                formData.append('files', uf.file);
              }

              setConversionProgress('');
            }

          } catch (pdfError: any) {
            console.error('[UnifiedAnalyzer] PDF processing error:', pdfError);
            // Fallback: upload original PDF
            formData.append('files', uf.file);
            setConversionProgress('');
          }
        } else {
          // Non-PDF files go through as-is
          formData.append('files', uf.file);
        }
      }

      if (pdfCount > 0) {
        console.log(`[UnifiedAnalyzer] Processed ${pdfExtractedCount}/${pdfCount} PDFs client-side`);
      }

      // Add analysis type
      formData.append('analysisType', analysisType);

      // Call unified API
      const response = await fetch('/api/analyze/unified', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        onAnalyzed(result);
        handleClose();
      } else {
        setError(result.error || 'Analysis failed');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  // Close and reset
  const handleClose = () => {
    if (!loading) {
      setUploadedFiles([]);
      setAnalysisType('smart');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📎</span>
            Upload &amp; Analyze Documents
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:text-gray-200 text-3xl leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 mb-6 transition-all ${
              isDragging
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <div className="text-5xl mb-4">📎</div>
              <p className="text-lg font-semibold text-gray-700 mb-2">
                Drag &amp; drop files here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse
              </p>
              <div className="flex justify-center gap-4 mb-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span>📄</span> PDFs
                </span>
                <span className="flex items-center gap-1">
                  <span>🖼️</span> Images
                </span>
                <span className="flex items-center gap-1">
                  <span>📝</span> Documents
                </span>
                <span className="flex items-center gap-1">
                  <span>📊</span> Spreadsheets
                </span>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.heic,.heif,.webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={loading}
                className="hidden"
              />
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Uploaded Files ({uploadedFiles.length}/20)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {uploadedFiles.map((uf, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {uf.preview ? (
                      <img
                        src={uf.preview}
                        alt={uf.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-200 rounded text-2xl">
                        {getFileIcon(uf.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {uf.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(uf.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading}
                      className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Type Selector */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              What do you want to analyze?
            </h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="analysisType"
                  value="smart"
                  checked={analysisType === 'smart'}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-semibold text-gray-800">Smart Analysis (Auto-detect)</span>
                    <span className="ml-auto px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">DEFAULT</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">Let AI automatically detect document type and provide relevant analysis</p>
                </div>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="analysisType"
                  value="denial_letter"
                  checked={analysisType === 'denial_letter'}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❌</span>
                    <span className="font-semibold text-gray-800">Denial Letter Review</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">Extract denied items, reasons, and supplement potential</p>
                </div>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="analysisType"
                  value="estimate_comparison"
                  checked={analysisType === 'estimate_comparison'}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <span className="font-semibold text-gray-800">Estimate Comparison</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">Compare adjuster vs contractor estimates, find missing items</p>
                </div>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="analysisType"
                  value="email_analysis"
                  checked={analysisType === 'email_analysis'}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📧</span>
                    <span className="font-semibold text-gray-800">Email Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">Extract action items, deadlines, and key contact information</p>
                </div>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all">
                <input
                  type="radio"
                  name="analysisType"
                  value="claims_package"
                  checked={analysisType === 'claims_package'}
                  onChange={(e) => setAnalysisType(e.target.value)}
                  disabled={loading}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📦</span>
                    <span className="font-semibold text-gray-800">Full Claims Package</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">Comprehensive analysis of all documents and photos together</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAnalyze}
            disabled={uploadedFiles.length === 0 || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{conversionProgress || 'Analyzing...'}</span>
              </>
            ) : (
              `Analyze ${uploadedFiles.length} File${uploadedFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
