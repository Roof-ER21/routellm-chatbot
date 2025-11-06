# Advanced Lip Sync System for React Three Fiber

A production-ready, performant lip-sync system for 3D avatars using React Three Fiber, Web Audio API, and Three.js morph targets.

## Features

- **Real-time Audio Analysis**: Web Audio API integration for speech analysis
- **Phoneme Detection**: Frequency-based phoneme/viseme estimation
- **Smooth Animations**: Lerp-based interpolation for natural movement
- **Idle Animations**: Realistic blinking, breathing, and micro-movements
- **Performance Optimized**: 60fps with throttled audio analysis
- **TypeScript**: Full type safety with comprehensive interfaces
- **Flexible Configuration**: Customizable audio analysis, smoothing, and idle behavior
- **Production Ready**: Error handling, cleanup, and memory management

## Installation

The component requires these dependencies (already in your project):

```json
{
  "@react-three/fiber": "^9.4.0",
  "@react-three/drei": "^10.7.6",
  "three": "^0.181.0",
  "react": "^19.1.1"
}
```

## Quick Start

### Basic Usage with Microphone

```tsx
import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useAdvancedLipSync, useMicrophoneStream } from './components/AdvancedLipSync'

function Avatar() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { stream, initialize } = useMicrophoneStream()

  const lipSync = useAdvancedLipSync({
    audioStream: stream,
    isActive: true,
  })

  useFrame(() => {
    if (meshRef.current) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  return (
    <mesh ref={meshRef}>
      {/* Your 3D model */}
    </mesh>
  )
}
```

### Usage with Audio Element

```tsx
import { useRef, useState } from 'react'
import { useAdvancedLipSync, useAudioElement } from './components/AdvancedLipSync'

function Avatar() {
  const meshRef = useRef<THREE.Mesh>(null)
  const audioElement = useAudioElement('/path/to/audio.mp3')

  const lipSync = useAdvancedLipSync({
    audioElement,
    isActive: true,
  })

  useFrame(() => {
    if (meshRef.current) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  // Play audio to start lip sync
  const handlePlay = () => audioElement?.play()

  return <mesh ref={meshRef}>{/* ... */}</mesh>
}
```

### Using the Component Wrapper

```tsx
import { useRef } from 'react'
import { AdvancedLipSyncComponent, useMicrophoneStream } from './components/AdvancedLipSync'

function Scene() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { stream, initialize } = useMicrophoneStream()

  return (
    <>
      <mesh ref={meshRef}>{/* Your avatar */}</mesh>
      <AdvancedLipSyncComponent
        meshRef={meshRef}
        audioStream={stream}
        isActive={true}
      />
    </>
  )
}
```

## Configuration

### Audio Analysis Configuration

```tsx
const lipSync = useAdvancedLipSync({
  audioConfig: {
    fftSize: 2048,                    // FFT size for frequency analysis
    smoothingTimeConstant: 0.8,        // 0-1, higher = more smoothing
    minDecibels: -90,                  // Minimum decibel value
    maxDecibels: -10,                  // Maximum decibel value
    volumeThreshold: 0.01,             // Threshold to detect speaking
    updateInterval: 16,                // ms between updates (~60fps)
  },
  // ...
})
```

### Idle Animation Configuration

```tsx
const lipSync = useAdvancedLipSync({
  idleConfig: {
    blinkInterval: [2, 6],             // [min, max] seconds between blinks
    blinkDuration: 0.15,               // Seconds for a complete blink
    breathingSpeed: 0.2,               // Cycles per second
    microMovementScale: 0.3,           // 0-1, scale of subtle movements
    enableIdleAnimations: true,        // Toggle idle animations
  },
  // ...
})
```

### Smoothing Configuration

```tsx
const lipSync = useAdvancedLipSync({
  smoothingConfig: {
    blendShapeLerp: 0.15,              // 0-1, blend shape interpolation speed
    volumeLerp: 0.2,                   // 0-1, volume smoothing speed
    enableSmoothing: true,              // Toggle smoothing
  },
  // ...
})
```

