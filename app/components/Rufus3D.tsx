'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

interface Rufus3DModelProps {
  isSpeaking: boolean
  isListening: boolean
  message?: string
}

function RufusModel({ isSpeaking, isListening, message }: Rufus3DModelProps) {
  const modelRef = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([])
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load the GLB model
  const gltf = useLoader(GLTFLoader, '/models/rufus.glb')

  useEffect(() => {
    if (gltf && gltf.animations && gltf.animations.length > 0) {
      setAnimations(gltf.animations)

      // Create animation mixer
      if (gltf.scene) {
        const mixer = new THREE.AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        // Play idle animation by default (if exists)
        if (gltf.animations[0]) {
          const action = mixer.clipAction(gltf.animations[0])
          action.play()
        }
      }
    }
  }, [gltf])

  // Handle speaking animation and TTS
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

      // Play talking animation if available
      if (mixerRef.current && animations.length > 1) {
        const talkAction = mixerRef.current.clipAction(animations[1])
        talkAction.reset()
        talkAction.play()
      }

      utterance.onend = () => {
        // Return to idle animation
        if (mixerRef.current && animations.length > 0) {
          const idleAction = mixerRef.current.clipAction(animations[0])
          idleAction.reset()
          idleAction.play()
        }
      }

      // Start speaking
      window.speechSynthesis.speak(utterance)
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [isSpeaking, message, animations])

  // Animate the model
  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Gentle bobbing animation
    if (modelRef.current) {
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1

      // Rotate slightly when listening
      if (isListening) {
        modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2
      }
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={2}
      position={[0, -1, 0]}
    />
  )
}

interface Rufus3DProps {
  isSpeaking?: boolean
  isListening?: boolean
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export default function Rufus3D({
  isSpeaking = false,
  isListening = false,
  size = 'medium',
  message = ''
}: Rufus3DProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Size configurations
  const sizes = {
    small: { width: 150, height: 150 },
    medium: { width: 250, height: 250 },
    large: { width: 400, height: 400 }
  }
  const config = sizes[size]

  if (!isClient) {
    return (
      <div
        style={{
          width: config.width,
          height: config.height,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px'
        }}
      >
        Loading Rufus...
      </div>
    )
  }

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: isSpeaking
          ? '0 0 30px rgba(59, 130, 246, 0.6)'
          : isListening
          ? '0 0 30px rgba(16, 185, 129, 0.6)'
          : '0 10px 40px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      <Canvas
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* Load the 3D Rufus model */}
        <Suspense fallback={null}>
          <RufusModel
            isSpeaking={isSpeaking}
            isListening={isListening}
            message={message}
          />
        </Suspense>
      </Canvas>

      {/* Status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 16px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        {isSpeaking ? (
          <>
            <div
              style={{
                width: 8,
                height: 8,
                background: '#3B82F6',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}
            />
            🗣️ Speaking...
          </>
        ) : isListening ? (
          <>
            <div
              style={{
                width: 8,
                height: 8,
                background: '#10B981',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}
            />
            👂 Listening...
          </>
        ) : (
          <>
            <div
              style={{
                width: 8,
                height: 8,
                background: '#6B7280',
                borderRadius: '50%'
              }}
            />
            😊 Ready
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}
