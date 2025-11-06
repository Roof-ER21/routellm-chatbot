# Advanced Lip Sync System - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Advanced Lip Sync System                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          INPUT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐       ┌──────────────────┐               │
│  │ HTMLAudioElement │       │   MediaStream    │               │
│  │  (Audio Files)   │       │  (Microphone)    │               │
│  └────────┬─────────┘       └────────┬─────────┘               │
│           │                          │                          │
│           └───────────┬──────────────┘                          │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                     WEB AUDIO API LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              AudioContext                                │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │  MediaElementSource / MediaStreamSource         │    │   │
│  │  └──────────────────┬──────────────────────────────┘    │   │
│  │                     ↓                                    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │           AnalyserNode                          │    │   │
│  │  │  - FFT Size: 512-2048                          │    │   │
│  │  │  - Smoothing: 0.5-0.8                          │    │   │
│  │  │  - Frequency Data                              │    │   │
│  │  │  - Time Domain Data                            │    │   │
│  │  └──────────────────┬──────────────────────────────┘    │   │
│  └────────────────────┼─────────────────────────────────────┘   │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ANALYSIS LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Volume Calculation (RMS)                               │   │
│  │  ├─> Time Domain Data                                   │   │
│  │  └─> Volume (0-1)                                       │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   ↓                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Frequency Band Analysis                                │   │
│  │  ├─> Low Freq (0-10%)                                   │   │
│  │  ├─> Mid Freq (10-40%)                                  │   │
│  │  └─> High Freq (40-80%)                                 │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   ↓                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Viseme Detection (Heuristic)                           │   │
│  │  ├─> Low Ratio  → 'aa', 'oh'                           │   │
│  │  ├─> Mid Ratio  → 'eh', 'ih'                           │   │
│  │  └─> High Ratio → 'ss', 'ff'                           │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┼──────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                  VISEME MAPPING LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  14 Visemes → Blend Shape Weights                       │   │
│  │                                                          │   │
│  │  neutral → { jawOpen: 0, mouthPucker: 0, ... }         │   │
│  │  aa      → { jawOpen: 0.8, lipUpperUp: 0.2, ... }      │   │
│  │  eh      → { jawOpen: 0.4, mouthStretch: 0.6, ... }    │   │
│  │  ih      → { jawOpen: 0.3, mouthSmile: 0.5, ... }      │   │
│  │  oh      → { mouthPucker: 0.7, jawOpen: 0.5, ... }     │   │
│  │  uu      → { mouthPucker: 0.9, jawOpen: 0.3, ... }     │   │
│  │  pp      → { mouthPucker: 0.8, jawOpen: 0, ... }       │   │
│  │  ff      → { lipLowerDown: 0.4, jawOpen: 0.1, ... }    │   │
│  │  th      → { tongueOut: 0.2, jawOpen: 0.2, ... }       │   │
│  │  ss      → { mouthSmile: 0.6, mouthStretch: 0.4, ...}  │   │
│  │  nn      → { tongueOut: 0.3, jawOpen: 0.3, ... }       │   │
│  │  kk      → { jawOpen: 0.4, mouthStretch: 0.2, ... }    │   │
│  │  rr      → { tongueOut: 0.4, mouthPucker: 0.3, ... }   │   │
│  │  ww      → { mouthPucker: 0.9, jawOpen: 0.2, ... }     │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┼──────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SMOOTHING LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Linear Interpolation (Lerp)                            │   │
│  │                                                          │   │
│  │  Current Weights ──┐                                    │   │
│  │                    ├─> Lerp(α=0.15) ─> Smoothed Weights│   │
│  │  Target Weights  ──┘                                    │   │
│  │                                                          │   │
│  │  Volume ───────────> Lerp(α=0.2) ──> Smoothed Volume   │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┼──────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                   IDLE ANIMATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Blink System                                            │   │
│  │  ├─> Random interval: 2-6 seconds                       │   │
│  │  ├─> Duration: 0.15 seconds                             │   │
│  │  └─> Weight: 0 → 1 → 0 (smooth)                        │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   ↓                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Breathing Animation                                     │   │
│  │  ├─> Sine wave: 0.2 Hz                                  │   │
│  │  └─> Subtle jaw movement                                │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
└───────────────────┼──────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     OUTPUT LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  applyToMesh(mesh: THREE.Mesh)                          │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────┐       │   │
│  │  │  Find Morph Target Indices                   │       │   │
│  │  │  ├─> jawOpen → morphTargetDictionary         │       │   │
│  │  │  ├─> mouthPucker → morphTargetDictionary     │       │   │
│  │  │  └─> ... (all 8 blend shapes)                │       │   │
│  │  └────────────────┬─────────────────────────────┘       │   │
│  │                   ↓                                      │   │
│  │  ┌──────────────────────────────────────────────┐       │   │
│  │  │  Apply Weights to Morph Targets              │       │   │
│  │  │  mesh.morphTargetInfluences[index] = weight  │       │   │
│  │  └────────────────┬─────────────────────────────┘       │   │
│  └────────────────────────────────────────────────────────┘   │
│                     │                                           │
└─────────────────────┼───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3D AVATAR RENDERING                           │
│               (React Three Fiber / Three.js)                     │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Audio Input
    │
    ├─> Web Audio API
    │       │
    │       ├─> FFT Analysis (16-50ms intervals)
    │       │
    │       └─> Frequency & Time Data
    │               │
    │               ├─> RMS Calculation
    │               │   └─> Volume (0-1)
    │               │
    │               └─> Frequency Bands
    │                   ├─> Low (vowels)
    │                   ├─> Mid (consonants)
    │                   └─> High (sibilants)
    │
    ├─> Viseme Detection
    │       │
    │       └─> Current Viseme (string)
    │               │
    │               └─> Blend Shape Weights (object)
    │
    ├─> Smoothing (Lerp)
    │       │
    │       ├─> Previous Weights
    │       ├─> Target Weights
    │       └─> Alpha (0.15)
    │               │
    │               └─> Smoothed Weights
    │
    ├─> Idle Animations
    │       │
    │       ├─> Blink Timer → Blink Weight
    │       └─> Breathing Sine → Breathing Weight
    │
    └─> Apply to Mesh
            │
            └─> morph.TargetInfluences[i] = weight
                    │
                    └─> Visual Rendering
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  useAdvancedLipSync Hook                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  State Management:                                           │
│  ├─ currentViseme: string                                   │
│  ├─ currentWeights: VisemeWeights                           │
│  ├─ volume: number                                          │
│  ├─ isAnalyzing: boolean                                    │
│  ├─ isSpeaking: boolean                                     │
│  ├─ blinkWeight: number                                     │
│  └─ breathingWeight: number                                 │
│                                                              │
│  Refs (Performance):                                         │
│  ├─ audioContextRef                                         │
│  ├─ analyserRef                                             │
│  ├─ sourceRef                                               │
│  ├─ animationFrameRef                                       │
│  ├─ updateIntervalRef                                       │
│  ├─ targetWeightsRef                                        │
│  └─ smoothedWeightsRef                                      │
│                                                              │
│  Methods:                                                    │
│  ├─ initializeAudioAnalysis()                              │
│  ├─ analyzeAudio()                                          │
│  ├─ updateIdleAnimations()                                  │
│  ├─ applyToMesh(mesh)                                       │
│  └─ cleanup()                                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│                    Update Cycle (60fps)                       │
└──────────────────────────────────────────────────────────────┘

