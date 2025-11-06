'use client'

import { useState } from 'react'
import RufusCharacter from '../components/RufusCharacter'

export default function RufusDemoPage() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState('')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [inputText, setInputText] = useState('Hello! I am Rufus, your friendly AI assistant. I can help you with insurance claims and answer your questions!')

  const handleSpeak = () => {
    setIsSpeaking(true)
    setMessage(inputText)

    // Stop speaking after the speech is done (estimate based on text length)
    const estimatedDuration = inputText.split(' ').length * 400 + 1000
    setTimeout(() => {
      setIsSpeaking(false)
      setMessage('')
    }, estimatedDuration)
  }

  const handleStopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setMessage('')
  }

  const toggleListening = () => {
    setIsListening(!isListening)
  }

  const presetMessages = [
    'Hello! I am Rufus, your friendly AI assistant.',
    'I can help you with insurance claims and answer your questions!',
    'Let me know if you need assistance with document analysis or email generation.',
    'Weather verification? Storm data? I can help with that too!',
    'I am here to make your insurance claims process easier and faster.'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Meet Rufus!
          </h1>
          <p className="text-gray-600">
            Your friendly AI assistant with animated lip-sync
          </p>
        </div>

        {/* Main demo area */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex flex-col items-center justify-center mb-8">
            <RufusCharacter
              isSpeaking={isSpeaking}
              isListening={isListening}
              size={size}
              message={message}
            />
          </div>

          {/* Size selector */}
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setSize('small')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                size === 'small'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => setSize('medium')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                size === 'medium'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => setSize('large')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                size === 'large'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Large
            </button>
          </div>

          {/* Text input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message for Rufus to speak:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter text for Rufus to speak..."
            />
          </div>

          {/* Preset messages */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick presets:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {presetMessages.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(preset)}
                  className="px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-all text-left"
                >
                  {preset.substring(0, 50)}...
                </button>
              ))}
            </div>
          </div>

          {/* Control buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleSpeak}
              disabled={isSpeaking || !inputText.trim()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              🗣️ Make Rufus Speak
            </button>

            <button
              onClick={handleStopSpeaking}
              disabled={!isSpeaking}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              🛑 Stop Speaking
            </button>

            <button
              onClick={toggleListening}
              className={`px-6 py-3 font-medium rounded-lg shadow-lg transition-all transform hover:scale-105 ${
                isListening
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {isListening ? '👂 Listening...' : '👂 Start Listening Mode'}
            </button>
          </div>
        </div>

        {/* Features showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              Lip-Sync Animation
            </h3>
            <p className="text-gray-600 text-sm">
              Rufus's mouth moves naturally with speech using the Web Speech API
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">👁️</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              Lifelike Animations
            </h3>
            <p className="text-gray-600 text-sm">
              Automatic blinking, tail wagging, and head tilting for realism
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-bold text-lg text-gray-800 mb-2">
              Zero API Costs
            </h3>
            <p className="text-gray-600 text-sm">
              Uses browser's built-in Web Speech API - completely free!
            </p>
          </div>
        </div>

        {/* Technical info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-lg text-blue-900 mb-3">
            Technical Details
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Pure SVG animation - no external image files needed</li>
            <li>✅ Web Speech API for text-to-speech - works in all modern browsers</li>
            <li>✅ Real-time lip-sync based on speech timing</li>
            <li>✅ Responsive design - works on desktop and mobile</li>
            <li>✅ No external dependencies or API costs</li>
            <li>✅ Automatic animations: blinking (every 3-5 seconds), tail wagging, head tilting</li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            ← Back to Main Chat
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
