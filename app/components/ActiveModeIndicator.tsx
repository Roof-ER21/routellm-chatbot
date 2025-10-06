/**
 * ActiveModeIndicator Component
 * Shows active modes with badges in the header
 *
 * Features:
 * - Compact badge for Education mode
 * - Animated entrance/exit
 * - Click to toggle mode off
 * - Mobile-optimized sizing
 */

'use client';

import React from 'react';

export interface ActiveModeIndicatorProps {
  educationMode?: boolean;
  isDarkMode?: boolean;
  onEducationToggle?: () => void;
}

export default function ActiveModeIndicator({
  educationMode = false,
  isDarkMode = false,
  onEducationToggle,
}: ActiveModeIndicatorProps) {
  if (!educationMode) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {educationMode && (
        <button
          onClick={onEducationToggle}
          className="
            group flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-green-600 text-white text-xs font-semibold
            transition-all duration-200 hover:bg-green-700
            shadow-md hover:shadow-lg
            animate-fadeIn
          "
          title="Education Mode Active - Click to disable"
        >
          <span className="text-sm">🎓</span>
          <span className="hidden sm:inline">Education</span>
          <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
        </button>
      )}
    </div>
  );
}
