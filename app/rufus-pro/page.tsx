'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import Rufus3DPro to avoid SSR issues with Three.js
const Rufus3DPro = dynamic(() => import('../components/Rufus3DPro'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl shadow-2xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mx-auto mb-4"></div>
        <p className="text-white text-xl font-semibold">Loading Professional 3D Rufus...</p>
      </div>
    </div>
  )
})

export default function RufusProPage() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [message, setMessage] = useState('')
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [enableLipSync, setEnableLipSync] = useState(true)
  const [inputText, setInputText] = useState('Hello! I am Rufus, your professional 3D AI assistant with advanced lip-sync technology. I can help you with insurance claims, document analysis, and much more!')

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
    'Hello! I am Rufus, your professional 3D AI assistant with advanced lip-sync.',
    'I can help you with insurance claims and comprehensive document analysis!',
    'Let me know if you need assistance with weather verification or damage assessment.',
    'I am here to make your insurance claims process easier, faster, and more efficient.',
    'Feel free to ask me anything about roofing insurance and property claims!',
    'My advanced lip-sync technology makes our conversations feel natural and engaging.',
    'I can analyze documents, generate emails, and provide real-time insights.'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-block mb-4 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30">
            <span className="text-blue-300 text-sm font-semibold">PROFESSIONAL EDITION</span>
          </div>
          <h1 className="text-6xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Meet Rufus Pro
          </h1>
          <p className="text-gray-300 text-xl">
            Your fully animated 3D AI assistant with professional-grade lip-sync technology
          </p>
        </div>

        {/* Main demo area */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* 3D Model Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
              <Rufus3DPro
                isSpeaking={isSpeaking}
                isListening={isListening}
                size={size}
                message={message}
                enableLipSync={enableLipSync}
              />

              {/* Size and feature controls */}
              <div className="mt-8 space-y-4 w-full max-w-md">
                {/* Size selector */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Avatar Size
                  </label>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setSize('small')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 ${
                        size === 'small'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Small
                    </button>
                    <button
                      onClick={() => setSize('medium')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 ${
                        size === 'medium'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => setSize('large')}
                      className={`px-5 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 ${
                        size === 'large'
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                    >
                      Large
                    </button>
                  </div>
                </div>

                {/* Lip sync toggle */}
                <div className="flex items-center justify-center gap-3 p-4 bg-white/10 rounded-lg border border-white/20">
                  <input
                    type="checkbox"
                    id="lipSyncToggle"
                    checked={enableLipSync}
                    onChange={(e) => setEnableLipSync(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="lipSyncToggle" className="text-white font-medium cursor-pointer">
                    Enable Advanced Lip-Sync
                  </label>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-6">
              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Message for Rufus to speak:
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm resize-none"
                  rows={5}
                  placeholder="Enter text for Rufus to speak..."
                />
              </div>

              {/* Preset messages */}
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  Quick presets:
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {presetMessages.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => setInputText(preset)}
                      className="px-4 py-3 text-sm bg-purple-500/30 hover:bg-purple-500/50 text-white rounded-lg transition-all text-left border border-purple-400/30 hover:border-purple-400/60"
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
                  className="flex-1 min-w-[150px] px-6 py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  🗣️ Make Rufus Speak
                </button>

                <button
                  onClick={handleStopSpeaking}
                  disabled={!isSpeaking}
                  className="flex-1 min-w-[150px] px-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:hover:scale-100"
                >
                  🛑 Stop Speaking
                </button>

                <button
                  onClick={toggleListening}
                  className={`w-full px-6 py-4 font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105 ${
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Professional 3D
            </h3>
            <p className="text-gray-300 text-sm">
              Optimized 4.1MB GLB model with 37-bone skeleton and professional rigging
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="text-5xl mb-4">🎤</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Advanced Lip-Sync
            </h3>
            <p className="text-gray-300 text-sm">
              14 visemes with Web Audio API analysis for ultra-realistic mouth movements
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Lifelike Animation
            </h3>
            <p className="text-gray-300 text-sm">
              Automatic blinking, breathing, and natural idle animations with ARKit blend shapes
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/20 hover:border-blue-400/50 transition-all">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="font-bold text-lg text-white mb-2">
              Zero API Costs
            </h3>
            <p className="text-gray-300 text-sm">
              Browser-native Web Speech API and Web Audio API - completely free!
            </p>
          </div>
        </div>

        {/* Technical specifications */}
        <div className="bg-blue-500/10 border border-blue-400/30 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <h3 className="font-bold text-2xl text-white mb-5 flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            Technical Specifications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>3D Engine:</strong> Three.js with React Three Fiber</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Model:</strong> Optimized 4.1MB GLB (GLTF 2.0)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Rigging:</strong> 37-bone quadruped skeleton</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Lip-Sync:</strong> 14 visemes with morph targets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Audio Analysis:</strong> Real-time FFT with Web Audio API</span>
              </li>
            </ul>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>TTS:</strong> Web Speech API with voice selection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Animations:</strong> Embedded GLB animations + procedural</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Lighting:</strong> Multi-source professional setup</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Performance:</strong> 60fps desktop, 30fps mobile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span><strong>Compatibility:</strong> All modern browsers</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Comparison with other solutions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
          <h3 className="font-bold text-2xl text-white mb-5 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            Why Rufus Pro Stands Out
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Ready Player Me</h4>
              <p className="text-sm text-gray-400 mb-2">~$0.05-0.10 per avatar + TTS costs</p>
              <p className="text-sm text-gray-300">Good quality but expensive at scale</p>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Soul Machines</h4>
              <p className="text-sm text-gray-400 mb-2">$0.002-0.005 per second</p>
              <p className="text-sm text-gray-300">Enterprise-grade but requires subscription</p>
            </div>
            <div className="border-2 border-green-500/50 rounded-lg p-4 bg-green-500/10">
              <h4 className="font-semibold text-green-300 mb-2">Rufus Pro</h4>
              <p className="text-sm text-green-400 mb-2 font-bold">$0.00 forever</p>
              <p className="text-sm text-white">Professional quality, zero cost, full control</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <a
            href="/"
            className="inline-block px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            ← Back to Main Chat
          </a>
          <a
            href="/rufus-3d-demo"
            className="inline-block px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            View Original 3D Demo →
          </a>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
      `}</style>
    </div>
  )
}
