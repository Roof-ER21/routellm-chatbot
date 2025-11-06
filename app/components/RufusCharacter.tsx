'use client'

import { useState, useEffect, useRef } from 'react'

interface RufusCharacterProps {
  isSpeaking?: boolean
  isListening?: boolean
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export default function RufusCharacter({
  isSpeaking = false,
  isListening = false,
  size = 'medium',
  message = ''
}: RufusCharacterProps) {
  const [mouthOpen, setMouthOpen] = useState(0) // 0-1 scale for mouth openness
  const [eyesBlink, setEyesBlink] = useState(false)
  const [tailWag, setTailWag] = useState(0)
  const [headTilt, setHeadTilt] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number>()
  const lastSpeakTimeRef = useRef<number>(0)

  // Size configurations
  const sizes = {
    small: { width: 120, height: 120, scale: 0.6 },
    medium: { width: 200, height: 200, scale: 1 },
    large: { width: 300, height: 300, scale: 1.5 }
  }
  const config = sizes[size]

  // Blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true)
      setTimeout(() => setEyesBlink(false), 150)
    }, 3000 + Math.random() * 2000)

    return () => clearInterval(blinkInterval)
  }, [])

  // Tail wagging animation
  useEffect(() => {
    if (isSpeaking || isListening) {
      const wagInterval = setInterval(() => {
        setTailWag(prev => (prev + 1) % 360)
      }, 50)
      return () => clearInterval(wagInterval)
    } else {
      setTailWag(0)
    }
  }, [isSpeaking, isListening])

  // Head tilt when listening
  useEffect(() => {
    if (isListening) {
      const tiltInterval = setInterval(() => {
        setHeadTilt(prev => {
          const newTilt = prev + 2
          return newTilt > 15 ? -15 : newTilt
        })
      }, 100)
      return () => clearInterval(tiltInterval)
    } else {
      setHeadTilt(0)
    }
  }, [isListening])

  // Lip-sync animation using Web Speech API
  useEffect(() => {
    if (isSpeaking && message) {
      // Cancel any existing speech
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
      utteranceRef.current = utterance

      // Configure voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') ||
        v.name.includes('Natural') ||
        v.name.includes('Enhanced')
      )
      if (preferredVoice) utterance.voice = preferredVoice

      utterance.rate = 1.0
      utterance.pitch = 1.1
      utterance.volume = 1.0

      // Animate mouth during speech
      const animateMouth = () => {
        if (window.speechSynthesis.speaking) {
          const now = Date.now()
          const timeDelta = now - lastSpeakTimeRef.current
          lastSpeakTimeRef.current = now

          // Create realistic mouth movement
          const intensity = 0.3 + Math.random() * 0.7
          setMouthOpen(intensity)

          animationFrameRef.current = requestAnimationFrame(animateMouth)
        } else {
          setMouthOpen(0)
        }
      }

      utterance.onstart = () => {
        lastSpeakTimeRef.current = Date.now()
        animateMouth()
      }

      utterance.onend = () => {
        setMouthOpen(0)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      utterance.onerror = () => {
        setMouthOpen(0)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }

      // Start speaking
      window.speechSynthesis.speak(utterance)
    }

    return () => {
      window.speechSynthesis.cancel()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isSpeaking, message])

  // Calculate mouth height based on openness
  const mouthHeight = 5 + (mouthOpen * 15)
  const mouthY = 85 + (mouthOpen * -5)

  return (
    <div
      className="rufus-container"
      style={{
        width: config.width,
        height: config.height,
        display: 'inline-block',
        position: 'relative'
      }}
    >
      <svg
        width={config.width}
        height={config.height}
        viewBox="0 0 200 200"
        className="rufus-svg"
        style={{
          filter: isListening ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))' : 'none',
          transition: 'filter 0.3s ease'
        }}
      >
        {/* Background circle for depth */}
        <circle cx="100" cy="100" r="90" fill="#f3f4f6" opacity="0.3" />

        {/* Body */}
        <ellipse
          cx="100"
          cy="130"
          rx="60"
          ry="50"
          fill="#8B4513"
          transform={`rotate(${headTilt} 100 100)`}
          style={{ transition: 'transform 0.2s ease' }}
        />

        {/* Tail */}
        <path
          d={`M 140 120 Q 160 ${110 + Math.sin(tailWag * 0.1) * 20} 165 ${90 + Math.sin(tailWag * 0.1) * 30}`}
          stroke="#8B4513"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          style={{ transition: 'all 0.05s ease' }}
        />

        {/* Head */}
        <g transform={`rotate(${headTilt} 100 80)`}>
          <circle cx="100" cy="80" r="45" fill="#A0522D" />

          {/* Ears */}
          <ellipse
            cx="70"
            cy="60"
            rx="18"
            ry="30"
            fill="#8B4513"
            transform="rotate(-20 70 60)"
          />
          <ellipse
            cx="130"
            cy="60"
            rx="18"
            ry="30"
            fill="#8B4513"
            transform="rotate(20 130 60)"
          />

          {/* Inner ears */}
          <ellipse
            cx="70"
            cy="65"
            rx="10"
            ry="18"
            fill="#FFB6C1"
            transform="rotate(-20 70 65)"
          />
          <ellipse
            cx="130"
            cy="65"
            rx="10"
            ry="18"
            fill="#FFB6C1"
            transform="rotate(20 130 65)"
          />

          {/* Snout */}
          <ellipse cx="100" cy="95" rx="30" ry="25" fill="#D2691E" />

          {/* Nose */}
          <ellipse cx="100" cy="90" rx="12" ry="10" fill="#333" />

          {/* Nostrils */}
          <ellipse cx="95" cy="92" rx="3" ry="4" fill="#000" />
          <ellipse cx="105" cy="92" rx="3" ry="4" fill="#000" />

          {/* Eyes */}
          <g className="eyes">
            <circle cx="85" cy="75" r="8" fill="#fff" />
            <circle cx="85" cy="75" r="5" fill="#333" />
            <circle cx="87" cy="73" r="2" fill="#fff" />

            <circle cx="115" cy="75" r="8" fill="#fff" />
            <circle cx="115" cy="75" r="5" fill="#333" />
            <circle cx="117" cy="73" r="2" fill="#fff" />
          </g>

          {/* Blinking effect */}
          {eyesBlink && (
            <>
              <rect x="77" y="73" width="16" height="4" fill="#A0522D" />
              <rect x="107" y="73" width="16" height="4" fill="#A0522D" />
            </>
          )}

          {/* Mouth */}
          <ellipse
            cx="100"
            cy={mouthY}
            rx="20"
            ry={mouthHeight}
            fill="#FF6B9D"
            style={{ transition: 'all 0.05s ease' }}
          />

          {/* Tongue when mouth is open */}
          {mouthOpen > 0.5 && (
            <ellipse
              cx="100"
              cy={mouthY + 3}
              rx="12"
              ry="6"
              fill="#FF1493"
            />
          )}

          {/* Whiskers */}
          <line x1="70" y1="88" x2="40" y2="85" stroke="#333" strokeWidth="1.5" />
          <line x1="70" y1="92" x2="40" y2="95" stroke="#333" strokeWidth="1.5" />
          <line x1="130" y1="88" x2="160" y2="85" stroke="#333" strokeWidth="1.5" />
          <line x1="130" y1="92" x2="160" y2="95" stroke="#333" strokeWidth="1.5" />
        </g>

        {/* Front legs */}
        <rect x="80" y="160" width="12" height="35" rx="6" fill="#8B4513" />
        <rect x="108" y="160" width="12" height="35" rx="6" fill="#8B4513" />

        {/* Paws */}
        <ellipse cx="86" cy="195" rx="8" ry="6" fill="#654321" />
        <ellipse cx="114" cy="195" rx="8" ry="6" fill="#654321" />

        {/* Speaking indicator waves */}
        {isSpeaking && (
          <g className="sound-waves">
            <circle
              cx="150"
              cy="80"
              r="5"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              opacity={mouthOpen}
            >
              <animate
                attributeName="r"
                from="5"
                to="15"
                dur="1s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.8"
                to="0"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx="150"
              cy="80"
              r="5"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              opacity={mouthOpen}
            >
              <animate
                attributeName="r"
                from="5"
                to="15"
                dur="1s"
                begin="0.3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.8"
                to="0"
                dur="1s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}

        {/* Listening indicator */}
        {isListening && (
          <g className="listening-indicator">
            <circle cx="50" cy="80" r="3" fill="#3B82F6">
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50" cy="90" r="3" fill="#3B82F6">
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur="1.5s"
                begin="0.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="50" cy="100" r="3" fill="#3B82F6">
              <animate
                attributeName="opacity"
                values="0.3;1;0.3"
                dur="1.5s"
                begin="1s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )}
      </svg>

      {/* Status text */}
      <div
        style={{
          position: 'absolute',
          bottom: -25,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
          fontWeight: 'bold',
          color: isSpeaking ? '#3B82F6' : isListening ? '#10B981' : '#6B7280',
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}
      >
        {isSpeaking ? '🗣️ Speaking...' : isListening ? '👂 Listening...' : '😊 Ready'}
      </div>

      <style jsx>{`
        .rufus-container {
          user-select: none;
        }

        .rufus-svg {
          display: block;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }

        .rufus-container:hover .rufus-svg {
          animation: float 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
