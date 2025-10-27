'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getTopPhotoReferences, PhotoReference as PhotoReferenceData } from '@/lib/photo-search'

interface PhotoReferenceProps {
  term: string
  index: number // 1 or 2
  className?: string
}

/**
 * PhotoReference Component
 *
 * Renders inline photo thumbnails that can be hovered for preview
 * and clicked to navigate to knowledge base.
 *
 * Features:
 * - 40px x 40px thumbnail display
 * - 200px x 200px hover preview with label
 * - Click to navigate to /knowledge-base?search=term
 * - Loading states and error handling
 * - Mobile responsive (no hover on touch devices)
 */
export default function PhotoReference({ term, index, className = '' }: PhotoReferenceProps) {
  const router = useRouter()
  const [photoData, setPhotoData] = useState<PhotoReferenceData | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile/touch devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch photo data on mount
  useEffect(() => {
    const fetchPhoto = async () => {
      try {
        setIsLoading(true)
        setHasError(false)

        // Get photo references for the term
        const references = getTopPhotoReferences(term, index)

        if (references && references[index - 1]) {
          setPhotoData(references[index - 1])
        } else {
          setHasError(true)
        }
      } catch (error) {
        console.error('Error fetching photo reference:', error)
        setHasError(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPhoto()
  }, [term, index])

  // Handle click - navigate to knowledge base
  const handleClick = () => {
    if (photoData) {
      router.push(photoData.knowledgeBaseUrl)
    }
  }

  // Don't render if no photo data or error
  if (hasError || !photoData) {
    return null
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <span className={`inline-block ${className}`}>
        <span className="inline-block w-10 h-10 bg-gray-200 rounded border border-gray-300 animate-pulse" />
      </span>
    )
  }

  return (
    <span
      className={`inline-block relative ${className}`}
      style={{ verticalAlign: 'middle' }}
    >
      {/* Thumbnail Image */}
      <button
        onClick={handleClick}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className="inline-block w-10 h-10 rounded border-2 border-gray-300 hover:border-red-500 transition-all duration-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-md"
        title={`Click to view ${term} in knowledge base`}
        aria-label={`Photo reference: ${photoData.label}`}
      >
        <img
          src={photoData.thumbnailUrl}
          alt={photoData.label}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to full image if thumbnail doesn't exist
            const target = e.target as HTMLImageElement
            if (target.src !== photoData.imageUrl) {
              target.src = photoData.imageUrl
            } else {
              setHasError(true)
            }
          }}
        />
      </button>

      {/* Hover Preview - Desktop Only */}
      {isHovered && !isMobile && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: '100%',
            marginBottom: '8px'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 overflow-hidden transition-all duration-200">
            {/* Preview Image */}
            <img
              src={photoData.imageUrl}
              alt={photoData.label}
              className="w-[200px] h-[200px] object-cover"
            />

            {/* Label */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-800 text-center">
                {photoData.label}
              </p>
            </div>

            {/* Arrow pointer */}
            <div
              className="absolute left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid white'
              }}
            />
          </div>
        </div>
      )}
    </span>
  )
}
