'use client';

/**
 * Offline Indicator Component
 * Shows connection status and offline capabilities
 */

import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000); // Hide after 3 seconds
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) {
    return null; // Don't show anything when online and banner dismissed
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-center font-semibold transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-black'
      }`}
    >
      {isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">✓</span>
          <span>Back online! Full AI capabilities restored.</span>
          <button
            onClick={() => setShowBanner(false)}
            className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>You're offline - Limited features available</span>
          </div>
          <div className="text-sm font-normal mt-1">
            ✅ Building codes • GAF requirements • Maryland law • Insurance company info
          </div>
        </div>
      )}
    </div>
  );
}
