'use client';

/**
 * Document Analyzer Page
 *
 * Comprehensive document analysis interface supporting:
 * - Multi-file drag-and-drop upload
 * - PDFs, Word, Excel, Text, and Images
 * - AI-powered document analysis
 * - Insurance data extraction
 * - Export results as PDF report
 */

import { useState, useRef, DragEvent } from 'react';
import { jsPDF } from 'jspdf';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

interface AnalysisResult {
  success: boolean;
  timestamp: string;
  documentsProcessed: number;
  successfulProcessing: number;
  totalSize: number;
  documents: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    preview?: string;
    success: boolean;
    error?: string;
    metadata: any;
    processingTime: number;
  }>;
  insuranceData: {
    claimNumber?: string;
    policyNumber?: string;
    insuranceCompany?: string;
    adjusterName?: string;
    adjusterPhone?: string;
    adjusterEmail?: string;
    dateOfLoss?: string;
    propertyAddress?: string;
    estimatedAmount?: string;
    approvedAmount?: string;
    deductible?: string;
  };
  analysis: {
    summary: string;
    keyFindings: string[];
    damageDescriptions: string[];
    claimRelevantInfo: string[];
    recommendations: string[];
  };
  combinedText: string;
  error?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentAnalyzerPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILES = 20;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`File ${file.name} exceeds 10MB limit`);
        continue;
      }

      // Check total files
      if (files.length + newFiles.length >= MAX_FILES) {
        alert(`Maximum ${MAX_FILES} files allowed`);
        break;
      }

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${i}`,
        file,
        status: 'pending'
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setFiles(prevFiles => [...prevFiles]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    }

    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setAnalysisResult(null);
    setPropertyAddress('');
    setClaimDate('');
    setAdditionalNotes('');
  };

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  const analyzeDocuments = async () => {
    if (files.length === 0) {
      alert('Please upload at least one file');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Update all files to processing
      setFiles(files.map(f => ({ ...f, status: 'processing' })));

      // Prepare form data
      const formData = new FormData();

      files.forEach((uploadedFile, index) => {
        formData.append(`file${index}`, uploadedFile.file);
      });

      if (propertyAddress) formData.append('propertyAddress', propertyAddress);
      if (claimDate) formData.append('claimDate', claimDate);
      if (additionalNotes) formData.append('additionalNotes', additionalNotes);

      // Call API
      const response = await fetch('/api/analyze/documents', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Update file statuses
      setFiles(files.map(f => ({ ...f, status: 'success' })));
      setAnalysisResult(result);

    } catch (error: any) {
      console.error('Analysis error:', error);
      alert(`Analysis failed: ${error.message}`);
      setFiles(files.map(f => ({ ...f, status: 'error', error: error.message })));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================================================
  // EXPORT TO PDF
  // ============================================================================

  const exportToPDF = () => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    let yPos = 20;
    const lineHeight = 7;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      if (yPos > pageHeight - margin) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(fontSize);
      doc.text(text, margin, yPos);
      yPos += lineHeight;
    };

    // Title
    doc.setFontSize(18);
    doc.text('Insurance Document Analysis Report', margin, yPos);
    yPos += lineHeight * 2;

    // Date
    addText(`Generated: ${new Date().toLocaleString()}`, 10);
    yPos += lineHeight;

    // Insurance Data
    if (Object.keys(analysisResult.insuranceData).length > 0) {
      addText('CLAIM INFORMATION', 14, true);
      yPos += lineHeight * 0.5;

      const data = analysisResult.insuranceData;
      if (data.claimNumber) addText(`Claim Number: ${data.claimNumber}`);
      if (data.policyNumber) addText(`Policy Number: ${data.policyNumber}`);
      if (data.insuranceCompany) addText(`Insurance Company: ${data.insuranceCompany}`);
      if (data.propertyAddress) addText(`Property: ${data.propertyAddress}`);
      if (data.dateOfLoss) addText(`Date of Loss: ${data.dateOfLoss}`);
      if (data.adjusterName) addText(`Adjuster: ${data.adjusterName}`);
      if (data.adjusterPhone) addText(`Adjuster Phone: ${data.adjusterPhone}`);
      if (data.estimatedAmount) addText(`Estimated Amount: ${data.estimatedAmount}`);
      if (data.approvedAmount) addText(`Approved Amount: ${data.approvedAmount}`);
      if (data.deductible) addText(`Deductible: ${data.deductible}`);

      yPos += lineHeight;
    }

    // Summary
    if (analysisResult.analysis.summary) {
      addText('ANALYSIS SUMMARY', 14, true);
      yPos += lineHeight * 0.5;
      const lines = doc.splitTextToSize(analysisResult.analysis.summary, 170);
      lines.forEach((line: string) => addText(line, 11));
      yPos += lineHeight;
    }

    // Key Findings
    if (analysisResult.analysis.keyFindings.length > 0) {
      addText('KEY FINDINGS', 14, true);
      yPos += lineHeight * 0.5;
      analysisResult.analysis.keyFindings.forEach((finding, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${finding}`, 170);
        lines.forEach((line: string) => addText(line, 11));
      });
      yPos += lineHeight;
    }

    // Damage Descriptions
    if (analysisResult.analysis.damageDescriptions.length > 0) {
      addText('DAMAGE DESCRIPTIONS', 14, true);
      yPos += lineHeight * 0.5;
      analysisResult.analysis.damageDescriptions.forEach((damage, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${damage}`, 170);
        lines.forEach((line: string) => addText(line, 11));
      });
      yPos += lineHeight;
    }

    // Recommendations
    if (analysisResult.analysis.recommendations.length > 0) {
      addText('RECOMMENDATIONS', 14, true);
      yPos += lineHeight * 0.5;
      analysisResult.analysis.recommendations.forEach((rec, idx) => {
        const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, 170);
        lines.forEach((line: string) => addText(line, 11));
      });
    }

    // Save PDF
    doc.save(`claim-analysis-${Date.now()}.pdf`);
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'txt': return '📃';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'heic':
      case 'webp': return '🖼️';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Document Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Multi-Format Document Analysis for Insurance Claims
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by <span className="font-semibold text-purple-600">Susan AI</span>
          </p>
        </div>

        {/* Supported Formats */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-3 justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="font-semibold">Supported:</span>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">📄 PDF</span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">📝 Word</span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">📊 Excel</span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">📃 Text</span>
            <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">🖼️ Images</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">

            {/* Drag & Drop Upload Zone */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Documents</h2>

              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <div className="text-6xl mb-4">📁</div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drag & drop files here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <p className="text-xs text-gray-400">
                  Max {MAX_FILES} files, 10MB each
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.jpg,.jpeg,.png,.heic,.heif,.webp"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">
                      Uploaded Files ({files.length})
                    </h3>
                    <button
                      onClick={clearAll}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {files.map(uploadedFile => (
                      <div
                        key={uploadedFile.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {/* Preview/Icon */}
                        {uploadedFile.preview ? (
                          <img
                            src={uploadedFile.preview}
                            alt={uploadedFile.file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="text-3xl">
                            {getFileIcon(uploadedFile.file.name)}
                          </div>
                        )}

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                        </div>

                        {/* Status */}
                        <div className="flex items-center gap-2">
                          {uploadedFile.status === 'processing' && (
                            <span className="text-blue-600 text-sm">Processing...</span>
                          )}
                          {uploadedFile.status === 'success' && (
                            <span className="text-green-600 text-xl">✓</span>
                          )}
                          {uploadedFile.status === 'error' && (
                            <span className="text-red-600 text-xl">✗</span>
                          )}
                          <button
                            onClick={() => removeFile(uploadedFile.id)}
                            className="text-gray-400 hover:text-red-600 text-xl"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Optional Context */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Additional Context (Optional)</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property Address
                  </label>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="123 Main St, City, State ZIP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Claim/Loss Date
                  </label>
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional context for the AI analysis..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeDocuments}
              disabled={files.length === 0 || isAnalyzing}
              className={`w-full py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-all ${
                files.length === 0 || isAnalyzing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Analyzing Documents...
                </span>
              ) : (
                `Analyze ${files.length} Document${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">

            {analysisResult ? (
              <>
                {/* Success Header */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">✓</span>
                      <div>
                        <h3 className="font-bold text-green-900">Analysis Complete</h3>
                        <p className="text-sm text-green-700">
                          {analysisResult.successfulProcessing}/{analysisResult.documentsProcessed} documents processed
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={exportToPDF}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Export PDF
                    </button>
                  </div>
                </div>

                {/* Insurance Data */}
                {Object.keys(analysisResult.insuranceData).length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Extracted Claim Information</h2>
                    <div className="grid grid-cols-1 gap-3">
                      {Object.entries(analysisResult.insuranceData).map(([key, value]) => {
                        if (!value) return null;
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key} className="flex justify-between items-start p-2 hover:bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-600">{label}:</span>
                            <span className="text-sm text-gray-900 font-semibold">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AI Analysis Summary */}
                {analysisResult.analysis.summary && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Summary</h2>
                    <p className="text-gray-700 leading-relaxed">{analysisResult.analysis.summary}</p>
                  </div>
                )}

                {/* Key Findings */}
                {analysisResult.analysis.keyFindings.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Key Findings</h2>
                    <ul className="space-y-2">
                      {analysisResult.analysis.keyFindings.map((finding, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-gray-700">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Damage Descriptions */}
                {analysisResult.analysis.damageDescriptions.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Damage Descriptions</h2>
                    <ul className="space-y-2">
                      {analysisResult.analysis.damageDescriptions.map((damage, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="text-gray-700">{damage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.analysis.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
                    <ul className="space-y-2">
                      {analysisResult.analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600 font-bold">→</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Processed Documents */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Processed Documents</h2>
                  <div className="space-y-2">
                    {analysisResult.documents.map((doc, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getFileIcon(doc.fileName)}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{doc.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {formatFileSize(doc.fileSize)} • {doc.fileType.toUpperCase()}
                                {doc.metadata?.pageCount && ` • ${doc.metadata.pageCount} pages`}
                                {doc.metadata?.wordCount && ` • ${doc.metadata.wordCount} words`}
                              </p>
                            </div>
                          </div>
                          <span className={doc.success ? 'text-green-600' : 'text-red-600'}>
                            {doc.success ? '✓' : '✗'}
                          </span>
                        </div>
                        {doc.preview && (
                          <p className="mt-2 text-xs text-gray-600 italic">{doc.preview}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No Analysis Yet
                </h3>
                <p className="text-gray-600">
                  Upload documents and click "Analyze" to see results here
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Analysis Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-2">🔍</div>
              <h3 className="font-semibold text-gray-800 mb-1">Smart Extraction</h3>
              <p className="text-sm text-gray-600">Automatically extracts claim numbers, policy info, and amounts</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🤖</div>
              <h3 className="font-semibold text-gray-800 mb-1">AI Analysis</h3>
              <p className="text-sm text-gray-600">Powered by Abacus AI for comprehensive document understanding</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <h3 className="font-semibold text-gray-800 mb-1">Multi-Format</h3>
              <p className="text-sm text-gray-600">Supports PDFs, Word, Excel, images, and text files</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🏠</div>
              <h3 className="font-semibold text-gray-800 mb-1">Damage Detection</h3>
              <p className="text-sm text-gray-600">Identifies damage descriptions across all documents</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">👤</div>
              <h3 className="font-semibold text-gray-808 mb-1">Adjuster Info</h3>
              <p className="text-sm text-gray-600">Extracts adjuster names, contact details, and dates</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💾</div>
              <h3 className="font-semibold text-gray-800 mb-1">Export Reports</h3>
              <p className="text-sm text-gray-600">Generate professional PDF reports with one click</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
