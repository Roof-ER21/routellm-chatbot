/**
 * ModeToggle Component
 * Controls Susan's operational modes and theme
 *
 * Features:
 * - Education Mode: Teaching/mentoring persona for learning
 * - Theme Toggle: Light/Dark mode switcher
 */

'use client';

import React from 'react';

export interface ModeToggleProps {
  educationMode: boolean;
  isDarkMode: boolean;
  onEducationChange: (enabled: boolean) => void;
  onThemeChange: (isDark: boolean) => void;
}

export default function ModeToggle({
  educationMode,
  isDarkMode,
  onEducationChange,
  onThemeChange,
}: ModeToggleProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Education Mode */}
      <button
        onClick={() => onEducationChange(!educationMode)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all duration-200 border-2
          ${educationMode
            ? 'bg-green-600 text-white border-green-700 shadow-lg'
            : isDarkMode
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
        `}
        title="Education Mode: Susan becomes your teacher and mentor"
      >
        <span className="text-sm">🎓</span>
        <span className="hidden sm:inline">Education</span>
      </button>

      {/* Theme Toggle */}
      <button
        onClick={() => onThemeChange(!isDarkMode)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
          transition-all duration-200 border-2
          ${isDarkMode
            ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }
        `}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <span className="text-sm">{isDarkMode ? '☀️' : '🌙'}</span>
      </button>
    </div>
  );
}
