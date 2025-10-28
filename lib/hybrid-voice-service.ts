/**
 * Hybrid Voice Service
 *
 * Intelligent combination of Web Speech API and Transformers.js
 * Optimized for iPhone/iPad with automatic fallback cascade
 *
 * Strategy:
 * 1. Web Speech API (Primary) - Fast, native, real-time
 * 2. Transformers.js (Fallback) - Offline, accurate, privacy-first
 * 3. Progressive enhancement - Load Transformers.js in background
 *
 * Use Cases:
 * - Real-time speech: Web Speech API (faster)
 * - Audio file uploads: Transformers.js (better accuracy)
 * - Offline mode: Transformers.js only
 * - Validation: Cross-check both transcriptions
 */

import {
  getTransformersVoiceService,
  type WhisperModelSize,
  type TranscriptionResult,
  type TransformersVoiceStatus
} from './transformers-voice-service';

export type VoiceServiceType = 'web-speech' | 'transformers' | 'hybrid';
export type VoiceServiceMode = 'real-time' | 'file-upload' | 'offline' | 'validation';

export interface HybridVoiceConfig {
  preferTransformers?: boolean;
  modelSize?: WhisperModelSize;
  preloadTransformers?: boolean;
  enableValidation?: boolean;
  onTransformersReady?: () => void;
  onProgressUpdate?: (progress: any) => void;
}

export interface VoiceServiceCapabilities {
  webSpeechAvailable: boolean;
  transformersAvailable: boolean;
  offlineCapable: boolean;
  recommendedMode: VoiceServiceType;
}

export interface HybridTranscriptionResult extends TranscriptionResult {
  source: VoiceServiceType;
  confidence?: number;
  validatedWith?: VoiceServiceType;
  validationMatch?: boolean;
}

class HybridVoiceService {
  private config: HybridVoiceConfig;
  private transformersService: any = null;
  private transformersReady = false;
  private webSpeechSupported = false;
  private recognition: any = null;

  constructor(config: HybridVoiceConfig = {}) {
    this.config = {
      preferTransformers: false, // Default: prefer Web Speech for speed
      modelSize: 'tiny',
      preloadTransformers: true, // Load Transformers.js in background
      enableValidation: false,
      ...config
    };

    this.checkCapabilities();

    // Preload Transformers.js if enabled
    if (this.config.preloadTransformers) {
      this.initializeTransformers();
    }
  }

  /**
   * Check what voice technologies are available
   */
  private checkCapabilities(): VoiceServiceCapabilities {
    // Check Web Speech API
    this.webSpeechSupported =
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    // Check Transformers.js support
    const transformersSupported =
      typeof WebAssembly !== 'undefined' &&
      typeof indexedDB !== 'undefined' &&
      typeof Worker !== 'undefined';

    console.log('[HybridVoice] Capabilities:', {
      webSpeech: this.webSpeechSupported,
      transformers: transformersSupported,
      offline: transformersSupported
    });

    return {
      webSpeechAvailable: this.webSpeechSupported,
      transformersAvailable: transformersSupported,
      offlineCapable: transformersSupported,
      recommendedMode: this.getRecommendedMode()
    };
  }

  /**
   * Get recommended voice service based on capabilities
   */
  private getRecommendedMode(): VoiceServiceType {
    // If offline, must use Transformers.js
    if (!navigator.onLine) {
      return 'transformers';
    }

    // If user prefers Transformers.js
    if (this.config.preferTransformers) {
      return 'transformers';
    }

    // If Web Speech available, use hybrid (Web Speech primary, Transformers.js backup)
    if (this.webSpeechSupported) {
      return 'hybrid';
    }

    // Fallback to Transformers.js
    return 'transformers';
  }

  /**
   * Initialize Transformers.js in background
   */
  private async initializeTransformers(): Promise<void> {
    try {
      console.log('[HybridVoice] Initializing Transformers.js...');

      this.transformersService = getTransformersVoiceService({
        modelSize: this.config.modelSize,
        progressCallback: this.config.onProgressUpdate
      });

      await this.transformersService.initialize();

      this.transformersReady = true;
      console.log('[HybridVoice] Transformers.js ready!');

      if (this.config.onTransformersReady) {
        this.config.onTransformersReady();
      }
    } catch (error) {
      console.error('[HybridVoice] Failed to initialize Transformers.js:', error);
      this.transformersReady = false;
    }
  }

  /**
   * Ensure Transformers.js is initialized
   */
  async ensureTransformersReady(): Promise<void> {
    if (this.transformersReady) return;

    if (!this.transformersService) {
      await this.initializeTransformers();
    } else {
      // Wait for initialization to complete
      while (!this.transformersReady && this.transformersService.getStatus() === 'loading') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * Start real-time speech recognition
   * Uses Web Speech API for speed, Transformers.js as fallback
   */
  startRealTimeRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: Error) => void
  ): void {
    // Prefer Web Speech API for real-time (faster)
    if (this.webSpeechSupported && !this.config.preferTransformers) {
      this.startWebSpeechRecognition(onResult, onError);
    } else {
      // Fallback to Transformers.js (requires manual recording)
      console.log('[HybridVoice] Web Speech not available, use transcribeRecording() instead');
      if (onError) {
        onError(new Error('Real-time recognition requires Web Speech API. Use transcribeRecording() with Transformers.js.'));
      }
    }
  }

