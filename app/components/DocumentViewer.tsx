'use client'

import { useState, useRef, useEffect } from 'react'
import { InsuranceKBDocument } from '@/lib/insurance-argumentation-kb'
import CitationTooltip from './CitationTooltip'

interface DocumentViewerProps {
  document: InsuranceKBDocument
  onClose: () => void
  isDarkMode?: boolean
}

const CATEGORY_ICONS: Record<string, string> = {
  pushback: '🛡️',
  building_codes: '📋',
  manufacturer_specs: '🏭',
  warranties: '✅',
  training: '📚',
  licenses: '🎓',
  agreements: '📄',
  email_templates: '✉️',
  sales_scripts: '💬',
  photo_examples: '📸'
}

const CATEGORY_COLORS: Record<string, string> = {
  pushback: 'from-red-500 to-red-600',
  building_codes: 'from-blue-500 to-blue-600',
  manufacturer_specs: 'from-orange-500 to-orange-600',
  warranties: 'from-green-500 to-green-600',
  training: 'from-purple-500 to-purple-600',
  licenses: 'from-indigo-500 to-indigo-600',
  agreements: 'from-gray-500 to-gray-600',
  email_templates: 'from-pink-500 to-pink-600',
  sales_scripts: 'from-teal-500 to-teal-600',
  photo_examples: 'from-amber-500 to-amber-600'
}

export default function DocumentViewer({ document, onClose, isDarkMode = false }: DocumentViewerProps) {
  const [copied, setCopied] = useState(false)
  const [showCitationTooltip, setShowCitationTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [tooltipContent, setTooltipContent] = useState('')
  const contentRef = useRef<HTMLDivElement>(null)

  const categoryColor = CATEGORY_COLORS[document.category] || 'from-gray-500 to-gray-600'
  const categoryIcon = CATEGORY_ICONS[document.category] || '📄'

  // Format content with proper sections
  const formatContent = (content: string) => {
    // Split by double newlines to create sections
    const sections = content.split('\n\n').filter(s => s.trim())

    return sections.map((section, index) => {
      const trimmed = section.trim()

      // Check if it's a heading (all caps line or starts with specific markers)
      if (trimmed.match(/^[A-Z\s]{3,}:?$/) || trimmed.match(/^(KEY POINTS|YOUR ARGUMENT|SUPPORTING EVIDENCE|SUCCESS RATE|BEST PRACTICES|DOCUMENTATION NEEDED|STATE-SPECIFIC|CONTACT INFORMATION|CODE REFERENCE|CODE TEXT|CODE REQUIREMENT|CRITICAL|WARNING|NOTE):/i)) {
        return (
          <h3 key={index} className="text-lg font-bold text-red-700 mt-6 mb-3 pb-2 border-b-2 border-red-200">
            {trimmed}
          </h3>
        )
      }

      // Check if it's a list item
      if (trimmed.match(/^[\-•\*]\s/)) {
        const items = trimmed.split('\n').filter(l => l.trim())
        return (
          <ul key={index} className="list-disc list-inside space-y-1 mb-4 ml-4">
            {items.map((item, i) => (
              <li key={i} className="text-gray-700">
                {item.replace(/^[\-•\*]\s/, '')}
              </li>
            ))}
          </ul>
        )
      }

      // Check if it's a numbered list
      if (trimmed.match(/^\d+\./)) {
        const items = trimmed.split('\n').filter(l => l.trim())
        return (
          <ol key={index} className="list-decimal list-inside space-y-1 mb-4 ml-4">
            {items.map((item, i) => (
              <li key={i} className="text-gray-700">
                {item.replace(/^\d+\.\s*/, '')}
              </li>
            ))}
          </ol>
        )
      }

      // Check if it's a quoted section
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        return (
          <blockquote key={index} className="border-l-4 border-red-500 pl-4 py-2 mb-4 italic bg-red-50 rounded-r-lg">
            <p className="text-gray-800">{trimmed.replace(/^"|"$/g, '')}</p>
          </blockquote>
        )
      }

      // Regular paragraph
      return (
        <p key={index} className="text-gray-700 mb-4 leading-relaxed">
          {trimmed}
        </p>
      )
    })
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCitationHover = (e: React.MouseEvent, citation: string) => {
    setTooltipContent(citation)
    setTooltipPosition({ x: e.clientX, y: e.clientY })
    setShowCitationTooltip(true)
  }

  const handleCitationLeave = () => {
    setShowCitationTooltip(false)
  }

  // Note: Citation highlighting in content would require more complex implementation
  // For now, citations are displayed in the metadata section below

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl h-full max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`flex-shrink-0 bg-gradient-to-r ${categoryColor} text-white p-6 border-b-2 border-white/20`}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl border-2 border-white/40 flex-shrink-0">
                  {categoryIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold mb-1 leading-tight">
                    {document.title}
                  </h2>
                  <p className="text-sm text-white/90">
                    {document.filename}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                aria-label="Close document"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Metadata Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {document.metadata.success_rate && (
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-semibold">
                  {document.metadata.success_rate}% Success Rate
                </span>
              )}
              {document.metadata.confidence_level && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  document.metadata.confidence_level === 'high' ? 'bg-blue-500 text-white' :
                  document.metadata.confidence_level === 'medium' ? 'bg-cyan-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {document.metadata.confidence_level.toUpperCase()} Confidence
                </span>
              )}
              {document.metadata.states && document.metadata.states.length > 0 && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {document.metadata.states.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{document.keywords.length}</span> keywords
              {document.metadata.code_citations && (
                <span className="ml-3">
                  <span className="font-semibold">{document.metadata.code_citations.length}</span> code citations
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(document.content)}
                className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Text
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 rounded-lg text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>

          {/* Document Summary */}
          <div className="flex-shrink-0 bg-blue-50 border-b border-blue-200 px-6 py-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Summary</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              {document.summary}
            </p>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6" ref={contentRef}>
            <div className="prose prose-sm max-w-none">
              {formatContent(document.content)}
            </div>

            {/* Keywords Section */}
            {document.keywords.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {document.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors cursor-default"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Code Citations Section */}
            {document.metadata.code_citations && document.metadata.code_citations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Code Citations</h3>
                <div className="flex flex-wrap gap-2">
                  {document.metadata.code_citations.map((citation, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-lg text-xs font-mono text-blue-800 transition-colors cursor-help"
                      title={`Click to copy ${citation}`}
                      onClick={() => handleCopy(citation)}
                    >
                      {citation}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Applicable To Section */}
            {document.metadata.applicable_to && document.metadata.applicable_to.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Applicable To</h3>
                <div className="flex flex-wrap gap-2">
                  {document.metadata.applicable_to.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 rounded-full text-xs font-medium text-green-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Scenarios Section */}
            {document.metadata.scenarios && document.metadata.scenarios.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Relevant Scenarios</h3>
                <div className="flex flex-wrap gap-2">
                  {document.metadata.scenarios.map((scenario, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 rounded-full text-xs font-medium text-purple-800"
                    >
                      {scenario.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Document ID: <span className="font-mono">{document.id}</span>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Citation Tooltip */}
      {showCitationTooltip && (
        <CitationTooltip
          content={tooltipContent}
          position={tooltipPosition}
        />
      )}
    </div>
  )
}
