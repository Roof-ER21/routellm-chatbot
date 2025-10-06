'use client';

/**
 * iOS-Optimized Voice Recognition Hook
 * Handles Safari Web Speech API quirks and mobile-specific voice features
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// iOS Safari detection
const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
  const webkit = !!ua.match(/WebKit/i);
  const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
  return iOSSafari;
};

// Check if Web Speech API is available
const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
};

export interface VoiceHookOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: any) => void;
  onStart?: () => void;
  onEnd?: () => void;
  debounceMs?: number;
}

export interface VoiceHookReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => Promise<boolean>;
  stopListening: () => void;
  resetTranscript: () => void;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
}

export function useVoice(options: VoiceHookOptions = {}): VoiceHookReturn {
  const {
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    lang = 'en-US',
    onTranscript,
    onError,
    onStart,
    onEnd,
    debounceMs = 300,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSupported] = useState(isSpeechRecognitionSupported());

  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null);
  const audioSessionActiveRef = useRef(false);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition not available');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = lang;

    // iOS Safari specific configurations
    if (isIOSSafari()) {
      // iOS Safari requires user interaction before starting
      recognition.continuous = false; // iOS Safari doesn't support true continuous mode
      recognition.interimResults = true; // Always use interim results for better UX
    }

    // Event: Recognition starts
    recognition.onstart = () => {
      console.log('[Voice] Recognition started');
      setIsListening(true);
      setError(null);
      audioSessionActiveRef.current = true;
      onStart?.();
    };

    // Event: Recognition ends
    recognition.onend = () => {
      console.log('[Voice] Recognition ended');
      setIsListening(false);
      audioSessionActiveRef.current = false;
      onEnd?.();

      // iOS Safari: Auto-restart if continuous mode is desired
      if (isIOSSafari() && continuous && recognitionRef.current) {
        try {
          setTimeout(() => {
            if (recognitionRef.current && audioSessionActiveRef.current) {
              recognitionRef.current.start();
            }
          }, 100); // Small delay for iOS
        } catch (error) {
          console.log('[Voice] Auto-restart prevented');
        }
      }
    };

    // Event: Result received
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptText + ' ';
        } else {
          interimText += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');

        // Debounce callback for final transcripts
        if (onTranscript && debounceMs > 0) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = setTimeout(() => {
            onTranscript(finalTranscript.trim(), true);
          }, debounceMs);
        } else if (onTranscript) {
          onTranscript(finalTranscript.trim(), true);
        }
      }

      if (interimText) {
        setInterimTranscript(interimText);
        onTranscript?.(interimText, false);
      }
    };

    // Event: Error occurred
    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error);

      // Handle different error types
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          setError('Microphone permission denied');
          setHasPermission(false);
          break;
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('No microphone found or microphone is in use');
          break;
        case 'network':
          setError('Network error. Check your connection.');
          break;
        case 'aborted':
          // Aborted is normal, don't show error
          setError(null);
          break;
        default:
          setError(`Recognition error: ${event.error}`);
      }

      setIsListening(false);
      audioSessionActiveRef.current = false;
      onError?.(event);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('[Voice] Cleanup stop error (safe to ignore)');
        }
        recognitionRef.current = null;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      releaseWakeLock();
    };
  }, [
    continuous,
    interimResults,
    maxAlternatives,
    lang,
    onTranscript,
    onError,
    onStart,
    onEnd,
    debounceMs,
    isSupported,
  ]);

  // Request wake lock (prevent screen sleep during voice mode)
  const requestWakeLock = async (): Promise<boolean> => {
    if (!('wakeLock' in navigator)) return false;

    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      console.log('[Voice] Wake lock acquired');

      wakeLockRef.current.addEventListener('release', () => {
        console.log('[Voice] Wake lock released');
      });

      return true;
    } catch (error) {
      console.warn('[Voice] Wake lock failed:', error);
      return false;
    }
  };

  // Release wake lock
  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (error) {
        console.warn('[Voice] Wake lock release failed:', error);
      }
    }
  };

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Immediately stop all tracks (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());

      setHasPermission(true);
      setError(null);
      return true;
    } catch (error: any) {
      console.error('[Voice] Permission denied:', error);
      setHasPermission(false);
      setError('Microphone access denied. Please enable in Settings.');
      return false;
    }
  }, [isSupported]);

  // Start listening
  const startListening = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return false;
    }

    if (!recognitionRef.current) {
      setError('Recognition not initialized');
      return false;
    }

    if (isListening) {
      console.log('[Voice] Already listening');
      return true;
    }

    // Clear previous errors
    setError(null);

    // Request wake lock on iOS
    if (isIOSSafari()) {
      await requestWakeLock();
    }

    try {
      // iOS Safari: Trigger haptic feedback if available
      if (isIOSSafari() && (navigator as any).vibrate) {
        (navigator as any).vibrate(50);
      }

      recognitionRef.current.start();
      audioSessionActiveRef.current = true;
      return true;
    } catch (error: any) {
      console.error('[Voice] Start failed:', error);

      // Handle already started error
      if (error.message?.includes('already started')) {
        setIsListening(true);
        return true;
      }

      setError('Failed to start voice recognition');
      setIsListening(false);
      releaseWakeLock();
      return false;
    }
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      audioSessionActiveRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      releaseWakeLock();

      // iOS Safari: Trigger haptic feedback
      if (isIOSSafari() && (navigator as any).vibrate) {
        (navigator as any).vibrate(30);
      }
    } catch (error) {
      console.error('[Voice] Stop failed:', error);
      setIsListening(false);
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Handle interruptions (phone calls, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden && isListening) {
        console.log('[Voice] Page hidden, stopping recognition');
        stopListening();
      }
    };

    const handleAudioInterruption = () => {
      console.log('[Voice] Audio interruption detected');
      if (isListening) {
        stopListening();
        // Show notification to user
        setError('Voice interrupted. Tap to resume.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // iOS-specific interruption handling
    if (isIOSSafari()) {
      window.addEventListener('pagehide', handleAudioInterruption);
      window.addEventListener('blur', handleAudioInterruption);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (isIOSSafari()) {
        window.removeEventListener('pagehide', handleAudioInterruption);
        window.removeEventListener('blur', handleAudioInterruption);
      }
    };
  }, [isListening, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
    hasPermission,
    requestPermission,
  };
}
