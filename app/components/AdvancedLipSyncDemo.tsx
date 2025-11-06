'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei'
import * as THREE from 'three'
import {
  useAdvancedLipSync,
  useAudioElement,
  useMicrophoneStream,
} from './AdvancedLipSync'
import {
  getPresetConfig,
  detectOptimalPreset,
  PRESETS,
} from './AdvancedLipSync.presets'
import type { PresetName } from './AdvancedLipSync.types'

/**
 * 3D Avatar Component with Lip Sync
 */
function Avatar({ modelPath, audioElement, audioStream, presetName, isActive }: any) {
  const meshRef = useRef<THREE.SkinnedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const gltf = useLoader(GLTFLoader, modelPath)

  const presetConfig = getPresetConfig(presetName)
  const lipSync = useAdvancedLipSync({
    audioElement,
    audioStream,
    isActive,
    ...presetConfig,
  })

  // Find mesh with morph targets
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
          meshRef.current = child as THREE.SkinnedMesh
        }
      })
    }
  }, [gltf])

  useFrame((state, delta) => {
    if (meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }

    // Gentle bobbing
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      if (!lipSync.isSpeaking) {
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      }
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} scale={1.5} position={[0, -1, 0]} />
    </group>
  )
}

/**
 * Visualizer for audio analysis
 */
function AudioVisualizer({ volume, isSpeaking, currentViseme }: any) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 30px',
        borderRadius: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        minWidth: '300px',
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: isSpeaking ? '#10B981' : '#6B7280',
          boxShadow: isSpeaking ? '0 0 10px #10B981' : 'none',
          transition: 'all 0.3s',
        }}
      />

      {/* Current viseme */}
      <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
        {currentViseme.toUpperCase()}
      </div>

      {/* Volume bar */}
      <div
        style={{
          flex: 1,
          height: '8px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${volume * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
            transition: 'width 0.1s',
          }}
        />
      </div>

      {/* Volume percentage */}
      <div style={{ color: 'white', fontSize: '12px', minWidth: '40px' }}>
        {Math.round(volume * 100)}%
      </div>
    </div>
  )
}

/**
 * Main Demo Component
 */
