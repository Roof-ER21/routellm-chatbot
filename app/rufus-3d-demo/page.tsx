'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Rufus3D to avoid SSR issues with Three.js
const Rufus3D = dynamic(() => import('../components/Rufus3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl">
      <p className="text-white text-lg">Loading 3D Rufus...</p>
    </div>
  )
})

export default function Rufus3DDemoPage() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState('')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [inputText, setInputText] = useState('Hello! I am Rufus, your 3D AI assistant. I can help you with insurance claims and answer your questions!')

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
    'Hello! I am Rufus, your 3D AI assistant.',
    'I can help you with insurance claims and document analysis!',
    'Let me know if you need assistance with weather verification or damage assessment.',
    'I am here to make your insurance claims process easier and faster.',
    'Feel free to ask me anything about roofing insurance!'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Meet 3D Rufus!
          </h1>
          <p className="text-gray-300 text-lg">
            Your fully animated 3D AI assistant with lip-sync
          </p>
        </div>

        {/* Main demo area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* 3D Model Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <Rufus3D
                isSpeaking={isSpeaking}
                isListening={isListening}
                size={size}
                message={message}
              />

              {/* Size selector */}
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setSize('small')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    size === 'small'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Small
                </button>
                <button
                  onClick={() => setSize('medium')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    size === 'medium'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setSize('large')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    size === 'large'
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Large
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-6">
              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Message for Rufus to speak:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter text for Rufus to speak..."
                />
              </div>

              {/* Preset messages */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Quick presets:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {presetMessages.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setInputText(preset)}
                      className="px-3 py-2 text-sm bg-purple-500/30 hover:bg-purple-500/50 text-white rounded-lg transition-all text-left border border-purple-400/30"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSpeak}
                  disabled={isSpeaking || !inputText.trim()}
                  className="flex-1 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🗣️ Make Rufus Speak
                </button>

                <button
                  onClick={handleStopSpeaking}
                  disabled={!isSpeaking}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg transition-all transform hover:scale-105"
                >
                  🛑 Stop Speaking
                </button>

                <button
                  onClick={toggleListening}
                  className={`w-full px-6 py-3 font-medium rounded-lg shadow-lg transition-all transform hover:scale-105 ${
                    isListening
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-white/20 hover:bg-white/30 text-white'
                  }`}
                >
                  {isListening ? '👂 Listening...' : '👂 Start Listening Mode'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
            <div className="text-4xl mb-3">🎬</div>
            <h3 className="font-bold text-lg text-white mb-2">
              3D Animations
            </h3>
            <p className="text-gray-300 text-sm">
              Full 3D model with built-in animations from the GLB file
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
            <div className="text-4xl mb-3">🎤</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Real Lip-Sync
            </h3>
            <p className="text-gray-300 text-sm">
              Synchronized animations with Web Speech API text-to-speech
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-white/20">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Zero API Costs
            </h3>
            <p className="text-gray-300 text-sm">
              Uses browser's built-in Web Speech API - completely free!
            </p>
          </div>
        </div>

        {/* Technical info */}
        <div className="bg-blue-500/10 border border-blue-400/30 backdrop-blur-lg rounded-xl p-6">
          <h3 className="font-bold text-lg text-white mb-3">
            Technical Details
          </h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>✅ Three.js and React Three Fiber for 3D rendering</li>
            <li>✅ GLB model format with embedded animations</li>
            <li>✅ Web Speech API for text-to-speech (no API costs)</li>
            <li>✅ Interactive 3D scene with orbit controls</li>
            <li>✅ Responsive design - works on desktop and mobile</li>
            <li>✅ Smooth animations and transitions</li>
            <li>✅ Dynamic lighting and shadows</li>
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
    </div>
  )
}