  /**
   * Start Web Speech API recognition
   */
  private startWebSpeechRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: Error) => void
  ): void {
    try {
      // @ts-ignore - webkit prefix
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          onResult(transcript, isFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('[HybridVoice] Web Speech error:', event.error);
        if (onError) {
          onError(new Error(`Web Speech error: ${event.error}`));
        }
      };

      this.recognition.start();
      console.log('[HybridVoice] Web Speech recognition started');
    } catch (error) {
      console.error('[HybridVoice] Failed to start Web Speech:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  }

  /**
   * Stop real-time speech recognition
   */
  stopRealTimeRecognition(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
      console.log('[HybridVoice] Recognition stopped');
    }
  }

  /**
   * Transcribe recorded audio using Transformers.js
   * Best for audio files, offline mode, or when accuracy is critical
   */
  async transcribeRecording(audioBlob: Blob): Promise<HybridTranscriptionResult> {
    await this.ensureTransformersReady();

    if (!this.transformersReady) {
      throw new Error('Transformers.js not available. Cannot transcribe audio.');
    }

    const result = await this.transformersService.transcribeRecording(audioBlob);

    return {
      ...result,
      source: 'transformers'
    };
  }

  /**
   * Transcribe audio file with optional validation
   * If validation enabled, transcribes with both methods and compares
   */
  async transcribeAudioFile(
    audio: File | Blob | ArrayBuffer | string
  ): Promise<HybridTranscriptionResult> {
    await this.ensureTransformersReady();

    if (!this.transformersReady) {
      throw new Error('Transformers.js not available. Cannot transcribe audio.');
    }

    const transformersResult = await this.transformersService.transcribe(audio);

    // If validation enabled and Web Speech available, cross-check
    if (this.config.enableValidation && this.webSpeechSupported) {
      // TODO: Implement Web Speech validation for audio files
      // This would require playing audio back through speakers (not ideal)
      console.log('[HybridVoice] Validation with Web Speech not implemented for file uploads');
    }

    return {
      ...transformersResult,
      source: 'transformers'
    };
  }

  /**
   * Get current service capabilities
   */
  getCapabilities(): VoiceServiceCapabilities {
    return this.checkCapabilities();
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    const mode = this.getRecommendedMode();

    if (mode === 'web-speech') {
      return this.webSpeechSupported;
    } else if (mode === 'transformers') {
      return this.transformersReady;
    } else { // hybrid
      return this.webSpeechSupported || this.transformersReady;
    }
  }

  /**
   * Get Transformers.js loading status
   */
  getTransformersStatus(): TransformersVoiceStatus {
    return this.transformersService?.getStatus() || 'idle';
  }

  /**
   * Check if Transformers.js model is cached
   */
  async isTransformersModelCached(): Promise<boolean> {
    const TransformersVoiceService = (await import('./transformers-voice-service')).default;
    return TransformersVoiceService.isModelCached(this.config.modelSize);
  }

  /**
   * Manually trigger Transformers.js initialization
   */
  async initializeTransformersManually(): Promise<void> {
    if (!this.transformersReady) {
      await this.initializeTransformers();
    }
  }

  /**
   * Switch to Transformers.js mode
   */
  async switchToTransformersMode(): Promise<void> {
    this.config.preferTransformers = true;
    await this.ensureTransformersReady();
  }

  /**
   * Switch to Web Speech mode
   */
  switchToWebSpeechMode(): void {
    this.config.preferTransformers = false;
  }

  /**
   * Get recommended mode for specific use case
   */
  getRecommendedModeForUseCase(mode: VoiceServiceMode): VoiceServiceType {
    switch (mode) {
      case 'real-time':
        return this.webSpeechSupported ? 'web-speech' : 'transformers';
      case 'file-upload':
        return 'transformers';
      case 'offline':
        return 'transformers';
      case 'validation':
        return 'hybrid';
      default:
        return this.getRecommendedMode();
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopRealTimeRecognition();

    if (this.transformersService) {
      this.transformersService.dispose();
      this.transformersService = null;
    }

    this.transformersReady = false;
    console.log('[HybridVoice] Disposed');
  }
}

// Singleton instance
let globalHybridVoice: HybridVoiceService | null = null;

/**
 * Get or create global hybrid voice service
 */
export function getHybridVoiceService(config?: HybridVoiceConfig): HybridVoiceService {
  if (!globalHybridVoice) {
    globalHybridVoice = new HybridVoiceService(config);
  }
  return globalHybridVoice;
}

/**
 * Reset global instance
 */
export function resetHybridVoiceService(): void {
  if (globalHybridVoice) {
    globalHybridVoice.dispose();
    globalHybridVoice = null;
  }
}

export default HybridVoiceService;