export default function AdvancedLipSyncDemo() {
  const [isClient, setIsClient] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [selectedPreset, setSelectedPreset] = useState<PresetName>('balanced')
  const [audioUrl, setAudioUrl] = useState('')
  const [volume, setVolume] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentViseme, setCurrentViseme] = useState('neutral')

  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const { stream, initialize: startMic, stop: stopMic, isInitialized: isMicActive } = useMicrophoneStream()
  const audioElement = useAudioElement(audioUrl)

  const modelPath = '/models/rufus.glb'

  useEffect(() => {
    setIsClient(true)
    // Auto-detect optimal preset
    const optimal = detectOptimalPreset()
    setSelectedPreset(optimal)
  }, [])

  useEffect(() => {
    audioElementRef.current = audioElement
  }, [audioElement])

  // Simulate volume updates (in production, get from lip sync hook)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isSpeaking) {
      interval = setInterval(() => {
        setVolume(Math.random() * 0.5 + 0.5)
      }, 100)
    } else {
      setVolume(0)
    }
    return () => clearInterval(interval)
  }, [isSpeaking])

  const handlePlayAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
      setIsSpeaking(true)
      audioElementRef.current.onended = () => setIsSpeaking(false)
    }
  }

  const handleToggleMic = async () => {
    if (isMicActive) {
      stopMic()
      setIsSpeaking(false)
    } else {
      await startMic()
      setIsSpeaking(true)
    }
  }

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
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <Canvas style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <PerspectiveCamera makeDefault position={[0, 1.6, 3]} />
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={6}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />

        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} castShadow />

        <Environment preset="sunset" />

        <Avatar
          modelPath={modelPath}
          audioElement={isMicActive ? null : audioElementRef.current}
          audioStream={isMicActive ? stream : null}
          presetName={selectedPreset}
          isActive={isActive}
        />
      </Canvas>

      {/* Control Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.9)',
          padding: '25px',
          borderRadius: '15px',
          color: 'white',
          minWidth: '320px',
          maxWidth: '400px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '14px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '700' }}>
          Lip Sync Controls
        </h2>

        {/* Preset selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.8 }}>
            Quality Preset:
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value as PresetName)}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {Object.entries(PRESETS).map(([key, preset]) => (
              <option key={key} value={key} style={{ background: '#1a1a1a' }}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
        </div>

        {/* Status indicators */}
        <div
          style={{
            marginBottom: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ opacity: 0.7 }}>Status:</span>
            <span style={{ fontWeight: 'bold' }}>{isActive ? '🟢 Active' : '🔴 Inactive'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ opacity: 0.7 }}>Mode:</span>
            <span style={{ fontWeight: 'bold' }}>
              {isMicActive ? '🎤 Microphone' : audioUrl ? '🔊 Audio File' : '⏸️ Idle'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.7 }}>Speaking:</span>
            <span style={{ fontWeight: 'bold' }}>{isSpeaking ? '🗣️ Yes' : '😶 No'}</span>
          </div>
        </div>

        {/* Microphone control */}
        <button
          onClick={handleToggleMic}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '12px',
            background: isMicActive
              ? 'linear-gradient(135deg, #EF4444, #DC2626)'
              : 'linear-gradient(135deg, #10B981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isMicActive ? '🛑 Stop Microphone' : '🎤 Start Microphone'}
        </button>

        {/* Activation toggle */}
        <button
          onClick={() => setIsActive(!isActive)}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '20px',
            background: isActive
              ? 'linear-gradient(135deg, #F59E0B, #D97706)'
              : 'linear-gradient(135deg, #6B7280, #4B5563)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {isActive ? '⏸️ Pause Lip Sync' : '▶️ Resume Lip Sync'}
        </button>

        {/* Audio URL */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', opacity: 0.8 }}>
            Audio URL:
          </label>
          <input
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://example.com/audio.mp3"
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
            }}
          />
        </div>

        <button
          onClick={handlePlayAudio}
          disabled={!audioUrl}
          style={{
            width: '100%',
            padding: '14px',
            background: audioUrl
              ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
              : 'linear-gradient(135deg, #374151, #1F2937)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: audioUrl ? 'pointer' : 'not-allowed',
            fontSize: '15px',
            fontWeight: '600',
            opacity: audioUrl ? 1 : 0.5,
            transition: 'transform 0.2s',
          }}
          onMouseDown={(e) => {
            if (audioUrl) e.currentTarget.style.transform = 'scale(0.98)'
          }}
          onMouseUp={(e) => {
            if (audioUrl) e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          🔊 Play Audio
        </button>

        {/* Info */}
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '10px',
            fontSize: '12px',
            lineHeight: '1.6',
            border: '1px solid rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>💡 Tips:</div>
          <ul style={{ margin: 0, paddingLeft: '18px', opacity: 0.9 }}>
            <li>Use microphone for real-time testing</li>
            <li>Switch presets to optimize performance</li>
            <li>Drag to rotate, scroll to zoom</li>
            <li>Model needs morph targets for lip sync</li>
          </ul>
        </div>
      </div>

      {/* Audio Visualizer */}
      <AudioVisualizer volume={volume} isSpeaking={isSpeaking} currentViseme={currentViseme} />

      {/* Title overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '20px 25px',
          borderRadius: '15px',
          color: 'white',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        }}
      >
        <h1 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
          Advanced Lip Sync
        </h1>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>
          Production-ready • 60fps • React Three Fiber
        </p>
      </div>

      {/* Performance indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '12px 18px',
          borderRadius: '10px',
          color: 'white',
          fontSize: '11px',
          fontFamily: 'monospace',
        }}
      >
        <div>Preset: {PRESETS[selectedPreset].name}</div>
        <div style={{ opacity: 0.6, marginTop: '4px' }}>
          FFT: {getPresetConfig(selectedPreset).audioConfig.fftSize}
        </div>
      </div>
    </div>
  )
}
