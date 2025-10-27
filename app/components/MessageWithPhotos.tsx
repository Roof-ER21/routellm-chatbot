'use client'

import { ReactNode } from 'react'
import PhotoReference from './PhotoReference'

interface MessageWithPhotosProps {
  text: string
  className?: string
}

/**
 * MessageWithPhotos Component
 *
 * Parses message text for [PHOTO:term:N] syntax and replaces with PhotoReference components.
 *
 * Syntax: [PHOTO:term:N]
 * - term: The roofing term to search for (e.g., "drip edge", "step flashing")
 * - N: The index (1 or 2) indicating which photo to display
 *
 * Example input:
 * "Drip edge [PHOTO:drip edge:1] [PHOTO:drip edge:2] is installed along eaves."
 *
 * Example output:
 * "Drip edge [thumbnail1] [thumbnail2] is installed along eaves."
 */
export default function MessageWithPhotos({ text, className = '' }: MessageWithPhotosProps) {
  // Regular expression to match [PHOTO:term:N] pattern
  // Captures: term and index number
  const photoPattern = /\[PHOTO:([^:]+):(\d+)\]/g

  // Parse the text and build an array of text segments and photo components
  const parseMessage = (): ReactNode[] => {
    const elements: ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    // Reset regex state
    photoPattern.lastIndex = 0

    while ((match = photoPattern.exec(text)) !== null) {
      const [fullMatch, term, indexStr] = match
      const matchIndex = match.index
      const photoIndex = parseInt(indexStr, 10)

      // Add text before the match
      if (matchIndex > lastIndex) {
        const textBefore = text.substring(lastIndex, matchIndex)
        elements.push(
          <span key={`text-${lastIndex}`}>{textBefore}</span>
        )
      }

      // Add PhotoReference component
      elements.push(
        <PhotoReference
          key={`photo-${matchIndex}-${term}-${photoIndex}`}
          term={term.trim()}
          index={photoIndex}
          className="mx-1"
        />
      )

      lastIndex = matchIndex + fullMatch.length
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex)
      elements.push(
        <span key={`text-${lastIndex}`}>{textAfter}</span>
      )
    }

    // If no matches found, return original text
    if (elements.length === 0) {
      return [<span key="original">{text}</span>]
    }

    return elements
  }

  return (
    <div className={`whitespace-pre-wrap break-words leading-relaxed ${className}`}>
      {parseMessage()}
    </div>
  )
}

/**
 * Helper function to check if text contains photo references
 */
export function hasPhotoReferences(text: string): boolean {
  const photoPattern = /\[PHOTO:[^:]+:\d+\]/
  return photoPattern.test(text)
}

/**
 * Helper function to extract all photo references from text
 * Returns array of {term, index} objects
 */
export function extractPhotoReferences(text: string): Array<{ term: string; index: number }> {
  const photoPattern = /\[PHOTO:([^:]+):(\d+)\]/g
  const references: Array<{ term: string; index: number }> = []
  let match: RegExpExecArray | null

  photoPattern.lastIndex = 0

  while ((match = photoPattern.exec(text)) !== null) {
    const [, term, indexStr] = match
    references.push({
      term: term.trim(),
      index: parseInt(indexStr, 10)
    })
  }

  return references
}
