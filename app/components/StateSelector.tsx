'use client';

import React, { useState } from 'react';
import { getAvailableStates, getStateInfo, getStateTalkingPoints } from '@/lib/state-codes-reference';

interface StateSelectorProps {
  selectedState: string | null;
  onStateChange: (state: string | null) => void;
  showDetails?: boolean;
  className?: string;
}

export default function StateSelector({
  selectedState,
  onStateChange,
  showDetails = true,
  className = ''
}: StateSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);
  const states = getAvailableStates();
  const stateInfo = selectedState ? getStateInfo(selectedState) : null;
  const talkingPoints = selectedState ? getStateTalkingPoints(selectedState) : [];

  return (
    <div className={`state-selector ${className}`}>
      {/* State Selection Dropdown */}
      <div className="flex items-center gap-3 mb-3">
        <label htmlFor="state-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📍 State:
        </label>
        <select
          id="state-select"
          value={selectedState || ''}
          onChange={(e) => onStateChange(e.target.value || null)}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select state (optional)</option>
          {states.map(state => (
            <option key={state.value} value={state.value}>
              {state.label} ({state.value})
            </option>
          ))}
        </select>

        {selectedState && (
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Show state-specific information"
          >
            {showInfo ? '▼ Hide Info' : '▶ Show Info'}
          </button>
        )}
      </div>

      {/* State-Specific Information Panel */}
      {selectedState && showInfo && showDetails && stateInfo && (
        <div className="mt-3 p-4 bg-gradient-to-br from-indigo-600 to-blue-700 dark:from-indigo-800 dark:to-blue-900 border-2 border-indigo-500 dark:border-indigo-600 rounded-xl shadow-lg">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-sm">
                {stateInfo.name} - Building Code Information
              </h3>
              <p className="text-xs text-indigo-100 dark:text-indigo-200 mt-1 font-medium">
                {stateInfo.ircVersion} • Effective: {stateInfo.ircEffectiveDate}
              </p>
            </div>
            <button
              onClick={() => setShowInfo(false)}
              className="text-white hover:text-indigo-200 font-bold text-lg"
              aria-label="Close info panel"
            >
              ✕
            </button>
          </div>

          {/* Quick Talking Points */}
          {talkingPoints.length > 0 && (
            <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <h4 className="text-xs font-bold text-yellow-300 mb-2">
                💡 Key Points:
              </h4>
              <ul className="space-y-1">
                {talkingPoints.map((point, idx) => (
                  <li key={idx} className="text-xs text-white font-medium flex items-start gap-2">
                    <span className="text-yellow-300 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Top Building Codes */}
          <div className="mb-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <h4 className="text-xs font-bold text-yellow-300 mb-2">
              📋 Key Building Codes:
            </h4>
            <div className="space-y-2">
              {stateInfo.buildingCodes.slice(0, 3).map((code, idx) => (
                <div key={idx} className="text-xs">
                  <div className="font-bold text-white">
                    {code.code} - {code.title}
                    {code.successRate && (
                      <span className="ml-2 text-green-300 font-extrabold">
                        ({code.successRate}% success)
                      </span>
                    )}
                  </div>
                  <div className="text-indigo-100 dark:text-indigo-200 mt-0.5 font-medium">
                    {code.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Special Requirements Highlight */}
          {stateInfo.specialRequirements.length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <h4 className="text-xs font-bold text-yellow-300 mb-2">
                ⚠️ Special Requirements:
              </h4>
              <div className="space-y-1">
                {stateInfo.specialRequirements.slice(0, 2).map((req, idx) => (
                  <div key={idx} className="text-xs text-white font-medium">
                    <span className="font-bold text-indigo-100">{req.requirement}:</span> {req.details}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State-Specific Notes */}
          {selectedState === 'MD' && (
            <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <strong className="text-yellow-800 dark:text-yellow-200">Maryland Special:</strong>
              <span className="text-yellow-700 dark:text-yellow-300 ml-1">
                MIA Bulletin 18-23 provides strong matching requirement guidance
              </span>
            </div>
          )}
        </div>
      )}

      {/* Compact State Badge (when info is hidden) */}
      {selectedState && !showInfo && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-medium">
            {stateInfo?.name}
          </span>
          <span className="text-gray-500 dark:text-gray-500">
            Using {stateInfo?.ircVersion}
          </span>
        </div>
      )}

      <style jsx>{`
        .state-selector select {
          cursor: pointer;
        }

        .state-selector select:focus {
          outline: none;
        }

        @media (max-width: 640px) {
          .state-selector .flex {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
}

// Helper component for inline state badge (for use in other components)
export function StateBadge({ state }: { state: string | null }) {
  if (!state) return null;

  const stateInfo = getStateInfo(state);
  if (!stateInfo) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
      <span>📍</span>
      <span>{stateInfo.abbreviation}</span>
    </span>
  );
}
