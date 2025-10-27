'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KnowledgeBaseProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode?: boolean
}

/**
 * KnowledgeBase Component - Modal/Legacy Wrapper
 *
 * This component now redirects to the full-page Knowledge Base route
 * Kept for backward compatibility with existing code that opens KB as modal
 */
export default function KnowledgeBase({ isOpen, onClose, isDarkMode = false }: KnowledgeBaseProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      // Redirect to full-page Knowledge Base
      router.push('/knowledge-base')
      // Close the modal since we're navigating away
      onClose()
    }
  }, [isOpen, router, onClose])

  // Return null since we're redirecting
  return null
}
