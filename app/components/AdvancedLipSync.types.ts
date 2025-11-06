/**
 * Type definitions for Advanced Lip Sync System
 */

import * as THREE from 'three'

/**
 * Phoneme-to-Viseme mapping type
 */
export type PhonemeToVisemeMap = Record<string, string>

/**
 * Viseme blend shape weights for facial animation
 * Based on ARKit blend shapes standard
 */
export interface VisemeWeights {
  jawOpen: number          // 0-1: Jaw opening amount
  mouthPucker: number      // 0-1: Lips pushed forward (like "oo")
  mouthStretch: number     // 0-1: Mouth stretched wide
  mouthSmile: number       // 0-1: Smile amount
  mouthFrown: number       // 0-1: Frown amount
  lipUpperUp: number       // 0-1: Upper lip raised
  lipLowerDown: number     // 0-1: Lower lip lowered
  tongueOut: number        // 0-1: Tongue visibility
}

/**
 * Viseme name type for type safety
 */
export type VisemeName =
  | 'neutral'
  | 'aa'  // 'father'
  | 'eh'  // 'bed'
  | 'ih'  // 'bit'
  | 'oh'  // 'boat'
  | 'uu'  // 'boot'
  | 'pp'  // 'p', 'b', 'm'
  | 'ff'  // 'f', 'v'
  | 'th'  // 't', 'd'
  | 'ss'  // 's', 'z'
  | 'nn'  // 'n', 'l'
  | 'kk'  // 'k', 'g'
  | 'rr'  // 'r'
  | 'ww'  // 'w'

/**
 * Audio analysis configuration
 */
export interface AudioAnalysisConfig {
  /** FFT size for frequency analysis (must be power of 2: 256, 512, 1024, 2048, etc.) */
  fftSize: number

  /** Smoothing constant for frequency data (0-1, higher = more smoothing) */
  smoothingTimeConstant: number

  /** Minimum decibel value for analysis */
  minDecibels: number

  /** Maximum decibel value for analysis */
  maxDecibels: number

  /** Volume threshold to detect speaking (0-1) */
  volumeThreshold: number

  /** Milliseconds between audio analysis updates (lower = more frequent, higher CPU) */
  updateInterval: number
}

/**
 * Idle animation configuration
 */
export interface IdleAnimationConfig {
  /** [min, max] seconds between blinks */
  blinkInterval: [number, number]

  /** Duration of a complete blink in seconds */
  blinkDuration: number

  /** Breathing animation speed in cycles per second */
  breathingSpeed: number

  /** Scale of micro-movements (0-1) */
  microMovementScale: number

  /** Enable/disable all idle animations */
  enableIdleAnimations: boolean
}

/**
 * Smoothing configuration using linear interpolation
 */
export interface SmoothingConfig {
  /** Blend shape interpolation speed (0-1, higher = faster transitions) */
  blendShapeLerp: number

  /** Volume smoothing speed (0-1, higher = faster changes) */
  volumeLerp: number

  /** Enable/disable smoothing */
  enableSmoothing: boolean
}

/**
 * Props for the useAdvancedLipSync hook
 */
export interface AdvancedLipSyncProps {
  /** HTML Audio element to analyze (for audio file playback) */
  audioElement?: HTMLAudioElement | null

  /** Media stream to analyze (for microphone input) */
  audioStream?: MediaStream | null

  /** Whether lip sync is active */
  isActive?: boolean

  /** Audio analysis configuration */
  audioConfig?: Partial<AudioAnalysisConfig>

  /** Idle animation configuration */
  idleConfig?: Partial<IdleAnimationConfig>

  /** Smoothing configuration */
  smoothingConfig?: Partial<SmoothingConfig>

  /** Error callback */
  onError?: (error: Error) => void

  /** Viseme change callback */
  onVisemeChange?: (viseme: string, weights: VisemeWeights) => void
}

/**
 * Return type for the useAdvancedLipSync hook
 */
export interface LipSyncState {
  /** Current viseme name */
  currentViseme: string

  /** Current blend shape weights */
  currentWeights: VisemeWeights

  /** Current audio volume (0-1) */
  volume: number

  /** Whether audio analysis is active */
  isAnalyzing: boolean

