# Voice Features - Susan 21

## Overview

Susan 21 now includes comprehensive voice-to-text and text-to-voice capabilities, designed specifically for roofing reps working in the field on iPhone/iPad devices. The interface features an Egyptian-themed design with stargate-style controls and hieroglyphic animations.

## Features

### 1. Voice-to-Text (Speech Recognition)
- **Technology**: Web Speech API (iOS Safari compatible)
- **Real-time transcription**: See your words as you speak
- **Automatic submission**: Transcripts are automatically sent to Susan
- **Visual feedback**: Pulsing red glow when listening
- **Error handling**: Graceful degradation if speech recognition fails

### 2. Text-to-Voice (Speech Synthesis)
- **Technology**: Web Speech API SpeechSynthesis
- **Auto-read responses**: Susan speaks her responses aloud
- **Voice selection**: Choose from available iOS voices (Samantha, Karen, Moira, etc.)
- **Speed control**: Adjust speaking rate from 0.5x to 2.0x
- **Toggle control**: "Voice of Ra" button to enable/disable

### 3. Hands-Free Mode
- **Continuous conversation**: Automatically activates listening after each response
- **Field-optimized**: Perfect for roofing reps on ladders or inspecting roofs
- **Visual indicators**: Clear status showing listening/speaking states
- **Easy toggle**: Single button to enable/disable hands-free operation

## User Interface

### Egyptian-Themed Controls

#### Microphone Button (Stargate Style)
- **Appearance**: Circular button with three concentric golden rings
- **Size**: 64px x 64px (large touch target for mobile)
- **States**:
  - **Idle**: Gold glow with microphone icon 🎤
  - **Listening**: Red pulsing glow with animated microphone 🎙️
  - **Animation**: Expanding pulse rings when active

#### Voice of Ra Toggle
- **Appearance**: Icon button with speaker emoji
- **States**:
  - **Enabled**: Gold gradient background with 🔊
  - **Disabled**: Gray background with 🔇
- **Label**: "Voice of Ra" in hieroglyphic-style text

#### Hands-Free Mode Toggle
- **Appearance**: Icon button with hand emoji
- **States**:
  - **Active**: Red gradient with egyptian glow and 🤚
  - **Inactive**: Gray background with ✋
- **Label**: "Hands-Free" text

#### Status Display
- **Real-time indicator**: Shows current state
  - 🔴 Listening...
  - 🟡 Speaking...
  - ⚪ Voice Ready
  - 🟢 Hands-Free Mode Active
- **Transcript preview**: Shows interim and final transcripts
- **Error messages**: Displays any issues

### Settings Panel

Accessible via the ⚙️ button, includes:

1. **Voice Selection**
   - Dropdown of available English voices
   - Shows voice name and locale
   - Default: Best iOS voice (Samantha preferred)

2. **Speaking Rate Slider**
   - Range: 0.5x to 2.0x
   - Default: 1.0x (normal speed)
   - Egyptian-themed slider with gold thumb

3. **Info Section**
   - Explains hands-free mode
   - Describes Voice of Ra feature

## iOS Safari Compatibility

### Supported Features
✅ Speech Recognition (webkitSpeechRecognition)
✅ Speech Synthesis (speechSynthesis)
✅ Real-time transcription
✅ Voice selection
✅ Rate/pitch/volume control

### iOS-Specific Optimizations
- Asynchronous voice loading handled
- Touch targets minimum 44px
- GPU-accelerated animations
- Safe area insets for notch
- Prevented zoom on input focus

### Permissions Required
- **Microphone**: Required for speech recognition
- **User gesture**: iOS requires user interaction to start speech recognition
- **Auto-granted**: Speech synthesis doesn't require permissions

## Usage Guide

### Basic Voice Input

1. **Enable Voice of Ra** (optional but recommended)
   - Tap the Voice of Ra button (🔊/🔇)
   - Gold color indicates it's active

2. **Start Speaking**
   - Tap the microphone button
   - When it glows red, start speaking
   - Watch your words appear in real-time
   - Speak clearly and at normal pace

3. **Send Message**
   - Stop speaking naturally
   - System detects end of speech
   - Message automatically sends to Susan
   - Susan's response appears and is spoken (if Voice of Ra enabled)

### Hands-Free Operation

Perfect for field work when hands are busy:

