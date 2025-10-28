'use client'

import { useState } from 'react'

interface ConversationalFlowProps {
  questions: string[];
  onComplete: (responses: string[]) => void;
  onCancel: () => void;
  repName: string;
}

export function ConversationalFlow({
  questions,
  onComplete,
  onCancel,
  repName
}: ConversationalFlowProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<string[]>([])
  const [currentResponse, setCurrentResponse] = useState('')

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleNext = () => {
    if (!currentResponse.trim()) return

    const newResponses = [...responses, currentResponse]
    setResponses(newResponses)
    setCurrentResponse('')

    if (isLastQuestion) {
      onComplete(newResponses)
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setCurrentResponse(responses[currentQuestionIndex - 1] || '')
      setResponses(responses.slice(0, -1))
    }
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-300 font-semibold">
            Gathering Intelligence {currentQuestionIndex + 1}/{questions.length}
          </span>
          <span className="text-gray-400">
            {Math.round(progress)}% complete
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Susan's Question */}
      <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-2 border-purple-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <p className="text-purple-200 font-bold text-sm mb-2">Susan AI-21:</p>
            <div className="text-white whitespace-pre-wrap leading-relaxed">
              {currentQuestion}
            </div>
          </div>
        </div>
      </div>

      {/* Response Area */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-200">
          Your Response:
        </label>
        <textarea
          value={currentResponse}
          onChange={(e) => setCurrentResponse(e.target.value)}
          placeholder="Type your detailed response here..."
          rows={8}
          className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleNext()
            }
          }}
        />
        <p className="text-xs text-gray-400">
          Press Ctrl+Enter to continue, or click the button below
        </p>
      </div>

      {/* Conversation History (collapsed) */}
      {responses.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => {
              const historyEl = document.getElementById('conversation-history')
              if (historyEl) {
                historyEl.classList.toggle('hidden')
              }
            }}
            className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
          >
            ▼ View Previous Responses ({responses.length})
          </button>
          <div id="conversation-history" className="hidden space-y-2 max-h-48 overflow-y-auto">
            {responses.map((resp, idx) => (
              <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Question {idx + 1}:</p>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{resp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {currentQuestionIndex > 0 && (
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!currentResponse.trim()}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLastQuestion ? (
            <>
              <span>✨</span>
              <span>Generate Email</span>
            </>
          ) : (
            <>
              <span>Continue →</span>
            </>
          )}
        </button>
      </div>

      {/* Cancel */}
      <button
        onClick={onCancel}
        className="w-full text-center text-gray-400 hover:text-gray-300 text-sm transition-colors"
      >
        Cancel and return to form
      </button>
    </div>
  )
}

/**
 * Intelligence Summary Display
 */
interface IntelligenceSummaryProps {
  intelligence: Record<string, any>;
  onEdit: () => void;
  onProceed: () => void;
}

export function IntelligenceSummary({
  intelligence,
  onEdit,
  onProceed
}: IntelligenceSummaryProps) {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-600/20 to-blue-600/20 border-2 border-green-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">✓</span>
          </div>
          <div className="flex-1">
            <p className="text-green-200 font-bold text-lg mb-2">Intelligence Gathered!</p>
            <p className="text-green-300 text-sm mb-4">
              I have all the information I need to craft a powerful, fact-based email.
            </p>

            <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
              {intelligence.situation && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Situation:</p>
                  <p className="text-white text-sm">{intelligence.situation}</p>
                </div>
              )}

              {intelligence.evidence && intelligence.evidence.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Evidence Available:</p>
                  <ul className="list-disc list-inside text-white text-sm space-y-1">
                    {intelligence.evidence.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {intelligence.specificIssues && intelligence.specificIssues.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Issues to Address:</p>
                  <ul className="list-disc list-inside text-white text-sm space-y-1">
                    {intelligence.specificIssues.map((issue: string, i: number) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {intelligence.jurisdiction && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Jurisdiction:</p>
                  <p className="text-white text-sm">{intelligence.jurisdiction}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium"
        >
          ← Edit Responses
        </button>
        <button
          onClick={onProceed}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <span>🚀</span>
          <span>Generate Powerful Email</span>
        </button>
      </div>
    </div>
  )
}
