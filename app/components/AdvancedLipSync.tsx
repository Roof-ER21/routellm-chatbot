'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Phoneme-to-Viseme mapping for accurate lip sync
 * Visemes are visual representations of phonemes
 */
const PHONEME_TO_VISEME_MAP: Record<string, string> = {
  // Silence
  'sil': 'neutral',

  // Vowels
  'a': 'aa',      // 'a' in 'father'
  'e': 'eh',      // 'e' in 'bed'
  'i': 'ih',      // 'i' in 'bit'
  'o': 'oh',      // 'o' in 'boat'
  'u': 'uu',      // 'u' in 'boot'

  // Consonants
  'p': 'pp',      // bilabial plosive
  'b': 'pp',      // bilabial plosive
  'm': 'pp',      // bilabial nasal

  'f': 'ff',      // labiodental fricative
  'v': 'ff',      // labiodental fricative

  't': 'th',      // alveolar plosive
  'd': 'th',      // alveolar plosive
  's': 'ss',      // alveolar fricative
  'z': 'ss',      // alveolar fricative
  'n': 'nn',      // alveolar nasal
  'l': 'nn',      // alveolar lateral

  'k': 'kk',      // velar plosive
  'g': 'kk',      // velar plosive

  'r': 'rr',      // alveolar approximant
  'w': 'ww',      // labio-velar approximant
}

/**
 * Viseme blend shape weights for GLB models
 * These map to standard ARKit blend shapes or custom morph targets
 */
interface VisemeWeights {
  jawOpen: number
  mouthPucker: number
  mouthStretch: number
  mouthSmile: number
  mouthFrown: number
  lipUpperUp: number
  lipLowerDown: number
  tongueOut: number
}

const VISEME_BLEND_SHAPES: Record<string, VisemeWeights> = {
  neutral: {
    jawOpen: 0,
    mouthPucker: 0,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0,
    tongueOut: 0,
  },
  aa: { // 'father'
    jawOpen: 0.8,
    mouthPucker: 0,
    mouthStretch: 0.3,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0.2,
    lipLowerDown: 0.5,
    tongueOut: 0,
  },
  eh: { // 'bed'
    jawOpen: 0.4,
    mouthPucker: 0,
    mouthStretch: 0.6,
    mouthSmile: 0.3,
    mouthFrown: 0,
    lipUpperUp: 0.1,
    lipLowerDown: 0.2,
    tongueOut: 0,
  },
  ih: { // 'bit'
    jawOpen: 0.3,
    mouthPucker: 0,
    mouthStretch: 0.4,
    mouthSmile: 0.5,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0.1,
    tongueOut: 0,
  },
  oh: { // 'boat'
    jawOpen: 0.5,
    mouthPucker: 0.7,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0.1,
    lipLowerDown: 0.3,
    tongueOut: 0,
  },
  uu: { // 'boot'
    jawOpen: 0.3,
    mouthPucker: 0.9,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0.2,
    tongueOut: 0,
  },
  pp: { // 'p', 'b', 'm'
    jawOpen: 0,
    mouthPucker: 0.8,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0,
    tongueOut: 0,
  },
  ff: { // 'f', 'v'
    jawOpen: 0.1,
    mouthPucker: 0,
    mouthStretch: 0.3,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0.4,
    tongueOut: 0,
  },
  th: { // 't', 'd'
    jawOpen: 0.2,
    mouthPucker: 0,
    mouthStretch: 0.2,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0.3,
    lipLowerDown: 0.3,
    tongueOut: 0.2,
  },
  ss: { // 's', 'z'
    jawOpen: 0.1,
    mouthPucker: 0,
    mouthStretch: 0.4,
    mouthSmile: 0.6,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0,
    tongueOut: 0.1,
  },
  nn: { // 'n', 'l'
    jawOpen: 0.3,
    mouthPucker: 0,
    mouthStretch: 0.3,
    mouthSmile: 0.2,
    mouthFrown: 0,
    lipUpperUp: 0.2,
    lipLowerDown: 0.2,
    tongueOut: 0.3,
  },
  kk: { // 'k', 'g'
    jawOpen: 0.4,
    mouthPucker: 0,
    mouthStretch: 0.2,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0.2,
    tongueOut: 0,
  },
  rr: { // 'r'
    jawOpen: 0.3,
    mouthPucker: 0.3,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0.1,
    lipLowerDown: 0.1,
    tongueOut: 0.4,
  },
  ww: { // 'w'
    jawOpen: 0.2,
    mouthPucker: 0.9,
    mouthStretch: 0,
    mouthSmile: 0,
    mouthFrown: 0,
    lipUpperUp: 0,
    lipLowerDown: 0,
    tongueOut: 0,
  },
}

