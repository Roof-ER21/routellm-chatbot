/**
 * useTextToSpeech Hook
 * React hook for speech synthesis (text-to-voice)
 * iOS Safari compatible with Web Speech API
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceService, SynthesisConfig } from '@/lib/voice-service';

export interface UseTextToSpeechOptions {
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
  autoPlay?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Event) => void;
}

export interface UseTextToSpeechReturn {
  speak: (text: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

export function useTextToSpeech(
  options: UseTextToSpeechOptions = {}
): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(options.rate ?? 0.95); // Slightly slower for clarity
  const [pitch, setPitch] = useState(options.pitch ?? 1.05); // Slightly higher for feminine tone
  const [volume, setVolume] = useState(options.volume ?? 1.0);

  const speakingRef = useRef(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support on client-side only
  useEffect(() => {
    setIsSupported(voiceService.isSynthesisAvailable());
  }, []);

  // Load voices on mount
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const loadVoices = async () => {
      const loadedVoices = await voiceService.loadVoices();
      setVoices(loadedVoices);

      // Set default to high-quality British female voice
      if (!selectedVoice && loadedVoices.length > 0) {
        // Priority list for premium British female voices
        const premiumBritishNames = [
          'Kate',           // iOS premium British female
          'Serena',         // iOS premium British female
          'Stephanie',      // iOS high-quality British
          'Karen',          // iOS British female
          'Google UK English Female', // Google British female
        ];

        // Try to find premium voices first
        let britishVoice = null;
        for (const name of premiumBritishNames) {
          britishVoice = loadedVoices.find(v =>
            v.name.includes(name) &&
            (v.lang === 'en-GB' || v.lang.startsWith('en-GB'))
          );
          if (britishVoice) break;
        }

        // Fallback to any British female voice (avoiding male voices)
        if (!britishVoice) {
          britishVoice = loadedVoices.find(v =>
            (v.lang === 'en-GB' || v.lang.startsWith('en-GB')) &&
            (v.name.toLowerCase().includes('female') ||
             !v.name.toLowerCase().includes('male'))
          );
        }

        // Final fallback to any British voice
        if (!britishVoice) {
          britishVoice = loadedVoices.find(v =>
            v.lang === 'en-GB' || v.lang.startsWith('en-GB')
          );
        }

        const voiceToUse = britishVoice || voiceService.getBestVoice();
        console.log('[TTS] Auto-selected premium voice:', voiceToUse?.name, voiceToUse?.lang);
        setSelectedVoice(voiceToUse);
      }
    };

    loadVoices();
  }, [isSupported]);

  // Update rate from options
  useEffect(() => {
    if (options.rate !== undefined) {
      setRate(options.rate);
    }
  }, [options.rate]);

  // Update pitch from options
  useEffect(() => {
    if (options.pitch !== undefined) {
      setPitch(options.pitch);
    }
  }, [options.pitch]);

  // Update volume from options
  useEffect(() => {
    if (options.volume !== undefined) {
      setVolume(options.volume);
    }
  }, [options.volume]);

  // Monitor speaking state
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    const interval = setInterval(() => {
      const speaking = voiceService.isSpeaking();
      if (speaking !== speakingRef.current) {
        speakingRef.current = speaking;
        setIsSpeaking(speaking);

        if (!speaking) {
          setIsPaused(false);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSupported]);

  // Speak function
  const speak = useCallback(
    (text: string) => {
      if (!isSupported) {
        console.warn('[TTS] Text-to-speech is not supported in this browser');
        return;
      }

      if (!text.trim()) {
        console.warn('[TTS] Empty text, skipping');
        return;
      }

      console.log('[TTS] Speaking:', text.substring(0, 100) + '...');
      console.log('[TTS] Voice:', selectedVoice?.name || 'default', selectedVoice?.lang);
      console.log('[TTS] Config:', { rate, pitch, volume });

      // Stop any ongoing speech
      voiceService.stopSpeaking();

      const config: SynthesisConfig = {
        voice: selectedVoice ?? undefined,
        rate,
        pitch,
        volume,
      };

      const callbacks = {
        onStart: () => {
          console.log('[TTS] Speech started');
          setIsSpeaking(true);
          setIsPaused(false);
          speakingRef.current = true;

          if (options.onStart) {
            options.onStart();
          }
        },
        onEnd: () => {
          console.log('[TTS] Speech ended');
          setIsSpeaking(false);
          setIsPaused(false);
          speakingRef.current = false;
          currentUtteranceRef.current = null;

          if (options.onEnd) {
            options.onEnd();
          }
        },
        onError: (error: Event) => {
          console.error('[TTS] Speech error:', error);
          setIsSpeaking(false);
          setIsPaused(false);
          speakingRef.current = false;
          currentUtteranceRef.current = null;

          if (options.onError) {
            options.onError(error);
          }
        },
      };

      voiceService.speak(text, config, callbacks);
    },
    [isSupported, selectedVoice, rate, pitch, volume, options]
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setIsPaused(false);
    speakingRef.current = false;
    currentUtteranceRef.current = null;
  }, [isSupported]);

  // Pause speaking
  const pause = useCallback(() => {
    if (!isSupported) {
      return;
    }

    if (isSpeaking && !isPaused) {
      voiceService.pauseSpeaking();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  // Resume speaking
  const resume = useCallback(() => {
    if (!isSupported) {
      return;
    }

    if (isSpeaking && isPaused) {
      voiceService.resumeSpeaking();
      setIsPaused(false);
    }
  }, [isSupported, isSpeaking, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        voiceService.stopSpeaking();
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
    setVoice: setSelectedVoice,
    rate,
    setRate,
    pitch,
    setPitch,
    volume,
    setVolume,
  };
}
