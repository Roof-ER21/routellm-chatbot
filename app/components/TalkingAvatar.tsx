'use client'

import { useEffect, useRef, useState } from 'react'

interface TalkingAvatarProps {
  isSpeaking?: boolean
  isListening?: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
}

export default function TalkingAvatar({
  isSpeaking = false,
  isListening = false,
  message = '',
  size = 'medium'
}: TalkingAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [avatarReady, setAvatarReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const headRef = useRef<any>(null)

  // Size configurations
  const sizes = {
    small: { width: 300, height: 400 },
    medium: { width: 500, height: 600 },
    large: { width: 700, height: 800 }
  }
  const config = sizes[size]

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const initAvatar = async () => {
      try {
        // Dynamically import TalkingHead module from CDN
        // TypeScript doesn't support dynamic CDN imports at build time, but they work at runtime
        const TalkingHeadModule = await import(
          /* webpackIgnore: true */
          // @ts-expect-error - Runtime CDN import
          'https://cdn.jsdelivr.net/gh/met4citizen/TalkingHead@1.2/modules/talkinghead.mjs'
        )

        const TalkingHead = TalkingHeadModule.default || TalkingHeadModule

        // Initialize TalkingHead
        const head = new TalkingHead(containerRef.current, {
          ttsEndpoint: '',
          cameraView: 'upper',
          cameraDistance: 1,
          cameraY: 0.2,
          lightAmbientColor: '#666666',
          lightDirectColor: '#ffffff'
        })

        headRef.current = head

        // Show Ready Player Me avatar
        await head.showAvatar({
          url: 'https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb',
          body: 'M',
          ttsLang: 'en-US',
          ttsVoice: 'en-US-Neural2-J',
          lipsyncLang: 'en'
        })

        setAvatarReady(true)
        console.log('TalkingHead avatar loaded successfully')

      } catch (err) {
        console.error('Failed to load TalkingHead:', err)
        setError('Failed to load avatar. Please refresh the page.')
      }
    }

    initAvatar()

    return () => {
      if (headRef.current) {
        headRef.current.detach()
      }
    }
  }, [])

  // Handle speaking
  useEffect(() => {
    if (avatarReady && headRef.current && isSpeaking && message) {
      try {
        headRef.current.speakText(message)
      } catch (err) {
        console.error('Failed to speak:', err)
      }
    }
  }, [avatarReady, isSpeaking, message])

  // Handle stop speaking
  useEffect(() => {
    if (avatarReady && headRef.current && !isSpeaking) {
      try {
        headRef.current.stopSpeaking()
      } catch (err) {
        console.error('Failed to stop speaking:', err)
      }
    }
  }, [avatarReady, isSpeaking])

  // Handle listening mode (visual feedback)
  useEffect(() => {
    if (avatarReady && headRef.current) {
      try {
        if (isListening) {
          // Add listening animation/emotion
          headRef.current.setMood('curious')
        } else {
          headRef.current.setMood('neutral')
        }
      } catch (err) {
        console.error('Failed to set mood:', err)
      }
    }
  }, [avatarReady, isListening])

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isSpeaking
          ? '0 0 40px rgba(59, 130, 246, 0.8)'
          : isListening
          ? '0 0 40px rgba(16, 185, 129, 0.8)'
          : '0 10px 40px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      {/* Avatar Container */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      />

      {/* Loading Overlay */}
      {!avatarReady && !error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(102, 126, 234, 0.9)',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 50,
                height: 50,
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTop: '4px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 20px'
              }}
            />
            Loading Professional Avatar...
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(220, 38, 38, 0.9)',
            color: 'white',
            fontSize: '16px',
            padding: '20px',
            textAlign: 'center',
            zIndex: 10
          }}
        >
          {error}
        </div>
      )}

      {/* Status Indicator */}
      {avatarReady && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '10px 20px',
            borderRadius: '25px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 5
          }}
        >
          {isSpeaking ? (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: '#3B82F6',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite',
                  boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                }}
              />
              Speaking...
            </>
          ) : isListening ? (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: '#10B981',
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.8)'
                }}
              />
              Listening...
            </>
          ) : (
            <>
              <div
                style={{
                  width: 10,
                  height: 10,
                  background: '#6B7280',
                  borderRadius: '50%'
                }}
              />
              Ready
            </>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  )
}