/**
 * Audio analysis configuration
 */
interface AudioAnalysisConfig {
  fftSize: number
  smoothingTimeConstant: number
  minDecibels: number
  maxDecibels: number
  volumeThreshold: number
  updateInterval: number // ms between updates
}

const DEFAULT_AUDIO_CONFIG: AudioAnalysisConfig = {
  fftSize: 2048,
  smoothingTimeConstant: 0.8,
  minDecibels: -90,
  maxDecibels: -10,
  volumeThreshold: 0.01,
  updateInterval: 16, // ~60fps
}

/**
 * Idle animation configuration
 */
interface IdleAnimationConfig {
  blinkInterval: [number, number] // min, max seconds between blinks
  blinkDuration: number // seconds
  breathingSpeed: number // cycles per second
  microMovementScale: number // 0-1
  enableIdleAnimations: boolean
}

const DEFAULT_IDLE_CONFIG: IdleAnimationConfig = {
  blinkInterval: [2, 6],
  blinkDuration: 0.15,
  breathingSpeed: 0.2,
  microMovementScale: 0.3,
  enableIdleAnimations: true,
}

/**
 * Smoothing configuration using lerp (linear interpolation)
 */
interface SmoothingConfig {
  blendShapeLerp: number // 0-1, higher = faster transitions
  volumeLerp: number
  enableSmoothing: boolean
}

const DEFAULT_SMOOTHING_CONFIG: SmoothingConfig = {
  blendShapeLerp: 0.15,
  volumeLerp: 0.2,
  enableSmoothing: true,
}

/**
 * Props for the AdvancedLipSync hook
 */
export interface AdvancedLipSyncProps {
  audioElement?: HTMLAudioElement | null
  audioStream?: MediaStream | null
  isActive?: boolean
  audioConfig?: Partial<AudioAnalysisConfig>
  idleConfig?: Partial<IdleAnimationConfig>
  smoothingConfig?: Partial<SmoothingConfig>
  onError?: (error: Error) => void
  onVisemeChange?: (viseme: string, weights: VisemeWeights) => void
}

/**
 * Return type for the AdvancedLipSync hook
 */
export interface LipSyncState {
  currentViseme: string
  currentWeights: VisemeWeights
  volume: number
  isAnalyzing: boolean
  isSpeaking: boolean
  blinkWeight: number
  breathingWeight: number
  applyToMesh: (mesh: THREE.Mesh | THREE.SkinnedMesh) => void
  cleanup: () => void
}

/**
 * Frequency analysis to estimate phoneme/viseme
 * This is a simplified approach - for production, consider using
 * ML models like Wav2Lip or Azure Speech SDK
 */
function analyzeFrequencyForViseme(
  frequencyData: Uint8Array,
  volume: number
): string {
  if (volume < 0.02) return 'neutral'

  // Calculate frequency band energies
  const lowFreq = frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10
  const midFreq = frequencyData.slice(10, 40).reduce((a, b) => a + b, 0) / 30
  const highFreq = frequencyData.slice(40, 80).reduce((a, b) => a + b, 0) / 40

  const totalEnergy = lowFreq + midFreq + highFreq
  if (totalEnergy === 0) return 'neutral'

  // Normalize
  const lowRatio = lowFreq / totalEnergy
  const midRatio = midFreq / totalEnergy
  const highRatio = highFreq / totalEnergy

  // Simple heuristic mapping (improved with more data)
  if (lowRatio > 0.5) {
    return volume > 0.3 ? 'aa' : 'oh' // Open vowels
  } else if (midRatio > 0.4) {
    return volume > 0.25 ? 'eh' : 'ih' // Mid vowels
  } else if (highRatio > 0.4) {
    return volume > 0.2 ? 'ss' : 'ff' // Sibilants and fricatives
  } else {
    // Mixed - use volume to determine mouth shape
    if (volume > 0.3) return 'aa'
    if (volume > 0.2) return 'eh'
    if (volume > 0.1) return 'uu'
    return 'neutral'
  }
}

/**
 * Linear interpolation helper
 */
function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * alpha
}

/**
 * Interpolate between two viseme weight sets
 */
