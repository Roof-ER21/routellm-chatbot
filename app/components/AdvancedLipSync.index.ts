/**
 * Advanced Lip Sync System - Main Export File
 *
 * Use this file for clean imports across your application
 */

// Main hook and components
export {
  useAdvancedLipSync,
  AdvancedLipSyncComponent,
  useAudioElement,
  useMicrophoneStream,
} from './AdvancedLipSync'

// Types
export type {
  AdvancedLipSyncProps,
  LipSyncState,
  AdvancedLipSyncComponentProps,
  VisemeWeights,
  VisemeName,
  AudioAnalysisConfig,
  IdleAnimationConfig,
  SmoothingConfig,
  FrequencyAnalysis,
  AudioContextState,
  MicrophoneStreamState,
  MorphTargetMapping,
  PerformanceMetrics,
  DebugInfo,
  LipSyncEvent,
  LipSyncEventCallback,
  AdvancedLipSyncPropsWithEvents,
  LipSyncPreset,
  PresetName,
  PresetsMap,
} from './AdvancedLipSync.types'

// Presets
export {
  HIGH_QUALITY_PRESET,
  BALANCED_PRESET,
  PERFORMANCE_PRESET,
  MOBILE_PRESET,
  PRESETS,
  getPreset,
  getPresetConfig,
  detectOptimalPreset,
  createCustomPreset,
} from './AdvancedLipSync.presets'

// Utilities
export {
  lerp,
  clamp,
  smoothStep,
  lerpVisemeWeights,
  calculateRMS,
  calculateVolume,
  analyzeFrequencyBands,
  detectSpeech,
  calculateZeroCrossingRate,
  formatPerformanceMetrics,
  createDebugInfo,
  exportDebugInfo,
  downloadDebugInfo,
  PerformanceMonitor,
  AudioBufferRecorder,
  VisemeTransitionTracker,
  checkBrowserSupport,
  getRecommendedConfig,
  logSystemInfo,
} from './AdvancedLipSync.utils'

/**
 * Usage Examples:
 *
 * // Import everything
 * import * as LipSync from './components/AdvancedLipSync.index'
 *
 * // Import specific items
 * import { useAdvancedLipSync, getPresetConfig } from './components/AdvancedLipSync.index'
 *
 * // Use in component
 * const lipSync = useAdvancedLipSync({
 *   audioStream: myStream,
 *   ...getPresetConfig('balanced'),
 * })
 */