RAF Loop (16ms)                    Interval Loop (16-50ms)
     │                                     │
     ├─> Update Idle Animations            ├─> Analyze Audio
     │   ├─> Check Blink Timer             │   ├─> Get Frequency Data
     │   │   └─> Update Blink Weight       │   ├─> Get Time Data
     │   └─> Calculate Breathing           │   ├─> Calculate Volume
     │       └─> Update Breathing Weight   │   ├─> Detect Viseme
     │                                      │   └─> Update Weights
     │                                      │
     ├─> Apply to Mesh                     └─> Smooth Weights
     │   ├─> Map Blend Shapes                  ├─> Lerp Current → Target
     │   └─> Set morphTargetInfluences         └─> Update State
     │
     └─> Render Frame
         └─> Three.js renders avatar with new morph targets

Total Frame Budget: 16.67ms (60fps)
├─> Audio Analysis: ~2-5ms
├─> Smoothing: ~0.1ms
├─> Idle Updates: ~0.1ms
├─> Mesh Application: ~0.5ms
└─> GPU Rendering: ~10ms
```

## Memory Management

```
┌──────────────────────────────────────────────────────────┐
│                    Memory Lifecycle                       │
└──────────────────────────────────────────────────────────┘

1. Initialization
   ├─> Create AudioContext        (~50KB)
   ├─> Create AnalyserNode        (~10KB)
   ├─> Allocate frequency buffer  (~4KB for FFT 2048)
   └─> Allocate time buffer       (~4KB)

