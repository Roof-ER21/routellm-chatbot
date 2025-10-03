'use client';

/**
 * PhotoAnalysisModal Component
 *
 * Modal for photo upload and analysis
 */

import { useState, useRef } from 'react';
import { actionHandler } from '@/lib/action-handlers';

interface PhotoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzed: (result: any) => void;
}

export default function PhotoAnalysisModal({ isOpen, onClose, onAnalyzed }: PhotoAnalysisModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [claimDate, setClaimDate] = useState('');
  const [roofAge, setRoofAge] = useState('');
  const [hailSize, setHailSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 20) {
      setError('Maximum 20 photos allowed');
      return;
    }

    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Files exceed 10MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(files);
    setError('');
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one photo');
      return;
    }

    setLoading(true);
    setError('');

    const result = await actionHandler.handlePhotoAnalysis({
      files: selectedFiles,
      propertyAddress,
      claimDate,
      roofAge,
      hailSize,
      mode: selectedFiles.length === 1 ? 'single' : 'batch',
    });

    setLoading(false);

    if (result.success) {
      onAnalyzed(result.data);
      onClose();
      // Reset form
      setSelectedFiles([]);
      setPropertyAddress('');
      setClaimDate('');
      setRoofAge('');
      setHailSize('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError(result.error || 'Analysis failed');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📸</span>
            Analyze Photos
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

          {/* File Upload */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Photos (up to 20)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={loading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {selectedFiles.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {selectedFiles.length} file(s) selected
              </div>
            )}
          </div>

          {/* Context Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Property Address
              </label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Main St, City, ST"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Claim Date
              </label>
              <input
                type="date"
                value={claimDate}
                onChange={(e) => setClaimDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Roof Age (years)
              </label>
              <input
                type="number"
                value={roofAge}
                onChange={(e) => setRoofAge(e.target.value)}
                placeholder="e.g., 10"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Hail Size
              </label>
              <input
                type="text"
                value={hailSize}
                onChange={(e) => setHailSize(e.target.value)}
                placeholder='e.g., 1.5"'
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:opacity-50"
              />
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
            disabled={selectedFiles.length === 0 || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Analyzing...</span>
              </>
            ) : (
              'Analyze Photos'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
