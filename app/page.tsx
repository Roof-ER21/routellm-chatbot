'use client'

import { useState, useRef, useEffect } from 'react'
import InsuranceCompanySelector, { InsuranceCompany } from './components/InsuranceCompanySelector'
import EmailGenerator from './components/EmailGenerator'
import PhotoAnalysisModal from './components/PhotoAnalysisModal'
import UnifiedAnalyzerModal from './components/UnifiedAnalyzerModal'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickLinks, setShowQuickLinks] = useState(true)
  const [repName, setRepName] = useState('')
  const [showRepEntry, setShowRepEntry] = useState(true)
  const [repInputValue, setRepInputValue] = useState('')
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [repId, setRepId] = useState<number | null>(null)
  const [showInsuranceSelector, setShowInsuranceSelector] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<InsuranceCompany | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showEmailGenerator, setShowEmailGenerator] = useState(false)
  const [showUnifiedAnalyzer, setShowUnifiedAnalyzer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for stored rep name on mount
  useEffect(() => {
    const storedName = localStorage.getItem('repName')
    if (storedName) {
      setRepName(storedName)
      setShowRepEntry(false)
      initializeSession(storedName)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const initializeSession = async (name: string) => {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repName: name })
      })
      const data = await response.json()
      setSessionId(data.sessionId)
      setRepId(data.repId)
    } catch (error) {
      console.error('Failed to initialize session:', error)
    }
  }

  const handleInsuranceSelect = (company: InsuranceCompany) => {
    setSelectedCompany(company)
    // Add company info to the chat
    const companyInfo = `Selected Insurance Company: ${company.name}\nPhone: ${company.phone}${company.phone_instructions ? `\nInstructions: ${company.phone_instructions}` : ''}${company.email ? `\nEmail: ${company.email}` : ''}`
    setInput(companyInfo)
  }

  const handlePhotoAnalyzed = (result: any) => {
    // Add the analysis result to the chat
    let analysisMessage = 'Photo Analysis Results:\n\n'

    if (result.success) {
      if (result.severity) {
        analysisMessage += `Severity: ${result.severity.score}/10 (${result.severity.rating})\n`
        analysisMessage += `Recommendation: ${result.severity.recommendation}\n\n`
      }

      if (result.damage_detected) {
        analysisMessage += 'Damage Detected: Yes\n'
      }

      if (result.detections && result.detections.length > 0) {
        analysisMessage += `\nDetections (${result.detections.length}):\n`
        result.detections.slice(0, 3).forEach((d: any, i: number) => {
          analysisMessage += `${i + 1}. ${d.name} (${Math.round(d.confidence * 100)}% confidence)\n`
        })
      }

      if (result.assessment) {
        analysisMessage += `\nAssessment:\n${result.assessment.substring(0, 500)}...`
      }
    } else {
      analysisMessage += `Error: ${result.error || 'Analysis failed'}`
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: analysisMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
    setShowQuickLinks(false)
  }

  const handleDocumentAnalyzed = (result: any) => {
    // Add the unified document analysis result to the chat
    let analysisMessage = ''

    if (result.success) {
      // Use the formatted response from the API
      analysisMessage = result.formattedResponse || result.rawAnalysis || 'Analysis completed successfully'

      // Add metadata if available
      if (result.metadata) {
        const meta = result.metadata
        if (meta.claimNumber) {
          analysisMessage += `\n\nClaim #: ${meta.claimNumber}`
        }
        if (meta.policyNumber) {
          analysisMessage += `\nPolicy #: ${meta.policyNumber}`
        }
      }
    } else {
      analysisMessage = `Document Analysis Error: ${result.error || 'Analysis failed'}`
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: analysisMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, assistantMessage])
    setShowQuickLinks(false)
  }

  const handleRepSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!repInputValue.trim()) return

    const name = repInputValue.trim()
    setRepName(name)
    localStorage.setItem('repName', name)
    setShowRepEntry(false)
    initializeSession(name)
  }

  const handleLogout = () => {
    localStorage.removeItem('repName')
    setRepName('')
    setShowRepEntry(true)
    setMessages([])
    setSessionId(null)
    setShowQuickLinks(true)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowQuickLinks(false)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          repName: repName,
          sessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickLink = (prompt: string) => {
    setInput(prompt)
    setShowQuickLinks(false)
  }

  const clearChat = () => {
    setMessages([])
    setShowQuickLinks(true)
  }

  // Rep Entry Screen
  if (showRepEntry) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg">
                <span className="text-4xl">👁️</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              SUSAN<span className="text-red-600">AI-21</span>
            </h1>
            <p className="text-center text-gray-600 mb-8">Roof-ER Roofing Assistant</p>

            <form onSubmit={handleRepSubmit} className="space-y-6">
              <div>
                <label htmlFor="repName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter Your Name to Continue
                </label>
                <input
                  id="repName"
                  type="text"
                  value={repInputValue}
                  onChange={(e) => setRepInputValue(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 focus:border-red-500 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!repInputValue.trim()}
                className="w-full bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Start Chat Session
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6">
              Your name will be saved locally for future sessions
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-[#1a1a1a] text-white shadow-xl border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                <span className="text-2xl">👁️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  SUSAN<span className="text-red-600">AI-21</span>
                </h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Roof-ER Roofing Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right mr-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Logged in as</p>
                <p className="text-sm font-semibold text-white">{repName}</p>
              </div>
              {messages.length > 0 && (
                <>
                  <EmailGenerator
                    repName={repName}
                    sessionId={sessionId || undefined}
                    conversationHistory={messages.map(m => ({
                      role: m.role,
                      content: m.content
                    }))}
                  />
                  <button
                    onClick={clearChat}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    New Chat
                  </button>
                </>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
        {/* Quick Links - Show when no messages */}
        {showQuickLinks && messages.length === 0 && (
          <div className="p-6 bg-white/50 backdrop-blur-sm border-b border-gray-200">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Access Tools</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => setShowUnifiedAnalyzer(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-orange-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center group-hover:from-orange-500 group-hover:to-orange-600 transition-all">
                    <span className="text-2xl">📎</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 text-center">Upload & Analyze</span>
                </button>

                <button
                  onClick={() => setShowEmailGenerator(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-red-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-500 group-hover:to-blue-600 transition-all">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600 text-center">Email Generator</span>
                </button>

                <button
                  onClick={() => setShowInsuranceSelector(true)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center group-hover:from-green-500 group-hover:to-green-600 transition-all">
                    <span className="text-2xl">🏢</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-green-600 text-center">Insurance Companies</span>
                </button>

                <button
                  onClick={() => handleQuickLink("Show me weather data and storm information for damage assessment")}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-red-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center group-hover:from-purple-500 group-hover:to-purple-600 transition-all">
                    <span className="text-2xl">⛈️</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 text-center">Weather Data</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-6 shadow-2xl">
                  <span className="text-5xl">👁️</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  Welcome to SusanAI-21
                </h2>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                  I'm your specialized AI assistant for roofing professionals, equipped with:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl text-left">
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Unified Document Analyzer</h3>
                        <p className="text-sm text-gray-600">Denial letters, estimates, emails, photos - all in one</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🤖</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Smart Analysis</h3>
                        <p className="text-sm text-gray-600">Auto-detect document types and extract insights</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">✉️</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Email Generator</h3>
                        <p className="text-sm text-gray-600">Professional templates for clients</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🏢</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Insurance Finder</h3>
                        <p className="text-sm text-gray-600">Company contact details and processes</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⛈️</span>
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Weather Data</h3>
                        <p className="text-sm text-gray-600">Storm history and damage correlation</p>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 mt-8 text-sm">
                  Ask about damage assessment, insurance claims, or use the roofing tools above
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-5 shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0 mt-1">
                          {message.role === 'user' ? '👤' : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-base">
                              👁️
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-red-100' : 'text-gray-500'}`}>
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-base">
                          👁️
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white border-t-2 border-gray-200 p-4 shadow-2xl">
          <form onSubmit={sendMessage} className="max-w-5xl mx-auto">
            {/* Selected Company Display */}
            {selectedCompany && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏢</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedCompany.name}</p>
                    <div className="flex gap-3 text-xs text-gray-600">
                      {selectedCompany.phone && (
                        <a href={`tel:${selectedCompany.phone.replace(/[^0-9]/g, '')}`} className="hover:text-green-600">
                          {selectedCompany.phone}
                        </a>
                      )}
                      {selectedCompany.email && (
                        <a href={`mailto:${selectedCompany.email}`} className="hover:text-green-600">
                          {selectedCompany.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompany(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUnifiedAnalyzer(true)}
                className="bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold px-4 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                title="Upload & Analyze Documents and Photos"
              >
                <span className="text-xl">📎</span>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about damage assessment, insurance claims, or use the roofing tools..."
                className="flex-1 bg-gray-50 border-2 border-gray-300 focus:border-red-500 rounded-xl px-5 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ) : (
                  <span>Send</span>
                )}
              </button>
            </div>
            {!showQuickLinks && messages.length > 0 && (
              <button
                type="button"
                onClick={() => setShowQuickLinks(!showQuickLinks)}
                className="mt-3 text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                {showQuickLinks ? 'Hide' : 'Show'} Quick Access Tools
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Insurance Company Selector Modal */}
      <InsuranceCompanySelector
        isOpen={showInsuranceSelector}
        onClose={() => setShowInsuranceSelector(false)}
        onSelect={handleInsuranceSelect}
        repId={repId || undefined}
      />

      {/* Photo Analysis Modal */}
      <PhotoAnalysisModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onAnalyzed={handlePhotoAnalyzed}
      />

      {/* Unified Document Analyzer Modal */}
      <UnifiedAnalyzerModal
        isOpen={showUnifiedAnalyzer}
        onClose={() => setShowUnifiedAnalyzer(false)}
        onAnalyzed={handleDocumentAnalyzed}
      />

      {/* Email Generator Modal - Conditionally Rendered */}
      {showEmailGenerator && (
        <EmailGenerator
          repName={repName}
          sessionId={sessionId || undefined}
          conversationHistory={messages.map(m => ({
            role: m.role,
            content: m.content
          }))}
          autoOpen={true}
          onClose={() => setShowEmailGenerator(false)}
        />
      )}
    </div>
  )
}