2. Runtime
   ├─> Audio analysis data        (~8KB, reused)
   ├─> Weight state               (~200 bytes)
   └─> Animation frame data       (~100 bytes)

3. Cleanup
   ├─> Disconnect source
   ├─> Disconnect analyser
   ├─> Close AudioContext
   ├─> Cancel animation frames
   └─> Clear intervals

Total Memory: ~70-100KB per instance
```

## Configuration Presets

```
┌────────────────────────────────────────────────────────────┐
│  Preset: high-quality                                       │
├────────────────────────────────────────────────────────────┤
│  FFT: 2048 | Update: 16ms | Idle: ON                       │
│  CPU: 5-8% | Memory: 70-100KB | Target: Desktop            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Preset: balanced (default)                                 │
├────────────────────────────────────────────────────────────┤
│  FFT: 1024 | Update: 20ms | Idle: ON                       │
│  CPU: 3-5% | Memory: 50-80KB | Target: Web Apps            │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Preset: performance                                        │
├────────────────────────────────────────────────────────────┤
│  FFT: 512 | Update: 33ms | Idle: ON                        │
│  CPU: 2-3% | Memory: 30-60KB | Target: Multiple Avatars    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  Preset: mobile                                             │
├────────────────────────────────────────────────────────────┤
│  FFT: 512 | Update: 50ms | Idle: OFF                       │
│  CPU: 1-2% | Memory: 20-40KB | Target: Mobile Devices      │
└────────────────────────────────────────────────────────────┘
```

## File Structure

```
app/components/
│
├── AdvancedLipSync.tsx              (22KB) Main implementation
│   ├─ useAdvancedLipSync()          Hook
│   ├─ AdvancedLipSyncComponent      Component wrapper
│   ├─ useAudioElement()             Utility hook
│   ├─ useMicrophoneStream()         Utility hook
│   └─ PHONEME_TO_VISEME_MAP         Mapping data
│
├── AdvancedLipSync.types.ts         (7.3KB) TypeScript types
│   ├─ VisemeWeights                 Interface
│   ├─ AudioAnalysisConfig           Interface
│   ├─ IdleAnimationConfig           Interface
│   └─ LipSyncState                  Interface
│
├── AdvancedLipSync.presets.ts       (6.2KB) Preset configs
│   ├─ HIGH_QUALITY_PRESET           Constant
│   ├─ BALANCED_PRESET               Constant
│   ├─ PERFORMANCE_PRESET            Constant
│   ├─ MOBILE_PRESET                 Constant
│   ├─ getPreset()                   Function
│   └─ detectOptimalPreset()         Function
│
├── AdvancedLipSync.utils.ts         (12KB) Utilities
│   ├─ lerp()                        Math function
│   ├─ analyzeFrequencyBands()       Analysis function
│   ├─ PerformanceMonitor            Class
│   ├─ AudioBufferRecorder           Class
│   └─ VisemeTransitionTracker       Class
│
├── AdvancedLipSyncExample.tsx       (12KB) Basic example
├── AdvancedLipSyncDemo.tsx          (14KB) Full demo
├── AdvancedLipSync.index.ts         (2KB) Barrel export
│
├── AdvancedLipSync.README.md        (12KB) API docs
├── AdvancedLipSync.INTEGRATION.md   (13KB) Integration guide
│
└── Documentation:
    ├─ ADVANCED_LIPSYNC_SUMMARY.md   (11KB) Overview
    ├─ LIPSYNC_QUICKSTART.md         (7.9KB) Quick start
    └─ LIPSYNC_ARCHITECTURE.md       (This file)
```

## Integration Points

```
┌─────────────────────────────────────────────────────────┐
│             Your Application                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ├─> Import Hook
                         │   import { useAdvancedLipSync }
                         │
                         ├─> Initialize
                         │   const lipSync = useAdvancedLipSync({...})
                         │
                         ├─> Apply in useFrame
                         │   useFrame(() => {
                         │     lipSync.applyToMesh(mesh)
                         │   })
                         │
                         └─> Cleanup (automatic)
                             useEffect cleanup
```

---

This architecture provides a scalable, performant, and production-ready lip-sync system for 3D avatars in React Three Fiber applications.
