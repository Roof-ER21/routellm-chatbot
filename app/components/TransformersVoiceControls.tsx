/**
 * TransformersVoiceControls Component
 *
 * Voice controls using hybrid approach (Web Speech + Transformers.js)
 * Optimized for iPhone/iPad Safari with progressive loading
 *
 * Features:
 * - Real-time speech recognition (Web Speech API)
 * - Audio file transcription (Transformers.js)
 * - Recording and transcription (Transformers.js)
 * - Automatic fallback cascade
 * - Model loading progress
 * - Cache status indicator
 */

'use client';

import { useState, useEffect } from 'react';
import { useHybridVoice } from '../../hooks/useHybridVoice';
import { Mic, MicOff, Upload, Download, Loader2, Check, X, Info } from 'lucide-react';

interface TransformersVoiceControlsProps {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
  autoInitialize?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

export default function TransformersVoiceControls({
  onTranscript,
  onError,
  autoInitialize = true,
  showAdvanced = false,
  className = ''
}: TransformersVoiceControlsProps) {
  const {
    isListening,
    isRecording,
    isReady,
    transcript,
    interimTranscript,
    finalTranscript,
    error,
    capabilities,
    transformersStatus,
    currentMode,
    isTransformersReady,
    isModelCached,
    loadingProgress,
    startListening,
    stopListening,
    startRecording,
    stopRecording,
    transcribeFile,
    initializeTransformers,
    switchToTransformers,
    switchToWebSpeech,
    clearTranscript,
    checkModelCache
  } = useHybridVoice({
    autoInitialize,
    modelSize: 'tiny', // Best for mobile
    preloadTransformers: true,
    onTranscript,
    onError
  });

  const [showDetails, setShowDetails] = useState(showAdvanced);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [transcribing, setTranscribing] = useState(false);

  // Handle file upload and transcription
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadedFile(file);
      setTranscribing(true);

      const result = await transcribeFile(file);

      console.log('Transcription result:', result);
      alert(`Transcribed: ${result.text}`);

      if (onTranscript) {
        onTranscript(result.text, true);
      }
    } catch (err) {
      console.error('File transcription error:', err);
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setTranscribing(false);
    }
  };

  // Handle recording button
  const handleRecordToggle = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        console.log('Recording transcribed:', result);
      }
    } else {
      await startRecording();
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (!isReady) return 'text-gray-400';
    if (isListening || isRecording) return 'text-green-500';
    return 'text-blue-500';
  };

  // Get status text
  const getStatusText = () => {
    if (error) return `Error: ${error.message}`;
    if (transformersStatus === 'loading') return 'Loading AI model...';
    if (!isReady) return 'Initializing...';
    if (isListening) return 'Listening (Web Speech)';
    if (isRecording) return 'Recording (Transformers.js)';
    if (isTransformersReady) return 'Ready (Hybrid Mode)';
    return 'Ready (Web Speech only)';
  };

  // Format loading progress
  const formatProgress = () => {
    if (!loadingProgress) return null;

    const { status, file, progress, loaded, total } = loadingProgress;

    if (progress) {
      return `${Math.round(progress)}% - ${file || 'Loading...'}`;
    } else if (loaded && total) {
      const percent = Math.round((loaded / total) * 100);
      const mb = (loaded / 1024 / 1024).toFixed(1);
      const totalMb = (total / 1024 / 1024).toFixed(1);
      return `${percent}% (${mb}MB / ${totalMb}MB)`;
    }

    return status;
  };

  return (
    <div className={`transformers-voice-controls space-y-4 ${className}`}>
      {/* Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`${getStatusColor()}`}>
            {transformersStatus === 'loading' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isReady ? (
              <Check className="h-5 w-5" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{getStatusText()}</span>
            {loadingProgress && (
              <span className="text-xs text-gray-500">{formatProgress()}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {/* Details Panel */}
      {showDetails && capabilities && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2 text-sm">
          <div className="font-semibold mb-2">Voice Capabilities</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Web Speech API:</div>
            <div className={capabilities.webSpeechAvailable ? 'text-green-600' : 'text-red-600'}>
              {capabilities.webSpeechAvailable ? 'Available' : 'Not Available'}
            </div>

            <div>Transformers.js:</div>
            <div className={isTransformersReady ? 'text-green-600' : 'text-yellow-600'}>
              {isTransformersReady ? 'Ready' : transformersStatus}
            </div>

            <div>Model Cached:</div>
            <div className={isModelCached ? 'text-green-600' : 'text-gray-600'}>
              {isModelCached ? 'Yes' : 'No'}
            </div>

            <div>Current Mode:</div>
            <div className="font-medium capitalize">{currentMode}</div>

            <div>Offline Capable:</div>
            <div className={capabilities.offlineCapable ? 'text-green-600' : 'text-gray-600'}>
              {capabilities.offlineCapable ? 'Yes' : 'No'}
            </div>
          </div>

          {!isTransformersReady && (
            <button
              onClick={initializeTransformers}
              disabled={transformersStatus === 'loading'}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {transformersStatus === 'loading' ? 'Loading...' : 'Load Transformers.js'}
            </button>
          )}
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4">
        {/* Real-time Speech (Web Speech API) */}
        {capabilities?.webSpeechAvailable && (
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={!isReady || isRecording}
            className={`
              p-6 rounded-full transition-all
              ${isListening
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700'
              }
              text-white disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Real-time speech recognition (Web Speech API)"
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        )}

        {/* Recording (Transformers.js) */}
        {isTransformersReady && (
          <button
            onClick={handleRecordToggle}
            disabled={!isReady || isListening}
            className={`
              p-6 rounded-full transition-all
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700'
              }
              text-white disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Record and transcribe (Transformers.js)"
          >
            {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        )}

        {/* File Upload */}
        {isTransformersReady && (
          <label
            className={`
              p-6 rounded-full bg-green-600 hover:bg-green-700
              text-white cursor-pointer transition-all
              ${!isReady || transcribing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Upload audio file for transcription"
          >
            {transcribing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Upload className="h-8 w-8" />
            )}
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              disabled={!isReady || transcribing}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Transcript:</span>
            <button
              onClick={clearTranscript}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Clear
            </button>
          </div>
          <div className="text-sm space-y-1">
            {finalTranscript && (
              <p className="text-gray-900 dark:text-gray-100">{finalTranscript}</p>
            )}
            {interimTranscript && (
              <p className="text-gray-500 dark:text-gray-400 italic">{interimTranscript}</p>
            )}
          </div>
        </div>
      )}

      {/* Mode Switcher (Advanced) */}
      {showDetails && capabilities?.webSpeechAvailable && isTransformersReady && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={switchToWebSpeech}
            disabled={currentMode === 'web-speech'}
            className={`
              px-4 py-2 rounded text-sm
              ${currentMode === 'web-speech'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
              disabled:opacity-50
            `}
          >
            Web Speech
          </button>
          <button
            onClick={switchToTransformers}
            disabled={currentMode === 'transformers'}
            className={`
              px-4 py-2 rounded text-sm
              ${currentMode === 'transformers'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
              disabled:opacity-50
            `}
          >
            Transformers.js
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          <div className="flex items-start space-x-2">
            <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">{error.message}</div>
          </div>
        </div>
      )}

      {/* Helper Text */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>
          {capabilities?.webSpeechAvailable && '🔵 Blue = Real-time (Web Speech API, fastest)'}
        </p>
        {isTransformersReady && (
          <>
            <p>🟣 Purple = Record & Transcribe (Transformers.js, offline-capable)</p>
            <p>🟢 Green = Upload Audio File (Transformers.js)</p>
          </>
        )}
        {!isTransformersReady && (
          <p className="text-yellow-600">
            ⚠️ Transformers.js loading... ({transformersStatus})
          </p>
        )}
      </div>
    </div>
  );
}
