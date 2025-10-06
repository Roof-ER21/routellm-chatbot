'use client';

/**
 * VoiceCommandPanel Component
 * Full-screen voice command interface optimized for iOS field use
 * Landscape mode support, large controls, clear visual feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { useVoice } from '../hooks/useVoice';
import VoiceButton from './VoiceButton';

export interface VoiceCommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: string) => void;
  repName?: string;
}

interface Suggestion {
  label: string;
  command: string;
  icon: string;
}

const VOICE_SUGGESTIONS: Suggestion[] = [
  { label: 'Document Damage', command: 'Susan, document hail damage', icon: '📝' },
  { label: 'Cite Code', command: 'Susan, cite IRC flashing code', icon: '📋' },
  { label: 'Draft Letter', command: 'Susan, draft appeal letter', icon: '✉️' },
  { label: 'Analyze Photo', command: 'Susan, analyze photo', icon: '📸' },
  { label: 'Get Help', command: 'Susan, help with measurements', icon: '❓' },
  { label: 'Emergency', command: 'Susan, emergency contact', icon: '🚨' },
];

export default function VoiceCommandPanel({
  isOpen,
  onClose,
  onCommand,
  repName,
}: VoiceCommandPanelProps) {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoice({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
    debounceMs: 500,
  });

  // Handle transcript changes
  useEffect(() => {
    if (transcript) {
      setCurrentTranscript(transcript);
    }
  }, [transcript]);

  // Handle voice command
  const handleVoiceCommand = useCallback(
    async (command: string) => {
      if (!command.trim()) return;

      setIsProcessing(true);
      setCommandHistory((prev) => [command, ...prev.slice(0, 4)]);

      try {
        await onCommand(command);
        resetTranscript();
        setCurrentTranscript('');
      } catch (error) {
        console.error('Command failed:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [onCommand, resetTranscript]
  );

  // Handle suggestion click
  const handleSuggestionClick = (command: string) => {
    handleVoiceCommand(command);
  };

  // Handle close
  const handleClose = () => {
    if (isListening) {
      stopListening();
    }
    resetTranscript();
    setCurrentTranscript('');
    onClose();
  };

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center egyptian-pattern safe-area-top safe-area-bottom">
      {/* Background overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Main content */}
      <div className="relative w-full h-full max-w-4xl mx-auto p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="egyptian-circle-border w-12 h-12 flex items-center justify-center">
              <span className="text-2xl">👁️</span>
            </div>
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: 'var(--color-egyptian-gold-light)' }}
              >
                Voice Commands
              </h1>
              {repName && (
                <p className="text-sm" style={{ color: 'var(--color-papyrus-dark)' }}>
                  {repName}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleClose}
            className="egyptian-button-circle w-12 h-12"
            aria-label="Close voice panel"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Status indicator */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2"
            style={{
              borderColor: isListening ? 'var(--color-egyptian-gold)' : 'var(--color-egyptian-stone)',
              backgroundColor: 'var(--color-egyptian-black-light)',
            }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: isListening
                  ? 'var(--color-egyptian-gold)'
                  : 'var(--color-egyptian-stone)',
                boxShadow: isListening ? '0 0 8px var(--color-egyptian-gold)' : 'none',
              }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--color-papyrus)' }}
            >
              {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Transcript display */}
        <div
          className="flex-1 mb-6 p-6 rounded-2xl overflow-y-auto smooth-scroll"
          style={{
            backgroundColor: 'var(--color-egyptian-black-light)',
            border: '2px solid var(--color-egyptian-gold-dark)',
            minHeight: '200px',
            maxHeight: '400px',
          }}
        >
          {currentTranscript || interimTranscript ? (
            <div>
              <p
                className="text-lg leading-relaxed"
                style={{ color: 'var(--color-papyrus)' }}
              >
                {currentTranscript}
                <span className="opacity-60">{interimTranscript}</span>
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-6xl mb-4">🎙️</span>
              <p
                className="text-lg font-medium"
                style={{ color: 'var(--color-egyptian-gold)' }}
              >
                Tap the microphone and start speaking
              </p>
              <p className="text-sm mt-2" style={{ color: 'var(--color-papyrus-dark)' }}>
                Say "Susan" followed by your command
              </p>
            </div>
          )}
        </div>

        {/* Voice button */}
        <div className="flex justify-center mb-6">
          <VoiceButton
            onTranscript={(text, isFinal) => {
              if (isFinal) {
                handleVoiceCommand(text);
              }
            }}
            size="lg"
            showWaveform={true}
          />
        </div>

        {/* Error display */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--color-egyptian-red)',
              color: 'white',
            }}
          >
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Quick suggestions - Horizontal scroll on mobile */}
        <div className="mb-4">
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--color-egyptian-gold)' }}
          >
            Quick Commands
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 smooth-scroll">
            {VOICE_SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion.command)}
                disabled={isProcessing}
                className="flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[100px] touch-smooth"
                style={{
                  backgroundColor: 'var(--color-egyptian-stone)',
                  borderColor: 'var(--color-egyptian-gold-dark)',
                  color: 'var(--color-papyrus)',
                }}
              >
                <span className="text-2xl">{suggestion.icon}</span>
                <span className="text-xs font-medium text-center">
                  {suggestion.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Command history */}
        {commandHistory.length > 0 && (
          <div>
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--color-egyptian-gold)' }}
            >
              Recent Commands
            </p>
            <div className="space-y-2">
              {commandHistory.map((cmd, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--color-egyptian-stone)',
                    color: 'var(--color-papyrus-dark)',
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not supported message */}
        {!isSupported && (
          <div
            className="mt-4 p-4 rounded-lg text-center"
            style={{
              backgroundColor: 'var(--color-egyptian-stone)',
              borderLeft: '3px solid var(--color-egyptian-red)',
            }}
          >
            <p className="font-semibold mb-1" style={{ color: 'var(--color-egyptian-red)' }}>
              Voice Not Supported
            </p>
            <p className="text-sm" style={{ color: 'var(--color-papyrus-dark)' }}>
              Please use Safari on iOS or Chrome on desktop for voice features.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
