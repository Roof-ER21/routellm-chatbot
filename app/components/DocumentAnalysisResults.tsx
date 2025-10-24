'use client'

/**
 * DocumentAnalysisResults Component
 *
 * Displays the analysis results from Susan AI with:
 * - Key findings highlighted
 * - Missing items flagged
 * - Code references cited
 * - Action items listed
 * - Copy functionality
 * - Follow-up questions
 */

import { useState } from 'react'

interface AnalysisResult {
  summary: string
  keyFindings: string[]
  missingItems: string[]
  codeReferences: string[]
  actionItems: string[]
  confidence: number
  rawAnalysis: string
}

interface DocumentAnalysisResultsProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  documentType: string
  result: AnalysisResult
  onAskFollowUp: (question: string) => void
}

export default function DocumentAnalysisResults({
  isOpen,
  onClose,
  fileName,
  documentType,
  result,
  onAskFollowUp
}: DocumentAnalysisResultsProps) {
  const [copied, setCopied] = useState(false)
  const [followUpInput, setFollowUpInput] = useState('')
  const [activeTab, setActiveTab] = useState<'summary' | 'details' | 'raw'>('summary')

  const handleCopy = async () => {
    const textToCopy = `
DOCUMENT ANALYSIS RESULTS
File: ${fileName}
Type: ${documentType}
Confidence: ${result.confidence}%

SUMMARY:
${result.summary}

KEY FINDINGS:
${result.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

MISSING ITEMS:
${result.missingItems.map((m, i) => `${i + 1}. ${m}`).join('\n')}

CODE REFERENCES:
${result.codeReferences.map((c, i) => `${i + 1}. ${c}`).join('\n')}

ACTION ITEMS:
${result.actionItems.map((a, i) => `${i + 1}. ${a}`).join('\n')}
    `.trim()

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleAskFollowUp = () => {
    if (followUpInput.trim()) {
      onAskFollowUp(followUpInput.trim())
      setFollowUpInput('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Analysis Complete</h2>
                  <p className="text-xs text-white/80">{documentType} - {fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Confidence Badge */}
                <div className="px-3 py-1 rounded-lg bg-white/20 border border-white/30">
                  <p className="text-xs text-white/80">Confidence</p>
                  <p className="text-lg font-bold text-white">{result.confidence}%</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'summary'
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'details'
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Detailed Analysis
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-3 font-semibold transition-all border-b-2 ${
                  activeTab === 'raw'
                    ? 'border-green-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Full Report
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-400px)]">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <span>📋</span>
                    Executive Summary
                  </h3>
                  <p className="text-gray-200 leading-relaxed">{result.summary}</p>
                </div>

                {/* Key Findings */}
                {result.keyFindings.length > 0 && (
                  <div className="bg-green-500/20 border-2 border-green-400 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-200 mb-3 flex items-center gap-2">
                      <span>✨</span>
                      Key Findings
                    </h3>
                    <ul className="space-y-2">
                      {result.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-green-400 font-bold flex-shrink-0">{index + 1}.</span>
                          <span className="text-green-100">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing Items */}
                {result.missingItems.length > 0 && (
                  <div className="bg-red-500/20 border-2 border-red-400 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-red-200 mb-3 flex items-center gap-2">
                      <span>⚠️</span>
                      Missing or Incomplete Items
                    </h3>
                    <ul className="space-y-2">
                      {result.missingItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-red-400 font-bold flex-shrink-0">!</span>
                          <span className="text-red-100">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Code References */}
                {result.codeReferences.length > 0 && (
                  <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-200 mb-3 flex items-center gap-2">
                      <span>📚</span>
                      Code References & Guidelines
                    </h3>
                    <ul className="space-y-3">
                      {result.codeReferences.map((ref, index) => (
                        <li key={index} className="bg-blue-600/20 rounded-lg p-3">
                          <p className="text-blue-100">{ref}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Items */}
                {result.actionItems.length > 0 && (
                  <div className="bg-purple-500/20 border-2 border-purple-400 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-purple-200 mb-3 flex items-center gap-2">
                      <span>🎯</span>
                      Recommended Action Items
                    </h3>
                    <ul className="space-y-2">
                      {result.actionItems.map((action, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-white">{index + 1}</span>
                          </div>
                          <span className="text-purple-100 flex-1">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'raw' && (
              <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span>📄</span>
                  Complete Analysis Report
                </h3>
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-200 text-sm leading-relaxed font-mono bg-gray-900 p-4 rounded-lg overflow-x-auto">
{result.rawAnalysis}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-800 border-t-2 border-gray-700 p-4 space-y-3">
            {/* Follow-up Question Input */}
            <div className="flex gap-3">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskFollowUp()}
                placeholder="Ask Susan a follow-up question..."
                className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 focus:border-green-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all text-white placeholder-gray-500"
              />
              <button
                onClick={handleAskFollowUp}
                disabled={!followUpInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all font-bold disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                Ask
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <span>✓</span>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
