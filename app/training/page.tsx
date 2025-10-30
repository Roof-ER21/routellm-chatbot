'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import A21Badge from '../components/A21Badge'
import SimpleVoiceButton from '../components/SimpleVoiceButton'
import { ROLEPLAY_CHARACTERS, type RoleplayCharacterId } from '@/lib/agnes-prompts'
import CopyButton from '../components/CopyButton'
import CitationDisplay, { Citation } from '../components/CitationDisplay'

export const dynamic = 'force-dynamic'

interface PhotoExample {
  imageUrl: string
  label: string
  documentId: string
  pageNumber: number
  imageNumber: number
}

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  citations?: Citation[]
  photos?: PhotoExample[]
  score?: {
    confidence?: number
    evidence?: number
    objectionHandling?: number
    citations?: number
    overall?: number
  }
}

export default function TrainingPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [characterId, setCharacterId] = useState<RoleplayCharacterId>('none')
  const [showWelcome, setShowWelcome] = useState(true)
  const [sessionActive, setSessionActive] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoExample | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Start training session with selected character
  const startTrainingSession = async (selectedCharacterId: RoleplayCharacterId) => {
    setCharacterId(selectedCharacterId)
    setShowWelcome(false)
    setSessionActive(true)

    const character = ROLEPLAY_CHARACTERS[selectedCharacterId]

    // Add system message
    const systemMessage: Message = {
      role: 'system',
      content: `Training session started with ${character.name}`,
      timestamp: new Date()
    }

    setMessages([systemMessage])
    setIsLoading(true)

    try {
      // Get initial scenario from Agnes
      const response = await fetch('/api/agnes-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          characterId: selectedCharacterId,
          action: 'start'
        })
      })

      const data = await response.json()

      if (data.message) {
        const agnesMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          citations: data.citations,
          photos: data.photos || []
        }
        setMessages([systemMessage, agnesMessage])
      }
    } catch (error) {
      console.error('Failed to start training:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error starting the training session. Please try again.',
        timestamp: new Date()
      }
      setMessages([systemMessage, errorMessage])
    } finally {
      setIsLoading(false)
    }
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

    try {
      const response = await fetch('/api/agnes-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          characterId: characterId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response')
      }

      const agnesMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        citations: data.citations,
        photos: data.photos || [],
        score: data.score
      }

      setMessages(prev => [...prev, agnesMessage])
    } catch (error) {
      console.error('Chat error:', error)
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

  const resetSession = () => {
    setMessages([])
    setShowWelcome(true)
    setSessionActive(false)
    setCharacterId('none')
  }

  const switchCharacter = () => {
    resetSession()
  }

  const currentCharacter = ROLEPLAY_CHARACTERS[characterId]

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

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-red-700 to-red-800 border-b-4 border-black shadow-xl z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Left: Logo & Title */}
            <div className="flex items-center gap-4">
              <A21Badge size="md" />
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">
                  AGNES<span className="text-black">21</span>
                </h1>
                <p className="text-xs uppercase tracking-wider text-red-100 font-semibold">
                  Your Training Coach
                </p>
              </div>
            </div>

            {/* Center: Current Mode */}
            {sessionActive && (
              <div className="hidden md:flex items-center gap-3 px-5 py-2 bg-black/30 rounded-xl border-2 border-white/30">
                <span className="text-3xl">{currentCharacter.icon}</span>
                <div>
                  <p className="text-xs text-red-200 uppercase font-semibold">Training Mode</p>
                  <p className="text-sm text-white font-bold">{currentCharacter.name}</p>
                </div>
              </div>
            )}

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {sessionActive && (
                <>
                  <button
                    onClick={switchCharacter}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-all font-semibold text-sm border border-white/30"
                  >
                    Switch Character
                  </button>
                  <button
                    onClick={resetSession}
                    className="px-4 py-2 bg-black/40 hover:bg-black/60 text-white rounded-lg transition-all font-semibold text-sm border border-white/30"
                  >
                    End Session
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  console.log('[Training] Navigating back to home page')
                  router.push('/')
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors font-semibold text-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        {showWelcome ? (
          /* Welcome Screen */
          <div className="max-w-5xl mx-auto px-6 py-12">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <A21Badge size="xl" />
              </div>
              <h2 className="text-4xl font-black text-gray-900 mb-3">
                Welcome to Agnes 21 Training
              </h2>
              <p className="text-xl text-gray-700 font-semibold mb-2">
                Your Personal Sales Coach & Practice Partner
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Practice real-world scenarios, get expert feedback, and build confidence
                through roleplay training with AI characters.
              </p>
            </div>

            {/* Training Modes */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Choose Your Training Mode
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Expert Mode */}
                <button
                  onClick={() => startTrainingSession('none')}
                  className="group p-6 bg-white rounded-2xl border-3 border-red-200 hover:border-red-600 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.none.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-red-600">
                        {ROLEPLAY_CHARACTERS.none.name}
                      </h4>
                      <p className="text-sm text-gray-600">Ask & Learn</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Get expert coaching, Q&A support, and feedback without roleplay.
                    Perfect for learning new concepts and getting quick answers.
                  </p>
                </button>

                {/* Homeowner Characters */}
                <button
                  onClick={() => startTrainingSession('skeptical_veteran')}
                  className="group p-6 bg-white rounded-2xl border-3 border-gray-200 hover:border-orange-500 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.skeptical_veteran.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600">
                        {ROLEPLAY_CHARACTERS.skeptical_veteran.name}
                      </h4>
                      <p className="text-sm text-orange-600 font-semibold">Challenging</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ROLEPLAY_CHARACTERS.skeptical_veteran.personality}
                  </p>
                </button>

                <button
                  onClick={() => startTrainingSession('busy_professional')}
                  className="group p-6 bg-white rounded-2xl border-3 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.busy_professional.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                        {ROLEPLAY_CHARACTERS.busy_professional.name}
                      </h4>
                      <p className="text-sm text-blue-600 font-semibold">Fast-Paced</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ROLEPLAY_CHARACTERS.busy_professional.personality}
                  </p>
                </button>

                <button
                  onClick={() => startTrainingSession('cautious_researcher')}
                  className="group p-6 bg-white rounded-2xl border-3 border-gray-200 hover:border-purple-500 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.cautious_researcher.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-600">
                        {ROLEPLAY_CHARACTERS.cautious_researcher.name}
                      </h4>
                      <p className="text-sm text-purple-600 font-semibold">Detail-Oriented</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ROLEPLAY_CHARACTERS.cautious_researcher.personality}
                  </p>
                </button>

                <button
                  onClick={() => startTrainingSession('defensive_homeowner')}
                  className="group p-6 bg-white rounded-2xl border-3 border-gray-200 hover:border-yellow-500 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.defensive_homeowner.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-yellow-600">
                        {ROLEPLAY_CHARACTERS.defensive_homeowner.name}
                      </h4>
                      <p className="text-sm text-yellow-600 font-semibold">Very Challenging</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ROLEPLAY_CHARACTERS.defensive_homeowner.personality}
                  </p>
                </button>

                {/* Adjuster Character */}
                <button
                  onClick={() => startTrainingSession('tough_adjuster')}
                  className="group p-6 bg-white rounded-2xl border-3 border-gray-200 hover:border-green-500 hover:shadow-2xl transition-all text-left"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{ROLEPLAY_CHARACTERS.tough_adjuster.icon}</div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-600">
                        {ROLEPLAY_CHARACTERS.tough_adjuster.name}
                      </h4>
                      <p className="text-sm text-green-600 font-semibold">Advanced</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {ROLEPLAY_CHARACTERS.tough_adjuster.personality}
                  </p>
                </button>
              </div>
            </div>

            {/* Features Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                What You'll Get
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🎯</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Real-Time Feedback</h4>
                    <p className="text-sm text-gray-600">
                      Get instant performance scores and improvement suggestions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📚</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Source Citations</h4>
                    <p className="text-sm text-gray-600">
                      Every answer includes Q#, slide references, and document sources
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💪</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Build Confidence</h4>
                    <p className="text-sm text-gray-600">
                      Practice difficult scenarios in a safe environment
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🔄</div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Unlimited Practice</h4>
                    <p className="text-sm text-gray-600">
                      Train as much as you want with different characters and scenarios
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Interface */
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Mobile Character Indicator */}
            <div className="md:hidden mb-4 p-4 bg-white rounded-xl border-2 border-red-200 flex items-center gap-3">
              <span className="text-3xl">{currentCharacter.icon}</span>
              <div>
                <p className="text-xs text-red-600 uppercase font-semibold">Training Mode</p>
                <p className="text-sm text-gray-900 font-bold">{currentCharacter.name}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 pb-24 md:pb-6">
              {messages.map((message, index) => {
                if (message.role === 'system') {
                  return (
                    <div key={index} className="text-center">
                      <div className="inline-block px-4 py-2 bg-gray-200 rounded-full text-sm text-gray-700">
                        {message.content}
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-5 shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-red-600 to-red-700 text-white'
                          : 'bg-white text-gray-800 border-2 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0 mt-1">
                          {message.role === 'user' ? '👤' : currentCharacter.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Render content with inline citations (like Susan) */}
                          {message.role === 'assistant' && message.citations && message.citations.length > 0 ? (
                            <CitationDisplay
                              text={cleanMarkdown(message.content)}
                              citations={message.citations}
                              isDarkMode={false}
                            />
                          ) : (
                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                          )}

                          {/* Photo Examples Display */}
                          {message.role === 'assistant' && message.photos && message.photos.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">
                                📸 Photo Examples:
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                {message.photos.map((photo, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setSelectedPhoto(photo)}
                                    className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-red-500 transition-all shadow-sm hover:shadow-md bg-gray-100"
                                  >
                                    <img
                                      src={photo.imageUrl}
                                      alt={photo.label}
                                      className="w-full h-32 object-cover bg-gray-50"
                                      onError={(e) => {
                                        console.error('[Agnes] Failed to load image:', photo.imageUrl);
                                        e.currentTarget.style.display = 'none';
                                        const parent = e.currentTarget.parentElement;
                                        if (parent) {
                                          const errorDiv = document.createElement('div');
                                          errorDiv.className = 'w-full h-32 flex items-center justify-center bg-red-50 text-red-600 text-xs p-2';
                                          errorDiv.textContent = 'Image failed to load';
                                          parent.insertBefore(errorDiv, e.currentTarget);
                                        }
                                      }}
                                      onLoad={() => {
                                        console.log('[Agnes] Successfully loaded image:', photo.imageUrl);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-bold">
                                        Click to enlarge
                                      </span>
                                    </div>
                                    <div className="p-2 bg-white">
                                      <p className="text-xs text-gray-700 font-medium line-clamp-2">
                                        {photo.label}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <p className={`text-xs ${message.role === 'user' ? 'text-red-100' : 'text-gray-500'}`}>
                                {message.timestamp.toLocaleTimeString()}
                              </p>
                              {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {message.citations.length} {message.citations.length === 1 ? 'citation' : 'citations'}
                                </span>
                              )}
                            </div>
                            <CopyButton
                              text={message.content}
                              variant={message.role === 'user' ? 'dark' : 'light'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{currentCharacter.icon}</span>
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
          </div>
        )}
      </div>

      {/* Input Form - Only show when session is active */}
      {sessionActive && (
        <div className="flex-shrink-0 bg-white border-t-4 border-red-600 p-4 shadow-2xl sticky bottom-0 z-20 safe-bottom">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={sendMessage} className="flex gap-2 sm:gap-3 items-center">
              {/* Voice Input Button */}
              <SimpleVoiceButton
                onTranscript={(text, isFinal) => {
                  if (isFinal) {
                    setInput(prev => prev + ' ' + text);
                  }
                }}
                onError={(error) => {
                  console.error('Voice error:', error);
                }}
                className="flex-shrink-0"
              />

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  characterId === 'none'
                    ? 'Ask Agnes a question...'
                    : 'Your response...'
                }
                className="flex-1 bg-gray-50 border-2 border-gray-300 focus:border-red-500 rounded-xl px-3 sm:px-5 py-3 sm:py-4 text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-red-100 transition-all min-w-0"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold px-4 sm:px-8 py-3 sm:py-4 rounded-xl transition-all shadow-lg hover:shadow-xl whitespace-nowrap text-sm sm:text-base"
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
            </form>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Photo */}
            <div className="max-h-[70vh] overflow-auto bg-gray-100">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.label}
                className="w-full h-auto"
                onError={(e) => {
                  console.error('[Agnes] Failed to load lightbox image:', selectedPhoto.imageUrl);
                  e.currentTarget.style.display = 'none';
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'w-full h-64 flex items-center justify-center bg-red-50 text-red-600 p-8 text-center';
                    errorDiv.innerHTML = `<div><p class="font-bold mb-2">Failed to load image</p><p class="text-sm">${selectedPhoto.imageUrl}</p></div>`;
                    parent.appendChild(errorDiv);
                  }
                }}
                onLoad={() => {
                  console.log('[Agnes] Successfully loaded lightbox image:', selectedPhoto.imageUrl);
                }}
              />
            </div>

            {/* Photo info */}
            <div className="p-6 bg-white">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedPhoto.label}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Document: {selectedPhoto.documentId}</span>
                <span>Page {selectedPhoto.pageNumber}</span>
              </div>
              <button
                onClick={() => router.push(`/knowledge-base?doc=${selectedPhoto.documentId}`)}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
              >
                View in Knowledge Base →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
