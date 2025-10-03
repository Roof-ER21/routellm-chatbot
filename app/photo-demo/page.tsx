'use client';

/**
 * Photo Intelligence Demo Page
 *
 * Interactive demo for testing the photo intelligence system
 */

import { useState } from 'react';
import PhotoUpload from '@/app/components/PhotoUpload';

export default function PhotoDemoPage() {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisHistory(prev => [{
      timestamp: new Date().toISOString(),
      mode,
      result
    }, ...prev]);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Photo Intelligence System
          </h1>
          <p className="text-lg text-gray-600">
            AI-Powered Roof Damage Analysis for Insurance Claims
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex justify-center gap-4">
          <button
            onClick={() => setMode('single')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'single'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Single Photo Analysis
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'batch'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Batch Analysis
          </button>
        </div>

        {/* Features Overview */}
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Hail Impact Detection</div>
                <div className="text-sm text-gray-600">Circular impacts, mat exposure, density analysis</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Wind Damage</div>
                <div className="text-sm text-gray-600">Missing shingles, torn edges, directional patterns</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Granule Loss</div>
                <div className="text-sm text-gray-600">Asphalt exposure, accelerated aging</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Flashing Issues</div>
                <div className="text-sm text-gray-600">Corrosion, separation, gaps</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Severity Scoring</div>
                <div className="text-sm text-gray-600">1-10 scale with detailed reasoning</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-blue-600 text-xl">✓</div>
              <div>
                <div className="font-semibold text-gray-800">Code Violations</div>
                <div className="text-sm text-gray-600">IRC compliance, manufacturer guidelines</div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload Component */}
        <PhotoUpload mode={mode} onAnalysisComplete={handleAnalysisComplete} />

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Analysis History ({analysisHistory.length})
            </h2>
            <div className="space-y-3">
              {analysisHistory.map((entry, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-sm font-semibold text-gray-700">
                        {entry.mode === 'single' ? 'Single Photo' : 'Batch Analysis'}
                      </span>
                      {entry.result.success && (
                        <span className="ml-3 text-sm text-gray-600">
                          Severity: <span className="font-semibold">
                            {entry.mode === 'single'
                              ? `${entry.result.severity?.score}/10`
                              : `${entry.result.overall_severity?.score}/10`
                            }
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {entry.result.success ? (
                      <span className="text-green-600">✓ Analysis Complete</span>
                    ) : (
                      <span className="text-red-600">✗ Analysis Failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">API Documentation</h2>

          <div className="space-y-4">
            {/* Single Photo Endpoint */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">POST /api/photo/analyze</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>Description:</strong> Analyze a single roof photo for damage
                </div>
                <div>
                  <strong>Content-Type:</strong> multipart/form-data
                </div>
                <div>
                  <strong>Parameters:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-gray-100 px-1 rounded">photo</code> (required): Image file</li>
                    <li><code className="bg-gray-100 px-1 rounded">propertyAddress</code> (optional): Property address</li>
                    <li><code className="bg-gray-100 px-1 rounded">claimDate</code> (optional): Date of claim</li>
                    <li><code className="bg-gray-100 px-1 rounded">roofAge</code> (optional): Age of roof in years</li>
                    <li><code className="bg-gray-100 px-1 rounded">hailSize</code> (optional): Hail size (e.g., "1.5")</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Batch Endpoint */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-2">POST /api/photo/batch</h3>
              <div className="text-sm text-gray-700 space-y-2">
                <div>
                  <strong>Description:</strong> Analyze multiple photos (up to 20) in batch
                </div>
                <div>
                  <strong>Content-Type:</strong> multipart/form-data
                </div>
                <div>
                  <strong>Parameters:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><code className="bg-gray-100 px-1 rounded">photo0, photo1, ...</code> (required): Multiple image files</li>
                    <li><code className="bg-gray-100 px-1 rounded">propertyAddress</code> (optional): Property address</li>
                    <li><code className="bg-gray-100 px-1 rounded">claimDate</code> (optional): Date of claim</li>
                    <li><code className="bg-gray-100 px-1 rounded">documentedAngles</code> (optional): Comma-separated angles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Technology Stack</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Vision AI</h3>
              <p className="text-sm text-gray-600">Anthropic Claude Vision API for advanced image analysis</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Image Processing</h3>
              <p className="text-sm text-gray-600">Sharp library for feature extraction and optimization</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Roofing Expertise</h3>
              <p className="text-sm text-gray-600">Abacus AI integration for domain-specific analysis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
