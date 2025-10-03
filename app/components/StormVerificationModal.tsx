'use client';

/**
 * StormVerificationModal Component
 *
 * Modal for storm verification with NOAA API
 */

import { useState } from 'react';

interface StormVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (result: any) => void;
}

export default function StormVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: StormVerificationModalProps) {
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [radius, setRadius] = useState('25');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!address || !date) {
      setError('Please enter address and date');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the new NOAA verification API
      const response = await fetch(
        `/api/weather/verify-claim?date=${encodeURIComponent(date)}&location=${encodeURIComponent(address)}&radius=${radius}`
      );

      if (!response.ok) {
        throw new Error('Verification request failed');
      }

      const data = await response.json();

      setLoading(false);

      if (data.success) {
        onVerified(data.report);
        onClose();
        // Reset form
        setAddress('');
        setDate('');
        setRadius('25');
      } else {
        setError('Storm verification failed');
      }
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : 'Storm verification failed');
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">⛈️</span>
            Verify Storm Date
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:text-gray-200 text-3xl leading-none disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Property Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Property Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, ST, ZIP"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the full property address for accurate location
              </p>
            </div>

            {/* Storm Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Storm Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Approximate date of the storm event
              </p>
            </div>

            {/* Search Radius */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Search Radius (miles)
              </label>
              <select
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none disabled:opacity-50"
              >
                <option value="10">10 miles</option>
                <option value="25">25 miles</option>
                <option value="50">50 miles</option>
                <option value="100">100 miles</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Search area around the property
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">
                What we'll verify:
              </h3>
              <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                <li>Hail events in the area</li>
                <li>Storm severity and size</li>
                <li>Weather conditions on the date</li>
                <li>Distance from property</li>
                <li>NOAA official records</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleVerify}
            disabled={!address || !date || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Verifying...</span>
              </>
            ) : (
              'Verify Storm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
