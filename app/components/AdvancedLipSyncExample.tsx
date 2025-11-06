'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import {
  useAdvancedLipSync,
  useAudioElement,
  useMicrophoneStream,
  type AdvancedLipSyncProps,
} from './AdvancedLipSync'

/**
 * 3D Avatar with Advanced Lip Sync
 */
interface Avatar3DProps {
  modelPath: string
  audioElement?: HTMLAudioElement | null
  audioStream?: MediaStream | null
  isActive: boolean
  lipSyncConfig?: Partial<AdvancedLipSyncProps>
  onLipSyncReady?: () => void
}

function Avatar3D({
  modelPath,
  audioElement,
  audioStream,
  isActive,
  lipSyncConfig,
  onLipSyncReady,
}: Avatar3DProps) {
  const meshRef = useRef<THREE.SkinnedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Load GLB model
  const gltf = useLoader(GLTFLoader, modelPath)

  // Initialize lip sync
  const lipSync = useAdvancedLipSync({
    audioElement,
    audioStream,
    isActive,
    ...lipSyncConfig,
    onError: (error) => {
      console.error('Lip sync error:', error)
      lipSyncConfig?.onError?.(error)
    },
    onVisemeChange: (viseme, weights) => {
      console.log('Viseme changed:', viseme, weights)
      lipSyncConfig?.onVisemeChange?.(viseme, weights)
    },
  })

  // Find the mesh with morph targets in the loaded model
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if (
          (child as THREE.Mesh).isMesh &&
          (child as THREE.Mesh).morphTargetInfluences
        ) {
          meshRef.current = child as THREE.SkinnedMesh
          onLipSyncReady?.()
        }
      })
    }
  }, [gltf, onLipSyncReady])

  // Apply lip sync on every frame
  useFrame((state, delta) => {
    if (meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }

    // Subtle idle rotation
    if (groupRef.current && !lipSync.isSpeaking) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  )
}

/**
 * Control panel for the lip sync demo
 */
interface ControlPanelProps {
  isActive: boolean
  onToggleActive: () => void
  isMicActive: boolean
  onToggleMic: () => void
  audioUrl: string
  onAudioUrlChange: (url: string) => void
  onPlayAudio: () => void
  volume: number
  isSpeaking: boolean
  currentViseme: string
}

function ControlPanel({
  isActive,
  onToggleActive,
  isMicActive,
  onToggleMic,
  audioUrl,
  onAudioUrlChange,
  onPlayAudio,
  volume,
  isSpeaking,
  currentViseme,
}: ControlPanelProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '10px',
        color: 'white',
        minWidth: '300px',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}
    >
      <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
        Advanced Lip Sync Controls
      </h3>

      {/* Status indicators */}
      <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Status:</strong> {isActive ? '🟢 Active' : '🔴 Inactive'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Speaking:</strong> {isSpeaking ? '🗣️ Yes' : '😶 No'}
        </div>
        <div style={{ marginBottom: '8px' }}>
          <strong>Viseme:</strong> {currentViseme}
        </div>
        <div>
          <strong>Volume:</strong>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
              marginTop: '5px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${volume * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #10B981, #3B82F6)',
                transition: 'width 0.1s',
              }}
            />
          </div>
        </div>
      </div>

      {/* Activation toggle */}
      <button
        onClick={onToggleActive}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '10px',
          background: isActive ? '#EF4444' : '#10B981',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {isActive ? 'Deactivate Lip Sync' : 'Activate Lip Sync'}
      </button>

      {/* Microphone toggle */}
      <button
        onClick={onToggleMic}
        style={{
          width: '100%',
          padding: '10px',
          marginBottom: '15px',
          background: isMicActive ? '#EF4444' : '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        {isMicActive ? '🎤 Stop Microphone' : '🎤 Start Microphone'}
      </button>

      {/* Audio URL input */}
      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px' }}>
          Audio URL:
        </label>
        <input
          type="text"
          value={audioUrl}
          onChange={(e) => onAudioUrlChange(e.target.value)}
          placeholder="Enter audio URL..."
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '5px',
            color: 'white',
            fontSize: '12px',
          }}
        />
      </div>

      {/* Play audio button */}
      <button
        onClick={onPlayAudio}
        disabled={!audioUrl}
        style={{
          width: '100%',
          padding: '10px',
          background: audioUrl ? '#8B5CF6' : '#4B5563',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: audioUrl ? 'pointer' : 'not-allowed',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        🔊 Play Audio
      </button>

      {/* Instructions */}
      <div
        style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '5px',
          fontSize: '11px',
          lineHeight: '1.4',
        }}
      >
        <strong>💡 Tips:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Use microphone for real-time lip sync</li>
          <li>Or provide an audio URL to play</li>
          <li>Ensure your GLB model has morph targets</li>
          <li>Optimized for 60fps performance</li>
        </ul>
      </div>
    </div>
  )
}