1. **Enable Hands-Free Mode**
   - Tap the Hands-Free button
   - Button turns red with glow
   - Voice of Ra auto-enables
   - Microphone starts listening

2. **Continuous Conversation**
   - Speak your message
   - Susan responds (spoken aloud)
   - Microphone auto-activates after response
   - Speak next message
   - Repeat as needed

3. **Exit Hands-Free Mode**
   - Tap Hands-Free button again
   - Or tap microphone to stop listening
   - Or tap Voice of Ra to disable voice

### Adjusting Settings

1. **Open Settings**
   - Tap the ⚙️ gear icon

2. **Select Voice**
   - Choose preferred voice from dropdown
   - Try different voices to find your favorite
   - Recommended: Samantha (default iOS voice)

3. **Adjust Speed**
   - Move slider left for slower
   - Move slider right for faster
   - Default 1.0x is natural speaking speed
   - 1.2x-1.5x is good for faster responses

## Technical Architecture

### Core Components

1. **`/lib/voice-service.ts`**
   - Core voice service singleton
   - Handles Web Speech API initialization
   - Voice selection and configuration
   - Error handling and browser detection

2. **`/hooks/useVoiceRecognition.ts`**
   - React hook for speech recognition
   - State management for listening status
   - Transcript handling (interim and final)
   - Auto-restart for continuous mode

3. **`/hooks/useTextToSpeech.ts`**
   - React hook for speech synthesis
   - Voice loading and selection
   - Rate/pitch/volume controls
   - Speaking state management

4. **`/app/components/VoiceControls.tsx`**
   - Egyptian-themed UI component
   - Integrates both hooks
   - Hands-free mode logic
   - Settings panel

### State Flow

```
User taps microphone
  ↓
useVoiceRecognition starts
  ↓
Interim results → Display in UI
  ↓
Final result → onTranscript callback
  ↓
Parent component (page.tsx)
  ↓
sendMessage(transcript)
  ↓
API call to /api/chat
  ↓
Response received
  ↓
If Voice of Ra enabled → speak(response)
  ↓
If Hands-Free enabled → startListening()
```

## Styling

### CSS Classes (from `/app/globals.css`)

- `.voice-mic-button` - Microphone button base
- `.voice-mic-listening` - Listening state animation
- `.voice-pulse-ring` - Expanding pulse animation
- `.voice-speaking` - Speaking shimmer effect
- `.voice-slider` - Custom range slider
- `.voice-hieroglyph-pulse` - Hieroglyphic pulse
- `.voice-wave` - Sound wave visualization

### Animations

1. **`voice-glow-pulse`** - Red pulsing glow (2s loop)
2. **`voice-pulse-expand`** - Expanding rings (1.5s loop)
3. **`voice-shimmer`** - Gold shimmer (2s loop)
4. **`hieroglyph-voice-pulse`** - Icon pulse (1.5s loop)
5. **`voice-wave-pulse`** - Sound wave (1s loop)

### Color Palette

- **Egyptian Red**: `#8B0000` (listening state)
- **Egyptian Gold**: `#D4AF37` (buttons, accents)
- **Egyptian Black**: `#000000` (backgrounds)
- **Papyrus**: `#E8DCC4` (text)

## Browser Support

| Browser | Speech Recognition | Speech Synthesis |
|---------|-------------------|------------------|
| iOS Safari 14+ | ✅ Full Support | ✅ Full Support |
| Chrome Desktop | ✅ Full Support | ✅ Full Support |
| Chrome Android | ✅ Full Support | ✅ Full Support |
| Edge Desktop | ✅ Full Support | ✅ Full Support |
| Firefox Desktop | ❌ Limited | ✅ Full Support |
| Firefox Mobile | ❌ No Support | ✅ Full Support |

**Note**: This feature is primarily designed for iOS Safari, which has full support.

## Troubleshooting

### "Speech recognition not supported"
- **Issue**: Browser doesn't support Web Speech API
- **Solution**: Use iOS Safari, Chrome, or Edge

### Microphone permission denied
- **Issue**: User denied microphone access
- **Solution**:
  1. Go to Settings → Safari → Camera & Microphone
  2. Allow access for the website
  3. Refresh page

### No voices available
- **Issue**: Voices haven't loaded yet (iOS)
- **Solution**: Wait a moment and try again (voices load asynchronously)

