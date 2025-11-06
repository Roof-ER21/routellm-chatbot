# Advanced Lip Sync - Quick Start Guide

Get your 3D avatar speaking with realistic lip sync in 5 minutes!

## Step 1: Test the Demo (1 minute)

Create a test page to verify everything works:

```tsx
// app/test-lipsync/page.tsx
import AdvancedLipSyncDemo from '../components/AdvancedLipSyncDemo'

export default function TestLipSync() {
  return <AdvancedLipSyncDemo />
}
```

Visit: `http://localhost:4000/test-lipsync`

## Step 2: Basic Implementation (3 minutes)

### With Microphone (Real-time)

```tsx
'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAdvancedLipSync, useMicrophoneStream } from './components/AdvancedLipSync'

function Avatar() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { stream, initialize, isInitialized } = useMicrophoneStream()

  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: isInitialized,
  })

  useFrame(() => {
    if (meshRef.current) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  return (
    <>
      <mesh ref={meshRef}>{/* Your 3D model */}</mesh>
      <button onClick={initialize}>Start Talking</button>
    </>
  )
}

export default function App() {
  return (
    <Canvas>
      <Avatar />
    </Canvas>
  )
}
```

### With Audio File

```tsx
import { useAudioElement } from './components/AdvancedLipSync'

function Avatar() {
  const audioElement = useAudioElement('/your-audio.mp3')

  const lipSync = useAdvancedLipSync({
    audioElement,
    isActive: true,
  })

  // Rest same as above...
}
```

## Step 3: Use a Preset (1 minute)

Optimize for your use case:

```tsx
import { getPresetConfig } from './components/AdvancedLipSync.presets'

// For desktop
const lipSync = useAdvancedLipSync({
  ...getPresetConfig('high-quality'),
  audioStream: stream,
})

// For mobile
const lipSync = useAdvancedLipSync({
  ...getPresetConfig('mobile'),
  audioStream: stream,
})

// Auto-detect
import { detectOptimalPreset } from './components/AdvancedLipSync.presets'

const preset = detectOptimalPreset()
const lipSync = useAdvancedLipSync({
  ...getPresetConfig(preset),
  audioStream: stream,
})
```

## Model Requirements

Your GLB model MUST have these morph targets:

Minimum required:
- `jawOpen` or `mouthOpen`
- `mouthPucker` or `mouthFunnel`

Recommended for best results:
- `mouthStretch`
- `mouthSmile`
- `lipUpperUp`
- `lipLowerDown`
- `eyeBlinkLeft`
- `eyeBlinkRight`

### Check Your Model

```tsx
useEffect(() => {
  if (gltf.scene) {
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (mesh.morphTargetDictionary) {
          console.log('Available morph targets:',
            Object.keys(mesh.morphTargetDictionary))
        }
      }
    })
  }
}, [gltf])
```

## Integration with Existing Rufus3D

Add to your existing Rufus3D component:

```tsx
import { useAdvancedLipSync } from './AdvancedLipSync'
import { getPresetConfig } from './AdvancedLipSync.presets'

function RufusModel({ isSpeaking }: { isSpeaking: boolean }) {
  const meshRef = useRef<THREE.SkinnedMesh>(null)

  // Add this
  const { stream, initialize } = useMicrophoneStream()
  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: isSpeaking,
    ...getPresetConfig('balanced'),
  })

  // Initialize mic when speaking starts
  useEffect(() => {
    if (isSpeaking) initialize()
  }, [isSpeaking])

  useFrame(() => {
    // Add this
    if (meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  // Rest of your existing code...
}
```

## Troubleshooting

### Issue: No lip movement
**Solution**: Check if model has morph targets
```tsx
console.log(mesh.morphTargetDictionary)
```

### Issue: Microphone not working
**Solution**: Check permissions and HTTPS
```tsx
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('Mic OK'))
  .catch(err => console.error('Mic error:', err))
```

