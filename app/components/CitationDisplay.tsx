'use client'

import { useState, useEffect, useRef, ReactElement } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Citation Display Component
 *
 * Renders inline citations with:
 * - Superscript numbered citations [1], [2], etc.
 * - Hover tooltips showing document preview
 * - Click to navigate to Knowledge Base page
 * - Responsive tooltip positioning
 */

export interface Citation {
  number: string // Grouped format like "1.1", "2.3"
  categoryNumber?: number
  documentNumber?: number
  documentId: string
  documentTitle: string
  category: string
  snippet: string
  preview?: string // First 100 characters for tooltip
  metadata?: {
    states?: string[]
    success_rate?: number
    code_citations?: string[]
    confidence_level?: 'high' | 'medium' | 'low'
  }
}

interface CitationDisplayProps {
  text: string
  citations: Citation[]
  isDarkMode?: boolean
}

interface TooltipData {
  citation: Citation
  x: number
  y: number
}

export default function CitationDisplay({ text, citations, isDarkMode = false }: CitationDisplayProps) {
  const [hoveredCitation, setHoveredCitation] = useState<TooltipData | null>(null)
  const [citationDetails, setCitationDetails] = useState<Map<string, any>>(new Map())
  const tooltipRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Parse text to identify citation markers [1.1], [2.3], etc.
  const renderTextWithCitations = () => {
    const citationPattern = /\[(\d+\.\d+)\]/g
    const parts: ReactElement[] = []
    let lastIndex = 0
    let match

    while ((match = citationPattern.exec(text)) !== null) {
      const citationNumber = match[1] // e.g., "1.1", "2.3"
      const citation = citations.find(c => c.number === citationNumber)

      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        )
      }

      // Add citation link
      if (citation) {
        parts.push(
          <sup
            key={`citation-${citationNumber}-${match.index}`}
            className="citation-marker"
            onMouseEnter={(e) => handleCitationHover(e, citation)}
            onMouseLeave={handleCitationLeave}
            onClick={() => handleCitationClick(citation)}
          >
            <span
              className={`inline-block cursor-pointer px-1 py-0.5 rounded text-xs font-bold transition-all ${
                isDarkMode
                  ? 'text-blue-400 hover:bg-blue-900 hover:text-blue-200'
                  : 'text-blue-600 hover:bg-blue-100 hover:text-blue-800'
              }`}
              style={{
                fontSize: '0.7em',
                verticalAlign: 'super',
              }}
            >
              [{citationNumber}]
            </span>
          </sup>
        )
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      )
    }

    return parts.length > 0 ? parts : <span>{text}</span>
  }

  const handleCitationHover = (e: React.MouseEvent, citation: Citation) => {
    const rect = e.currentTarget.getBoundingClientRect()

    setHoveredCitation({
      citation,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })

    // Fetch detailed citation info if not cached
    if (!citationDetails.has(citation.documentId)) {
      fetchCitationDetails(citation.documentId)
    }
  }

  const handleCitationLeave = () => {
    setHoveredCitation(null)
  }

  const handleCitationClick = (citation: Citation) => {
    // Navigate to Knowledge Base page with document ID as query param
    // The KB page will auto-scroll to the document and open it
    router.push(`/knowledge-base?doc=${citation.documentId}`)
  }

  const fetchCitationDetails = async (documentId: string) => {
    try {
      const response = await fetch(`/api/citations?documentId=${documentId}`)
      const data = await response.json()

      if (data.success && data.citation) {
        setCitationDetails(prev => new Map(prev).set(documentId, data.citation))
      }
    } catch (error) {
      console.error('Failed to fetch citation details:', error)
    }
  }

  // Position tooltip to avoid going off-screen
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hoveredCitation || !tooltipRef.current) {
      return { display: 'none' }
    }

    const tooltipWidth = 320
    const tooltipHeight = tooltipRef.current.offsetHeight || 200
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = hoveredCitation.x - tooltipWidth / 2
    let top = hoveredCitation.y - tooltipHeight - 10

    // Adjust horizontal position if off-screen
    if (left < 10) {
      left = 10
    } else if (left + tooltipWidth > viewportWidth - 10) {
      left = viewportWidth - tooltipWidth - 10
    }

    // Adjust vertical position if off-screen (show below instead)
    if (top < 10) {
      top = hoveredCitation.y + 30
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999,
    }
  }

  const renderTooltip = () => {
    if (!hoveredCitation) return null

    const { citation } = hoveredCitation
    const details = citationDetails.get(citation.documentId)

    // Use preview from API if available, otherwise use snippet
    const displayPreview = details?.preview || citation.preview || citation.snippet

    return (
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className={`citation-tooltip w-80 p-4 rounded-lg shadow-2xl border-2 pointer-events-none ${
          isDarkMode
            ? 'bg-gray-800 border-blue-600 text-white'
            : 'bg-white border-blue-500 text-gray-900'
        }`}
      >
        {/* Citation number badge */}
        <div className="flex items-start gap-2 mb-2">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
          }`}>
            [{citation.number}]
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-sm mb-1">{citation.documentTitle}</h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {citation.category.replace('_', ' ').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Document preview - first 100 characters */}
        <div className={`text-xs mb-3 italic ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          "{displayPreview}"
        </div>

        {/* Metadata */}
        {citation.metadata && (
          <div className="space-y-1 text-xs">
            {citation.metadata.success_rate && (
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">Success Rate:</span>
                <span className={`px-2 py-0.5 rounded ${
                  citation.metadata.success_rate >= 90
                    ? 'bg-green-100 text-green-800'
                    : citation.metadata.success_rate >= 80
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {citation.metadata.success_rate}%
                </span>
              </div>
            )}

            {citation.metadata.confidence_level && (
              <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">Confidence Level:</span>
                <span className={`px-2 py-0.5 rounded uppercase ${
                  citation.metadata.confidence_level === 'high'
                    ? 'bg-blue-100 text-blue-800'
                    : citation.metadata.confidence_level === 'medium'
                    ? 'bg-cyan-100 text-cyan-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {citation.metadata.confidence_level}
                </span>
              </div>
            )}

            {citation.metadata.states && citation.metadata.states.length > 0 && (
              <div className={`flex items-start gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">States:</span>
                <span>{citation.metadata.states.join(', ')}</span>
              </div>
            )}

            {citation.metadata.code_citations && citation.metadata.code_citations.length > 0 && (
              <div className={`flex items-start gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className="font-semibold">Codes:</span>
                <span>{citation.metadata.code_citations.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Click hint */}
        <div className={`mt-3 pt-2 border-t text-xs text-center ${
          isDarkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'
        }`}>
          Click to view in Knowledge Base →
        </div>
      </div>
    )
  }

  return (
    <div className="citation-display-container relative">
      <div className="whitespace-pre-wrap break-words leading-relaxed">
        {renderTextWithCitations()}
      </div>
      {renderTooltip()}
    </div>
  )
}
