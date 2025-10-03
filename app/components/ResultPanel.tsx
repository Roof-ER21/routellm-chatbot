'use client';

/**
 * ResultPanel Component
 *
 * Sliding panel that displays action results from the right side
 */

import { ReactNode, useEffect } from 'react';

export type PanelType = 'template' | 'photo' | 'email' | 'storm' | 'company' | 'export' | 'none';

interface ResultPanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: PanelType;
  title: string;
  children: ReactNode;
}

export default function ResultPanel({ isOpen, onClose, type, title, children }: ResultPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const typeColors = {
    template: 'from-red-600 to-red-700',
    photo: 'from-blue-600 to-blue-700',
    email: 'from-green-600 to-green-700',
    storm: 'from-purple-600 to-purple-700',
    company: 'from-indigo-600 to-indigo-700',
    export: 'from-orange-600 to-orange-700',
    none: 'from-gray-600 to-gray-700',
  };

  const typeIcons = {
    template: '📄',
    photo: '📸',
    email: '✉️',
    storm: '⛈️',
    company: '🏢',
    export: '📥',
    none: '📋',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-2/3 lg:w-1/2 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${typeColors[type]} px-6 py-4 flex justify-between items-center shadow-lg`}>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{typeIcons[type]}</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none transition-colors"
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * TemplateResultContent Component
 */
export function TemplateResultContent({ data }: { data: any }) {
  const copyToClipboard = () => {
    if (data?.document) {
      navigator.clipboard.writeText(data.document);
      alert('Template copied to clipboard!');
    }
  };

  const downloadDocument = () => {
    if (data?.document) {
      const blob = new Blob([data.document], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.templateKey}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!data) return <div className="text-gray-500">No data available</div>;

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      <div className={`p-4 rounded-lg ${
        data.readyToSend
          ? 'bg-green-50 border-2 border-green-200'
          : data.validation?.isValid
          ? 'bg-yellow-50 border-2 border-yellow-200'
          : 'bg-red-50 border-2 border-red-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            {data.readyToSend ? '✓ Ready to Send' : data.validation?.isValid ? '⚠ Needs Review' : '✗ Needs Revision'}
          </h3>
          <span className="text-sm font-medium">
            Score: {data.validation?.score || 0}/100
          </span>
        </div>

        {data.validation?.issues?.length > 0 && (
          <div className="mt-2">
            <p className="text-sm font-medium text-red-700">Issues:</p>
            <ul className="text-sm text-red-600 list-disc list-inside">
              {data.validation.issues.map((issue: string, idx: number) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Copy
        </button>
        <button
          onClick={downloadDocument}
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
        >
          Download
        </button>
      </div>

      {/* Document Content */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Generated Document</h3>
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-auto max-h-96">
          {data.document}
        </pre>
      </div>
    </div>
  );
}

/**
 * PhotoResultContent Component
 */
export function PhotoResultContent({ data }: { data: any }) {
  if (!data) return <div className="text-gray-500">No data available</div>;

  const getSeverityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 9) return 'text-red-600';
    if (score >= 7) return 'text-orange-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Analysis Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-600">Severity Score:</span>
            <div className={`text-2xl font-bold ${getSeverityColor(data.severity?.score)}`}>
              {data.severity?.score || 0}/10
            </div>
            <div className="text-sm text-gray-700">{data.severity?.rating}</div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Damage Detected:</span>
            <div className={`text-lg font-semibold ${data.damage_detected ? 'text-red-600' : 'text-green-600'}`}>
              {data.damage_detected ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>

      {/* Detections */}
      {data.detections && data.detections.length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Damage Detections</h3>
          <div className="space-y-3">
            {data.detections.map((detection: any, idx: number) => (
              <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-800">{detection.name}</h4>
                  <span className="text-sm text-gray-600">
                    {Math.round(detection.confidence * 100)}%
                  </span>
                </div>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                  {detection.indicators?.slice(0, 3).map((indicator: string, i: number) => (
                    <li key={i}>{indicator}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Assessment */}
      {data.assessment && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Full Assessment</h3>
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 overflow-auto max-h-96">
            {data.assessment}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * StormResultContent Component
 */
export function StormResultContent({ data }: { data: any }) {
  if (!data) return <div className="text-gray-500">No data available</div>;

  const downloadPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality coming soon!');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
        <h3 className="font-semibold text-lg mb-3">Verification Summary</h3>
        <div className="text-sm text-gray-700">
          <p><strong>Events Found:</strong> {data.events?.length || 0}</p>
          <p><strong>Date Range:</strong> {data.dateRange || 'N/A'}</p>
          <p><strong>Location:</strong> {data.location || 'N/A'}</p>
        </div>
      </div>

      {/* Events */}
      {data.events && data.events.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Storm Events</h3>
          {data.events.map((event: any, idx: number) => (
            <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="font-semibold text-gray-900">{event.date}</div>
              <div className="text-sm text-gray-600 mt-1">
                <p><strong>Hail Size:</strong> {event.hailSize}</p>
                <p><strong>Distance:</strong> {event.distance} miles</p>
                <p><strong>Severity:</strong> {event.severity}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Download */}
      <button
        onClick={downloadPDF}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
      >
        Download Verification PDF
      </button>
    </div>
  );
}
