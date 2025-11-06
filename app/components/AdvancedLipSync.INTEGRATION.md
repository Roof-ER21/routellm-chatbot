# Integration Guide: Advanced Lip Sync with Existing Components

This guide shows how to integrate the Advanced Lip Sync system with your existing 3D avatar components.

## Quick Integration with Rufus3D

### Step 1: Import the Lip Sync Hook

```tsx
import { useAdvancedLipSync, useMicrophoneStream } from './AdvancedLipSync'
import { getPresetConfig } from './AdvancedLipSync.presets'
```

### Step 2: Update RufusModel Component

```tsx
function RufusModel({ isSpeaking, isListening, message }: Rufus3DModelProps) {
  const modelRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.SkinnedMesh>(null)
  const gltf = useLoader(GLTFLoader, '/models/rufus.glb')

  // Initialize lip sync
  const audioElement = useRef<HTMLAudioElement | null>(null)
  const lipSync = useAdvancedLipSync({
    audioElement: audioElement.current,
    isActive: isSpeaking,
    ...getPresetConfig('balanced'),
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

  // Handle TTS with lip sync
  useEffect(() => {
    if (isSpeaking && message) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)

      // Configure voice (same as before)
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v =>
        v.name.includes('Google') || v.name.includes('Natural')
      )
      if (preferredVoice) utterance.voice = preferredVoice

      utterance.rate = 1.0
      utterance.pitch = 1.1
      utterance.volume = 1.0

      // Create audio element for lip sync analysis
      // Note: Web Speech API doesn't provide direct audio stream,
      // so we'll use microphone or audio file approach

      window.speechSynthesis.speak(utterance)
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [isSpeaking, message])

  // Apply lip sync on every frame
  useFrame((state, delta) => {
    // Apply lip sync to mesh
    if (meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }

    // Gentle bobbing animation
    if (modelRef.current) {
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1

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
```

## Integration with Microphone Input

For real-time lip sync with microphone:

```tsx
function RufusWithMicrophone() {
  const { stream, initialize, stop, isInitialized } = useMicrophoneStream()

  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: isInitialized,
    ...getPresetConfig('balanced'),
  })

  return (
    <>
      <RufusModel lipSync={lipSync} />
      <button onClick={initialize}>Start Mic</button>
      <button onClick={stop}>Stop Mic</button>
    </>
  )
}
```

## Integration with Audio Files

For pre-recorded audio:

```tsx
function RufusWithAudio({ audioUrl }: { audioUrl: string }) {
  const audioElement = useAudioElement(audioUrl)

  const lipSync = useAdvancedLipSync({
    audioElement,
    isActive: true,
    ...getPresetConfig('high-quality'),
  })

  const handlePlay = () => {
    if (audioElement) {
      audioElement.play()
    }
  }

  return (
    <>
      <RufusModel lipSync={lipSync} />
      <button onClick={handlePlay}>Play Audio</button>
    </>
  )
}
```

## Complete Updated Rufus3D.tsx

Here's the complete updated version:

