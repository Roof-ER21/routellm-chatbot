/**
 * ActiveModeIndicator Component
 * Shows active modes with badges in the header
 *
 * Features:
 * - Compact badges for Deep Dive, Education, and Hands-Free modes
 * - Animated entrance/exit
 * - Click to toggle mode off
 * - Mobile-optimized sizing
 */

'use client';

import React from 'react';

export interface ActiveModeIndicatorProps {
  deepDiveMode?: boolean;
  educationMode?: boolean;
  handsFreeMode?: boolean;
  isDarkMode?: boolean;
  onDeepDiveToggle?: () => void;
  onEducationToggle?: () => void;
  onHandsFreeToggle?: () => void;
}

export default function ActiveModeIndicator({
  deepDiveMode = false,
  educationMode = false,
  handsFreeMode = false,
  isDarkMode = false,
  onDeepDiveToggle,
  onEducationToggle,
  onHandsFreeToggle,
}: ActiveModeIndicatorProps) {
  const hasActiveModes = deepDiveMode || educationMode || handsFreeMode;

  if (!hasActiveModes) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {deepDiveMode && (
        <button
          onClick={onDeepDiveToggle}
          className="
            group flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-blue-600 text-white text-xs font-semibold
            transition-all duration-200 hover:bg-blue-700
            shadow-md hover:shadow-lg
            animate-fadeIn
          "
          title="Deep Dive Mode Active - Click to disable"
        >
          <span className="text-sm">🔍</span>
          <span className="hidden sm:inline">Deep Dive</span>
          <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
        </button>
      )}

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

      {handsFreeMode && (
        <button
          onClick={onHandsFreeToggle}
          className="
            group flex items-center gap-1.5 px-2.5 py-1 rounded-full
            bg-red-600 text-white text-xs font-semibold
            transition-all duration-200 hover:bg-red-700
            shadow-md hover:shadow-lg
            animate-fadeIn animate-pulse
          "
          title="Hands-Free Mode Active - Click to disable"
        >
          <span className="text-sm">🎤</span>
          <span className="hidden sm:inline">Hands-Free</span>
          <span className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">×</span>
        </button>
      )}
    </div>
  );
}
