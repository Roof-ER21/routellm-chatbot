'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useAdvancedLipSync, useMicrophoneStream } from './AdvancedLipSync'
import { getPresetConfig } from './AdvancedLipSync.presets'

// Preload the model for faster loading
useGLTF.preload('/models/rufus-optimized.glb')

interface Rufus3DModelProps {
  isSpeaking: boolean
  isListening: boolean
  message?: string
  enableLipSync?: boolean
}

function RufusModel({ isSpeaking, isListening, message, enableLipSync = true }: Rufus3DModelProps) {
  const modelRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.SkinnedMesh | THREE.Mesh | null>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([])
  const [blinkTimer, setBlinkTimer] = useState(0)
  const [shouldBlink, setShouldBlink] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load the optimized GLB model (4.1MB) using useGLTF (production-ready)
  const gltf = useGLTF('/models/rufus-optimized.glb') as any

  // Initialize lip sync with microphone
  const { stream, initialize, stop, isInitialized } = useMicrophoneStream()
  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: enableLipSync && isSpeaking && isInitialized,
    ...getPresetConfig('balanced'),
    onVisemeChange: (viseme, weights) => {
      // Debug: Log current viseme for troubleshooting
      if (process.env.NODE_ENV === 'development') {
        console.log('Current viseme:', viseme, 'Jaw:', weights.jawOpen)
      }
    },
  })

  // Initialize model, animations, and find mesh with morph targets
  useEffect(() => {
    if (gltf && gltf.scene) {
      // Setup animation mixer
      if (gltf.animations && gltf.animations.length > 0) {
        setAnimations(gltf.animations)
        const mixer = new THREE.AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        // Play idle animation by default
        if (gltf.animations[0]) {
          const action = mixer.clipAction(gltf.animations[0])
          action.play()
        }
      }

      // Find mesh with morph targets for lip sync
      gltf.scene.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
            meshRef.current = mesh as THREE.SkinnedMesh
            console.log('Found mesh with morph targets:', mesh.name, 'Targets:', mesh.morphTargetInfluences.length)
          }
        }
      })

      // If no morph targets found, log warning
      if (!meshRef.current) {
        console.warn('No mesh with morph targets found in GLB model. Lip sync will use animation fallback.')
      }
    }
  }, [gltf])

  // Handle microphone for lip sync
  useEffect(() => {
    if (isSpeaking && enableLipSync) {
      initialize().catch(err => {
        console.warn('Could not initialize microphone for lip sync:', err)
      })
    } else {
      stop()
    }
  }, [isSpeaking, enableLipSync, initialize, stop])

  // Handle TTS with animation triggers
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
        talkAction.setLoop(THREE.LoopRepeat, Infinity)
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

  // Main animation loop
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Apply advanced lip sync to mesh morph targets
    if (enableLipSync && meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }

    // Idle animations
    if (modelRef.current) {
      // Gentle breathing/bobbing animation
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08

      // Head rotation when listening
      if (isListening) {
        modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.15
      } else {
        // Smooth return to neutral rotation
        modelRef.current.rotation.y = THREE.MathUtils.lerp(
          modelRef.current.rotation.y,
          0,
          0.05
        )
      }

      // Automatic blinking (every 3-5 seconds)
      const newBlinkTimer = blinkTimer + delta
      setBlinkTimer(newBlinkTimer)

      if (newBlinkTimer > 3 + Math.random() * 2) {
        setShouldBlink(true)
        setBlinkTimer(0)
        setTimeout(() => setShouldBlink(false), 150)
      }
    }
  })

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={2.2}
      position={[0, -1.2, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

interface Rufus3DProProps {
  isSpeaking?: boolean
  isListening?: boolean
  size?: 'small' | 'medium' | 'large'
  message?: string
  enableLipSync?: boolean
}

export default function Rufus3DPro({
  isSpeaking = false,
  isListening = false,
  size = 'medium',
  message = '',
  enableLipSync = true
}: Rufus3DProProps) {
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
          fontSize: '14px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
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
          ? '0 0 40px rgba(59, 130, 246, 0.8)'
          : isListening
          ? '0 0 40px rgba(16, 185, 129, 0.8)'
          : '0 10px 40px rgba(0, 0, 0, 0.3)',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      <Canvas
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={45} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          enableDamping={true}
          dampingFactor={0.05}
        />

        {/* Professional lighting setup */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 8, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.4} color="#b794f4" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.4}
          penumbra={1}
          intensity={0.8}
          castShadow
        />
        <hemisphereLight
          color="#ffffff"
          groundColor="#444444"
          intensity={0.5}
        />

        {/* Load the professional 3D Rufus model */}
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#667eea" wireframe />
            </mesh>
          }
        >
          <RufusModel
            isSpeaking={isSpeaking}
            isListening={isListening}
            message={message}
            enableLipSync={enableLipSync}
          />
        </Suspense>
      </Canvas>

      {/* Professional status indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '10px 20px',
          borderRadius: '25px',
          color: 'white',
          fontSize: '13px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
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

      {/* Lip sync indicator (only visible when active) */}
      {enableLipSync && isSpeaking && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(59, 130, 246, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '6px 12px',
            borderRadius: '15px',
            color: 'white',
            fontSize: '11px',
            fontWeight: '500',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}
        >
          Lip Sync Active
        </div>
      )}

      <style jsx>{`
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
