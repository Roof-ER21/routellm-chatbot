/**
 * useVoiceRecognition Hook
 * React hook for speech recognition (voice-to-text)
 * iOS Safari compatible with Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceService, VoiceServiceConfig, RecognitionResult } from '@/lib/voice-service';

export interface UseVoiceRecognitionOptions extends VoiceServiceConfig {
  onResult?: (result: RecognitionResult) => void;
  onFinalResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  autoRestart?: boolean; // Automatically restart after results (for continuous listening)
}

export interface UseVoiceRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => voiceService.isRecognitionSupported());

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const autoRestartRef = useRef(options.autoRestart ?? false);

  // Update autoRestart ref when option changes
  useEffect(() => {
    autoRestartRef.current = options.autoRestart ?? false;
  }, [options.autoRestart]);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognition = voiceService.initializeRecognition({
      language: options.language ?? 'en-US',
      continuous: options.continuous ?? false,
      interimResults: options.interimResults ?? true,
      maxAlternatives: options.maxAlternatives ?? 1,
    });

    if (!recognition) {
      setError('Failed to initialize speech recognition');
      return;
    }

    recognitionRef.current = recognition;

    // Handle recognition results
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let currentInterim = '';
      let lastConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPiece = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPiece;
          lastConfidence = result[0].confidence;

          // Call onResult callback
          if (options.onResult) {
            options.onResult({
              transcript: transcriptPiece,
              confidence: result[0].confidence,
              isFinal: true,
            });
          }
        } else {
          currentInterim += transcriptPiece;

          // Call onResult callback for interim results
          if (options.onResult) {
            options.onResult({
              transcript: transcriptPiece,
              confidence: result[0].confidence,
              isFinal: false,
            });
          }
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setConfidence(lastConfidence);
        setInterimTranscript('');

        // Call onFinalResult callback
        if (options.onFinalResult) {
          options.onFinalResult(finalTranscript, lastConfidence);
        }
      } else {
        setInterimTranscript(currentInterim);
      }
    };

    // Handle recognition start
    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);

      if (options.onStart) {
        options.onStart();
      }
    };

    // Handle recognition end
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');

      if (options.onEnd) {
        options.onEnd();
      }

      // Auto-restart if enabled and was listening
      if (autoRestartRef.current && isListeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
            isListeningRef.current = false;
          }
        }, 100);
      } else {
        isListeningRef.current = false;
      }
    };

    // Handle recognition errors
    recognition.onerror = (event: any) => {
      const errorMessage = event.error || 'Unknown error occurred';

      // Don't treat 'no-speech' as a critical error
      if (errorMessage === 'no-speech') {
        setError(null);
        return;
      }

      // Don't treat 'aborted' as an error (user stopped intentionally)
      if (errorMessage === 'aborted') {
        setError(null);
        return;
      }

      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;

      if (options.onError) {
        options.onError(errorMessage);
      }
    };

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          // Ignore cleanup errors
        }
      }
    };
  }, [isSupported]); // Only re-initialize if support changes

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Speech recognition is not available');
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      setError(null);
      isListeningRef.current = true;
      recognitionRef.current.start();
    } catch (err: any) {
      // If already started, ignore the error
      if (err.message && err.message.includes('already started')) {
        return;
      }
      setError(err.message || 'Failed to start speech recognition');
      isListeningRef.current = false;
    }
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) {
      return;
    }

    try {
      isListeningRef.current = false;
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}
