'use client'

/**
 * DocumentQuestionsDialog Component
 *
 * Interactive Q&A interface where Susan asks contextual questions
 * to gather more information about the uploaded document
 */

import { useState, useRef, useEffect } from 'react'

interface Question {
  id: string
  question: string
  placeholder?: string
  optional?: boolean
}

interface DocumentQuestionsDialogProps {
  isOpen: boolean
  onClose: () => void
  fileName: string
  filePreview: string | null
  documentType: string
  questions: Question[]
  onComplete: (answers: Record<string, string>) => void
}

export default function DocumentQuestionsDialog({
  isOpen,
  onClose,
  fileName,
  filePreview,
  documentType,
  questions,
  onComplete
}: DocumentQuestionsDialogProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  useEffect(() => {
    if (isOpen && currentQuestion) {
      // Show typing animation before displaying question
      setShowTyping(true)
      const timer = setTimeout(() => {
        setShowTyping(false)
        // Focus input after question appears
        setTimeout(() => inputRef.current?.focus(), 100)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [currentQuestionIndex, isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [currentQuestionIndex, showTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleNext = () => {
    if (!currentAnswer.trim() && !currentQuestion.optional) {
      return
    }

    // Save answer
    if (currentAnswer.trim()) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: currentAnswer.trim()
      }))
    }

    // Move to next question or complete
    if (isLastQuestion) {
      handleComplete()
    } else {
      setCurrentAnswer('')
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSkip = () => {
    if (isLastQuestion) {
      handleComplete()
    } else {
      setCurrentAnswer('')
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleComplete = () => {
    setIsAnalyzing(true)

    // Small delay for UX
    setTimeout(() => {
      const finalAnswers = { ...answers }
      if (currentAnswer.trim()) {
        finalAnswers[currentQuestion.id] = currentAnswer.trim()
      }
      onComplete(finalAnswers)
    }, 500)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleNext()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Susan AI Analysis</h2>
                  <p className="text-xs text-white/80">{documentType} - {fileName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                disabled={isAnalyzing}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-white/80 mb-1">
                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
            {isAnalyzing ? (
              // Analyzing State
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <svg className="animate-spin h-12 w-12 text-purple-400" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Analyzing Document...</h3>
                <p className="text-gray-400">Susan is processing your document with the provided context</p>
                <div className="mt-6 flex justify-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            ) : (
              // Q&A Interface
              <div className="space-y-6">
                {/* File Preview (if image) */}
                {filePreview && currentQuestionIndex === 0 && (
                  <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Uploaded Document:</p>
                    <img
                      src={filePreview}
                      alt="Document preview"
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                  </div>
                )}

                {/* Conversation History */}
                {Object.entries(answers).map(([questionId, answer], index) => {
                  const q = questions.find(q => q.id === questionId)
                  if (!q) return null

                  return (
                    <div key={questionId} className="space-y-3">
                      {/* Susan's Question */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">S</span>
                        </div>
                        <div className="flex-1 bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-1">Susan AI</p>
                          <p className="text-white">{q.question}</p>
                        </div>
                      </div>

                      {/* User's Answer */}
                      <div className="flex items-start gap-3 justify-end">
                        <div className="flex-1 bg-blue-600 rounded-lg p-4 max-w-[80%]">
                          <p className="text-sm text-blue-100 mb-1">You</p>
                          <p className="text-white">{answer}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">👤</span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Current Question */}
                {currentQuestion && (
                  <div className="space-y-3">
                    {showTyping ? (
                      // Typing Indicator
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">S</span>
                        </div>
                        <div className="bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-2">Susan AI is typing...</p>
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Susan's Question
                      <div className="flex items-start gap-3 animate-fadeIn">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">S</span>
                        </div>
                        <div className="flex-1 bg-gray-800 border-2 border-purple-500 rounded-lg p-4">
                          <p className="text-sm text-gray-400 mb-1">Susan AI</p>
                          <p className="text-white text-lg">{currentQuestion.question}</p>
                          {currentQuestion.optional && (
                            <p className="text-sm text-gray-500 mt-2 italic">Optional - you can skip this</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {!isAnalyzing && (
            <div className="bg-gray-800 border-t-2 border-gray-700 p-4">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={currentQuestion?.placeholder || 'Type your answer...'}
                  className="flex-1 px-4 py-3 bg-gray-700 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500"
                />
                {currentQuestion?.optional && (
                  <button
                    onClick={handleSkip}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors font-medium"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() && !currentQuestion?.optional}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all font-bold disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLastQuestion ? 'Analyze' : 'Next'}
                </button>
              </div>

              {/* Helper Text */}
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press Enter to continue • {currentQuestion?.optional ? 'This question is optional' : 'Answer required to continue'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
