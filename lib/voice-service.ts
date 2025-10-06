/**
 * Voice Service for Susan 21
 * Provides Web Speech API integration for iOS Safari compatibility
 *
 * Features:
 * - Speech Recognition (voice-to-text)
 * - Speech Synthesis (text-to-voice)
 * - iOS Safari optimized
 * - Hands-free mode support
 */

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      prototype: SpeechRecognition;
      new(): SpeechRecognition;
    };
  }
}

export interface VoiceServiceConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface RecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SynthesisConfig {
  voice?: SpeechSynthesisVoice;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isSupported: boolean = false;
  private isSynthesisSupported: boolean = false;

  constructor() {
    this.checkSupport();
  }

  /**
   * Check if speech recognition and synthesis are supported
   */
  private checkSupport(): void {
    // Check Speech Recognition support (iOS Safari supports webkitSpeechRecognition)
    this.isSupported = !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );

    // Check Speech Synthesis support
    this.isSynthesisSupported = !!(
      typeof window !== 'undefined' &&
      window.speechSynthesis
    );

    if (this.isSynthesisSupported) {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Initialize speech recognition
   */
  public initializeRecognition(config: VoiceServiceConfig = {}): SpeechRecognition | null {
    if (!this.isSupported) {
      console.warn('Speech recognition not supported in this browser');
      return null;
    }

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognitionAPI();

      // Configure recognition
      this.recognition.continuous = config.continuous ?? false;
      this.recognition.interimResults = config.interimResults ?? true;
      this.recognition.lang = config.language ?? 'en-US';
      this.recognition.maxAlternatives = config.maxAlternatives ?? 1;

      return this.recognition;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      return null;
    }
  }

  /**
   * Get available voices for synthesis
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isSynthesisSupported || !this.synthesis) {
      return [];
    }

    return this.synthesis.getVoices();
  }

  /**
   * Get the best voice for iOS (prefer Samantha or default US English female voice)
   */
  public getBestVoice(preferredLang: string = 'en-US'): SpeechSynthesisVoice | null {
    const voices = this.getAvailableVoices();

    if (voices.length === 0) {
      return null;
    }

    // Priority order for iOS voices
    const priorities = [
      'Samantha',           // iOS default high-quality voice
      'Karen',              // iOS female voice
      'Moira',              // iOS female voice (Irish accent)
      'Tessa',              // iOS female voice (South African)
      'Google US English',  // Google voice
    ];

    // Try to find prioritized voices
    for (const priority of priorities) {
      const voice = voices.find(v =>
        v.name.includes(priority) && v.lang.startsWith(preferredLang.split('-')[0])
      );
      if (voice) return voice;
    }

    // Fallback to any voice matching the language
    const langVoice = voices.find(v => v.lang === preferredLang);
    if (langVoice) return langVoice;

    // Final fallback to first English voice
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Ultimate fallback
    return voices[0];
  }

  /**
   * Speak text using speech synthesis
   */
  public speak(
    text: string,
    config: SynthesisConfig = {},
    callbacks?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: Event) => void;
    }
  ): void {
    if (!this.isSynthesisSupported || !this.synthesis) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure utterance
    utterance.voice = config.voice ?? this.getBestVoice();
    utterance.rate = config.rate ?? 1.0;
    utterance.pitch = config.pitch ?? 1.0;
    utterance.volume = config.volume ?? 1.0;

    // Set up callbacks
    if (callbacks?.onStart) {
      utterance.onstart = callbacks.onStart;
    }

    if (callbacks?.onEnd) {
      utterance.onend = callbacks.onEnd;
    }

    if (callbacks?.onError) {
      utterance.onerror = callbacks.onError;
    }

    // Speak
    this.synthesis.speak(utterance);
  }

  /**
   * Stop speech synthesis
   */
  public stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * Pause speech synthesis
   */
  public pauseSpeaking(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume speech synthesis
   */
  public resumeSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if speech recognition is supported
   */
  public isRecognitionSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Check if speech synthesis is supported
   */
  public isSynthesisAvailable(): boolean {
    return this.isSynthesisSupported;
  }

  /**
   * Request microphone permission (iOS Safari requires user gesture)
   */
  public async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  /**
   * Load voices (needed for iOS - voices load asynchronously)
   */
  public loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      if (!this.isSynthesisSupported || !this.synthesis) {
        resolve([]);
        return;
      }

      const voices = this.synthesis.getVoices();

      if (voices.length > 0) {
        resolve(voices);
        return;
      }

      // Wait for voices to load (iOS requirement)
      this.synthesis.onvoiceschanged = () => {
        const loadedVoices = this.synthesis!.getVoices();
        resolve(loadedVoices);
      };

      // Timeout fallback
      setTimeout(() => {
        resolve(this.synthesis!.getVoices());
      }, 1000);
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.recognition = null;
    }

    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Export singleton instance
export const voiceService = new VoiceService();
