/**
 * SettingsPanel Component
 * User preferences and configuration
 *
 * Features:
 * - Theme toggle
 * - Default modes configuration
 * - Voice settings toggle
 * - Clear conversation history
 * - Export/import settings
 */

'use client';

import React, { useState } from 'react';

export interface SettingsPanelProps {
  isDarkMode: boolean;
  educationMode: boolean;
  voiceEnabled: boolean;
  onThemeChange: (isDark: boolean) => void;
  onEducationChange: (enabled: boolean) => void;
  onVoiceEnabledChange: (enabled: boolean) => void;
}

export default function SettingsPanel({
  isDarkMode,
  educationMode,
  voiceEnabled,
  onThemeChange,
  onEducationChange,
  onVoiceEnabledChange,
}: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold
          transition-all duration-200
          ${isDarkMode
            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }
        `}
        title="Settings"
      >
        <span className="text-lg">⚙️</span>
        <span className="hidden sm:inline">Settings</span>
      </button>

      {/* Settings Panel */}
      {isOpen && (
        <div className={`
          absolute top-full right-0 mt-2 w-80
          rounded-xl shadow-2xl border-2 overflow-hidden
          ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}
          z-50
        `}>
          {/* Header */}
          <div className={`
            p-4 border-b-2
            ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}
          `}>
            <div className="flex items-center justify-between">
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Settings Content */}
          <div className="p-4 space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Dark Mode
                </h4>
                <p className="text-xs text-gray-500">Switch between light and dark themes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => onThemeChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Default Education Mode */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Education Mode
                </h4>
                <p className="text-xs text-gray-500">Teaching style by default</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={educationMode}
                  onChange={(e) => onEducationChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Voice Auto-Speak */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Voice Responses
                </h4>
                <p className="text-xs text-gray-500">Auto-speak Susan's replies</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => onVoiceEnabledChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Divider */}
            <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

            {/* Version Info */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Susan 21 v1.0.0
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Born in Egypt • Educated in England • Serving The Roof Docs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
