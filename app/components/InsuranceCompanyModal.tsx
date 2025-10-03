'use client';

/**
 * InsuranceCompanyModal Component
 *
 * Modal for selecting insurance companies from database
 */

import { useState, useEffect } from 'react';
import { actionHandler } from '@/lib/action-handlers';

interface Company {
  id: string;
  name: string;
  contact_email: string;
  phone?: string;
  fax?: string;
  address?: string;
  notes?: string;
  phone_instructions?: string;
  app_name?: string;
  client_login_url?: string;
  guest_login_url?: string;
  best_call_times?: string;
  responsiveness_score?: number;
}

interface InsuranceCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelected: (company: Company) => void;
}

export default function InsuranceCompanyModal({
  isOpen,
  onClose,
  onSelected,
}: InsuranceCompanyModalProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async (search?: string) => {
    setLoading(true);
    const result = await actionHandler.getInsuranceCompanies(search);
    setLoading(false);

    if (result.success) {
      setCompanies(result.data || []);
    } else {
      setError(result.error || 'Failed to load companies');
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (value.length >= 2 || value.length === 0) {
      loadCompanies(value);
    }
  };

  const handleSelect = async (companyId: string) => {
    setLoading(true);
    const result = await actionHandler.handleCompanySelection(companyId);
    setLoading(false);

    if (result.success) {
      onSelected(result.data);
      onClose();
      setSearchTerm('');
    } else {
      setError(result.error || 'Failed to select company');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            Select Insurance Company
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 px-6 py-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by company name..."
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : companies.length > 0 ? (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleSelect(company.id)}
                  className="border-2 border-gray-200 hover:border-indigo-500 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md bg-white relative"
                >
                  {/* Responsiveness Score Badge */}
                  {company.responsiveness_score && (
                    <div className="absolute top-3 right-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                        company.responsiveness_score >= 9 ? 'bg-green-100 text-green-800' :
                        company.responsiveness_score >= 7 ? 'bg-blue-100 text-blue-800' :
                        company.responsiveness_score >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Score: {company.responsiveness_score}/10
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-20">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {company.name}
                      </h3>

                      <div className="text-sm text-gray-600 space-y-1.5">
                        {/* Phone with Shortcut */}
                        {company.phone && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-600">📞</span>
                              <span className="font-medium">{company.phone}</span>
                            </div>
                            {company.phone_instructions && (
                              <div className="ml-6 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                <span className="font-semibold">Shortcut:</span> {company.phone_instructions}
                              </div>
                            )}
                            {company.best_call_times && (
                              <div className="ml-6 text-xs text-green-700">
                                ⏰ Best times: {company.best_call_times}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Email */}
                        {company.contact_email && (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">✉️</span>
                            <span>{company.contact_email}</span>
                          </div>
                        )}

                        {/* App Name or Website */}
                        {company.app_name ? (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">📱</span>
                            <span className="font-medium">{company.app_name}</span>
                            {company.client_login_url && (
                              <a
                                href={company.client_login_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-600 hover:text-blue-800 text-xs underline"
                              >
                                Login
                              </a>
                            )}
                          </div>
                        ) : company.client_login_url ? (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">🌐</span>
                            <a
                              href={company.client_login_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              {company.client_login_url.replace(/^https?:\/\//, '').split('/')[0]}
                            </a>
                          </div>
                        ) : null}

                        {company.fax && (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">📠</span>
                            <span>{company.fax}</span>
                          </div>
                        )}
                        {company.address && (
                          <div className="flex items-center gap-2">
                            <span className="text-indigo-600">📍</span>
                            <span>{company.address}</span>
                          </div>
                        )}
                      </div>
                      {company.notes && (
                        <div className="mt-2 text-xs text-gray-500 italic">
                          {company.notes}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-md">
                        View Details →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? (
                <>
                  <div className="text-4xl mb-4">🔍</div>
                  <p>No companies found matching "{searchTerm}"</p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-4">🏢</div>
                  <p>Start typing to search for insurance companies</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
