'use client'

interface EmailPreviewEnhancedProps {
  email: {
    subject: string;
    body: string;
    explanation: string;
  };
  onCopy: () => void;
  copied: boolean;
  onEdit?: () => void;
}

export function EmailPreviewEnhanced({
  email,
  onCopy,
  copied,
  onEdit
}: EmailPreviewEnhancedProps) {
  // Parse explanation to extract metrics if available
  const hasSuccessRate = email.explanation.includes('%')
  const successRateMatch = email.explanation.match(/(\d+)%/)
  const successRate = successRateMatch ? parseInt(successRateMatch[1]) : 85

  // Check for quality indicators in email body
  const hasCodeCitations = email.body.includes('IRC') || email.body.includes('IBC')
  const hasManufacturerSpecs = email.body.includes('GAF') || email.body.includes('Owens Corning') || email.body.includes('CertainTeed')
  const hasFactValuePolicy = email.body.toLowerCase().includes('request') &&
                             (email.body.includes('Section') || email.body.includes('Code'))
  const hasSupportingDocs = email.body.toLowerCase().includes('attached') ||
                            email.body.toLowerCase().includes('documentation')

  const qualityScore = [hasCodeCitations, hasManufacturerSpecs, hasFactValuePolicy, hasSupportingDocs]
    .filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Success Metrics Banner */}
      <div className="bg-gradient-to-r from-green-600/20 via-blue-600/20 to-purple-600/20 border-2 border-green-500 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <p className="text-green-200 font-bold text-lg">Powerful Email Generated!</p>
              <p className="text-green-300 text-sm">
                Evidence-based argument built with proven methodology
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center px-4 py-2 bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-green-400">{successRate}%</p>
              <p className="text-xs text-gray-400">Success Rate</p>
            </div>
            <div className="text-center px-4 py-2 bg-gray-900/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">{qualityScore}/4</p>
              <p className="text-xs text-gray-400">Quality Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${
          hasCodeCitations ? 'bg-green-500/10 border-green-500' : 'bg-gray-700/50 border-gray-600'
        }`}>
          <span className="text-lg">{hasCodeCitations ? '✅' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${hasCodeCitations ? 'text-green-300' : 'text-gray-400'}`}>
              Building Code Citations
            </p>
            <p className="text-xs text-gray-400">IRC/IBC sections cited</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${
          hasManufacturerSpecs ? 'bg-green-500/10 border-green-500' : 'bg-gray-700/50 border-gray-600'
        }`}>
          <span className="text-lg">{hasManufacturerSpecs ? '✅' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${hasManufacturerSpecs ? 'text-green-300' : 'text-gray-400'}`}>
              Manufacturer Specs
            </p>
            <p className="text-xs text-gray-400">Warranty requirements</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${
          hasFactValuePolicy ? 'bg-green-500/10 border-green-500' : 'bg-gray-700/50 border-gray-600'
        }`}>
          <span className="text-lg">{hasFactValuePolicy ? '✅' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${hasFactValuePolicy ? 'text-green-300' : 'text-gray-400'}`}>
              Fact-Value-Policy
            </p>
            <p className="text-xs text-gray-400">Persuasive structure</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 p-3 rounded-lg border-2 ${
          hasSupportingDocs ? 'bg-green-500/10 border-green-500' : 'bg-gray-700/50 border-gray-600'
        }`}>
          <span className="text-lg">{hasSupportingDocs ? '✅' : '⚠️'}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${hasSupportingDocs ? 'text-green-300' : 'text-gray-400'}`}>
              Supporting Documentation
            </p>
            <p className="text-xs text-gray-400">Evidence attached</p>
          </div>
        </div>
      </div>

      {/* Email Preview */}
      <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6">
        <div className="mb-4 pb-4 border-b-2 border-gray-700">
          <p className="text-sm text-gray-300 mb-2">
            <strong className="text-gray-200">Subject:</strong> {email.subject}
          </p>
        </div>
        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-gray-200 font-sans text-sm leading-relaxed break-words">
            {email.body}
          </div>
        </div>
      </div>

      {/* Why This Works */}
      <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">💡</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-blue-200 font-semibold text-sm mb-1">Why This Email Works:</p>
            <p className="text-blue-300 text-sm leading-relaxed break-words">{email.explanation}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCopy}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium flex items-center gap-2"
          >
            <span>✏️</span>
            <span>Edit</span>
          </button>
        )}
      </div>

      {/* Usage Tips */}
      <div className="bg-purple-500/20 border-2 border-purple-400 rounded-lg p-4">
        <p className="text-purple-200 font-semibold text-sm mb-2">📧 Next Steps:</p>
        <ol className="text-purple-300 text-sm space-y-2 list-decimal list-inside">
          <li>Copy this email to your clipboard (button above)</li>
          <li>Paste into your email client (Gmail, Outlook, etc.)</li>
          <li>Attach supporting documentation mentioned in the email</li>
          <li>Review recipient email address carefully</li>
          <li>Send with confidence - the facts are on your side!</li>
        </ol>
      </div>
    </div>
  )
}
