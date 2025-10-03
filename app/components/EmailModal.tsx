'use client'

import { useState, useEffect } from 'react'

export interface EmailData {
  to: string
  subject: string
  body: string
  templateName?: string
}

interface EmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (emailData: EmailData) => Promise<void>
  initialData?: Partial<EmailData>
  repName: string
  sessionId?: number
}

export default function EmailModal({
  isOpen,
  onClose,
  onSend,
  initialData,
  repName,
  sessionId
}: EmailModalProps) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Initialize form with provided data
  useEffect(() => {
    if (initialData) {
      setTo(initialData.to || '')
      setSubject(initialData.subject || '')
      setBody(initialData.body || '')
    }
  }, [initialData])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTo('')
        setSubject('')
        setBody('')
        setShowPreview(false)
        setError(null)
        setSuccess(false)
      }, 300)
    }
  }, [isOpen])

  const handleSend = async () => {
    setError(null)

    // Validation
    if (!to.trim()) {
      setError('Recipient email is required')
      return
    }

    if (!body.trim()) {
      setError('Email body is required')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      setError('Invalid email address')
      return
    }

    setIsSending(true)

    try {
      await onSend({
        to: to.trim(),
        subject: subject.trim() || 'Insurance Claim Communication',
        body: body.trim(),
        templateName: initialData?.templateName
      })

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">✉️</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Send Email</h2>
                <p className="text-xs text-red-100">Professional insurance claim communication</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={isSending}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {!showPreview ? (
              // Compose Form
              <div className="space-y-4">
                {/* Success Message */}
                {success && (
                  <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div>
                      <p className="text-green-800 font-semibold">Email sent successfully!</p>
                      <p className="text-green-600 text-sm">The email has been delivered to {to}</p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-2xl text-white">!</span>
                    </div>
                    <div>
                      <p className="text-red-800 font-semibold">Error</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* From Field (Read-only) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    From
                  </label>
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-600">
                    Roof-ER Claims (via {repName})
                  </div>
                </div>

                {/* To Field */}
                <div>
                  <label htmlFor="to" className="block text-sm font-semibold text-gray-700 mb-2">
                    To <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="to"
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="adjuster@insurancecompany.com"
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-red-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                    disabled={isSending}
                  />
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Auto-generated from email body if left empty"
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-red-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                    disabled={isSending}
                  />
                </div>

                {/* Body Field */}
                <div>
                  <label htmlFor="body" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Body <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    id="body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Email content will be formatted professionally with Roof-ER branding..."
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-gray-300 focus:border-red-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-red-100 transition-all font-mono text-sm"
                    disabled={isSending}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    The email will be automatically formatted with professional HTML styling and Roof-ER branding.
                  </p>
                </div>

                {/* Template Info */}
                {initialData?.templateName && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold text-sm">Template: {initialData.templateName}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Preview Mode
              <div className="space-y-4">
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                  <div className="mb-4 pb-4 border-b-2 border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>From:</strong> Roof-ER Claims (via {repName})
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>To:</strong> {to}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Subject:</strong> {subject || 'Auto-generated from body'}
                    </p>
                  </div>
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                      {body}
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> The actual email will be formatted with professional HTML styling,
                    Roof-ER branding, and a professional signature block.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t-2 border-gray-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                disabled={isSending || success}
              >
                {showPreview ? '✏️ Edit' : '👁️ Preview'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                disabled={isSending}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || success || !to.trim() || !body.trim()}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : success ? (
                  <>
                    <span>✓</span>
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <span>✉️</span>
                    <span>Send Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
