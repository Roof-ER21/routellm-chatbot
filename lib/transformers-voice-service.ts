/**
 * Transformers.js Voice Service
 *
 * Browser-based Speech-to-Text using Hugging Face Transformers.js
 * Optimized for iPhone/iPad Safari with progressive loading and caching
 *
 * Key Features:
 * - Runs entirely in browser (no API costs, privacy-first)
 * - Offline capable after initial model load
 * - WebGPU/WebAssembly acceleration
 * - IndexedDB caching for instant subsequent loads
 * - Whisper-tiny model (~75MB) for mobile optimization
 */

import { pipeline, type PipelineType } from '@huggingface/transformers';

export type WhisperModelSize = 'tiny' | 'base' | 'small';
export type TransformersVoiceStatus = 'idle' | 'loading' | 'ready' | 'transcribing' | 'error';

export interface TransformersVoiceConfig {
  modelSize?: WhisperModelSize;
  language?: string;
  task?: 'transcribe' | 'translate';
  progressCallback?: (progress: { status: string; file?: string; progress?: number; loaded?: number; total?: number }) => void;
}

export interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number | null];
  }>;
  language?: string;
}

class TransformersVoiceService {
  private transcriber: any = null;
  private status: TransformersVoiceStatus = 'idle';
  private modelSize: WhisperModelSize = 'tiny';
  private progressCallback?: (progress: any) => void;

  /**
   * Model sizes and their characteristics
   */
  private static readonly MODEL_SIZES = {
    tiny: {
      model: 'Xenova/whisper-tiny',
      size: '75MB',
      speed: 'Fast',
      quality: 'Good for clear speech',
      recommended: 'Default for mobile'
    },
    base: {
      model: 'Xenova/whisper-base',
      size: '140MB',
      speed: 'Medium',
      quality: 'Better accuracy',
      recommended: 'Good WiFi connection'
    },
    small: {
      model: 'Xenova/whisper-small',
      size: '470MB',
      speed: 'Slower',
      quality: 'Best for noisy environments',
      recommended: 'Desktop or high-speed connection'
    }
  };

  constructor(config: TransformersVoiceConfig = {}) {
    this.modelSize = config.modelSize || 'tiny';
    this.progressCallback = config.progressCallback;
  }

