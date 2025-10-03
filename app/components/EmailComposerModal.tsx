'use client';

/**
 * EmailComposerModal Component
 *
 * Modal for composing and sending emails
 */

import { useState, useEffect } from 'react';
import { actionHandler, EmailPayload } from '@/lib/action-handlers';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent: (result: any) => void;
  prefilledData?: Partial<EmailPayload>;
}

export default function EmailComposerModal({
  isOpen,
  onClose,
  onSent,
  prefilledData,
}: EmailComposerModalProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && prefilledData) {
      setTo(prefilledData.to || '');
      setSubject(prefilledData.subject || '');
      setBody(prefilledData.body || '');
    }
  }, [isOpen, prefilledData]);

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const result = await actionHandler.handleEmailSend({
      to,
      subject,
      body,
      attachments: prefilledData?.attachments,
    });

    setLoading(false);

    if (result.success) {
      onSent(result.data);
      onClose();
      // Reset form
      setTo('');
      setSubject('');
      setBody('');
    } else {
      setError(result.error || 'Failed to send email');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">✉️</span>
            Compose Email
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
            {/* To */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                To
              </label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="adjuster@insurance.com"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Insurance Claim Documentation"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message here..."
                disabled={loading}
                rows={12}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none disabled:opacity-50 resize-none"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Preview</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>To:</strong> {to || '(recipient)'}</div>
                <div><strong>Subject:</strong> {subject || '(subject)'}</div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <pre className="whitespace-pre-wrap font-sans">
                    {body || '(message body)'}
                  </pre>
                </div>
              </div>
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
            onClick={handleSend}
            disabled={!to || !subject || !body || loading}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending...</span>
              </>
            ) : (
              'Send Email'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