  /** Whether the avatar is currently speaking */
  isSpeaking: boolean

  /** Current blink weight (0-1, 0=eyes open, 1=eyes closed) */
  blinkWeight: number

  /** Current breathing weight (0-1) */
  breathingWeight: number

  /** Function to apply lip sync to a Three.js mesh */
  applyToMesh: (mesh: THREE.Mesh | THREE.SkinnedMesh) => void

  /** Cleanup function to release resources */
  cleanup: () => void
}

/**
 * Props for the AdvancedLipSyncComponent
 */
export interface AdvancedLipSyncComponentProps extends AdvancedLipSyncProps {
  /** Reference to the Three.js mesh to apply lip sync to */
  meshRef: React.RefObject<THREE.Mesh | THREE.SkinnedMesh>
}

/**
 * Frequency analysis result
 */
export interface FrequencyAnalysis {
  /** Low frequency energy (0-1) */
  lowFreq: number

  /** Mid frequency energy (0-1) */
  midFreq: number

  /** High frequency energy (0-1) */
  highFreq: number

  /** Total energy (0-1) */
  totalEnergy: number

  /** Detected viseme */
  viseme: VisemeName
}

/**
 * Audio context state
 */
export interface AudioContextState {
  context: AudioContext | null
  analyser: AnalyserNode | null
  source: MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null
  isInitialized: boolean
}

/**
 * Microphone stream state
 */
export interface MicrophoneStreamState {
  /** Media stream from microphone */
  stream: MediaStream | null

  /** Error if microphone access failed */
  error: Error | null

  /** Whether microphone is initialized */
  isInitialized: boolean

  /** Function to start microphone */
  initialize: () => Promise<void>

  /** Function to stop microphone */
  stop: () => void
}

/**
 * Morph target mapping configuration
 * Maps internal blend shape names to GLB model morph target names
 */
export interface MorphTargetMapping {
  jawOpen: string[]
  mouthPucker: string[]
  mouthStretch: string[]
  mouthSmile: string[]
  mouthFrown: string[]
  lipUpperUp: string[]
  lipLowerDown: string[]
  tongueOut: string[]
  eyeBlinkLeft: string[]
  eyeBlinkRight: string[]
}

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  /** Average frames per second */
  fps: number

  /** Audio analysis time in ms */
  analysisTime: number

  /** Render time in ms */
  renderTime: number

  /** Memory usage in MB */
  memoryUsage: number

  /** Number of active blend shapes */
  activeBlendShapes: number
}

/**
 * Debug information
 */
export interface DebugInfo {
  /** Current viseme */
  viseme: VisemeName

  /** Current weights */
  weights: VisemeWeights

  /** Volume level */
  volume: number

  /** Is speaking */
  isSpeaking: boolean

  /** Frequency data snapshot */
  frequencyData: number[]

  /** Time domain data snapshot */
  timeDomainData: number[]

  /** Performance metrics */
  performance: Partial<PerformanceMetrics>
}

/**
 * Lip sync event types
 */
export enum LipSyncEvent {
  INITIALIZED = 'initialized',
  STARTED = 'started',
  STOPPED = 'stopped',
  VISEME_CHANGED = 'viseme_changed',
  SPEAKING_STARTED = 'speaking_started',
  SPEAKING_STOPPED = 'speaking_stopped',
  BLINK_STARTED = 'blink_started',
  BLINK_ENDED = 'blink_ended',
  ERROR = 'error',
}

/**
 * Event callback type
 */
export type LipSyncEventCallback = (event: LipSyncEvent, data?: any) => void

/**
 * Extended lip sync props with event callbacks
 */
export interface AdvancedLipSyncPropsWithEvents extends AdvancedLipSyncProps {
  /** Event callback */
  onEvent?: LipSyncEventCallback
}

/**
 * Preset configurations for common use cases
 */
export interface LipSyncPreset {
  name: string
  description: string
  audioConfig: AudioAnalysisConfig
  idleConfig: IdleAnimationConfig
  smoothingConfig: SmoothingConfig
}

/**
 * Common presets
 */
export type PresetName = 'high-quality' | 'balanced' | 'performance' | 'mobile'

/**
 * Preset configurations map
 */
export type PresetsMap = Record<PresetName, LipSyncPreset>
