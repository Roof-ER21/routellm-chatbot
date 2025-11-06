/**
 * Utility functions for Advanced Lip Sync System
 */

import type { VisemeWeights, DebugInfo, PerformanceMetrics } from './AdvancedLipSync.types'

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, alpha: number): number {
  return start + (end - start) * Math.max(0, Math.min(1, alpha))
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Smooth step interpolation (ease in/out)
 */
export function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/**
 * Interpolate between two viseme weight sets
 */
export function lerpVisemeWeights(
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
 * Calculate RMS (Root Mean Square) from time domain data
 */
export function calculateRMS(timeData: Uint8Array): number {
  let sum = 0
  for (let i = 0; i < timeData.length; i++) {
    const normalized = (timeData[i] - 128) / 128
    sum += normalized * normalized
  }
  return Math.sqrt(sum / timeData.length)
}

/**
 * Calculate volume from RMS (0-1 range)
 */
export function calculateVolume(rms: number, sensitivity: number = 2): number {
  return clamp(rms * sensitivity, 0, 1)
}

/**
 * Analyze frequency bands
 */
export function analyzeFrequencyBands(frequencyData: Uint8Array): {
  low: number
  mid: number
  high: number
  total: number
} {
  const lowEnd = Math.floor(frequencyData.length * 0.1)
  const midEnd = Math.floor(frequencyData.length * 0.4)
  const highEnd = Math.floor(frequencyData.length * 0.8)

  let lowSum = 0
  let midSum = 0
  let highSum = 0

  for (let i = 0; i < lowEnd; i++) {
    lowSum += frequencyData[i]
  }
  for (let i = lowEnd; i < midEnd; i++) {
    midSum += frequencyData[i]
  }
  for (let i = midEnd; i < highEnd; i++) {
    highSum += frequencyData[i]
  }

  const low = lowSum / lowEnd
  const mid = midSum / (midEnd - lowEnd)
  const high = highSum / (highEnd - midEnd)
  const total = low + mid + high

  return {
    low: total > 0 ? low / total : 0,
    mid: total > 0 ? mid / total : 0,
    high: total > 0 ? high / total : 0,
    total: total / (255 * 3), // Normalize to 0-1
  }
}

/**
 * Detect if audio contains speech based on frequency characteristics
 */
export function detectSpeech(
  frequencyData: Uint8Array,
  timeData: Uint8Array,
  threshold: number = 0.02
): boolean {
  const volume = calculateVolume(calculateRMS(timeData))
  if (volume < threshold) return false

  // Speech typically has energy in mid frequencies
  const bands = analyzeFrequencyBands(frequencyData)
  return bands.mid > 0.3 && bands.total > 0.1
}

/**
 * Calculate zero crossing rate (useful for speech detection)
 */
export function calculateZeroCrossingRate(timeData: Uint8Array): number {
  let crossings = 0
  for (let i = 1; i < timeData.length; i++) {
    const prev = timeData[i - 1] - 128
    const curr = timeData[i] - 128
    if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
      crossings++
    }
  }
  return crossings / timeData.length
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(metrics: PerformanceMetrics): string {
  return `
FPS: ${metrics.fps.toFixed(1)}
Analysis: ${metrics.analysisTime.toFixed(2)}ms
Render: ${metrics.renderTime.toFixed(2)}ms
Memory: ${metrics.memoryUsage.toFixed(1)}MB
Blend Shapes: ${metrics.activeBlendShapes}
  `.trim()
}

/**
 * Create debug info object
 */
export function createDebugInfo(
  viseme: string,
  weights: VisemeWeights,
  volume: number,
  isSpeaking: boolean,
  frequencyData: Uint8Array,
  timeData: Uint8Array,
  performance: Partial<PerformanceMetrics>
): DebugInfo {
  return {
    viseme: viseme as any,
    weights,
    volume,
    isSpeaking,
    frequencyData: Array.from(frequencyData),
    timeDomainData: Array.from(timeData),
    performance,
  }
}

/**
 * Export debug info as JSON
 */
export function exportDebugInfo(debugInfo: DebugInfo): string {
  return JSON.stringify(debugInfo, null, 2)
}

/**
 * Download debug info as file
 */
export function downloadDebugInfo(debugInfo: DebugInfo, filename: string = 'lipsync-debug.json'): void {
  const json = exportDebugInfo(debugInfo)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private analysisTime = 0
  private renderTime = 0

  reset(): void {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 60
    this.analysisTime = 0
    this.renderTime = 0
  }

  startFrame(): void {
    this.frameCount++
  }

  endFrame(): void {
    const now = performance.now()
    const delta = now - this.lastTime

    if (delta >= 1000) {
      this.fps = (this.frameCount * 1000) / delta
      this.frameCount = 0
      this.lastTime = now
    }
  }

  recordAnalysisTime(time: number): void {
    this.analysisTime = time
  }

  recordRenderTime(time: number): void {
    this.renderTime = time
  }

  getMetrics(): PerformanceMetrics {
    const memory = (performance as any).memory
    return {
      fps: this.fps,
      analysisTime: this.analysisTime,
      renderTime: this.renderTime,
      memoryUsage: memory ? memory.usedJSHeapSize / 1024 / 1024 : 0,
      activeBlendShapes: 0, // Set externally
    }
  }
}

/**
 * Audio buffer recorder for debugging
 */
export class AudioBufferRecorder {
  private buffers: Float32Array[] = []
  private maxBuffers: number
  private isRecording = false

  constructor(maxBuffers: number = 60) {
    this.maxBuffers = maxBuffers
  }

  start(): void {
    this.isRecording = true
    this.buffers = []
  }

  stop(): void {
    this.isRecording = false
  }

  record(data: Uint8Array): void {
    if (!this.isRecording) return

    const floatData = new Float32Array(data.length)
    for (let i = 0; i < data.length; i++) {
      floatData[i] = (data[i] - 128) / 128
    }

    this.buffers.push(floatData)

    if (this.buffers.length > this.maxBuffers) {
      this.buffers.shift()
    }
  }

  getBuffers(): Float32Array[] {
    return this.buffers
  }

  export(): ArrayBuffer {
    const totalLength = this.buffers.reduce((sum, buf) => sum + buf.length, 0)
    const result = new Float32Array(totalLength)
    let offset = 0

    for (const buffer of this.buffers) {
      result.set(buffer, offset)
      offset += buffer.length
    }

    return result.buffer
  }

  downloadWAV(filename: string = 'lipsync-audio.wav'): void {
    const audioData = this.export()
    const wav = this.encodeWAV(new Float32Array(audioData), 48000)
    const blob = new Blob([wav], { type: 'audio/wav' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  private encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)

    // Write samples
    let offset = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
      offset += 2
    }

    return buffer
  }
}

/**
 * Viseme transition tracker
 */
export class VisemeTransitionTracker {
  private transitions: Array<{ from: string; to: string; timestamp: number }> = []
  private maxTransitions: number

  constructor(maxTransitions: number = 100) {
    this.maxTransitions = maxTransitions
  }

  track(from: string, to: string): void {
    if (from === to) return

    this.transitions.push({
      from,
      to,
      timestamp: performance.now(),
    })

    if (this.transitions.length > this.maxTransitions) {
      this.transitions.shift()
    }
  }

  getTransitions(): Array<{ from: string; to: string; timestamp: number }> {
    return this.transitions
  }

  getTransitionCount(): number {
    return this.transitions.length
  }

  getAverageTransitionRate(): number {
    if (this.transitions.length < 2) return 0

    const first = this.transitions[0].timestamp
    const last = this.transitions[this.transitions.length - 1].timestamp
    const duration = (last - first) / 1000 // seconds

    return this.transitions.length / duration
  }

  export(): string {
    return JSON.stringify(this.transitions, null, 2)
  }

  clear(): void {
    this.transitions = []
  }
}

/**
 * Check browser support for required APIs
 */
export function checkBrowserSupport(): {
  webAudio: boolean
  mediaStream: boolean
  morphTargets: boolean
  webGL: boolean
  overall: boolean
} {
  const webAudio = !!(window.AudioContext || (window as any).webkitAudioContext)
  const mediaStream = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  const webGL = (() => {
    try {
      const canvas = document.createElement('canvas')
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    } catch (e) {
      return false
    }
  })()
  const morphTargets = true // Assume Three.js support

  return {
    webAudio,
    mediaStream,
    morphTargets,
    webGL,
    overall: webAudio && webGL && morphTargets,
  }
}

/**
 * Get recommended configuration based on device
 */
export function getRecommendedConfig(): {
  fftSize: number
  updateInterval: number
  enableIdleAnimations: boolean
} {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  const memory = (navigator as any).deviceMemory || 4
  const cores = navigator.hardwareConcurrency || 4

  if (isMobile || memory < 4 || cores < 4) {
    return {
      fftSize: 512,
      updateInterval: 50,
      enableIdleAnimations: false,
    }
  }

  return {
    fftSize: 2048,
    updateInterval: 16,
    enableIdleAnimations: true,
  }
}

/**
 * Log system info for debugging
 */
export function logSystemInfo(): void {
  const support = checkBrowserSupport()
  const config = getRecommendedConfig()

  console.group('🎤 Advanced Lip Sync - System Info')
  console.log('Browser Support:', support)
  console.log('User Agent:', navigator.userAgent)
  console.log('Device Memory:', (navigator as any).deviceMemory || 'Unknown')
  console.log('Hardware Concurrency:', navigator.hardwareConcurrency || 'Unknown')
  console.log('Recommended Config:', config)
  console.groupEnd()
}

/**
 * Example usage in React component:
 *
 * import { PerformanceMonitor, VisemeTransitionTracker, logSystemInfo } from './AdvancedLipSync.utils'
 *
 * // Log system info on mount
 * useEffect(() => {
 *   logSystemInfo()
 * }, [])
 *
 * // Track performance
 * const perfMonitor = useRef(new PerformanceMonitor())
 * useFrame(() => {
 *   perfMonitor.current.startFrame()
 *   // ... render code
 *   perfMonitor.current.endFrame()
 *   console.log(perfMonitor.current.getMetrics())
 * })
 *
 * // Track viseme transitions
 * const transitionTracker = useRef(new VisemeTransitionTracker())
 * const lipSync = useAdvancedLipSync({
 *   onVisemeChange: (from, to) => {
 *     transitionTracker.current.track(from, to)
 *   }
 * })
 */
