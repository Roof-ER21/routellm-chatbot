'use client'

import { useState, useRef, useEffect } from 'react'

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic'
import InsuranceCompanySelector, { InsuranceCompany } from './components/InsuranceCompanySelector'
import EmailGenerator from './components/EmailGenerator'
import PhotoAnalysisModal from './components/PhotoAnalysisModal'
import UnifiedAnalyzerModal from './components/UnifiedAnalyzerModal'
import InsuranceDetailPopup from './components/InsuranceDetailPopup'
import VoiceControls from './components/VoiceControls'
import ModeToggle from './components/ModeToggle'
import OnboardingTooltip from './components/OnboardingTooltip'
import ActiveModeIndicator from './components/ActiveModeIndicator'
import CopyButton from './components/CopyButton'
import ConversationHistory from './components/ConversationHistory'
import SmartModeSuggestion from './components/SmartModeSuggestion'
import SettingsPanel from './components/SettingsPanel'
import ExportButton from './components/ExportButton'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder'
import { cleanTextForSpeech } from '@/lib/text-cleanup'

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
  const [showInsuranceDetail, setShowInsuranceDetail] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showEmailGenerator, setShowEmailGenerator] = useState(false)
  const [showUnifiedAnalyzer, setShowUnifiedAnalyzer] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [deepDiveMode, setDeepDiveMode] = useState(false)
  const [educationMode, setEducationMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string>('')
  const [handsFreeMode, setHandsFreeMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestAssistantMessageRef = useRef<string>('')

  // Text-to-speech for auto-reading responses
  const { speak, isSupported: isTtsSupported } = useTextToSpeech()

  // Rotating placeholder hook
  const { placeholder, pause, resume } = useRotatingPlaceholder()

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light'
    setIsDarkMode(savedTheme === 'dark')
  }, [])

  const handleThemeChange = (isDark: boolean) => {
    setIsDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    document.body.classList.remove('light-mode', 'dark-mode')
    document.body.classList.add(isDark ? 'dark-mode' : 'light-mode')
  }

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
    setShowInsuranceSelector(false)
    setShowInsuranceDetail(true)
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

  const sendMessage = async (e?: React.FormEvent, messageText?: string) => {
    if (e) e.preventDefault()

    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
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
          sessionId: sessionId,
          handsFreeMode: voiceEnabled, // Enable conversational mode when voice is active
          deepDiveMode: deepDiveMode, // Enable deep dive with follow-up questions
          educationMode: educationMode // Enable teaching/mentoring persona
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
      latestAssistantMessageRef.current = data.message

      // Auto-speak response if voice is enabled
      if (voiceEnabled && isTtsSupported) {
        // Small delay to let the UI update
        setTimeout(() => {
          speak(cleanTextForSpeech(data.message))
        }, 300)
      }
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

  // Handle voice transcript
  const handleVoiceTranscript = (transcript: string) => {
    if (!transcript.trim()) return

    // Set input and send immediately
    setInput(transcript)
    sendMessage(undefined, transcript)
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
            {/* Large S21 Circle Logo - Classy Red & Black */}
            <div className="flex justify-center mb-6">
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-susan-red)] to-[var(--color-susan-red-dark)] border-4 border-white shadow-2xl">
                {/* Simple inner ring */}
                <div className="absolute inset-3 rounded-full border border-white opacity-20"></div>
                {/* Center S21 text */}
                <div className="relative z-10 text-center">
                  <div className="text-6xl font-black tracking-tight text-white">
                    S21
                  </div>
                  <div className="text-xs uppercase tracking-widest mt-1 text-white opacity-80">
                    SUSAN AI
                  </div>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-center mb-2">
              SUSAN<span className="text-red-600">21</span>
            </h1>
            <p className="text-center mb-8 text-gray-600">Ancient Wisdom, Modern Protection</p>

            <form onSubmit={handleRepSubmit} className="space-y-6">
              <div>
                <label htmlFor="repName" className="block text-sm font-semibold mb-2 text-gray-700">
                  Enter Your Name to Continue
                </label>
                <input
                  id="repName"
                  type="text"
                  value={repInputValue}
                  onChange={(e) => setRepInputValue(e.target.value)}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-600 focus:ring-2 focus:ring-red-600 focus:ring-opacity-20 transition-all"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!repInputValue.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-semibold hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                Enter the Platform
              </button>
            </form>

            <p className="text-center text-xs mt-6 text-gray-500">
              Your name will be saved for future sessions
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header - Classy Red & Black */}
      <header className="status-bar-safe bg-gradient-to-r from-gray-900 to-black border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Header S21 Logo - Simplified */}
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-white shadow-lg">
                <div className="text-xl font-black text-white">
                  S21
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  SUSAN<span className="text-red-500">21</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-gray-400">Ancient Wisdom, Modern Protection</p>
              </div>
            </div>

            {/* Center: Active Mode Indicators */}
            <div className="flex-1 flex justify-center">
              <ActiveModeIndicator
                deepDiveMode={deepDiveMode}
                educationMode={educationMode}
                handsFreeMode={handsFreeMode}
                isDarkMode={isDarkMode}
                onDeepDiveToggle={() => setDeepDiveMode(!deepDiveMode)}
                onEducationToggle={() => setEducationMode(!educationMode)}
                onHandsFreeToggle={() => setHandsFreeMode(!handsFreeMode)}
              />
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              <div className="text-right mr-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Logged in as</p>
                <p className="text-sm font-semibold text-white">{repName}</p>
              </div>

              {messages.length > 0 && (
                <>
                  <ConversationHistory
                    onLoadConversation={(id) => {
                      setCurrentConversationId(id)
                    }}
                    onNewConversation={() => {
                      setMessages([])
                      setCurrentConversationId(Date.now().toString())
                    }}
                    currentConversationId={currentConversationId}
                    isDarkMode={isDarkMode}
                  />
                  <ExportButton
                    messages={messages}
                    repName={repName}
                    isDarkMode={isDarkMode}
                  />
                  <EmailGenerator
                    repName={repName}
                    sessionId={sessionId || undefined}
                    conversationHistory={messages.map(m => ({
                      role: m.role,
                      content: m.content
                    }))}
                  />
                </>
              )}

              <SettingsPanel
                isDarkMode={isDarkMode}
                deepDiveMode={deepDiveMode}
                educationMode={educationMode}
                voiceEnabled={voiceEnabled}
                onThemeChange={handleThemeChange}
                onDeepDiveChange={setDeepDiveMode}
                onEducationChange={setEducationMode}
                onVoiceEnabledChange={setVoiceEnabled}
                onClearHistory={() => {
                  setMessages([])
                  localStorage.removeItem('susan21_conversation_history')
                }}
              />

              <ModeToggle
                deepDiveMode={deepDiveMode}
                educationMode={educationMode}
                isDarkMode={isDarkMode}
                onDeepDiveChange={setDeepDiveMode}
                onEducationChange={setEducationMode}
                onThemeChange={handleThemeChange}
              />

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
      <div className="flex-1 overflow-hidden flex flex-col w-full">
        {/* Quick Links - Show when no messages */}
        {showQuickLinks && messages.length === 0 && (
          <div className="p-6 bg-white/50 backdrop-blur-sm border-b border-gray-200 max-w-7xl mx-auto w-full">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Access Tools</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              </div>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="max-w-5xl mx-auto w-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                {/* Welcome S21 Logo - Classy & Simple */}
                <div className="relative w-32 h-32 flex items-center justify-center mb-6 rounded-full bg-gradient-to-br from-red-600 to-red-700 border-4 border-gray-300 shadow-2xl">
                  <div className="absolute inset-3 rounded-full border border-white opacity-20"></div>
                  <div className="text-5xl font-black text-white">
                    S21
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  Welcome to SusanAI-21
                </h2>
                <p className="text-gray-600 mb-8 text-lg max-w-2xl">
                  I'm your specialized AI assistant for roofing professionals, equipped with:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-left">
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
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border border-white">
                              <div className="text-xs font-black text-white">
                                S21
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className={`text-xs ${message.role === 'user' ? 'text-red-100' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                            <CopyButton
                              text={message.content}
                              variant={message.role === 'user' ? 'dark' : 'light'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border border-white">
                          <div className="text-xs font-black text-white">
                            S21
                          </div>
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
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Voice Controls */}
            <VoiceControls
              onTranscript={handleVoiceTranscript}
              autoReadResponses={voiceEnabled}
              disabled={isLoading}
              onVoiceEnabledChange={setVoiceEnabled}
            />

            {/* Smart Mode Suggestion */}
            <SmartModeSuggestion
              userMessage={input}
              deepDiveMode={deepDiveMode}
              educationMode={educationMode}
              onEnableDeepDive={() => setDeepDiveMode(true)}
              onEnableEducation={() => setEducationMode(true)}
              isDarkMode={isDarkMode}
            />

            <form onSubmit={sendMessage}>
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
                onFocus={pause}
                onBlur={resume}
                placeholder={placeholder}
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

      {/* Insurance Detail Popup - Shows comprehensive company info with Susan chat */}
      <InsuranceDetailPopup
        isOpen={showInsuranceDetail}
        onClose={() => setShowInsuranceDetail(false)}
        company={selectedCompany}
        repName={repName}
        sessionId={sessionId || undefined}
      />

      {/* Onboarding Tooltip - Shows on first visit */}
      <OnboardingTooltip />

    </div>
  )
}
