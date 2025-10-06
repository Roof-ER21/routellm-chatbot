'use client';

/**
 * iOS-Optimized Text-to-Speech Hook
 * Handles Web Speech Synthesis API with iOS Safari optimizations
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TextToSpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  voice?: SpeechSynthesisVoice | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

export interface TextToSpeechHook {
  speak: (text: string, options?: Partial<TextToSpeechOptions>) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export function useTextToSpeech(options: TextToSpeechOptions = {}): TextToSpeechHook {
  const {
    rate: initialRate = 1.0,
    pitch: initialPitch = 1.0,
    volume: initialVolume = 1.0,
    lang: initialLang = 'en-US',
    voice: initialVoice = null,
    onStart,
    onEnd,
    onError,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported] = useState(() => 'speechSynthesis' in window);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(initialVoice);
  const [rate, setRate] = useState(initialRate);
  const [pitch, setPitch] = useState(initialPitch);
  const [volume, setVolume] = useState(initialVolume);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);

  // Load available voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Auto-select first English voice if none selected
      if (!selectedVoice && availableVoices.length > 0) {
        const enVoice =
          availableVoices.find((v) => v.lang.startsWith('en')) || availableVoices[0];
        setSelectedVoice(enVoice);
      }
    };

    loadVoices();

    // iOS Safari requires this event listener
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported, selectedVoice]);

  // Speak function
  const speak = useCallback(
    (text: string, overrideOptions: Partial<TextToSpeechOptions> = {}) => {
      if (!isSupported) {
        console.warn('Text-to-speech not supported');
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();

      // Clean and prepare text
      const cleanText = text
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Apply settings
      utterance.rate = overrideOptions.rate ?? rate;
      utterance.pitch = overrideOptions.pitch ?? pitch;
      utterance.volume = overrideOptions.volume ?? volume;
      utterance.lang = overrideOptions.lang ?? initialLang;

      if (overrideOptions.voice) {
        utterance.voice = overrideOptions.voice;
      } else if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        onEnd?.();

        // Process queue if items exist
        if (queueRef.current.length > 0) {
          const nextText = queueRef.current.shift();
          if (nextText) {
            speak(nextText);
          }
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
        onError?.(event);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      // Store reference
      utteranceRef.current = utterance;

      // iOS Safari: Small delay helps with reliability
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch (error) {
          console.error('Failed to speak:', error);
          setIsSpeaking(false);
        }
      }, 10);
    },
    [
      isSupported,
      rate,
      pitch,
      volume,
      initialLang,
      selectedVoice,
      onStart,
      onEnd,
      onError,
    ]
  );

  // Stop function
  const stop = useCallback(() => {
    if (!isSupported) return;

    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
      queueRef.current = [];
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  }, [isSupported]);

  // Pause function
  const pause = useCallback(() => {
    if (!isSupported || !isSpeaking) return;

    try {
      window.speechSynthesis.pause();
      setIsPaused(true);
    } catch (error) {
      console.error('Failed to pause speech:', error);
    }
  }, [isSupported, isSpeaking]);

  // Resume function
  const resume = useCallback(() => {
    if (!isSupported || !isPaused) return;

    try {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to resume speech:', error);
    }
  }, [isSupported, isPaused]);

  // Set voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    selectedVoice,
    setVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
  };
}
