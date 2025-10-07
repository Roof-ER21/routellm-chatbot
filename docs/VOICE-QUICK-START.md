# Voice Quick Start Guide - Susan 21 iOS

## For Field Technicians (Susan 21 Users)

### Getting Started with Voice

1. **Enable Microphone Access**
   - Tap the microphone button 🎤
   - Tap "Enable Microphone" on the permission screen
   - Allow microphone access when iOS prompts you

2. **Using Voice Commands**
   - Tap the microphone button to start listening (turns red 🎙️)
   - Speak your command clearly
   - The app will automatically process and respond
   - Tap again to stop listening

3. **Hands-Free Mode** (⚡ Advanced)
   - Tap "Hands-Free" button in voice controls
   - Susan will automatically listen after each response
   - Perfect for continuous conversation while working

4. **Voice of Ra** (🔊 Text-to-Speech)
   - Tap "Voice of Ra" button to enable
   - Susan will speak her responses aloud
   - Adjust speed in voice settings (⚙️)

### Quick Voice Commands

Just say:
- "Susan, document hail damage" - Start damage documentation
- "Susan, cite IRC flashing code" - Get building code references
- "Susan, draft appeal letter" - Generate template
- "Susan, analyze photo" - Trigger photo analysis
- "Susan, help with measurements" - Get guidance
- "Susan, emergency contact" - Get emergency assistance

### Troubleshooting

**Microphone not working?**
1. Go to iPhone Settings
2. Scroll to Safari
3. Tap "Microphone"
4. Enable for Susan 21 website
5. Reload the page

**Voice stops randomly?**
- Normal on iOS Safari - it will auto-restart
- Keep screen on for best results
- Use "Hands-Free" mode for continuous operation

**No sound when Susan speaks?**
- Check device volume
- Turn off silent mode
- Try selecting different voice in settings

---

## For Developers

### Quick Implementation

#### 1. Basic Voice Recognition

```typescript
import { useVoice } from '@/hooks/useVoice';

function MyComponent() {
  const { isListening, transcript, startListening, stopListening } = useVoice({
    continuous: true,
    interimResults: true,
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        console.log('User said:', text);
      }
    }
  });

  return (
    <button onClick={isListening ? stopListening : startListening}>
      {isListening ? 'Stop' : 'Start'} Listening
    </button>
  );
}
```

#### 2. Basic Text-to-Speech

```typescript
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

function MyComponent() {
  const { speak, isSpeaking, stop } = useTextToSpeech();

  const handleSpeak = () => {
    speak('Hello from Susan AI');
  };

  return (
    <button onClick={isSpeaking ? stop : handleSpeak}>
      {isSpeaking ? 'Stop' : 'Speak'}
    </button>
  );
}
```

#### 3. Ready-Made Components

```typescript
import VoiceButton from '@/components/VoiceButton';

function MyComponent() {
  return (
    <VoiceButton
      onTranscript={(text, isFinal) => {
        if (isFinal) processCommand(text);
      }}
      size="lg"
      showWaveform={true}
    />
  );
}
```

```typescript
import VoiceCommandPanel from '@/components/VoiceCommandPanel';

function MyComponent() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <button onClick={() => setShowPanel(true)}>
        Open Voice Panel
      </button>

      <VoiceCommandPanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        onCommand={(cmd) => processCommand(cmd)}
        repName="John Smith"
      />
    </>
  );
}
```

### iOS Safari Compatibility Checklist

- ✅ Use `useVoice` hook (handles all iOS quirks)
- ✅ Request permission before first use
- ✅ Handle interruptions (phone calls, etc.)
- ✅ Use wake lock for long sessions
- ✅ Provide clear visual feedback
- ✅ Large touch targets (64px minimum)
- ✅ Safe area inset support
- ✅ Landscape mode optimization

### Testing on iOS

```bash
# 1. Run development server
npm run dev

# 2. Get local IP address
ifconfig | grep "inet "

# 3. Open on iOS Safari
# https://YOUR_IP:4000

# 4. Accept certificate warning (dev only)
```

### Performance Tips

1. **Debounce voice input:**
   ```typescript
   useVoice({ debounceMs: 300 })
   ```

2. **Clean up on unmount:**
   ```typescript
   useEffect(() => {
     return () => {
       stopListening();
       stop();
     };
   }, []);
   ```

3. **Use GPU acceleration:**
   ```tsx
   <div className="gpu-accelerated">
     {/* Animated content */}
   </div>
   ```

### Common Patterns

#### Voice + Chat Integration
```typescript
const [messages, setMessages] = useState([]);

const handleVoiceTranscript = (transcript: string) => {
  // Add user message
  setMessages(prev => [...prev, {
    role: 'user',
    content: transcript
  }]);

  // Send to API
  sendMessage(transcript);
};

<VoiceButton onTranscript={handleVoiceTranscript} />
```

#### Auto-Read Responses
```typescript
const { speak } = useTextToSpeech();
const [voiceEnabled, setVoiceEnabled] = useState(false);

useEffect(() => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'assistant' && voiceEnabled) {
    speak(lastMessage.content);
  }
}, [messages, voiceEnabled]);
```

#### Hands-Free Conversation
```typescript
const [handsFree, setHandsFree] = useState(false);

const { speak, isSpeaking } = useTextToSpeech({
  onEnd: () => {
    if (handsFree) {
      setTimeout(() => startListening(), 500);
    }
  }
});

const { startListening, stopListening } = useVoice({
  onTranscript: async (text, isFinal) => {
    if (isFinal) {
      const response = await processCommand(text);
      if (handsFree) {
        speak(response);
      }
    }
  }
});
```

---

## File Locations

### Hooks
- `/app/hooks/useVoice.ts` - Main voice recognition
- `/app/hooks/useTextToSpeech.ts` - Text-to-speech
- `/app/hooks/useVoiceRecognition.ts` - Compatibility wrapper

### Components
- `/app/components/VoiceButton.tsx` - Standalone button
- `/app/components/VoiceCommandPanel.tsx` - Full-screen panel
- `/app/components/VoiceControls.tsx` - Integrated control bar

### Styles
- `/app/globals.css` - Voice animations (search "VOICE CONTROLS")

### Documentation
- `/docs/iOS-VOICE-OPTIMIZATION.md` - Full technical guide
- `/docs/VOICE-QUICK-START.md` - This file

---

## Support

**For Users:**
- Check microphone permissions in iOS Settings
- Ensure Safari is up to date
- Try reloading the page

**For Developers:**
- See `/docs/iOS-VOICE-OPTIMIZATION.md` for detailed guide
- Check browser console for errors
- Test on physical iOS device (not simulator)

---

**Last Updated:** 2025-10-05
**Status:** Production Ready ✅