## API Reference

### `useAdvancedLipSync(props)`

Main hook for lip sync functionality.

**Props:**

```tsx
interface AdvancedLipSyncProps {
  audioElement?: HTMLAudioElement | null       // Audio element to analyze
  audioStream?: MediaStream | null             // Audio stream (e.g., microphone)
  isActive?: boolean                           // Enable/disable lip sync
  audioConfig?: Partial<AudioAnalysisConfig>   // Audio analysis config
  idleConfig?: Partial<IdleAnimationConfig>    // Idle animation config
  smoothingConfig?: Partial<SmoothingConfig>   // Smoothing config
  onError?: (error: Error) => void             // Error callback
  onVisemeChange?: (viseme: string, weights: VisemeWeights) => void  // Viseme change callback
}
```

**Returns:**

```tsx
interface LipSyncState {
  currentViseme: string                        // Current viseme name
  currentWeights: VisemeWeights                // Current blend shape weights
  volume: number                               // Current volume (0-1)
  isAnalyzing: boolean                         // Is audio analysis active
  isSpeaking: boolean                          // Is avatar speaking
  blinkWeight: number                          // Current blink weight (0-1)
  breathingWeight: number                      // Current breathing weight (0-1)
  applyToMesh: (mesh: THREE.Mesh | THREE.SkinnedMesh) => void  // Apply to mesh
  cleanup: () => void                          // Cleanup function
}
```

### `useAudioElement(audioUrl)`

Utility hook to create and manage an audio element.

```tsx
const audioElement = useAudioElement('/path/to/audio.mp3')
```

### `useMicrophoneStream()`

Utility hook to get microphone access.

```tsx
const { stream, error, isInitialized, initialize, stop } = useMicrophoneStream()

// Start microphone
await initialize()

// Stop microphone
stop()
```

### `AdvancedLipSyncComponent`

React Three Fiber component wrapper.

```tsx
<AdvancedLipSyncComponent
  meshRef={meshRef}
  audioElement={audioElement}
  isActive={true}
  // ... other AdvancedLipSyncProps
/>
```

## GLB Model Requirements

Your 3D model must have morph targets (blend shapes) for lip sync to work. The system looks for these standard names:

### Mouth Morph Targets

- `jawOpen`, `mouthOpen`, or `JawOpen`
- `mouthPucker`, `mouthFunnel`, or `MouthFunnel`
- `mouthStretch`, `mouthSmileLeft`, or `MouthStretchLeft`
- `mouthSmile` or `MouthSmile`
- `mouthFrown` or `MouthFrown`
- `lipUpperUp` or `UpperLipUp`
- `lipLowerDown` or `LowerLipDown`
- `tongueOut` or `TongueOut`

### Eye Morph Targets (for blinking)

- `eyeBlinkLeft` or `EyeBlinkLeft`
- `eyeBlinkRight` or `EyeBlinkRight`

### Creating Morph Targets in Blender

1. Select your mesh in Edit mode
2. Create shape keys for each mouth position
3. Name them according to the convention above
4. Export as GLB with morph targets enabled

## Visemes

The system uses these visemes (visual phonemes):

- `neutral` - Resting position
- `aa` - Open mouth (as in "father")
- `eh` - Mid-open (as in "bed")
- `ih` - Slight smile (as in "bit")
- `oh` - Round lips (as in "boat")
- `uu` - Pucker (as in "boot")
- `pp` - Lips together (p, b, m)
- `ff` - Teeth on lip (f, v)
- `th` - Tongue visible (t, d)
- `ss` - Teeth together (s, z)
- `nn` - Tongue up (n, l)
- `kk` - Open back (k, g)
- `rr` - Lip round with tongue (r)
- `ww` - Lip round (w)

## Performance Optimization

### Default Optimizations

- **Throttled Analysis**: Audio analysis at configurable intervals (default 16ms)
- **Efficient RAF**: Idle animations use requestAnimationFrame
- **Lerp Smoothing**: Reduces jitter without sacrificing responsiveness
- **Memory Management**: Proper cleanup of Web Audio API nodes