function lerpVisemeWeights(
  from: VisemeWeights,
  to: VisemeWeights,
  alpha: number
): VisemeWeights {
  return {
    jawOpen: lerp(from.jawOpen, to.jawOpen, alpha),
    mouthPucker: lerp(from.mouthPucker, to.mouthPucker, alpha),
    mouthStretch: lerp(from.mouthStretch, to.mouthStretch, alpha),
    mouthSmile: lerp(from.mouthSmile, to.mouthSmile, alpha),
    mouthFrown: lerp(from.mouthFrown, to.mouthFrown, alpha),
    lipUpperUp: lerp(from.lipUpperUp, to.lipUpperUp, alpha),
    lipLowerDown: lerp(from.lipLowerDown, to.lipLowerDown, alpha),
    tongueOut: lerp(from.tongueOut, to.tongueOut, alpha),
  }
}

/**
 * Main Advanced Lip Sync Hook
 *
 * This hook provides real-time audio analysis and lip sync capabilities
 * for 3D avatars using React Three Fiber.
 *
 * @example
 * ```tsx
 * function MyAvatar() {
 *   const meshRef = useRef<THREE.Mesh>(null)
 *   const audioRef = useRef<HTMLAudioElement>(null)
 *
 *   const lipSync = useAdvancedLipSync({
 *     audioElement: audioRef.current,
 *     isActive: true,
 *   })
 *
 *   useFrame(() => {
 *     if (meshRef.current) {
 *       lipSync.applyToMesh(meshRef.current)
 *     }
 *   })
 *
 *   return <mesh ref={meshRef}>...</mesh>
 * }
 * ```
 */
