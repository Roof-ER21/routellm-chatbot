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
import SmartModeSuggestion from './components/SmartModeSuggestion'
import SettingsPanel from './components/SettingsPanel'
import ExportButton from './components/ExportButton'
import SimpleAuth from './components/SimpleAuth'
import { useTextToSpeech } from '@/hooks/useTextToSpeech'
import { useRotatingPlaceholder } from '@/hooks/useRotatingPlaceholder'
import { cleanTextForSpeech } from '@/lib/text-cleanup'
import { getCurrentUser, getUserDisplayName, logout as authLogout, isRemembered, saveConversation, getCurrentConversation, cleanupOldConversations } from '@/lib/simple-auth'
import { analyzeAndFlagConversation } from '@/lib/client-threat-detection'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [repId, setRepId] = useState<number | null>(null)
  const [showInsuranceSelector, setShowInsuranceSelector] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<InsuranceCompany | null>(null)
  const [showInsuranceDetail, setShowInsuranceDetail] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showEmailGenerator, setShowEmailGenerator] = useState(false)
  const [showUnifiedAnalyzer, setShowUnifiedAnalyzer] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [educationMode, setEducationMode] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const latestAssistantMessageRef = useRef<string>('')

  // Text-to-speech for auto-reading responses
  const { speak, stop: stopSpeaking, isSpeaking, isSupported: isTtsSupported } = useTextToSpeech()

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

  // Mark component as mounted (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for authentication after mount
  useEffect(() => {
    if (!mounted) return

    const currentUser = getCurrentUser()
    if (currentUser && isRemembered()) {
      const displayName = getUserDisplayName()
      if (displayName) {
        setRepName(displayName)
        setIsAuthenticated(true)
        initializeSession(displayName)

        // Load current conversation
        const currentConv = getCurrentConversation()
        if (currentConv && currentConv.messages && currentConv.messages.length > 0) {
          const messagesWithDates = currentConv.messages.map(m => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
          }))
          setMessages(messagesWithDates)
          setCurrentConversationId(currentConv.id)
          setShowQuickLinks(false)
        }

        // Cleanup old conversations (60+ days)
        cleanupOldConversations()
      }
    }
  }, [mounted])

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

  const handleAuthenticated = () => {
    const displayName = getUserDisplayName()
    if (displayName) {
      setRepName(displayName)
      setIsAuthenticated(true)
      initializeSession(displayName)
    }
  }

  const handleLogout = () => {
    authLogout()
    setRepName('')
    setIsAuthenticated(false)
    setMessages([])
    setSessionId(null)
    setShowQuickLinks(true)
    setCurrentConversationId('')
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
          educationMode: educationMode // Enable teaching/mentoring persona
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      console.log('[Page] Received response from API:', data)

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      console.log('[Page] Adding assistant message to state')
      setMessages(prev => [...prev, assistantMessage])
      latestAssistantMessageRef.current = data.message

      // Auto-speak response if voice is enabled
      console.log('[Page] voiceEnabled:', voiceEnabled, 'isTtsSupported:', isTtsSupported)
      if (voiceEnabled && isTtsSupported) {
        console.log('[Page] Speaking response:', cleanTextForSpeech(data.message))
        // Small delay to let the UI update
        setTimeout(() => {
          speak(cleanTextForSpeech(data.message))
        }, 300)
      } else {
        console.log('[Page] NOT speaking - voiceEnabled:', voiceEnabled, 'isTtsSupported:', isTtsSupported)
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
    console.log('[Page] Voice transcript received:', transcript)

    if (!transcript.trim()) {
      console.log('[Page] Transcript is empty, ignoring')
      return
    }

    console.log('[Page] Setting input and sending message')
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
    setCurrentConversationId('')
  }

  const handleLoadConversation = (loadedMessages: any[], conversationId: string) => {
    // Convert timestamps back to Date objects
    const messagesWithDates = loadedMessages.map(m => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
    }))
    setMessages(messagesWithDates)
    setCurrentConversationId(conversationId)
    setShowQuickLinks(false)
    // Scroll to bottom to show loaded conversation
    setTimeout(() => scrollToBottom(), 100)
  }

  const handleNewConversation = () => {
    // Save current conversation before creating new one
    if (messages.length > 0 && currentConversationId) {
      saveConversation(messages, currentConversationId)
      // Run threat detection on final conversation
      analyzeAndFlagConversation(currentConversationId, messages)
    }
    // Reset to new conversation
    setMessages([])
    setShowQuickLinks(true)
    const newConvId = Date.now().toString()
    setCurrentConversationId(newConvId)
  }

  // Auto-save conversation when messages change (debounced with retry logic)
  useEffect(() => {
    if (messages.length > 0 && isAuthenticated) {
      const timeoutId = setTimeout(() => {
        try {
          console.log('[Auto-Save] Attempting to save conversation...', {
            messageCount: messages.length,
            conversationId: currentConversationId,
            isAuthenticated
          })

          // Use currentConversationId to update the same conversation
          const result = saveConversation(messages, currentConversationId || undefined)

          if (result.success) {
            console.log('[Auto-Save] ✓ Conversation saved successfully', {
              conversationId: result.conversationId,
              messageCount: messages.length
            })

            // Update conversation ID if it was just created
            if (result.conversationId && !currentConversationId) {
              setCurrentConversationId(result.conversationId)
            }

            // Run threat detection analysis (silent - user won't see this)
            if (result.conversationId) {
              try {
                analyzeAndFlagConversation(result.conversationId, messages)
                console.log('[Auto-Save] ✓ Threat detection analysis completed')
              } catch (threatError) {
                console.error('[Auto-Save] Threat detection failed (non-critical):', threatError)
              }
            }
          } else {
            console.error('[Auto-Save] ✗ Save failed:', result.error)

            // Retry once after 1 second if save failed
            setTimeout(() => {
              console.log('[Auto-Save] Retrying save...')
              const retryResult = saveConversation(messages, currentConversationId || undefined)
              if (retryResult.success) {
                console.log('[Auto-Save] ✓ Retry successful')
                if (retryResult.conversationId && !currentConversationId) {
                  setCurrentConversationId(retryResult.conversationId)
                }
              } else {
                console.error('[Auto-Save] ✗ Retry failed:', retryResult.error)
              }
            }, 1000)
          }
        } catch (error) {
          console.error('[Auto-Save] Exception during save:', error)
          // Show user-visible error for critical failures
          if (error instanceof Error && error.message.includes('localStorage')) {
            console.error('[Auto-Save] CRITICAL: localStorage not available on this device')
          }
        }
      }, 1000) // Reduced from 2000ms to 1000ms for faster saves on mobile

      return () => clearTimeout(timeoutId)
    }
  }, [messages, isAuthenticated, currentConversationId])

  // Clean markdown formatting from text for display
  const cleanMarkdown = (text: string): string => {
    return text
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove headers (### text or ## text)
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')
      // Keep the text readable
      .trim()
  }

  // Show nothing until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null
  }

  // Show authentication screen if not logged in
  if (!isAuthenticated) {
    return <SimpleAuth onAuthenticated={handleAuthenticated} isDarkMode={isDarkMode} />
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ height: '100dvh' }}>
      {/* Header - Responsive for mobile */}
      <header className="flex-shrink-0 status-bar-safe bg-gradient-to-r from-gray-900 to-black border-b-2 border-red-600">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
          {/* Mobile Header - Single Row */}
          <div className="md:hidden flex justify-between items-center gap-2">
            {/* Left: Logo + Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-white shadow-lg flex-shrink-0">
                <div className="text-sm font-black text-white">S21</div>
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold tracking-tight text-white truncate">
                  SUSAN<span className="text-red-500">21</span>
                </h1>
                <p className="text-xs text-gray-400 truncate">{repName}</p>
              </div>
            </div>

            {/* Right: Essential Controls Only */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <SettingsPanel
                isDarkMode={isDarkMode}
                educationMode={educationMode}
                voiceEnabled={voiceEnabled}
                onThemeChange={handleThemeChange}
                onEducationChange={setEducationMode}
                onVoiceEnabledChange={setVoiceEnabled}
                onLoadConversation={handleLoadConversation}
                onNewConversation={handleNewConversation}
                currentConversationId={currentConversationId}
                messages={messages}
                repName={repName}
                sessionId={sessionId}
                onExport={() => {
                  // Export logic will be handled by ExportButton component
                  const exportBtn = document.querySelector('[data-export-trigger]') as HTMLButtonElement
                  exportBtn?.click()
                }}
                onEmailGenerate={() => setShowEmailGenerator(true)}
              />
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium text-xs"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Desktop Header - Full Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 border-2 border-white shadow-lg">
                <div className="text-xl font-black text-white">S21</div>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  SUSAN<span className="text-red-500">21</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-gray-400">Ancient Wisdom, Modern Protection</p>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <ActiveModeIndicator
                educationMode={educationMode}
                isDarkMode={isDarkMode}
                onEducationToggle={() => setEducationMode(!educationMode)}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-3">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Logged in as</p>
                <p className="text-sm font-semibold text-white">{repName}</p>
              </div>

              {/* Hidden export button for triggering from Settings */}
              {messages.length > 0 && (
                <div className="hidden">
                  <ExportButton
                    messages={messages}
                    repName={repName}
                    isDarkMode={isDarkMode}
                    data-export-trigger="true"
                  />
                </div>
              )}

              <SettingsPanel
                isDarkMode={isDarkMode}
                educationMode={educationMode}
                voiceEnabled={voiceEnabled}
                onThemeChange={handleThemeChange}
                onEducationChange={setEducationMode}
                onVoiceEnabledChange={setVoiceEnabled}
                onLoadConversation={handleLoadConversation}
                onNewConversation={handleNewConversation}
                currentConversationId={currentConversationId}
                messages={messages}
                repName={repName}
                sessionId={sessionId}
                onExport={() => {
                  const exportBtn = document.querySelector('[data-export-trigger]') as HTMLButtonElement
                  exportBtn?.click()
                }}
                onEmailGenerate={() => setShowEmailGenerator(true)}
              />

              <ModeToggle
                educationMode={educationMode}
                isDarkMode={isDarkMode}
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
      <div className="flex-1 overflow-y-auto flex flex-col w-full" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Quick Links - Show when no messages */}
        {showQuickLinks && messages.length === 0 && (
          <div className="flex-shrink-0 p-6 bg-white/50 backdrop-blur-sm border-b border-gray-200 max-w-7xl mx-auto w-full">
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
        <div className="flex-1 p-6 pb-6">
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
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {message.role === 'assistant' ? cleanMarkdown(message.content) : message.content}
                          </p>
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
        <div className="flex-shrink-0 bg-white border-t-2 border-gray-200 p-4 shadow-2xl safe-area-bottom">
          <div className="max-w-5xl mx-auto space-y-3">
            {/* Smart Mode Suggestion */}
            <SmartModeSuggestion
              userMessage={input}
              educationMode={educationMode}
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
