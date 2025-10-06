/**
 * SmartModeSuggestion Component
 * Suggests appropriate modes based on user queries
 *
 * Features:
 * - Analyzes user input for mode suggestions
 * - Shows contextual prompts to enable modes
 * - One-click mode activation
 * - Dismissible suggestions
 */

'use client';

import React, { useState, useEffect } from 'react';

export interface SmartModeSuggestionProps {
  userMessage: string;
  educationMode: boolean;
  onEnableEducation: () => void;
  isDarkMode?: boolean;
}

export default function SmartModeSuggestion({
  userMessage,
  educationMode,
  onEnableEducation,
  isDarkMode = false,
}: SmartModeSuggestionProps) {
  const [suggestion, setSuggestion] = useState<'education' | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (isDismissed) return;

    const message = userMessage.toLowerCase();

    // Keywords for Education mode
    const educationKeywords = [
      'learn', 'teach', 'understand', 'how to', 'what is', 'explain',
      'help me understand', 'training', 'best practice', 'principle',
      'concept', 'methodology', 'process', 'why does', 'help me learn',
    ];

    // Check for Education triggers
    if (!educationMode && educationKeywords.some(keyword => message.includes(keyword))) {
      setSuggestion('education');
      return;
    }

    setSuggestion(null);
  }, [userMessage, educationMode, isDismissed]);

  const handleActivate = () => {
    if (suggestion === 'education') {
      onEnableEducation();
    }
    setIsDismissed(true);
    setSuggestion(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setSuggestion(null);
  };

  // Reset dismissed state when mode changes
  useEffect(() => {
    setIsDismissed(false);
  }, [educationMode]);

  if (!suggestion) return null;

  return (
    <div className="p-3 rounded-lg border-2 mb-3 animate-slideIn bg-green-50 border-green-500">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🎓</div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">Education Mode Suggested</h4>
          <p className="text-xs text-gray-700 mb-2">
            Activate learning mode for step-by-step teaching with examples and reflection questions.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleActivate}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
            >
              Activate Education
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-md text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors"
            >
              No thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
