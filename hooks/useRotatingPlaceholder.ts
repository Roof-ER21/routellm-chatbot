/**
 * useRotatingPlaceholder Hook
 * Provides rotating placeholder suggestions for input field
 *
 * Features:
 * - Cycles through helpful example queries
 * - Smooth transitions every 3 seconds
 * - Pauses when user is typing
 */

'use client';

import { useState, useEffect } from 'react';

const placeholders = [
  "Ask: 'What should I do when the adjuster denies my claim?'",
  "Try: 'How do I document hail damage for insurance?'",
  "Ask: 'Can you help me write an appeal letter?'",
  "Try: 'What's the process for filing a supplement?'",
  "Ask: 'How do I measure roof square footage?'",
  "Try: 'What building codes apply to roof repairs?'",
  "Ask: 'Can you analyze this denial letter?' (upload PDF)",
  "Try: 'What's the difference between ACV and RCV?'",
  "Ask: 'How do I handle adjuster lowballing?'",
  "Try: 'What documentation do I need for wind damage?'",
];

export function useRotatingPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused]);

  return {
    placeholder: placeholders[currentIndex],
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  };
}