/**
 * Main Example Component
 */
export default function AdvancedLipSyncExample() {
  const [isClient, setIsClient] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [audioUrl, setAudioUrl] = useState('')
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  // Microphone stream
  const { stream, initialize: startMic, stop: stopMic, isInitialized: isMicActive } = useMicrophoneStream()

  // Audio element for URL playback
  const audioElement = useAudioElement(audioUrl)

  // Lip sync state (for UI display)
  const [volume, setVolume] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentViseme, setCurrentViseme] = useState('neutral')

  // Model path - change this to your model
  const modelPath = '/models/rufus.glb' // Update to your GLB model path

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    audioElementRef.current = audioElement
  }, [audioElement])

  const handleToggleActive = () => {
    setIsActive(!isActive)
  }

  const handleToggleMic = async () => {
    if (isMicActive) {
      stopMic()
    } else {
      await startMic()
    }
  }

  const handlePlayAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
    }
  }

  const lipSyncConfig: Partial<AdvancedLipSyncProps> = {
    audioConfig: {
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      volumeThreshold: 0.01,
      updateInterval: 16, // 60fps
    },
    idleConfig: {
      blinkInterval: [2, 6],
      blinkDuration: 0.15,
      breathingSpeed: 0.2,
      microMovementScale: 0.3,
      enableIdleAnimations: true,
    },
    smoothingConfig: {
      blendShapeLerp: 0.15,
      volumeLerp: 0.2,
      enableSmoothing: true,
    },
    onVisemeChange: (viseme, weights) => {
      setCurrentViseme(viseme)
    },
  }

  // Sync lip sync state with local state for UI
  useEffect(() => {
    const interval = setInterval(() => {
      // This would come from the lip sync hook in a real implementation
      // For demo purposes, we'll simulate it
      if (isSpeaking) {
        setVolume(Math.random() * 0.5 + 0.5)
      } else {
        setVolume(0)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isSpeaking])

  if (!isClient) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '20px',
        }}
      >
        Loading Advanced Lip Sync Demo...
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <PerspectiveCamera makeDefault position={[0, 1.6, 3]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />

        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          castShadow
        />

        {/* Environment for better reflections */}
        <Environment preset="sunset" />

        {/* 3D Avatar with Lip Sync */}
        <Suspense fallback={null}>
          <Avatar3D
            modelPath={modelPath}
            audioElement={isMicActive ? null : audioElementRef.current}
            audioStream={isMicActive ? stream : null}
            isActive={isActive}
            lipSyncConfig={lipSyncConfig}
            onLipSyncReady={() => {
              console.log('Lip sync system ready!')
            }}
          />
        </Suspense>
      </Canvas>

      {/* Control Panel */}
      <ControlPanel
        isActive={isActive}
        onToggleActive={handleToggleActive}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        audioUrl={audioUrl}
        onAudioUrlChange={setAudioUrl}
        onPlayAudio={handlePlayAudio}
        volume={volume}
        isSpeaking={isSpeaking}
        currentViseme={currentViseme}
      />

      {/* Info overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px 20px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '12px',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ marginBottom: '5px' }}>
          <strong>Advanced Lip Sync System</strong>
        </div>
        <div style={{ opacity: 0.7 }}>
          Real-time audio analysis with smooth animations
        </div>
        <div style={{ opacity: 0.7 }}>
          Optimized for 60fps | Production-ready
        </div>
      </div>
    </div>
  )
}