```tsx
'use client'

import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { useAdvancedLipSync, useMicrophoneStream } from './AdvancedLipSync'
import { getPresetConfig } from './AdvancedLipSync.presets'

interface Rufus3DModelProps {
  isSpeaking: boolean
  isListening: boolean
  message?: string
  enableLipSync?: boolean
}

function RufusModel({ isSpeaking, isListening, message, enableLipSync = true }: Rufus3DModelProps) {
  const modelRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.SkinnedMesh>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const [animations, setAnimations] = useState<THREE.AnimationClip[]>([])

  const gltf = useLoader(GLTFLoader, '/models/rufus.glb')

  // Initialize lip sync for microphone
  const { stream, initialize, stop } = useMicrophoneStream()
  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: enableLipSync && isSpeaking,
    ...getPresetConfig('balanced'),
    onVisemeChange: (viseme, weights) => {
      console.log('Current viseme:', viseme)
    },
  })

  useEffect(() => {
    if (gltf && gltf.animations && gltf.animations.length > 0) {
      setAnimations(gltf.animations)

      if (gltf.scene) {
        const mixer = new THREE.AnimationMixer(gltf.scene)
        mixerRef.current = mixer

        if (gltf.animations[0]) {
          const action = mixer.clipAction(gltf.animations[0])
          action.play()
        }

        // Find mesh with morph targets
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
            meshRef.current = child as THREE.SkinnedMesh
          }
        })
      }
    }
  }, [gltf])

  useEffect(() => {
    if (isSpeaking && enableLipSync) {
      initialize()
    } else {
      stop()
    }
  }, [isSpeaking, enableLipSync, initialize, stop])

  useEffect(() => {
    if (isSpeaking && message) {
      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(message)
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

      if (mixerRef.current && animations.length > 1) {
        const talkAction = mixerRef.current.clipAction(animations[1])
        talkAction.reset()
        talkAction.play()
      }

      utterance.onend = () => {
        if (mixerRef.current && animations.length > 0) {
          const idleAction = mixerRef.current.clipAction(animations[0])
          idleAction.reset()
          idleAction.play()
        }
      }

      window.speechSynthesis.speak(utterance)
    }

    return () => {
      window.speechSynthesis.cancel()
    }
  }, [isSpeaking, message, animations])

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta)
    }

    // Apply lip sync
    if (enableLipSync && meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }

    // Gentle bobbing animation
    if (modelRef.current) {
      modelRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1

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
  enableLipSync?: boolean
}

export default function Rufus3D({
  isSpeaking = false,
  isListening = false,
  size = 'medium',
  message = '',
  enableLipSync = true
}: Rufus3DProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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

        <Suspense fallback={null}>
          <RufusModel
            isSpeaking={isSpeaking}
            isListening={isListening}
            message={message}
            enableLipSync={enableLipSync}
          />
        </Suspense>
      </Canvas>

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
            Speaking...
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
            Listening...
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
            Ready
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
```

## Usage in Your Application

```tsx
// Simple usage
<Rufus3D
  isSpeaking={true}
  message="Hello! I can now speak with realistic lip sync!"
  enableLipSync={true}
/>

// Without lip sync (fallback to animations)
<Rufus3D
  isSpeaking={true}
  message="This uses the original animation system"
  enableLipSync={false}
/>
```

## Performance Considerations

1. **Choose the right preset**:
   - Desktop: `'high-quality'` or `'balanced'`
   - Mobile: `'mobile'` or `'performance'`
   - Multiple avatars: `'performance'`

2. **Conditional rendering**:
   ```tsx
   enableLipSync={!isMobile && hasGoodPerformance}
   ```

3. **Monitor performance**:
   ```tsx
   import { PerformanceMonitor } from './AdvancedLipSync.utils'

   const perfMonitor = useRef(new PerformanceMonitor())
   useFrame(() => {
     perfMonitor.current.startFrame()
     // ... rendering
     perfMonitor.current.endFrame()

     if (perfMonitor.current.getMetrics().fps < 30) {
       console.warn('Low FPS detected, consider using performance preset')
     }
   })
   ```

## Troubleshooting

### Lip sync not working
1. Check if your GLB model has morph targets
2. Verify microphone permissions
3. Check browser console for errors
4. Try the demo component first

### Poor performance
1. Switch to `'performance'` or `'mobile'` preset
2. Reduce FFT size: `audioConfig: { fftSize: 512 }`
3. Increase update interval: `audioConfig: { updateInterval: 33 }`
4. Disable idle animations: `idleConfig: { enableIdleAnimations: false }`

### No audio with Web Speech API
Web Speech API doesn't provide direct audio stream access. For lip sync with TTS:
- Use microphone to capture system audio (requires user permission)
- Or use pre-recorded audio files with matching text
- Or integrate with Azure Speech SDK for phoneme data

## Next Steps

1. Test with your GLB model
2. Adjust presets based on your needs
3. Add error handling UI
4. Implement fallback to animations if lip sync fails
5. Consider adding visual feedback for debugging

## Support

See the main README for detailed API documentation and examples.
