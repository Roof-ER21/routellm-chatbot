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
  const lastInterimTranscriptRef = useRef('');
  const hasReceivedFinalRef = useRef(false);

  // Update autoRestart ref when option changes
  useEffect(() => {
    autoRestartRef.current = options.autoRestart ?? false;
  }, [options.autoRestart]);

  // Initialize recognition
  useEffect(() => {
    console.log('[Voice] ========== INITIALIZING RECOGNITION HOOK ==========');
    console.log('[Voice] isSupported:', isSupported);
    console.log('[Voice] options:', options);

    if (!isSupported) {
      console.log('[Voice] Speech recognition is NOT SUPPORTED in this browser');
      setError('Speech recognition is not supported in this browser');
      return;
    }

    const recognitionConfig = {
      language: options.language ?? 'en-US',
      continuous: options.continuous ?? false,
      interimResults: options.interimResults ?? true,
      maxAlternatives: options.maxAlternatives ?? 1,
    };

    console.log('[Voice] Initializing with config:', recognitionConfig);

    const recognition = voiceService.initializeRecognition(recognitionConfig);

    if (!recognition) {
      console.log('[Voice] FAILED to initialize speech recognition');
      setError('Failed to initialize speech recognition');
      return;
    }

    console.log('[Voice] Recognition initialized successfully');
    console.log('[Voice] Recognition object:', recognition);

    recognitionRef.current = recognition;

    // Handle recognition results
    recognition.onresult = (event: any) => {
      console.log('[Voice] ========== onresult FIRED ==========');
      console.log('[Voice] Event:', event);
      console.log('[Voice] resultIndex:', event.resultIndex);
      console.log('[Voice] results.length:', event.results.length);

      let finalTranscript = '';
      let currentInterim = '';
      let lastConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPiece = result[0].transcript;

        console.log(`[Voice] Result[${i}]:`, {
          transcript: transcriptPiece,
          isFinal: result.isFinal,
          confidence: result[0].confidence
        });

        if (result.isFinal) {
          finalTranscript += transcriptPiece;
          lastConfidence = result[0].confidence;
          hasReceivedFinalRef.current = true;

          console.log('[Voice] FINAL transcript piece:', transcriptPiece);

          // Call onResult callback
          if (options.onResult) {
            console.log('[Voice] Calling options.onResult (final)');
            options.onResult({
              transcript: transcriptPiece,
              confidence: result[0].confidence,
              isFinal: true,
            });
          } else {
            console.log('[Voice] No options.onResult callback defined');
          }
        } else {
          currentInterim += transcriptPiece;

          console.log('[Voice] INTERIM transcript piece:', transcriptPiece);

          // Call onResult callback for interim results
          if (options.onResult) {
            console.log('[Voice] Calling options.onResult (interim)');
            options.onResult({
              transcript: transcriptPiece,
              confidence: result[0].confidence,
              isFinal: false,
            });
          }
        }
      }

      if (finalTranscript) {
        console.log('[Voice] Setting FINAL transcript:', finalTranscript);
        setTranscript(prev => prev + finalTranscript);
        setConfidence(lastConfidence);
        setInterimTranscript('');
        lastInterimTranscriptRef.current = ''; // Clear interim since we got final

        // Call onFinalResult callback
        if (options.onFinalResult) {
          console.log('[Voice] Calling onFinalResult with final transcript:', finalTranscript);
          options.onFinalResult(finalTranscript, lastConfidence);
        } else {
          console.log('[Voice] No options.onFinalResult callback defined');
        }
      } else {
        console.log('[Voice] Setting INTERIM transcript:', currentInterim);
        setInterimTranscript(currentInterim);
        lastInterimTranscriptRef.current = currentInterim; // Store for fallback
      }

      console.log('[Voice] ========== onresult END ==========');
    };

    // Handle recognition start
    recognition.onstart = () => {
      console.log('[Voice] ========== onstart FIRED ==========');
      console.log('[Voice] Recognition started successfully');

      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
      hasReceivedFinalRef.current = false; // Reset flag on new session
      lastInterimTranscriptRef.current = ''; // Reset interim transcript

      if (options.onStart) {
        console.log('[Voice] Calling options.onStart callback');
        options.onStart();
      } else {
        console.log('[Voice] No options.onStart callback defined');
      }

      console.log('[Voice] ========== onstart END ==========');
    };

    // Handle recognition end
    recognition.onend = () => {
      console.log('[Voice] ========== onend FIRED ==========');
      console.log('[Voice] hasReceivedFinal:', hasReceivedFinalRef.current);
      console.log('[Voice] lastInterim:', lastInterimTranscriptRef.current);
      console.log('[Voice] autoRestart:', autoRestartRef.current);
      console.log('[Voice] isListeningRef:', isListeningRef.current);

      // CRITICAL FIX: If we have interim transcript but no final result, use interim as final
      if (!hasReceivedFinalRef.current && lastInterimTranscriptRef.current && options.onFinalResult) {
        console.log('[Voice] No final result received, using interim transcript as final:', lastInterimTranscriptRef.current);

        // Use interim transcript as final result with default confidence
        const fallbackTranscript = lastInterimTranscriptRef.current;
        setTranscript(prev => prev + fallbackTranscript);
        setConfidence(0.8); // Default confidence for interim-as-final

        // Call onFinalResult with the interim transcript
        console.log('[Voice] Calling onFinalResult with fallback transcript');
        options.onFinalResult(fallbackTranscript, 0.8);
      }

      setIsListening(false);
      setInterimTranscript('');
      lastInterimTranscriptRef.current = ''; // Clear after use
      hasReceivedFinalRef.current = false; // Reset for next session

      if (options.onEnd) {
        console.log('[Voice] Calling options.onEnd callback');
        options.onEnd();
      } else {
        console.log('[Voice] No options.onEnd callback defined');
      }

      // Auto-restart if enabled and was listening
      if (autoRestartRef.current && isListeningRef.current) {
        console.log('[Voice] Auto-restarting recognition in 100ms...');
        setTimeout(() => {
          try {
            recognition.start();
          } catch (err) {
            console.error('[Voice] Error restarting recognition:', err);
            isListeningRef.current = false;
          }
        }, 100);
      } else {
        console.log('[Voice] Not auto-restarting (autoRestart:', autoRestartRef.current, 'isListening:', isListeningRef.current, ')');
        isListeningRef.current = false;
      }

      console.log('[Voice] ========== onend END ==========');
    };

    // Handle recognition errors
    recognition.onerror = (event: any) => {
      console.log('[Voice] ========== onerror FIRED ==========');
      console.log('[Voice] Error event:', event);
      console.log('[Voice] Error type:', event.error);
      console.log('[Voice] Error message:', event.message);

      const errorMessage = event.error || 'Unknown error occurred';

      // Don't treat 'no-speech' as a critical error
      if (errorMessage === 'no-speech') {
        console.log('[Voice] no-speech error - ignoring (timeout, no audio detected)');
        setError(null);
        console.log('[Voice] ========== onerror END (no-speech) ==========');
        return;
      }

      // Don't treat 'aborted' as an error (user stopped intentionally)
      if (errorMessage === 'aborted') {
        console.log('[Voice] aborted error - ignoring (user stopped intentionally)');
        setError(null);
        console.log('[Voice] ========== onerror END (aborted) ==========');
        return;
      }

      console.log('[Voice] CRITICAL ERROR:', errorMessage);
      setError(errorMessage);
      setIsListening(false);
      isListeningRef.current = false;

      if (options.onError) {
        console.log('[Voice] Calling options.onError callback');
        options.onError(errorMessage);
      } else {
        console.log('[Voice] No options.onError callback defined');
      }

      console.log('[Voice] ========== onerror END ==========');
    };

    // Additional event handlers for debugging
    if ('onspeechstart' in recognition) {
      recognition.onspeechstart = () => {
        console.log('[Voice] ========== onspeechstart FIRED ==========');
        console.log('[Voice] Speech has been detected (user is speaking)');
      };
    }

    if ('onspeechend' in recognition) {
      recognition.onspeechend = () => {
        console.log('[Voice] ========== onspeechend FIRED ==========');
        console.log('[Voice] Speech has ended (user stopped speaking)');
      };
    }

    if ('onaudiostart' in recognition) {
      recognition.onaudiostart = () => {
        console.log('[Voice] ========== onaudiostart FIRED ==========');
        console.log('[Voice] Audio capturing has started');
      };
    }

    if ('onaudioend' in recognition) {
      recognition.onaudioend = () => {
        console.log('[Voice] ========== onaudioend FIRED ==========');
        console.log('[Voice] Audio capturing has ended');
      };
    }

    if ('onsoundstart' in recognition) {
      recognition.onsoundstart = () => {
        console.log('[Voice] ========== onsoundstart FIRED ==========');
        console.log('[Voice] Sound has been detected (any sound, not just speech)');
      };
    }

    if ('onsoundend' in recognition) {
      recognition.onsoundend = () => {
        console.log('[Voice] ========== onsoundend FIRED ==========');
        console.log('[Voice] Sound has stopped');
      };
    }

    if ('onnomatch' in recognition) {
      recognition.onnomatch = () => {
        console.log('[Voice] ========== onnomatch FIRED ==========');
        console.log('[Voice] Speech was recognized but no match found');
      };
    };

    // Log all attached handlers
    console.log('[Voice] Event handlers attached:');
    console.log('[Voice] - onresult:', typeof recognition.onresult);
    console.log('[Voice] - onstart:', typeof recognition.onstart);
    console.log('[Voice] - onend:', typeof recognition.onend);
    console.log('[Voice] - onerror:', typeof recognition.onerror);
    console.log('[Voice] - onspeechstart:', typeof recognition.onspeechstart);
    console.log('[Voice] - onspeechend:', typeof recognition.onspeechend);
    console.log('[Voice] - onaudiostart:', typeof recognition.onaudiostart);
    console.log('[Voice] - onaudioend:', typeof recognition.onaudioend);
    console.log('[Voice] - onsoundstart:', typeof recognition.onsoundstart);
    console.log('[Voice] - onsoundend:', typeof recognition.onsoundend);
    console.log('[Voice] - onnomatch:', typeof recognition.onnomatch);
    console.log('[Voice] ========== INITIALIZATION COMPLETE ==========');

    // Cleanup
    return () => {
      console.log('[Voice] ========== CLEANUP CALLED ==========');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          console.log('[Voice] Recognition aborted successfully');
        } catch (err) {
          console.log('[Voice] Error aborting recognition:', err);
        }
      }
    };
  }, [isSupported]); // Only re-initialize if support changes

  // Start listening
  const startListening = useCallback(() => {
    console.log('[Voice] ========== startListening CALLED ==========');
    console.log('[Voice] isSupported:', isSupported);
    console.log('[Voice] recognitionRef.current:', recognitionRef.current);
    console.log('[Voice] isListening:', isListening);

    if (!isSupported || !recognitionRef.current) {
      console.log('[Voice] ERROR: Speech recognition is not available');
      setError('Speech recognition is not available');
      return;
    }

    if (isListening) {
      console.log('[Voice] Already listening, returning early');
      return; // Already listening
    }

    try {
      console.log('[Voice] Starting recognition...');
      console.log('[Voice] Recognition config:', {
        continuous: recognitionRef.current.continuous,
        interimResults: recognitionRef.current.interimResults,
        lang: recognitionRef.current.lang,
        maxAlternatives: recognitionRef.current.maxAlternatives
      });

      setError(null);
      isListeningRef.current = true;
      recognitionRef.current.start();

      console.log('[Voice] recognition.start() called successfully');
    } catch (err: any) {
      console.log('[Voice] ERROR starting recognition:', err);

      // If already started, ignore the error
      if (err.message && err.message.includes('already started')) {
        console.log('[Voice] Recognition already started, ignoring error');
        return;
      }
      setError(err.message || 'Failed to start speech recognition');
      isListeningRef.current = false;
    }

    console.log('[Voice] ========== startListening END ==========');
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('[Voice] ========== stopListening CALLED ==========');
    console.log('[Voice] recognitionRef.current:', recognitionRef.current);

    if (!recognitionRef.current) {
      console.log('[Voice] No recognition instance, returning');
      return;
    }

    try {
      console.log('[Voice] Stopping recognition...');
      isListeningRef.current = false;
      recognitionRef.current.stop();
      console.log('[Voice] recognition.stop() called successfully');
    } catch (err) {
      console.error('[Voice] Error stopping recognition:', err);
    }

    console.log('[Voice] ========== stopListening END ==========');
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
