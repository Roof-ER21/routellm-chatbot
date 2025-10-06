/**
 * UploadProgress Component
 * Shows progress indicator for file uploads
 *
 * Features:
 * - Visual progress bar
 * - File name and size display
 * - Cancel upload option
 * - Success/error states
 */

'use client';

import React from 'react';

export interface UploadProgressProps {
  fileName: string;
  fileSize?: number;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'success' | 'error';
  onCancel?: () => void;
  errorMessage?: string;
}

export default function UploadProgress({
  fileName,
  fileSize,
  progress,
  status,
  onCancel,
  errorMessage,
}: UploadProgressProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Complete!';
      case 'error':
        return 'Upload failed';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'error':
        return 'bg-red-600';
      case 'success':
        return 'bg-green-600';
      default:
        return 'bg-blue-600';
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-md">
      <div className="flex items-start gap-3">
        <div className="text-2xl">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate text-gray-900">
                {fileName}
              </h4>
              {fileSize && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(fileSize)}
                </p>
              )}
            </div>
            {onCancel && status === 'uploading' && (
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 text-sm"
                title="Cancel upload"
              >
                ×
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Status Text */}
          <div className="flex items-center justify-between text-xs">
            <span className={`
              font-medium
              ${status === 'error' ? 'text-red-600' :
                status === 'success' ? 'text-green-600' :
                'text-blue-600'}
            `}>
              {getStatusText()}
            </span>
            {(status === 'uploading' || status === 'processing') && (
              <span className="text-gray-500">{progress}%</span>
            )}
          </div>

          {/* Error Message */}
          {status === 'error' && errorMessage && (
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
