'use client';

/**
 * Database Setup Page
 *
 * Simple page to populate insurance companies and verify setup
 */

import { useState } from 'react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const populateInsurance = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup/populate-insurance', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to populate insurance companies');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkInsurance = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/insurance/companies');
      const data = await response.json();

      if (data.success) {
        setResult({
          message: 'Insurance companies loaded successfully',
          count: data.companies?.length || 0,
          companies: data.companies?.slice(0, 5) || []
        });
      } else {
        setError(data.error || 'Failed to load insurance companies');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Database Setup
          </h1>
          <p className="text-gray-600 mb-8">
            Populate and verify Railway database
          </p>

          {/* Setup Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={populateInsurance}
              disabled={loading}
              className="px-6 py-4 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Populating...' : '📋 Populate Insurance Companies'}
            </button>

            <button
              onClick={checkInsurance}
              disabled={loading}
              className="px-6 py-4 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Checking...' : '✅ Check Insurance Companies'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 font-medium">❌ {error}</p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-green-900 mb-4">
                ✅ {result.message}
              </h2>

              {result.imported && (
                <div className="space-y-2 mb-4">
                  <p className="text-green-800">
                    <span className="font-semibold">Imported:</span> {result.imported} companies
                  </p>
                  {result.summary && (
                    <>
                      <p className="text-green-800">
                        <span className="font-semibold">Total:</span> {result.summary.total}
                      </p>
                      <p className="text-green-800">
                        <span className="font-semibold">Team Handlers:</span> {result.summary.team_handlers}
                      </p>
                      <p className="text-green-800">
                        <span className="font-semibold">Adjuster Handlers:</span> {result.summary.adjuster_handlers}
                      </p>
                    </>
                  )}
                </div>
              )}

              {result.count !== undefined && (
                <div className="space-y-2 mb-4">
                  <p className="text-green-800 font-semibold">
                    Found {result.count} companies in database
                  </p>
                  {result.companies && result.companies.length > 0 && (
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <p className="font-semibold text-gray-900 mb-2">Sample companies:</p>
                      <ul className="space-y-1">
                        {result.companies.map((company: any, index: number) => (
                          <li key={index} className="text-sm text-gray-700">
                            • {company.name} - {company.claim_handler} - {company.phone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">ℹ️ Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click "Populate Insurance Companies" to load 64 companies into Railway database</li>
              <li>Click "Check Insurance Companies" to verify data exists</li>
              <li>Once populated, insurance selector will work on main page</li>
              <li>You only need to run this once per database</li>
            </ol>
          </div>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              ← Back to Main App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
