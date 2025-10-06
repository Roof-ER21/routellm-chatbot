'use client';

/**
 * VoiceButton Component
 * iOS-optimized voice control button with Egyptian theming
 * Large tap targets, haptic feedback, visual animations
 */

import { useEffect, useState, useRef } from 'react';
import { useVoice } from '../hooks/useVoice';

export interface VoiceButtonProps {
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onVoiceCommand?: (command: string) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showWaveform?: boolean;
}

export default function VoiceButton({
  onTranscript,
  onVoiceCommand,
  disabled = false,
  className = '',
  size = 'lg',
  showWaveform = true,
}: VoiceButtonProps) {
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const {
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
  } = useVoice({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    onTranscript: (text, isFinal) => {
      onTranscript(text, isFinal);
      if (isFinal && onVoiceCommand) {
        onVoiceCommand(text);
      }
    },
    debounceMs: 300,
  });

  // Size configurations
  const sizeConfig = {
    sm: { button: 'w-12 h-12', icon: 'text-xl' },
    md: { button: 'w-16 h-16', icon: 'text-2xl' },
    lg: { button: 'w-20 h-20', icon: 'text-3xl' },
  };

  const config = sizeConfig[size];

  // Initialize audio visualization
  useEffect(() => {
    if (!isListening || !showWaveform) {
      // Clean up audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
      return;
    }

    // Setup audio visualization when listening
    const setupAudioVisualization = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioLevel = () => {
          if (!analyserRef.current) return;

          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
          setAudioLevel(normalizedLevel);

          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        };

        updateAudioLevel();
      } catch (error) {
        console.error('[VoiceButton] Audio visualization failed:', error);
      }
    };

    setupAudioVisualization();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening, showWaveform]);

  // Handle button click
  const handleClick = async () => {
    if (disabled) return;

    // Trigger haptic feedback on iOS
    if ((navigator as any).vibrate) {
      (navigator as any).vibrate(isListening ? 30 : 50);
    }

    if (!isSupported) {
      alert(
        'Voice recognition is not supported in this browser. Please use Safari on iOS or Chrome on desktop.'
      );
      return;
    }

    if (hasPermission === false) {
      setShowPermissionModal(true);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      if (hasPermission === null) {
        // First time - request permission
        const granted = await requestPermission();
        if (!granted) {
          setShowPermissionModal(true);
          return;
        }
      }

      const started = await startListening();
      if (!started && error) {
        // Show error modal or notification
        console.error('Failed to start:', error);
      }
    }
  };

  // Handle permission request from modal
  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionModal(false);
      await startListening();
    }
  };

  // Calculate pulse animation based on audio level
  const pulseScale = isListening ? 1 + audioLevel * 0.3 : 1;

  if (!isSupported) {
    return (
      <div className={`${config.button} rounded-full bg-gray-400 flex items-center justify-center ${className}`}>
        <span className={config.icon}>🚫</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`
          ${config.button}
          ${className}
          relative rounded-full
          egyptian-button-circle
          transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
          ${isListening ? 'egyptian-gold-glow' : 'egyptian-red-glow'}
          overflow-visible
          touch-smooth
          gpu-accelerated
        `}
        style={{
          transform: `scale(${pulseScale})`,
          minWidth: '64px',
          minHeight: '64px',
        }}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {/* Animated rings */}
        {isListening && showWaveform && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 opacity-60 animate-ping"
              style={{
                borderColor: 'var(--color-egyptian-gold)',
                animationDuration: '2s',
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 opacity-40 animate-ping"
              style={{
                borderColor: 'var(--color-egyptian-gold-light)',
                animationDuration: '2.5s',
                animationDelay: '0.5s',
              }}
            />
          </>
        )}

        {/* Microphone icon */}
        <span className={`${config.icon} relative z-10`}>
          {isListening ? '🎙️' : '🎤'}
        </span>

        {/* Audio level indicator */}
        {isListening && showWaveform && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 rounded-b-full transition-all duration-100"
            style={{
              background: 'var(--color-egyptian-gold)',
              transform: `scaleX(${audioLevel})`,
              opacity: 0.8,
            }}
          />
        )}
      </button>

      {/* Transcript display below button */}
      {(transcript || interimTranscript) && (
        <div className="mt-2 text-center max-w-xs">
          <p className="text-sm font-medium" style={{ color: 'var(--color-papyrus)' }}>
            {transcript}
            <span className="text-opacity-60">{interimTranscript}</span>
          </p>
        </div>
      )}

      {/* Error display */}
      {error && !showPermissionModal && (
        <div className="mt-2 text-center max-w-xs">
          <p className="text-xs font-medium text-red-400">{error}</p>
        </div>
      )}

      {/* Permission Modal */}
      {showPermissionModal && (
        <div className="ios-modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div
            className="ios-bottom-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="egyptian-circle-border w-20 h-20 flex items-center justify-center">
                  <span className="text-4xl">🎤</span>
                </div>
              </div>

              <h2
                className="text-2xl font-bold text-center mb-2"
                style={{ color: 'var(--color-egyptian-gold-light)' }}
              >
                Microphone Access Required
              </h2>

              <p
                className="text-center mb-6"
                style={{ color: 'var(--color-papyrus)' }}
              >
                Susan AI needs access to your microphone for voice commands. This enables
                hands-free operation in the field.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleRequestPermission}
                  className="egyptian-button w-full"
                >
                  Enable Microphone
                </button>

                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="w-full px-6 py-3 rounded-lg border-2 transition-all"
                  style={{
                    borderColor: 'var(--color-egyptian-gold-dark)',
                    color: 'var(--color-papyrus)',
                  }}
                >
                  Maybe Later
                </button>
              </div>

              {/* iOS Settings instructions */}
              <div
                className="mt-6 p-4 rounded-lg text-xs"
                style={{
                  backgroundColor: 'var(--color-egyptian-stone)',
                  borderLeft: '3px solid var(--color-egyptian-gold)',
                }}
              >
                <p className="font-semibold mb-2" style={{ color: 'var(--color-egyptian-gold)' }}>
                  If permission was previously denied:
                </p>
                <ol className="list-decimal list-inside space-y-1" style={{ color: 'var(--color-papyrus-dark)' }}>
                  <li>Open iOS Settings</li>
                  <li>Scroll to Safari</li>
                  <li>Tap "Microphone"</li>
                  <li>Enable for this website</li>
                  <li>Reload this page</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
