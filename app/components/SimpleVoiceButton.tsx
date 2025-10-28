/**
 * SimpleVoiceButton - Streamlined voice input (Web Speech API only)
 *
 * Single blue microphone button for real-time speech recognition
 * Optimized for iPhone/iPad Safari
 */

'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SimpleVoiceButtonProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export default function SimpleVoiceButton({
  onTranscript,
  onError,
  className = ''
}: SimpleVoiceButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [autoStopAfterSpeech, setAutoStopAfterSpeech] = useState(true); // Auto-stop after final transcript

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            if (onTranscript) {
              onTranscript(transcript, true);
            }

            // Auto-stop recognition after getting final transcript
            // This prevents the mic from staying on after sending a message
            if (autoStopAfterSpeech) {
              console.log('[SimpleVoice] Auto-stopping after final transcript');
              setTimeout(() => {
                try {
                  recognitionInstance.stop();
                } catch (err) {
                  console.error('[SimpleVoice] Error stopping recognition:', err);
                }
              }, 500); // Small delay to ensure transcript is processed
            }
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('[SimpleVoice] Error:', event.error);
        const errorMsg = `Voice recognition error: ${event.error}`;
        setError(errorMsg);
        setIsListening(false);
        if (onError) {
          onError(new Error(errorMsg));
        }
      };

      recognitionInstance.onend = () => {
        console.log('[SimpleVoice] Recognition ended');
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Cleanup: stop recognition when component unmounts
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (err) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [onTranscript, onError, autoStopAfterSpeech]);

  const toggleListening = () => {
    if (!recognition) {
      const errorMsg = 'Voice recognition not supported in this browser';
      setError(errorMsg);
      if (onError) {
        onError(new Error(errorMsg));
      }
      return;
    }

    if (isListening) {
      console.log('[SimpleVoice] Stopping recognition (user toggled)');
      try {
        recognition.stop();
        setIsListening(false);
      } catch (err) {
        console.error('[SimpleVoice] Error stopping recognition:', err);
        setIsListening(false); // Update state anyway
      }
    } else {
      console.log('[SimpleVoice] Starting recognition (user toggled)');
      setError(null);
      setTranscript('');
      try {
        recognition.start();
        setIsListening(true);
      } catch (err: any) {
        console.error('[SimpleVoice] Error starting recognition:', err);
        // If already started, just update the state
        if (err.message?.includes('already started')) {
          setIsListening(true);
        } else {
          const errorMsg = `Failed to start voice recognition: ${err.message}`;
          setError(errorMsg);
          if (onError) {
            onError(new Error(errorMsg));
          }
        }
      }
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <div className={`simple-voice-button ${className}`}>
      <button
        onClick={toggleListening}
        disabled={!isSupported}
        className={`
          p-4 rounded-full transition-all
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
          }
          text-white disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        `}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>

      {/* Transcript Display (optional, for debugging) */}
      {transcript && (
        <div className="mt-2 text-xs text-gray-600 max-w-xs">
          {transcript}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 text-xs text-red-600 max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
