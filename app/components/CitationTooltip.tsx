'use client'

import { useEffect, useState } from 'react'

interface CitationTooltipProps {
  content: string
  position: { x: number; y: number }
}

export default function CitationTooltip({ content, position }: CitationTooltipProps) {
  const [adjustedPosition, setAdjustedPosition] = useState(position)

  useEffect(() => {
    // Adjust position to keep tooltip on screen
    const tooltipWidth = 300
    const tooltipHeight = 100
    const padding = 20

    let x = position.x
    let y = position.y + 20 // Offset below cursor

    // Keep within horizontal bounds
    if (x + tooltipWidth + padding > window.innerWidth) {
      x = window.innerWidth - tooltipWidth - padding
    }
    if (x < padding) {
      x = padding
    }

    // Keep within vertical bounds
    if (y + tooltipHeight + padding > window.innerHeight) {
      y = position.y - tooltipHeight - 10 // Show above cursor
    }

    setAdjustedPosition({ x, y })
  }, [position])

  // Parse citation code to provide helpful context
  const getCitationInfo = (citation: string) => {
    // IRC codes
    if (citation.startsWith('IRC')) {
      return {
        type: 'International Residential Code',
        icon: '📋',
        color: 'from-blue-500 to-blue-600',
        description: 'Building code requirement adopted by most jurisdictions'
      }
    }

    // IBC codes
    if (citation.startsWith('IBC')) {
      return {
        type: 'International Building Code',
        icon: '🏗️',
        color: 'from-indigo-500 to-indigo-600',
        description: 'Commercial building code standard'
      }
    }

    // State-specific codes
    if (citation.startsWith('VA') || citation.startsWith('MD') || citation.startsWith('PA')) {
      const state = citation.substring(0, 2)
      return {
        type: `${state} State Code`,
        icon: '🏛️',
        color: 'from-purple-500 to-purple-600',
        description: 'State-specific building regulation'
      }
    }

    // GAF specifications
    if (citation.includes('GAF')) {
      return {
        type: 'GAF Specification',
        icon: '🏭',
        color: 'from-orange-500 to-orange-600',
        description: 'Manufacturer installation requirement'
      }
    }

    // Default
    return {
      type: 'Code Citation',
      icon: '📄',
      color: 'from-gray-500 to-gray-600',
      description: 'Building code reference'
    }
  }

  const citationInfo = getCitationInfo(content)

  return (
    <div
      className="fixed z-[70] pointer-events-none"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-200 overflow-hidden animate-fadeIn max-w-sm">
        {/* Header */}
        <div className={`bg-gradient-to-r ${citationInfo.color} text-white px-4 py-2 flex items-center gap-2`}>
          <span className="text-xl">{citationInfo.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold opacity-90">{citationInfo.type}</p>
            <p className="text-sm font-bold truncate">{content}</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 py-3 bg-white">
          <p className="text-xs text-gray-600 leading-relaxed">
            {citationInfo.description}
          </p>

          {/* Quick Actions */}
          <div className="mt-3 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigator.clipboard.writeText(content)
              }}
              className="pointer-events-auto flex-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                window.open(`https://www.google.com/search?q=${encodeURIComponent(content + ' building code')}`, '_blank')
              }}
              className="pointer-events-auto flex-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>

        {/* Arrow pointing to cursor */}
        <div className={`absolute -top-2 left-8 w-4 h-4 bg-gradient-to-br ${citationInfo.color} transform rotate-45 border-t-2 border-l-2 border-gray-200`} />
      </div>
    </div>
  )
}
