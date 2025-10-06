/**
 * VoiceControls Component
 * Egyptian-themed voice interface for Susan 21
 *
 * Features:
 * - Speech-to-text with stargate microphone button
 * - Text-to-speech with Voice of Ra toggle
 * - Hands-free mode for continuous conversation
 * - Mobile-optimized with large touch targets
 * - Visual feedback with hieroglyphic animations
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export interface VoiceControlsProps {
  onTranscript?: (transcript: string) => void;
  onVoiceCommand?: (command: string) => void;
  autoReadResponses?: boolean;
  disabled?: boolean;
  className?: string;
  onVoiceEnabledChange?: (enabled: boolean) => void;
}

export default function VoiceControls({
  onTranscript,
  onVoiceCommand,
  autoReadResponses = false,
  disabled = false,
  className = '',
  onVoiceEnabledChange,
}: VoiceControlsProps) {
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Voice recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: recognitionError,
    isSupported: isRecognitionSupported,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    onFinalResult: (finalTranscript, confidence) => {
      if (onTranscript) {
        onTranscript(finalTranscript);
      }

      // Auto-restart in hands-free mode
      if (handsFreeMode) {
        setTimeout(() => {
          startListening();
        }, 1000);
      }

      resetTranscript();
    },
    onError: (error) => {
      console.error('Voice recognition error:', error);
    },
  });

  // Text-to-speech hook with premium British voice settings
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isSpeechSupported,
    voices,
    selectedVoice,
    setVoice,
    rate,
    setRate,
  } = useTextToSpeech({
    rate: 0.95,  // Slightly slower for clarity and professionalism
    pitch: 1.05, // Slightly higher for warm feminine British tone
    volume: 1.0,
    onStart: () => {
      // Stop listening while speaking
      if (isListening) {
        stopListening();
      }
    },
    onEnd: () => {
      // Resume listening in hands-free mode
      if (handsFreeMode && voiceEnabled) {
        setTimeout(() => {
          startListening();
        }, 500);
      }
    },
  });

  // Handle hands-free mode toggle
  const toggleHandsFree = () => {
    const newHandsFreeMode = !handsFreeMode;
    setHandsFreeMode(newHandsFreeMode);

    if (newHandsFreeMode) {
      setVoiceEnabled(true);
      startListening();
    } else {
      stopListening();
      stopSpeaking();
    }
  };

  // Handle voice toggle
  const toggleVoice = () => {
    const newVoiceEnabled = !voiceEnabled;
    setVoiceEnabled(newVoiceEnabled);

    // Notify parent component
    if (onVoiceEnabledChange) {
      onVoiceEnabledChange(newVoiceEnabled);
    }

    if (!newVoiceEnabled) {
      stopSpeaking();
      setHandsFreeMode(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopListening();
      stopSpeaking();
    };
  }, []);

  // Don't render if neither feature is supported
  if (!isRecognitionSupported && !isSpeechSupported) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Voice features are not supported in this browser. Please use Chrome, Safari, or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className={`voice-controls ${className}`}>
      {/* Main Voice Control Bar */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-[var(--color-egyptian-stone)] to-[var(--color-egyptian-black-light)] rounded-xl border-2 border-[var(--color-egyptian-gold-dark)]">
        {/* Microphone Button (Stargate Style) */}
        {isRecognitionSupported && (
          <button
            onClick={toggleListening}
            disabled={disabled}
            className={`
              voice-mic-button
              relative flex items-center justify-center
              w-16 h-16 rounded-full
              transition-all duration-300
              ${isListening
                ? 'voice-mic-listening egyptian-red-glow'
                : 'egyptian-gold-glow'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
            `}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
            title={isListening ? 'Stop listening' : 'Click to speak'}
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-3 border-[var(--color-egyptian-gold)] opacity-60" />

            {/* Middle ring */}
            <div className="absolute inset-1 rounded-full border-2 border-[var(--color-egyptian-red)] opacity-40" />

            {/* Inner ring */}
            <div className="absolute inset-2 rounded-full border-1 border-[var(--color-egyptian-gold-dark)] opacity-30" />

            {/* Microphone Icon */}
            <div className={`
              relative z-10 text-3xl
              ${isListening ? 'animate-pulse' : ''}
            `}>
              {isListening ? '🎙️' : '🎤'}
            </div>

            {/* Listening Animation */}
            {isListening && (
              <div className="absolute inset-0 rounded-full voice-pulse-ring" />
            )}
          </button>
        )}

        {/* Status and Transcript Display */}
        <div className="flex-1 min-w-0">
          {/* Status Text */}
          <div className="flex items-center gap-2 mb-1">
            <div className={`
              w-2 h-2 rounded-full
              ${isListening
                ? 'bg-red-500 animate-pulse'
                : isSpeaking
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-gray-500'
              }
            `} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-egyptian-gold)' }}>
              {isListening
                ? 'Listening...'
                : isSpeaking
                ? 'Speaking...'
                : handsFreeMode
                ? 'Hands-Free Mode Active'
                : 'Voice Ready'
              }
            </span>
          </div>

          {/* Transcript Display */}
          {(transcript || interimTranscript) && (
            <div className="text-sm" style={{ color: 'var(--color-papyrus)' }}>
              <span className="font-medium">{transcript}</span>
              <span className="italic opacity-60">{interimTranscript}</span>
            </div>
          )}

          {/* Error Display */}
          {recognitionError && (
            <div className="text-xs text-red-400 mt-1">
              {recognitionError}
            </div>
          )}
        </div>

        {/* Hands-Free Mode Toggle - Voice automatically enabled when active */}
        {isRecognitionSupported && isSpeechSupported && (
          <button
            onClick={toggleHandsFree}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center
              px-4 py-2 rounded-lg
              transition-all duration-300
              ${handsFreeMode
                ? 'bg-gradient-to-br from-[var(--color-egyptian-red-light)] to-[var(--color-egyptian-red)] text-white egyptian-red-glow'
                : 'bg-[var(--color-egyptian-stone)] text-[var(--color-papyrus-dark)]'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              border-2 border-[var(--color-egyptian-gold-dark)]
            `}
            aria-label={handsFreeMode ? 'Disable hands-free' : 'Enable hands-free'}
            title="Hands-Free Mode"
          >
            <span className="text-xl mb-1">{handsFreeMode ? '🤚' : '✋'}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
              Hands-Free
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
