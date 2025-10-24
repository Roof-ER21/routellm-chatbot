'use client'

/**
 * DocumentUploadDialog Component
 *
 * Beautiful drag & drop file upload interface
 * Supports: PDF, JPG, PNG, DOCX, TXT
 * Max size: 10MB
 */

import { useState, useCallback, useRef } from 'react'

interface DocumentUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onFileUploaded: (file: File, preview: string | null) => void
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt']
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DocumentUploadDialog({ isOpen, onClose, onFileUploaded }: DocumentUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
    }

    // Check file type
    const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat()
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

    if (!acceptedExtensions.includes(fileExtension)) {
      return `File type not supported. Please upload: PDF, JPG, PNG, DOCX, or TXT files.`
    }

    return null
  }

  const generatePreview = async (file: File): Promise<string | null> => {
    // Only generate preview for images
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(null)
        reader.readAsDataURL(file)
      })
    }
    return null
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Generate preview
      const preview = await generatePreview(file)

      // Complete progress
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Small delay for UX
      setTimeout(() => {
        onFileUploaded(file, preview)
        setIsUploading(false)
        setUploadProgress(0)
      }, 300)
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to process file. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const handleCloseDialog = () => {
    if (!isUploading) {
      setError(null)
      setUploadProgress(0)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        onClick={handleCloseDialog}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-yellow-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Upload Document</h2>
                <p className="text-xs text-white/80">Susan AI Document Analyzer</p>
              </div>
            </div>
            <button
              onClick={handleCloseDialog}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              disabled={isUploading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl text-white">!</span>
                </div>
                <div>
                  <p className="text-red-200 font-semibold">Error</p>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleClickUpload}
              className={`
                border-4 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-orange-400 bg-orange-500/20'
                  : 'border-gray-600 bg-gray-800/50 hover:border-orange-500 hover:bg-gray-700/50'
                }
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isUploading ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
                    <svg className="animate-spin h-10 w-10 text-orange-400" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-white">Uploading...</p>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
                </div>
              ) : (
                <>
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center">
                    <span className="text-5xl">📄</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                  </h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>

                  {/* File Type Icons */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-1 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <span className="text-2xl">📕</span>
                      </div>
                      <p className="text-xs text-gray-400">PDF</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-1 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">🖼️</span>
                      </div>
                      <p className="text-xs text-gray-400">Images</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-1 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">📘</span>
                      </div>
                      <p className="text-xs text-gray-400">DOCX</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-1 rounded-lg bg-gray-500/20 flex items-center justify-center">
                        <span className="text-2xl">📄</span>
                      </div>
                      <p className="text-xs text-gray-400">TXT</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.txt"
              onChange={handleFileInput}
              disabled={isUploading}
            />

            {/* Info Box */}
            <div className="mt-6 bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <p className="text-blue-200 font-semibold text-sm mb-1">What Susan can analyze:</p>
                  <ul className="text-blue-300 text-sm space-y-1 list-disc list-inside">
                    <li>Insurance estimates and denial letters</li>
                    <li>Damage assessment photos</li>
                    <li>Email correspondence</li>
                    <li>Policy documents</li>
                    <li>Building code references</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
