'use client';

/**
 * iOS-Optimized Voice Recognition Hook
 * Wrapper around useVoice hook for compatibility with existing VoiceControls
 */

import { useVoice, VoiceHookOptions } from './useVoice';

export interface VoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onFinalResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
}

export interface VoiceRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: VoiceRecognitionOptions = {}
): VoiceRecognitionHook {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    onFinalResult,
    onError,
  } = options;

  const voiceHookOptions: VoiceHookOptions = {
    continuous,
    interimResults,
    lang: language,
    onTranscript: (transcript: string, isFinal: boolean) => {
      if (isFinal && onFinalResult) {
        onFinalResult(transcript, 1.0); // Default confidence
      }
    },
    onError: (error: any) => {
      if (onError) {
        onError(error.error || error.message || 'Unknown error');
      }
    },
  };

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoice(voiceHookOptions);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