### Tips for 60fps

1. **Reduce FFT Size**: Use `fftSize: 1024` for faster analysis
2. **Increase Update Interval**: Set `updateInterval: 33` for 30fps analysis
3. **Disable Idle Animations**: Set `enableIdleAnimations: false` if not needed
4. **Optimize Model**: Use low-poly models with minimal morph targets

### Monitoring Performance

```tsx
const lipSync = useAdvancedLipSync({
  onVisemeChange: (viseme, weights) => {
    console.time('viseme-update')
    // ... your code
    console.timeEnd('viseme-update')
  }
})
```

## Integration with Web Speech API

```tsx
function AvatarWithTTS() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  const lipSync = useAdvancedLipSync({
    audioElement,
    isActive: true,
  })

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.onstart = () => {
      // Create audio element from speech synthesis
      // Note: This requires additional setup for Web Speech API
      // See example implementation in Rufus3D.tsx
    }

    window.speechSynthesis.speak(utterance)
  }

  useFrame(() => {
    if (meshRef.current) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  return <mesh ref={meshRef}>{/* ... */}</mesh>
}
```

## Advanced: Custom Phoneme Detection

For production use, consider integrating:

- **Azure Speech SDK**: Provides accurate phoneme timestamps
- **Wav2Lip**: ML model for precise lip sync
- **Rhubarb Lip Sync**: Offline phoneme extraction

```tsx
const lipSync = useAdvancedLipSync({
  onVisemeChange: (viseme, weights) => {
    // Override with your custom phoneme data
    // viseme: current detected viseme
    // weights: blend shape weights
  }
})
```

## Troubleshooting

### No Lip Movement

1. **Check morph targets**: Ensure your GLB model has morph targets
2. **Verify audio**: Check `lipSync.isAnalyzing` and `lipSync.volume`
3. **Check mesh ref**: Ensure mesh reference is valid
4. **Console errors**: Look for Web Audio API errors

### Jittery Animation

1. **Increase smoothing**: Set `blendShapeLerp: 0.05` (slower transitions)
2. **Increase volume threshold**: Set `volumeThreshold: 0.02`
3. **Enable smoothing**: Ensure `enableSmoothing: true`

### Performance Issues

1. **Reduce FFT size**: Set `fftSize: 1024` or `512`
2. **Increase update interval**: Set `updateInterval: 33` (30fps)
3. **Disable idle animations**: Set `enableIdleAnimations: false`
4. **Profile with DevTools**: Check for memory leaks

### Microphone Access Denied

```tsx
const { error, initialize } = useMicrophoneStream()

useEffect(() => {
  if (error) {
    console.error('Microphone error:', error)
    alert('Please allow microphone access')
  }
}, [error])
```

## Examples

See `AdvancedLipSyncExample.tsx` for a complete working example with:

- 3D avatar rendering
- Microphone and audio file support
- Control panel UI
- Real-time visualization
- Configuration options

## Best Practices

1. **Always cleanup**: The hook handles cleanup automatically, but you can call `lipSync.cleanup()` manually if needed
2. **Check browser support**: Web Audio API requires modern browsers
3. **Handle errors**: Provide `onError` callback for production apps
4. **Optimize models**: Use low-poly models with essential morph targets only
5. **Test on mobile**: Mobile devices may have different performance characteristics

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with webkit prefix)
- Mobile Safari: Requires user interaction to start audio
- Mobile Chrome: Full support

## License

MIT

## Credits

- Uses Web Audio API for real-time audio analysis
- Phoneme-to-viseme mapping based on ARKit blend shapes
- Optimized for React Three Fiber ecosystem

## Future Improvements

- ML-based phoneme detection using TensorFlow.js
- Support for more visemes and languages
- Real-time emotion detection
- Integration with lip-sync ML models (Wav2Lip, etc.)
- Visual debugging tools

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example implementation
3. Verify your GLB model has morph targets
4. Test with the provided example component

---

**Built with React Three Fiber, Three.js, and Web Audio API**
