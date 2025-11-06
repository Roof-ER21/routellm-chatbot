/**
 * Preset configurations for Advanced Lip Sync System
 * Use these presets for common use cases
 */

import type {
  LipSyncPreset,
  PresetsMap,
  AudioAnalysisConfig,
  IdleAnimationConfig,
  SmoothingConfig,
} from './AdvancedLipSync.types'

/**
 * High Quality Preset
 * - Maximum fidelity
 * - Smooth animations
 * - All idle features enabled
 * - Best for: Desktop applications, recorded videos
 */
export const HIGH_QUALITY_PRESET: LipSyncPreset = {
  name: 'High Quality',
  description: 'Maximum fidelity with smooth animations',
  audioConfig: {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    volumeThreshold: 0.01,
    updateInterval: 16, // ~60fps
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
}

/**
 * Balanced Preset (Default)
 * - Good quality with reasonable performance
 * - Moderate smoothing
 * - Essential idle features
 * - Best for: Most web applications
 */
export const BALANCED_PRESET: LipSyncPreset = {
  name: 'Balanced',
  description: 'Good quality with reasonable performance',
  audioConfig: {
    fftSize: 1024,
    smoothingTimeConstant: 0.7,
    minDecibels: -85,
    maxDecibels: -10,
    volumeThreshold: 0.015,
    updateInterval: 20, // ~50fps
  },
  idleConfig: {
    blinkInterval: [3, 5],
    blinkDuration: 0.15,
    breathingSpeed: 0.15,
    microMovementScale: 0.2,
    enableIdleAnimations: true,
  },
  smoothingConfig: {
    blendShapeLerp: 0.2,
    volumeLerp: 0.25,
    enableSmoothing: true,
  },
}

/**
 * Performance Preset
 * - Optimized for speed
 * - Reduced smoothing for lower latency
 * - Minimal idle animations
 * - Best for: Real-time applications, multiple avatars
 */
export const PERFORMANCE_PRESET: LipSyncPreset = {
  name: 'Performance',
  description: 'Optimized for speed and low latency',
  audioConfig: {
    fftSize: 512,
    smoothingTimeConstant: 0.6,
    minDecibels: -80,
    maxDecibels: -10,
    volumeThreshold: 0.02,
    updateInterval: 33, // ~30fps
  },
  idleConfig: {
    blinkInterval: [4, 7],
    blinkDuration: 0.12,
    breathingSpeed: 0.1,
    microMovementScale: 0.1,
    enableIdleAnimations: true,
  },
  smoothingConfig: {
    blendShapeLerp: 0.3,
    volumeLerp: 0.35,
    enableSmoothing: true,
  },
}

/**
 * Mobile Preset
 * - Optimized for mobile devices
 * - Conservative resource usage
 * - Simplified animations
 * - Best for: Mobile web, tablets, low-end devices
 */
export const MOBILE_PRESET: LipSyncPreset = {
  name: 'Mobile',
  description: 'Optimized for mobile devices',
  audioConfig: {
    fftSize: 512,
    smoothingTimeConstant: 0.5,
    minDecibels: -80,
    maxDecibels: -10,
    volumeThreshold: 0.025,
    updateInterval: 50, // ~20fps
  },
  idleConfig: {
    blinkInterval: [5, 8],
    blinkDuration: 0.1,
    breathingSpeed: 0.08,
    microMovementScale: 0.05,
    enableIdleAnimations: false, // Disabled for performance
  },
  smoothingConfig: {
    blendShapeLerp: 0.4,
    volumeLerp: 0.4,
    enableSmoothing: true,
  },
}

/**
 * All presets map
 */
export const PRESETS: PresetsMap = {
  'high-quality': HIGH_QUALITY_PRESET,
  'balanced': BALANCED_PRESET,
  'performance': PERFORMANCE_PRESET,
  'mobile': MOBILE_PRESET,
}

/**
 * Get a preset by name
 */
export function getPreset(name: keyof PresetsMap): LipSyncPreset {
  return PRESETS[name]
}

/**
 * Get preset configuration (destructured)
 */
export function getPresetConfig(name: keyof PresetsMap): {
  audioConfig: AudioAnalysisConfig
  idleConfig: IdleAnimationConfig
  smoothingConfig: SmoothingConfig
} {
  const preset = PRESETS[name]
  return {
    audioConfig: preset.audioConfig,
    idleConfig: preset.idleConfig,
    smoothingConfig: preset.smoothingConfig,
  }
}

/**
 * Detect device capabilities and recommend a preset
 */
export function detectOptimalPreset(): keyof PresetsMap {
  // Check if mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  if (isMobile) {
    return 'mobile'
  }

  // Check device memory (if available)
  const memory = (navigator as any).deviceMemory
  if (memory && memory < 4) {
    return 'performance'
  }

  // Check hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4
  if (cores < 4) {
    return 'performance'
  }

  // Check if battery-powered (if available)
  const battery = (navigator as any).getBattery
  if (battery) {
    battery().then((batteryManager: any) => {
      if (batteryManager.charging === false && batteryManager.level < 0.3) {
        return 'performance'
      }
    })
  }

  // Default to balanced
  return 'balanced'
}

/**
 * Create a custom preset by merging with an existing preset
 */
export function createCustomPreset(
  baseName: keyof PresetsMap,
  overrides: {
    audioConfig?: Partial<AudioAnalysisConfig>
    idleConfig?: Partial<IdleAnimationConfig>
    smoothingConfig?: Partial<SmoothingConfig>
  }
): LipSyncPreset {
  const basePreset = PRESETS[baseName]

  return {
    name: 'Custom',
    description: `Custom preset based on ${basePreset.name}`,
    audioConfig: {
      ...basePreset.audioConfig,
      ...overrides.audioConfig,
    },
    idleConfig: {
      ...basePreset.idleConfig,
      ...overrides.idleConfig,
    },
    smoothingConfig: {
      ...basePreset.smoothingConfig,
      ...overrides.smoothingConfig,
    },
  }
}

/**
 * Example usage:
 *
 * // Use a preset directly
 * const lipSync = useAdvancedLipSync({
 *   ...getPresetConfig('high-quality'),
 *   audioElement: myAudio,
 * })
 *
 * // Auto-detect optimal preset
 * const optimalPreset = detectOptimalPreset()
 * const lipSync = useAdvancedLipSync({
 *   ...getPresetConfig(optimalPreset),
 *   audioElement: myAudio,
 * })
 *
 * // Create custom preset
 * const customPreset = createCustomPreset('balanced', {
 *   audioConfig: { fftSize: 2048 },
 *   idleConfig: { microMovementScale: 0.5 },
 * })
 * const lipSync = useAdvancedLipSync({
 *   audioConfig: customPreset.audioConfig,
 *   idleConfig: customPreset.idleConfig,
 *   smoothingConfig: customPreset.smoothingConfig,
 *   audioElement: myAudio,
 * })
 */
