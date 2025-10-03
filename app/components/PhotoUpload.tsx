'use client';

/**
 * PhotoUpload Component
 *
 * Provides UI for uploading roof photos and displaying analysis results
 * Supports single photo and batch photo analysis
 */

import { useState, useRef } from 'react';

interface PhotoAnalysisResult {
  success: boolean;
  photo_id?: string;
  damage_detected?: boolean;
  detections?: Array<{
    type: string;
    name: string;
    confidence: number;
    indicators: string[];
    evidence: Record<string, any>;
  }>;
  severity?: {
    score: number;
    rating: string;
    recommendation: string;
    explanation: string;
  };
  code_violations?: Array<{
    code: string;
    description: string;
    severity: string;
    evidence: string;
  }>;
  assessment?: string;
  next_steps?: Array<{
    priority: string;
    action: string;
    details: string;
  }>;
  additional_photos_needed?: string[];
  error?: string;
}

interface PhotoUploadProps {
  mode?: 'single' | 'batch';
  onAnalysisComplete?: (result: any) => void;
}

export default function PhotoUpload({ mode = 'single', onAnalysisComplete }: PhotoUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PhotoAnalysisResult | null>(null);
  const [batchResult, setBatchResult] = useState<any>(null);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [roofAge, setRoofAge] = useState('');
  const [hailSize, setHailSize] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (mode === 'single' && files.length > 1) {
      alert('Please select only one photo for single analysis mode');
      return;
    }

    if (mode === 'batch' && files.length > 20) {
      alert('Maximum 20 photos allowed per batch');
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`The following files exceed 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(files);
    setResult(null);
    setBatchResult(null);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one photo');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setBatchResult(null);

    try {
      const formData = new FormData();

      if (mode === 'single') {
        formData.append('photo', selectedFiles[0]);
      } else {
        selectedFiles.forEach((file, index) => {
          formData.append(`photo${index}`, file);
        });
      }

      // Add context parameters
      if (propertyAddress) formData.append('propertyAddress', propertyAddress);
      if (claimDate) formData.append('claimDate', claimDate);
      if (roofAge) formData.append('roofAge', roofAge);
      if (hailSize) formData.append('hailSize', hailSize);

      const endpoint = mode === 'single' ? '/api/photo/analyze' : '/api/photo/batch';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (mode === 'single') {
        setResult(data);
      } else {
        setBatchResult(data);
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(data);
      }

    } catch (error: any) {
      console.error('Analysis error:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to analyze photo'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setResult(null);
    setBatchResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 9) return 'text-red-600 font-bold';
    if (score >= 7) return 'text-orange-600 font-bold';
    if (score >= 5) return 'text-yellow-600 font-semibold';
    if (score >= 3) return 'text-blue-600';
    return 'text-green-600';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'text-red-600 font-semibold';
    if (priority === 'medium') return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {mode === 'single' ? 'Photo Analysis' : 'Batch Photo Analysis'}
      </h2>

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {mode === 'single' ? 'Select Photo' : 'Select Photos (up to 20)'}
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={mode === 'batch'}
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        {selectedFiles.length > 0 && (
          <div className="mt-2 text-sm text-gray-600">
            {selectedFiles.length} file(s) selected
          </div>
        )}
      </div>

      {/* Context Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Address
          </label>
          <input
            type="text"
            value={propertyAddress}
            onChange={(e) => setPropertyAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Claim Date
          </label>
          <input
            type="date"
            value={claimDate}
            onChange={(e) => setClaimDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Roof Age (years)
          </label>
          <input
            type="number"
            value={roofAge}
            onChange={(e) => setRoofAge(e.target.value)}
            placeholder="e.g., 10"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hail Size
          </label>
          <input
            type="text"
            value={hailSize}
            onChange={(e) => setHailSize(e.target.value)}
            placeholder='e.g., 1.5"'
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleAnalyze}
          disabled={analyzing || selectedFiles.length === 0}
          className={`flex-1 py-3 px-6 rounded-md font-semibold text-white transition-colors ${
            analyzing || selectedFiles.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {analyzing ? 'Analyzing...' : 'Analyze Photos'}
        </button>

        <button
          onClick={handleClear}
          disabled={analyzing}
          className="py-3 px-6 rounded-md font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      {/* Analysis Progress */}
      {analyzing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-blue-800 font-medium">
              Analyzing {mode === 'single' ? 'photo' : `${selectedFiles.length} photos`}...
            </span>
          </div>
        </div>
      )}

      {/* Single Photo Results */}
      {result && mode === 'single' && (
        <div className="mt-6 space-y-4">
          {result.success ? (
            <>
              {/* Severity Score */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Severity Score:</span>
                    <div className={`text-2xl font-bold ${getSeverityColor(result.severity?.score)}`}>
                      {result.severity?.score}/10
                    </div>
                    <div className="text-sm text-gray-700">{result.severity?.rating}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Damage Detected:</span>
                    <div className={`text-lg font-semibold ${result.damage_detected ? 'text-red-600' : 'text-green-600'}`}>
                      {result.damage_detected ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detections */}
              {result.detections && result.detections.length > 0 && (
                <div className="p-4 bg-white border border-gray-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Damage Detections</h3>
                  <div className="space-y-3">
                    {result.detections.map((detection, idx) => (
                      <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-gray-800">{detection.name}</h4>
                          <span className="text-sm text-gray-600">
                            {Math.round(detection.confidence * 100)}% confidence
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <strong>Indicators:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {detection.indicators.slice(0, 3).map((indicator, i) => (
                              <li key={i}>{indicator}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Violations */}
              {result.code_violations && result.code_violations.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-3 text-red-800">Code Violations</h3>
                  <div className="space-y-2">
                    {result.code_violations.map((violation, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-red-200">
                        <div className="font-semibold text-red-700">{violation.code}</div>
                        <div className="text-sm text-gray-700 mt-1">{violation.description}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <strong>Evidence:</strong> {violation.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              {result.next_steps && result.next_steps.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Next Steps</h3>
                  <div className="space-y-2">
                    {result.next_steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className={`font-semibold ${getPriorityColor(step.priority)}`}>
                          [{step.priority.toUpperCase()}]
                        </span>
                        <div>
                          <div className="font-medium">{step.action}</div>
                          <div className="text-sm text-gray-600">{step.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Assessment */}
              {result.assessment && (
                <div className="p-4 bg-white border border-gray-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Full Assessment</h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
                    {result.assessment}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Failed</h3>
              <p className="text-red-700">{result.error || 'Unknown error occurred'}</p>
            </div>
          )}
        </div>
      )}

      {/* Batch Results */}
      {batchResult && mode === 'batch' && (
        <div className="mt-6 space-y-4">
          {batchResult.success ? (
            <>
              {/* Batch Summary */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                <h3 className="text-lg font-semibold mb-3">Batch Analysis Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Photos Analyzed</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {batchResult.photos_analyzed}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Successful</div>
                    <div className="text-2xl font-bold text-green-600">
                      {batchResult.successful_analyses}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Detections</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {batchResult.total_detections}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Overall Severity</div>
                    <div className={`text-2xl font-bold ${getSeverityColor(batchResult.overall_severity?.score)}`}>
                      {batchResult.overall_severity?.score}/10
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Assessment */}
              {batchResult.batch_assessment?.assessment && (
                <div className="p-4 bg-white border border-gray-200 rounded-md">
                  <h3 className="text-lg font-semibold mb-3">Comprehensive Assessment</h3>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded overflow-auto max-h-96">
                    {batchResult.batch_assessment.assessment}
                  </pre>
                </div>
              )}

              {/* Coverage Status */}
              <div className={`p-4 border rounded-md ${
                batchResult.coverage_complete
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <h3 className="text-lg font-semibold mb-2">
                  Coverage Status: {batchResult.coverage_complete ? 'Complete' : 'Incomplete'}
                </h3>
                {!batchResult.coverage_complete && batchResult.missing_documentation && (
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Missing Documentation:</div>
                    {batchResult.missing_documentation.map((missing: any, idx: number) => (
                      <div key={idx} className="ml-4 text-sm">
                        <strong>{missing.category}:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {missing.items.map((item: string, i: number) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Batch Analysis Failed</h3>
              <p className="text-red-700">{batchResult.error || 'Unknown error occurred'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
