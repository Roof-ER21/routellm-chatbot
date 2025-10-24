'use client'

/**
 * SmartUploadButton Component
 *
 * A beautiful upload button that matches the email generator design
 * Opens the document upload system when clicked
 */

import { useState } from 'react'

interface SmartUploadButtonProps {
  onClick: () => void
  disabled?: boolean
}

export default function SmartUploadButton({ onClick, disabled = false }: SmartUploadButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-600 hover:from-orange-700 hover:via-orange-600 hover:to-yellow-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:scale-105 disabled:hover:scale-100"
      >
        <span className="text-xl">📄</span>
        <span>Analyze Document</span>
      </button>

      {/* Tooltip */}
      {isHovered && !disabled && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-50 animate-fadeIn">
          <div className="text-center">
            Analyze Document with Susan
            <div className="text-xs text-gray-300 mt-1">Upload estimates, PDFs, images & more</div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  )
}