### Voice not speaking
- **Issue**: Speech synthesis not working
- **Solution**:
  1. Check Voice of Ra is enabled (gold color)
  2. Check device volume
  3. Check device is not in silent mode (iOS)
  4. Try selecting a different voice

### Transcription inaccurate
- **Issue**: Speech recognition not understanding
- **Solution**:
  1. Speak clearly and at normal pace
  2. Reduce background noise
  3. Use industry-standard terms
  4. Check microphone isn't obstructed

### Hands-free mode not auto-restarting
- **Issue**: Listening doesn't resume after response
- **Solution**:
  1. Disable and re-enable Hands-Free mode
  2. Check no errors in status display
  3. Ensure browser permissions granted

## Performance Considerations

### Optimizations
- GPU-accelerated animations (transform/opacity)
- Debounced state updates
- Lazy voice loading
- Efficient re-renders with useCallback/useMemo

### Mobile Battery
- Voice recognition uses microphone → battery drain
- Hands-free mode → continuous listening → more battery use
- Recommended: Use hands-free sparingly, disable when not needed

### Network Usage
- Speech recognition: Minimal (processed locally on iOS)
- Speech synthesis: None (local processing)
- Chat API: Normal usage

## Accessibility

### Features
- ✅ Large touch targets (64px minimum)
- ✅ High contrast visuals
- ✅ Clear state indicators
- ✅ ARIA labels on buttons
- ✅ Keyboard navigation support
- ✅ Screen reader compatible

### WCAG Compliance
- **Level AA**: Color contrast ratios met
- **Touch Targets**: 44px minimum (iOS HIG)
- **Visual Feedback**: Multiple indicators (color, animation, text)
- **Error Messages**: Clear and descriptive

## Future Enhancements

### Planned Features
- [ ] Wake word detection ("Hey Susan")
- [ ] Voice commands (e.g., "send email", "analyze photo")
- [ ] Multi-language support
- [ ] Voice activity detection (VAD) for better hands-free
- [ ] Noise cancellation
- [ ] Voice biometrics (speaker identification)
- [ ] Offline mode with local models

### Under Consideration
- Custom voice training
- Voice macros/shortcuts
- Voice analytics (tone, sentiment)
- Integration with dictation APIs

## API Reference

### VoiceService

```typescript
import { voiceService } from '@/lib/voice-service';

// Check support
voiceService.isRecognitionSupported(): boolean
voiceService.isSynthesisAvailable(): boolean

// Speech Recognition
const recognition = voiceService.initializeRecognition({
  language: 'en-US',
  continuous: false,
  interimResults: true
});

// Speech Synthesis
voiceService.speak(text, {
  voice: selectedVoice,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0
}, {
  onStart: () => {},
  onEnd: () => {},
  onError: () => {}
});

voiceService.stopSpeaking();
voiceService.pauseSpeaking();
voiceService.resumeSpeaking();

// Voices
const voices = await voiceService.loadVoices();
const bestVoice = voiceService.getBestVoice('en-US');
```

### useVoiceRecognition Hook

```typescript
const {
  isListening,
  transcript,
  interimTranscript,
  confidence,
  error,
  isSupported,
  startListening,
  stopListening,
  toggleListening,
  resetTranscript
} = useVoiceRecognition({
  language: 'en-US',
  continuous: false,
  interimResults: true,
  onFinalResult: (transcript, confidence) => {},
  onError: (error) => {}
});
```

### useTextToSpeech Hook

```typescript
const {
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
  setRate
} = useTextToSpeech({
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  onStart: () => {},
  onEnd: () => {}
});
```

### VoiceControls Component

```typescript
<VoiceControls
  onTranscript={(transcript) => console.log(transcript)}
  onVoiceEnabledChange={(enabled) => console.log(enabled)}
  autoReadResponses={false}
  disabled={false}
  className="custom-class"
/>
```

## Credits

- **Design**: Egyptian theme inspired by ancient hieroglyphics and stargate aesthetics
- **Icons**: Emoji-based for universal compatibility
- **Voice Technology**: Web Speech API (W3C standard)
- **Target Users**: Roofing professionals in the field

## License

Part of Susan 21 - Roofing AI Assistant
© 2025 The Roof Docs

---

**For support or questions, contact the development team.**