export function useAdvancedLipSync({
  audioElement,
  audioStream,
  isActive = true,
  audioConfig: customAudioConfig,
  idleConfig: customIdleConfig,
  smoothingConfig: customSmoothingConfig,
  onError,
  onVisemeChange,
}: AdvancedLipSyncProps = {}): LipSyncState {
  // Merge configs with defaults
  const audioConfig = useMemo(
    () => ({ ...DEFAULT_AUDIO_CONFIG, ...customAudioConfig }),
    [customAudioConfig]
  )

  const idleConfig = useMemo(
    () => ({ ...DEFAULT_IDLE_CONFIG, ...customIdleConfig }),
    [customIdleConfig]
  )

  const smoothingConfig = useMemo(
    () => ({ ...DEFAULT_SMOOTHING_CONFIG, ...customSmoothingConfig }),
    [customSmoothingConfig]
  )

  // State
  const [currentViseme, setCurrentViseme] = useState<string>('neutral')
  const [currentWeights, setCurrentWeights] = useState<VisemeWeights>(
    VISEME_BLEND_SHAPES.neutral
  )
  const [volume, setVolume] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [blinkWeight, setBlinkWeight] = useState(0)
  const [breathingWeight, setBreathingWeight] = useState(0)

  // Refs for Web Audio API
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Refs for smoothing
  const targetWeightsRef = useRef<VisemeWeights>(VISEME_BLEND_SHAPES.neutral)
  const smoothedWeightsRef = useRef<VisemeWeights>(VISEME_BLEND_SHAPES.neutral)
  const smoothedVolumeRef = useRef(0)

  // Refs for idle animations
  const lastBlinkTimeRef = useRef(0)
  const nextBlinkTimeRef = useRef(0)
  const blinkStartTimeRef = useRef(0)
  const isBlinkingRef = useRef(false)

  /**
   * Initialize Web Audio API
   */
  const initializeAudioAnalysis = useCallback(() => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      // Create analyser node
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = audioConfig.fftSize
      analyser.smoothingTimeConstant = audioConfig.smoothingTimeConstant
      analyser.minDecibels = audioConfig.minDecibels
      analyser.maxDecibels = audioConfig.maxDecibels
      analyserRef.current = analyser

      // Connect source
      let source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null

      if (audioStream) {
        source = audioContext.createMediaStreamSource(audioStream)
      } else if (audioElement) {
        source = audioContext.createMediaElementSource(audioElement)
        // Connect to destination so audio still plays
        analyser.connect(audioContext.destination)
      }

      if (source) {
        source.connect(analyser)
        sourceRef.current = source
        setIsAnalyzing(true)
      }
    } catch (error) {
      console.error('Failed to initialize audio analysis:', error)
      onError?.(error as Error)
    }
  }, [audioElement, audioStream, audioConfig, onError])

  /**
   * Analyze audio and update viseme
   */
  const analyzeAudio = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const timeDataArray = new Uint8Array(bufferLength)

    analyser.getByteFrequencyData(dataArray)
    analyser.getByteTimeDomainData(timeDataArray)

    // Calculate volume (RMS)
    let sum = 0
    for (let i = 0; i < timeDataArray.length; i++) {
      const normalized = (timeDataArray[i] - 128) / 128
      sum += normalized * normalized
    }
    const rms = Math.sqrt(sum / timeDataArray.length)
    const currentVolume = Math.max(0, Math.min(1, rms * 2))

    // Smooth volume
    const smoothedVolume = smoothingConfig.enableSmoothing
      ? lerp(smoothedVolumeRef.current, currentVolume, smoothingConfig.volumeLerp)
      : currentVolume
    smoothedVolumeRef.current = smoothedVolume
    setVolume(smoothedVolume)

    // Determine if speaking
    const speaking = smoothedVolume > audioConfig.volumeThreshold
    setIsSpeaking(speaking)

    // Analyze frequency for viseme
    const viseme = speaking
      ? analyzeFrequencyForViseme(dataArray, smoothedVolume)
      : 'neutral'

    if (viseme !== currentViseme) {
      setCurrentViseme(viseme)
      targetWeightsRef.current = VISEME_BLEND_SHAPES[viseme] || VISEME_BLEND_SHAPES.neutral
      onVisemeChange?.(viseme, targetWeightsRef.current)
    }

    // Smooth blend shape weights
    if (smoothingConfig.enableSmoothing) {
      smoothedWeightsRef.current = lerpVisemeWeights(
        smoothedWeightsRef.current,
        targetWeightsRef.current,
        smoothingConfig.blendShapeLerp
      )
      setCurrentWeights(smoothedWeightsRef.current)
    } else {
      smoothedWeightsRef.current = targetWeightsRef.current
      setCurrentWeights(targetWeightsRef.current)
    }
  }, [
    currentViseme,
    audioConfig.volumeThreshold,
    smoothingConfig,
    onVisemeChange,
  ])

  /**
   * Idle animations (blinking, breathing, micro-movements)
   */
  const updateIdleAnimations = useCallback((time: number) => {
    if (!idleConfig.enableIdleAnimations) return

    // Blinking logic
    if (!isBlinkingRef.current && time > nextBlinkTimeRef.current) {
      // Start blink
      isBlinkingRef.current = true
      blinkStartTimeRef.current = time
      lastBlinkTimeRef.current = time

      // Schedule next blink
      const [minInterval, maxInterval] = idleConfig.blinkInterval
      const nextInterval = minInterval + Math.random() * (maxInterval - minInterval)
      nextBlinkTimeRef.current = time + nextInterval * 1000
    }

    // Update blink weight
    if (isBlinkingRef.current) {
      const blinkProgress = (time - blinkStartTimeRef.current) / (idleConfig.blinkDuration * 1000)

      if (blinkProgress < 0.5) {
        // Closing eyes
        setBlinkWeight(blinkProgress * 2)
      } else if (blinkProgress < 1) {
        // Opening eyes
        setBlinkWeight(2 - blinkProgress * 2)
      } else {
        // Blink complete
        isBlinkingRef.current = false
        setBlinkWeight(0)
      }
    }

    // Breathing animation (subtle jaw movement)
    const breathingCycle = Math.sin(time * 0.001 * idleConfig.breathingSpeed * Math.PI * 2)
    setBreathingWeight(breathingCycle * 0.5 + 0.5) // Normalize to 0-1
  }, [idleConfig])

  /**
   * Main update loop
   */
  useEffect(() => {
    if (!isActive || !isAnalyzing) return

    // Use interval for audio analysis (throttled)
    updateIntervalRef.current = setInterval(() => {
      analyzeAudio()
    }, audioConfig.updateInterval)

    // Use requestAnimationFrame for smooth idle animations
    const animateIdle = (time: number) => {
      updateIdleAnimations(time)
      animationFrameRef.current = requestAnimationFrame(animateIdle)
    }
    animationFrameRef.current = requestAnimationFrame(animateIdle)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, isAnalyzing, analyzeAudio, updateIdleAnimations, audioConfig.updateInterval])

  /**
   * Initialize audio analysis when audio source changes
   */
  useEffect(() => {
    if (!isActive) return
    if (!audioElement && !audioStream) return

    initializeAudioAnalysis()

    return () => {
      // Cleanup will be handled by cleanup function
    }
  }, [audioElement, audioStream, isActive, initializeAudioAnalysis])

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current)
      updateIntervalRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect()
      } catch (e) {
        // Already disconnected
      }
      sourceRef.current = null
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch (e) {
        // Already disconnected
      }
      analyserRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsAnalyzing(false)
  }, [])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return cleanup
  }, [cleanup])

  /**
   * Apply blend shapes to a Three.js mesh
   */
  const applyToMesh = useCallback(
    (mesh: THREE.Mesh | THREE.SkinnedMesh) => {
      if (!mesh.morphTargetInfluences || !mesh.morphTargetDictionary) {
        return
      }

      const weights = currentWeights
      const dict = mesh.morphTargetDictionary

      // Map our blend shape names to morph target indices
      // These should match your GLB model's morph target names
      const mappings = {
        jawOpen: ['jawOpen', 'mouthOpen', 'JawOpen'],
        mouthPucker: ['mouthPucker', 'mouthFunnel', 'MouthFunnel'],
        mouthStretch: ['mouthStretch', 'mouthSmileLeft', 'MouthStretchLeft'],
        mouthSmile: ['mouthSmile', 'MouthSmile'],
        mouthFrown: ['mouthFrown', 'MouthFrown'],
        lipUpperUp: ['lipUpperUp', 'UpperLipUp'],
        lipLowerDown: ['lipLowerDown', 'LowerLipDown'],
        tongueOut: ['tongueOut', 'TongueOut'],
      }

      // Apply each weight
      Object.entries(mappings).forEach(([key, names]) => {
        const weight = weights[key as keyof VisemeWeights]

        // Try each possible name
        for (const name of names) {
          const index = dict[name]
          if (index !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = weight
            break
          }
        }
      })

      // Apply blink weight if available
      if (blinkWeight > 0) {
        const blinkNames = ['eyeBlinkLeft', 'eyeBlinkRight', 'EyeBlinkLeft', 'EyeBlinkRight']
        blinkNames.forEach(name => {
          const index = dict[name]
          if (index !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = blinkWeight
          }
        })
      }

      // Apply breathing (subtle jaw movement when idle)
      if (!isSpeaking && breathingWeight > 0) {
        const breathingAmount = breathingWeight * 0.05 * idleConfig.microMovementScale
        const jawNames = ['jawOpen', 'mouthOpen', 'JawOpen']
        jawNames.forEach(name => {
          const index = dict[name]
          if (index !== undefined && mesh.morphTargetInfluences) {
            mesh.morphTargetInfluences[index] = Math.max(
              mesh.morphTargetInfluences[index] || 0,
              breathingAmount
            )
          }
        })
      }
    },
    [currentWeights, blinkWeight, breathingWeight, isSpeaking, idleConfig.microMovementScale]
  )

  return {
    currentViseme,
    currentWeights,
    volume,
    isAnalyzing,
    isSpeaking,
    blinkWeight,
    breathingWeight,
    applyToMesh,
    cleanup,
  }
}

