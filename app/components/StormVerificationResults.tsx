'use client';

/**
 * StormVerificationResults Component
 *
 * Displays the results of NOAA storm verification
 */

import { useState } from 'react';

interface HailEvent {
  date: string;
  time: string;
  location: string;
  hailSize: string;
  magnitude?: string;
  narrative?: string;
  distance?: number | null;
}

interface VerificationReport {
  verified: boolean;
  confidence: string;
  claimDate: string;
  location: string;
  searchRadius: number;
  eventsFound: number;
  events: HailEvent[];
  recommendation: string;
}

interface StormVerificationResultsProps {
  report: VerificationReport;
  onClose: () => void;
  onExportPDF?: () => void;
}

export default function StormVerificationResults({
  report,
  onClose,
  onExportPDF,
}: StormVerificationResultsProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set([0]));

  const toggleEvent = (index: number) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedEvents(newExpanded);
  };

  const getConfidenceBadge = () => {
    const badges = {
      high: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', label: 'High Confidence' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'Medium Confidence' },
      low: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', label: 'Low Confidence' },
    };

    const badge = badges[report.confidence as keyof typeof badges] || badges.low;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const getVerificationIcon = () => {
    if (report.verified) {
      return <span className="text-4xl">✅</span>;
    } else {
      return <span className="text-4xl">❌</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Storm Verification Report
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Section */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div>{getVerificationIcon()}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">
                    {report.verified ? 'Hail Event Verified' : 'No Hail Event Found'}
                  </h3>
                  {getConfidenceBadge()}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-semibold text-gray-700">Claim Date:</span>
                    <span className="ml-2 text-gray-900">{report.claimDate}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Location:</span>
                    <span className="ml-2 text-gray-900">{report.location}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Search Radius:</span>
                    <span className="ml-2 text-gray-900">{report.searchRadius} miles</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Events Found:</span>
                    <span className="ml-2 text-gray-900 font-bold">{report.eventsFound}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mb-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <h4 className="text-sm font-bold text-purple-900 mb-2">📋 Recommendation:</h4>
            <p className="text-sm text-purple-800">{report.recommendation}</p>
          </div>

          {/* Events List */}
          {report.events.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>⛈️</span>
                Verified Hail Events ({report.events.length})
              </h4>
              {report.events.map((event, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 transition-colors"
                >
                  {/* Event Header */}
                  <div
                    onClick={() => toggleEvent(index)}
                    className="bg-gray-50 px-4 py-3 cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🌧️</span>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {event.date} at {event.time}
                          </div>
                          <div className="text-sm text-gray-600">
                            {event.location} • Hail Size: {event.hailSize}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400">
                      {expandedEvents.has(index) ? '▲' : '▼'}
                    </div>
                  </div>

                  {/* Event Details */}
                  {expandedEvents.has(index) && (
                    <div className="px-4 py-3 bg-white border-t border-gray-200">
                      <div className="space-y-2 text-sm">
                        {event.magnitude && (
                          <div>
                            <span className="font-semibold text-gray-700">Magnitude:</span>
                            <span className="ml-2 text-gray-900">{event.magnitude}</span>
                          </div>
                        )}
                        {event.distance !== null && event.distance !== undefined && (
                          <div>
                            <span className="font-semibold text-gray-700">Distance:</span>
                            <span className="ml-2 text-gray-900">{event.distance} miles</span>
                          </div>
                        )}
                        {event.narrative && (
                          <div>
                            <span className="font-semibold text-gray-700">Event Details:</span>
                            <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {event.narrative}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No Events Found */}
          {report.events.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🌤️</div>
              <p className="text-gray-600 mb-2">No hail events found in the NOAA database</p>
              <p className="text-sm text-gray-500">for the specified location and date range.</p>
            </div>
          )}

          {/* NOAA Attribution */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Data source: NOAA National Centers for Environmental Information (NCEI) Storm Events Database</p>
            <p className="mt-1">This verification report uses official weather records from the National Weather Service.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span>📄</span>
              Export PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
