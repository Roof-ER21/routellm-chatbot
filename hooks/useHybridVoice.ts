/**
 * useHybridVoice Hook
 *
 * React hook for hybrid voice recognition (Web Speech API + Transformers.js)
 * Optimized for iPhone/iPad Safari with automatic fallback
 *
 * Features:
 * - Progressive enhancement (Web Speech → Transformers.js)
 * - Automatic fallback cascade
 * - Loading state management
 * - Error handling
 * - MediaRecorder integration for iPhone
 *
 * Usage:
 * ```tsx
 * const {
 *   isListening,
 *   transcript,
 *   startListening,
 *   stopListening,
 *   transcribeFile,
 *   capabilities,
 *   isReady
 * } = useHybridVoice();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHybridVoiceService,
  type HybridVoiceConfig,
  type VoiceServiceCapabilities,
  type HybridTranscriptionResult,
  type VoiceServiceType
} from '../lib/hybrid-voice-service';
import type { TransformersVoiceStatus } from '../lib/transformers-voice-service';

export interface UseHybridVoiceOptions extends HybridVoiceConfig {
  autoInitialize?: boolean;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export interface UseHybridVoiceReturn {
  // State
  isListening: boolean;
  isReady: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  error: Error | null;

  // Status
  capabilities: VoiceServiceCapabilities | null;
  transformersStatus: TransformersVoiceStatus;
  currentMode: VoiceServiceType;
  isTransformersReady: boolean;
  isModelCached: boolean;
  loadingProgress: any;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  transcribeFile: (file: File | Blob) => Promise<HybridTranscriptionResult>;
  transcribeRecording: (audioBlob: Blob) => Promise<HybridTranscriptionResult>;
  initializeTransformers: () => Promise<void>;
  switchToTransformers: () => Promise<void>;
  switchToWebSpeech: () => void;
  clearTranscript: () => void;
  checkModelCache: () => Promise<void>;

  // Recording (for iPhone/iPad)
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<HybridTranscriptionResult | null>;
}

export function useHybridVoice(options: UseHybridVoiceOptions = {}): UseHybridVoiceReturn {
  const {
    autoInitialize = true,
    onTranscript,
    onError,
    ...serviceConfig
  } = options;

  // Service instance ref
  const serviceRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // State
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [capabilities, setCapabilities] = useState<VoiceServiceCapabilities | null>(null);
  const [transformersStatus, setTransformersStatus] = useState<TransformersVoiceStatus>('idle');
  const [currentMode, setCurrentMode] = useState<VoiceServiceType>('hybrid');
  const [isTransformersReady, setIsTransformersReady] = useState(false);
  const [isModelCached, setIsModelCached] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<any>(null);

  // Initialize service
  useEffect(() => {
    const initService = async () => {
      try {
        serviceRef.current = getHybridVoiceService({
          ...serviceConfig,
          onTransformersReady: () => {
            setIsTransformersReady(true);
            setIsReady(true);
            console.log('[useHybridVoice] Transformers.js ready!');
          },
          onProgressUpdate: (progress) => {
            setLoadingProgress(progress);
            console.log('[useHybridVoice] Loading progress:', progress);
          }
        });

        const caps = serviceRef.current.getCapabilities();
        setCapabilities(caps);
        setCurrentMode(caps.recommendedMode);

        // Check if service is ready
        const ready = serviceRef.current.isReady();
        setIsReady(ready);

        // Check Transformers.js status
        const status = serviceRef.current.getTransformersStatus();
        setTransformersStatus(status);
        setIsTransformersReady(status === 'ready');

        // Check if model is cached
        if (autoInitialize) {
          await checkModelCache();
        }

        console.log('[useHybridVoice] Service initialized:', { caps, ready, status });
      } catch (err) {
        console.error('[useHybridVoice] Initialization error:', err);
        setError(err as Error);
        if (onError) onError(err as Error);
      }
    };

    initService();

    return () => {
      if (serviceRef.current) {
        serviceRef.current.dispose();
      }
    };
  }, [autoInitialize]);

  // Check if model is cached
  const checkModelCache = useCallback(async () => {
    try {
      if (serviceRef.current) {
        const cached = await serviceRef.current.isTransformersModelCached();
        setIsModelCached(cached);
        console.log('[useHybridVoice] Model cached:', cached);
      }
    } catch (err) {
      console.warn('[useHybridVoice] Could not check model cache:', err);
    }
  }, []);

  // Start listening (real-time with Web Speech API)
  const startListening = useCallback(() => {
    if (!serviceRef.current) {
      const err = new Error('Service not initialized');
      setError(err);
      if (onError) onError(err);
      return;
    }

    try {
      setError(null);
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');

      serviceRef.current.startRealTimeRecognition(
        (text: string, isFinal: boolean) => {
          if (isFinal) {
            setFinalTranscript(prev => prev + ' ' + text);
            setTranscript(prev => prev + ' ' + text);
            setInterimTranscript('');
          } else {
            setInterimTranscript(text);
            setTranscript(finalTranscript + ' ' + text);
          }

          if (onTranscript) {
            onTranscript(text, isFinal);
          }
        },
        (err: Error) => {
          console.error('[useHybridVoice] Recognition error:', err);
          setError(err);
          setIsListening(false);
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.error('[useHybridVoice] Failed to start listening:', err);
      setError(err as Error);
      setIsListening(false);
      if (onError) onError(err as Error);
    }
  }, [finalTranscript, onTranscript, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopRealTimeRecognition();
      setIsListening(false);
    }
  }, []);

  // Start recording (for Transformers.js transcription on iPhone)
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // iPhone Safari requires specific MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // iPhone Safari optimization: chunk every 500ms
      mediaRecorder.start(500);
      setIsRecording(true);

      console.log('[useHybridVoice] Recording started with', mimeType);
    } catch (err) {
      console.error('[useHybridVoice] Failed to start recording:', err);
      setError(err as Error);
      if (onError) onError(err as Error);
    }
  }, [onError]);

  // Stop recording and transcribe
  const stopRecording = useCallback(async (): Promise<HybridTranscriptionResult | null> => {
    if (!mediaRecorderRef.current || !isRecording) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mediaRecorder.mimeType
          });

          console.log('[useHybridVoice] Recording stopped, transcribing...', {
            size: audioBlob.size,
            type: audioBlob.type
          });

          // Transcribe with Transformers.js
          const result = await transcribeRecording(audioBlob);

          // Update transcript
          setFinalTranscript(prev => prev + ' ' + result.text);
          setTranscript(prev => prev + ' ' + result.text);

          if (onTranscript) {
            onTranscript(result.text, true);
          }

          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());

          resolve(result);
        } catch (err) {
          console.error('[useHybridVoice] Transcription error:', err);
          setError(err as Error);
          if (onError) onError(err as Error);
          reject(err);
        } finally {
          setIsRecording(false);
          audioChunksRef.current = [];
          mediaRecorderRef.current = null;
        }
      };

      mediaRecorder.stop();
    });
  }, [isRecording, onTranscript, onError]);

  // Transcribe audio file
  const transcribeFile = useCallback(async (file: File | Blob): Promise<HybridTranscriptionResult> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    try {
      setError(null);
      const result = await serviceRef.current.transcribeAudioFile(file);
      console.log('[useHybridVoice] File transcribed:', result);
      return result;
    } catch (err) {
      console.error('[useHybridVoice] File transcription error:', err);
      setError(err as Error);
      if (onError) onError(err as Error);
      throw err;
    }
  }, [onError]);

  // Transcribe recording
  const transcribeRecording = useCallback(async (audioBlob: Blob): Promise<HybridTranscriptionResult> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    try {
      setError(null);
      const result = await serviceRef.current.transcribeRecording(audioBlob);
      console.log('[useHybridVoice] Recording transcribed:', result);
      return result;
    } catch (err) {
      console.error('[useHybridVoice] Recording transcription error:', err);
      setError(err as Error);
      if (onError) onError(err as Error);
      throw err;
    }
  }, [onError]);

  // Initialize Transformers.js manually
  const initializeTransformers = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    try {
      setError(null);
      await serviceRef.current.initializeTransformersManually();
      setIsTransformersReady(true);
      setIsReady(true);
      await checkModelCache();
    } catch (err) {
      console.error('[useHybridVoice] Failed to initialize Transformers.js:', err);
      setError(err as Error);
      if (onError) onError(err as Error);
      throw err;
    }
  }, [checkModelCache, onError]);

  // Switch to Transformers.js mode
  const switchToTransformers = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    try {
      await serviceRef.current.switchToTransformersMode();
      setCurrentMode('transformers');
      console.log('[useHybridVoice] Switched to Transformers.js mode');
    } catch (err) {
      console.error('[useHybridVoice] Failed to switch to Transformers.js:', err);
      setError(err as Error);
      if (onError) onError(err as Error);
    }
  }, [onError]);

  // Switch to Web Speech mode
  const switchToWebSpeech = useCallback(() => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    serviceRef.current.switchToWebSpeechMode();
    setCurrentMode('web-speech');
    console.log('[useHybridVoice] Switched to Web Speech mode');
  }, []);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    // State
    isListening,
    isReady,
    transcript,
    interimTranscript,
    finalTranscript,
    error,

    // Status
    capabilities,
    transformersStatus,
    currentMode,
    isTransformersReady,
    isModelCached,
    loadingProgress,

    // Actions
    startListening,
    stopListening,
    transcribeFile,
    transcribeRecording,
    initializeTransformers,
    switchToTransformers,
    switchToWebSpeech,
    clearTranscript,
    checkModelCache,

    // Recording
    isRecording,
    startRecording,
    stopRecording
  };
}