  /**
   * Initialize the Transformers.js pipeline
   * Loads model and caches in IndexedDB for future use
   */
  async initialize(): Promise<void> {
    if (this.status === 'ready') {
      console.log('[TransformersVoice] Already initialized');
      return;
    }

    if (this.status === 'loading') {
      console.log('[TransformersVoice] Already loading...');
      return;
    }

    try {
      this.status = 'loading';
      const modelName = TransformersVoiceService.MODEL_SIZES[this.modelSize].model;

      console.log(`[TransformersVoice] Loading model: ${modelName}`);
      console.log(`[TransformersVoice] Expected size: ${TransformersVoiceService.MODEL_SIZES[this.modelSize].size}`);

      // Create transcription pipeline with progress tracking
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        modelName,
        {
          progress_callback: (progress: any) => {
            console.log('[TransformersVoice] Load progress:', progress);
            if (this.progressCallback) {
              this.progressCallback(progress);
            }
          }
        }
      );

      this.status = 'ready';
      console.log('[TransformersVoice] Model loaded and ready!');
    } catch (error) {
      this.status = 'error';
      console.error('[TransformersVoice] Failed to initialize:', error);
      throw new Error(`Failed to load Transformers.js model: ${error}`);
    }
  }

  /**
   * Transcribe audio from various sources
   * @param audio - Audio data (File, Blob, ArrayBuffer, or URL)
   * @param options - Transcription options
   */
  async transcribe(
    audio: File | Blob | ArrayBuffer | string,
    options: {
      language?: string;
      task?: 'transcribe' | 'translate';
      return_timestamps?: boolean;
      chunk_length_s?: number;
      stride_length_s?: number;
    } = {}
  ): Promise<TranscriptionResult> {
    if (this.status !== 'ready') {
      throw new Error('Transcriber not initialized. Call initialize() first.');
    }

    try {
      this.status = 'transcribing';
      console.log('[TransformersVoice] Starting transcription...');

      // Convert audio to format Transformers.js expects
      let audioData: any;
      if (audio instanceof File || audio instanceof Blob) {
        audioData = await audio.arrayBuffer();
      } else if (typeof audio === 'string') {
        // Assume it's a URL
        const response = await fetch(audio);
        audioData = await response.arrayBuffer();
      } else {
        audioData = audio;
      }

      // Transcribe with options
      const result = await this.transcriber(audioData, {
        language: options.language || 'english',
        task: options.task || 'transcribe',
        return_timestamps: options.return_timestamps || false,
        chunk_length_s: options.chunk_length_s || 30,
        stride_length_s: options.stride_length_s || 5,
      });

      this.status = 'ready';
      console.log('[TransformersVoice] Transcription complete:', result);

      return {
        text: result.text,
        chunks: result.chunks,
        language: options.language
      };
    } catch (error) {
      this.status = 'ready'; // Reset to ready for retry
      console.error('[TransformersVoice] Transcription error:', error);
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  /**
   * Transcribe audio from MediaRecorder stream (real-time recording)
   * Optimized for iPhone/iPad Safari with chunked recording
   */
  async transcribeRecording(audioBlob: Blob): Promise<TranscriptionResult> {
    console.log('[TransformersVoice] Transcribing recorded audio:', {
      size: audioBlob.size,
      type: audioBlob.type
    });

    return this.transcribe(audioBlob, {
      return_timestamps: false, // Faster for real-time use
      chunk_length_s: 30,
      stride_length_s: 5
    });
  }

  /**
   * Check if browser supports Transformers.js
   */
  static isSupported(): boolean {
    // Check for required APIs
    const hasWebAssembly = typeof WebAssembly !== 'undefined';
    const hasIndexedDB = typeof indexedDB !== 'undefined';
    const hasWorker = typeof Worker !== 'undefined';

    return hasWebAssembly && hasIndexedDB && hasWorker;
  }

  /**
   * Estimate model download size and time
   */
  static getModelInfo(modelSize: WhisperModelSize = 'tiny') {
    return TransformersVoiceService.MODEL_SIZES[modelSize];
  }

  /**
   * Check if model is cached in IndexedDB
   */
  static async isModelCached(modelSize: WhisperModelSize = 'tiny'): Promise<boolean> {
    try {
      // Try to open IndexedDB used by Transformers.js
      const modelName = TransformersVoiceService.MODEL_SIZES[modelSize].model;

      // Transformers.js uses a specific cache key pattern
      // This is a heuristic check - not 100% accurate
      const cacheExists = await caches.has('transformers-cache');

      if (!cacheExists) return false;

      const cache = await caches.open('transformers-cache');
      const keys = await cache.keys();

      // Check if any cached file matches our model
      return keys.some(request => request.url.includes(modelName.replace('/', '-')));
    } catch (error) {
      console.warn('[TransformersVoice] Could not check cache:', error);
      return false;
    }
  }

  /**
   * Clear cached models to free up space
   */
  static async clearCache(): Promise<void> {
    try {
      const deleted = await caches.delete('transformers-cache');
      console.log('[TransformersVoice] Cache cleared:', deleted);
    } catch (error) {
      console.error('[TransformersVoice] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Get current status
   */
  getStatus(): TransformersVoiceStatus {
    return this.status;
  }

  /**
   * Check if service is ready to transcribe
   */
  isReady(): boolean {
    return this.status === 'ready';
  }

  /**
   * Get current model size
   */
  getModelSize(): WhisperModelSize {
    return this.modelSize;
  }

  /**
   * Dispose of the transcriber and free memory
   */
  dispose(): void {
    if (this.transcriber) {
      this.transcriber = null;
      this.status = 'idle';
      console.log('[TransformersVoice] Disposed');
    }
  }
}

// Singleton instance for global use
let globalTransformersVoice: TransformersVoiceService | null = null;

/**
 * Get or create global Transformers.js voice service instance
 */
export function getTransformersVoiceService(config?: TransformersVoiceConfig): TransformersVoiceService {
  if (!globalTransformersVoice) {
    globalTransformersVoice = new TransformersVoiceService(config);
  }
  return globalTransformersVoice;
}

/**
 * Reset global instance (useful for testing or config changes)
 */
export function resetTransformersVoiceService(): void {
  if (globalTransformersVoice) {
    globalTransformersVoice.dispose();
    globalTransformersVoice = null;
  }
}

export default TransformersVoiceService;