### Issue: Poor performance
**Solution**: Use performance preset
```tsx
const lipSync = useAdvancedLipSync({
  ...getPresetConfig('performance'),
  audioStream: stream,
})
```

### Issue: Jittery animation
**Solution**: Increase smoothing
```tsx
const lipSync = useAdvancedLipSync({
  smoothingConfig: {
    blendShapeLerp: 0.05, // Lower = smoother
    enableSmoothing: true,
  },
  audioStream: stream,
})
```

## Configuration Cheat Sheet

### Audio Analysis
```tsx
audioConfig: {
  fftSize: 2048,              // 512, 1024, 2048, 4096
  volumeThreshold: 0.01,      // 0.001 - 0.1
  updateInterval: 16,         // 16ms = 60fps, 33ms = 30fps
}
```

### Smoothing
```tsx
smoothingConfig: {
  blendShapeLerp: 0.15,       // 0.05 (smooth) - 0.5 (responsive)
  volumeLerp: 0.2,            // Same range
  enableSmoothing: true,
}
```

### Idle Animations
```tsx
idleConfig: {
  blinkInterval: [2, 6],      // [min, max] seconds
  blinkDuration: 0.15,        // Seconds
  breathingSpeed: 0.2,        // Cycles per second
  enableIdleAnimations: true,
}
```

## Presets Overview

| Preset | Best For | FPS | CPU |
|--------|----------|-----|-----|
| high-quality | Desktop, videos | 60 | 5-8% |
| balanced | Web apps | 50 | 3-5% |
| performance | Multiple avatars | 30 | 2-3% |
| mobile | Mobile devices | 20 | 1-2% |

## Complete Minimal Example

```tsx
'use client'

import { useRef, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAdvancedLipSync, useMicrophoneStream } from './components/AdvancedLipSync'
import { getPresetConfig } from './components/AdvancedLipSync.presets'

function Avatar() {
  const meshRef = useRef<THREE.SkinnedMesh>(null)
  const gltf = useLoader(GLTFLoader, '/models/avatar.glb')
  const { stream, initialize, isInitialized } = useMicrophoneStream()

  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: isInitialized,
    ...getPresetConfig('balanced'),
  })

  // Find mesh with morph targets
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).morphTargetInfluences) {
          meshRef.current = child as THREE.SkinnedMesh
        }
      })
    }
  }, [gltf])

  useFrame(() => {
    if (meshRef.current && lipSync.isAnalyzing) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  return (
    <>
      <primitive object={gltf.scene} />
      <Html position={[0, 2, 0]}>
        <button onClick={initialize}>
          {isInitialized ? 'Speaking...' : 'Start Talking'}
        </button>
      </Html>
    </>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <Suspense fallback={null}>
          <Avatar />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

## Next Steps

1. **Test the demo**: Visit `/test-lipsync` page
2. **Check your model**: Verify morph targets exist
3. **Choose a preset**: Based on your target device
4. **Customize**: Adjust config for your needs
5. **Deploy**: Test on production environment

## Resources

- **Full API Docs**: `AdvancedLipSync.README.md`
- **Integration Guide**: `AdvancedLipSync.INTEGRATION.md`
- **Summary**: `ADVANCED_LIPSYNC_SUMMARY.md`
- **Demo Component**: `AdvancedLipSyncDemo.tsx`
- **Example Component**: `AdvancedLipSyncExample.tsx`

## Support

Common solutions:
1. Check browser console for errors
2. Verify microphone permissions
3. Ensure HTTPS (required for microphone)
4. Test with demo component first
5. Check model has morph targets

## Quick Commands

```bash
# Run development server
npm run dev

# Test lip sync
# Visit: http://localhost:4000/test-lipsync

# Check TypeScript
npx tsc --noEmit

# Build for production
npm run build
```

---

That's it! You now have production-ready lip sync for your 3D avatars.

For advanced features and customization, see the full documentation.