/**
 * React Three Fiber component that applies lip sync to a mesh
 *
 * @example
 * ```tsx
 * <AdvancedLipSyncComponent
 *   meshRef={avatarMeshRef}
 *   audioElement={audioRef.current}
 *   isActive={true}
 * />
 * ```
 */
export interface AdvancedLipSyncComponentProps extends AdvancedLipSyncProps {
  meshRef: React.RefObject<THREE.Mesh | THREE.SkinnedMesh>
}

export function AdvancedLipSyncComponent({
  meshRef,
  ...lipSyncProps
}: AdvancedLipSyncComponentProps) {
  const lipSync = useAdvancedLipSync(lipSyncProps)

  // Apply lip sync on every frame
  useFrame(() => {
    if (meshRef.current) {
      lipSync.applyToMesh(meshRef.current)
    }
  })

  return null
}

/**
 * Utility: Create audio element from URL
 */
export function useAudioElement(audioUrl?: string) {
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioUrl) {
      setAudioElement(null)
      return
    }

    const audio = new Audio(audioUrl)
    audio.crossOrigin = 'anonymous'
    setAudioElement(audio)

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl])

  return audioElement
}

/**
 * Utility: Get microphone stream
 */
export function useMicrophoneStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const initialize = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      setStream(mediaStream)
      setIsInitialized(true)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to get microphone access:', err)
    }
  }, [])

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsInitialized(false)
    }
  }, [stream])

  return { stream, error, isInitialized, initialize, stop }
}

export default useAdvancedLipSync
