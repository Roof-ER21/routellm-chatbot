'use client'

/**
 * SmartDocumentUpload Component
 *
 * Main orchestrator component that manages the document upload workflow:
 * 1. Upload file
 * 2. Ask contextual questions
 * 3. Show analysis results
 */

import { useState } from 'react'
import DocumentUploadDialog from './DocumentUploadDialog'
import DocumentQuestionsDialog from './DocumentQuestionsDialog'
import DocumentAnalysisResults from './DocumentAnalysisResults'

interface SmartDocumentUploadProps {
  isOpen: boolean
  onClose: () => void
  onAnalysisComplete?: (result: any) => void
}

interface Question {
  id: string
  question: string
  placeholder?: string
  optional?: boolean
}

interface AnalysisResult {
  summary: string
  keyFindings: string[]
  missingItems: string[]
  codeReferences: string[]
  actionItems: string[]
  confidence: number
  rawAnalysis: string
}

export default function SmartDocumentUpload({
  isOpen,
  onClose,
  onAnalysisComplete
}: SmartDocumentUploadProps) {
  const [step, setStep] = useState<'upload' | 'questions' | 'results'>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUploaded = async (file: File, preview: string | null) => {
    setError(null)
    setUploadedFile(file)
    setFilePreview(preview)

    try {
      // Upload file to get questions
      const formData = new FormData()
      formData.append('file', file)

      console.log('[SmartUpload] Uploading file for question generation...')

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process document')
      }

      const data = await response.json()
      console.log('[SmartUpload] Questions received:', data)

      if (data.success && data.questions) {
        setDocumentType(data.documentType)
        setQuestions(data.questions)
        setStep('questions')
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('[SmartUpload] Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to process document')
      // Reset to upload step on error
      setStep('upload')
    }
  }

  const handleQuestionsComplete = async (answers: Record<string, string>) => {
    if (!uploadedFile) return

    setError(null)

    try {
      // Upload file with answers for analysis
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('answers', JSON.stringify(answers))

      console.log('[SmartUpload] Submitting for analysis with answers:', answers)

      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze document')
      }

      const data = await response.json()
      console.log('[SmartUpload] Analysis complete:', data)

      if (data.success && data.result) {
        setAnalysisResult(data.result)
        setStep('results')

        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(data)
        }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (err) {
      console.error('[SmartUpload] Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze document')
    }
  }

  const handleAskFollowUp = async (question: string) => {
    console.log('[SmartUpload] Follow-up question:', question)
    // In a real implementation, this would send the question to the chat API
    // For now, we'll just close and let the user use the main chat
    handleClose()
    // You could trigger the main chat here if you have access to it
  }

  const handleClose = () => {
    // Reset state
    setStep('upload')
    setUploadedFile(null)
    setFilePreview(null)
    setDocumentType('')
    setQuestions([])
    setAnalysisResult(null)
    setError(null)
    onClose()
  }

  return (
    <>
      {/* Upload Dialog */}
      <DocumentUploadDialog
        isOpen={isOpen && step === 'upload'}
        onClose={handleClose}
        onFileUploaded={handleFileUploaded}
      />

      {/* Questions Dialog */}
      {uploadedFile && questions.length > 0 && (
        <DocumentQuestionsDialog
          isOpen={isOpen && step === 'questions'}
          onClose={handleClose}
          fileName={uploadedFile.name}
          filePreview={filePreview}
          documentType={documentType}
          questions={questions}
          onComplete={handleQuestionsComplete}
        />
      )}

      {/* Results Dialog */}
      {analysisResult && uploadedFile && (
        <DocumentAnalysisResults
          isOpen={isOpen && step === 'results'}
          onClose={handleClose}
          fileName={uploadedFile.name}
          documentType={documentType}
          result={analysisResult}
          onAskFollowUp={handleAskFollowUp}
        />
      )}

      {/* Error Display */}
      {error && isOpen && (
        <div className="fixed bottom-4 right-4 z-[60] max-w-md">
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-bold mb-1">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-white hover:bg-white/20 rounded p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
