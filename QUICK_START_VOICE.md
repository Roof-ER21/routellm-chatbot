# 🚀 Quick Start: Add Voice to Susan 21

## ⚡ 3-Minute Integration

### Step 1: Import the Component

Open `/app/page.tsx` and add at the top:

```tsx
import TransformersVoiceControls from '@/app/components/TransformersVoiceControls';
```

### Step 2: Add Voice Controls to Your UI

Find your chat interface and add the voice controls:

```tsx
<TransformersVoiceControls
  onTranscript={(text, isFinal) => {
    if (isFinal) {
      // Send to Susan AI - use your existing function
      handleSendMessage(text);
    }
  }}
  onError={(error) => {
    console.error('Voice error:', error);
  }}
  autoInitialize={true}
  showAdvanced={false}
/>
```

### Step 3: Deploy

```bash
git add .
git commit -m "✨ Add Transformers.js voice controls"
git push origin main
```

Done! Railway will auto-deploy to https://s21.up.railway.app

---

## 📱 What You Get

### 3 Voice Modes

**🔵 Real-time Speech (Web Speech API)**
- Fastest response
- Works immediately
- Great for quick questions
- Click the blue mic button

**🟣 Record & Transcribe (Transformers.js)**
- Works offline after model loads
- Better accuracy
- Privacy-first (audio stays local)
- Click the purple mic button

**🟢 Upload Audio File (Transformers.js)**
- Transcribe pre-recorded audio
- Supports mp3, wav, m4a, etc.
- Great for batch processing
- Click the green upload button

---

## 🎯 Integration Examples

### Example 1: Add to Existing Chat UI

If you already have a chat interface with a text input:

```tsx
// Your existing code
<input
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyPress={handleKeyPress}
/>
<button onClick={handleSendMessage}>Send</button>

// ADD THIS: Voice controls above or beside your input
<TransformersVoiceControls
  onTranscript={(text, isFinal) => {
    if (isFinal) {
      setMessage(text); // Fill input
      handleSendMessage(); // Auto-send
    }
  }}
/>
```

### Example 2: Hands-Free Mode

For field reps who want continuous conversation:

```tsx
const [isHandsFree, setIsHandsFree] = useState(false);

<TransformersVoiceControls
  onTranscript={(text, isFinal) => {
    if (isFinal) {
      handleSendMessage(text);

      if (isHandsFree) {
        // Auto-restart listening after Susan responds
        setTimeout(() => {
          // Restart voice after 2 seconds
        }, 2000);
      }
    }
  }}
/>

<button onClick={() => setIsHandsFree(!isHandsFree)}>
  {isHandsFree ? '🔴 Stop' : '🎤'} Hands-Free Mode
</button>
```

### Example 3: Minimal Custom UI

If you want a single button:

```tsx
import { useHybridVoice } from '@/hooks/useHybridVoice';

const { isListening, startListening, stopListening, transcript } = useHybridVoice({
  onTranscript: (text, isFinal) => {
    if (isFinal) handleSendMessage(text);
  }
});

<button onClick={isListening ? stopListening : startListening}>
  {isListening ? '🔴' : '🎤'}
</button>
```

---

## ⚙️ Configuration Options

### Simple (Default)

```tsx
<TransformersVoiceControls
  autoInitialize={true}     // Load model immediately
  showAdvanced={false}       // Hide technical details
/>
```

### Advanced (Show All Options)

```tsx
<TransformersVoiceControls
  autoInitialize={true}
  showAdvanced={true}        // Show model status, mode switcher
  onTranscript={handleTranscript}
  onError={handleError}
/>
```

### Custom Model Size

```tsx
import { useHybridVoice } from '@/hooks/useHybridVoice';

useHybridVoice({
  modelSize: 'tiny',         // 75MB, fast (RECOMMENDED)
  // modelSize: 'base',      // 140MB, better accuracy
  // modelSize: 'small',     // 470MB, best (slow)
});
```

---

## 🧪 Testing on iPhone/iPad

### 1. Deploy to Railway

```bash
git push origin main
# Wait for Railway to deploy (2-3 minutes)
```

### 2. Open on iPhone Safari

```
https://s21.up.railway.app
```

### 3. Test Voice

1. **Allow microphone access** when prompted
2. **Tap the blue mic** for real-time speech
3. **Speak clearly:** "Hello Susan, what's the weather?"
4. **Watch for transcript** to appear
5. **See Susan's response**

### 4. Test Offline (Advanced)

1. **First visit:** Let model download (~75MB, 30-60 sec on 4G)
2. **Enable Airplane Mode**
3. **Tap the purple mic** (Transformers.js mode)
4. **Speak and see it transcribe offline!**

---

## 🐛 Common Issues

### Issue: "Microphone not working"

**Solution:** Check browser permissions

```
Safari → Settings → Website Settings → Microphone → Allow
```

### Issue: "Model won't load"

**Solution:** Check network and wait

```tsx
// Model is ~75MB, takes time on first load
// Check progress in console:
const { loadingProgress } = useHybridVoice();
console.log('Progress:', loadingProgress);
```

### Issue: "Voice transcription is incorrect"

**Solution 1:** Speak more clearly and slower

**Solution 2:** Switch to Transformers.js for better accuracy

```tsx
const { switchToTransformers } = useHybridVoice();
await switchToTransformers(); // Uses AI model (more accurate)
```

**Solution 3:** Use larger model (slower but better)

```tsx
useHybridVoice({ modelSize: 'base' }); // 140MB model
```

---

## 📊 Performance Tips

### For Fast Loading (Recommended)

```tsx
<TransformersVoiceControls
  autoInitialize={true}      // Load in background
  // User can use Web Speech immediately while model loads
/>
```

### For Best Accuracy

```tsx
import { useHybridVoice } from '@/hooks/useHybridVoice';

useHybridVoice({
  modelSize: 'base',         // Better than tiny
  preferTransformers: true,  // Use AI model as primary
});
```

### For Offline-First

```tsx
useHybridVoice({
  preferTransformers: true,  // Force Transformers.js
  preloadTransformers: true, // Load immediately
});
```

---

## 🎨 UI Customization

### Custom Styling

```tsx
<TransformersVoiceControls
  className="my-custom-voice-controls"
  // Add your Tailwind classes or custom CSS
/>
```

### Custom Button Colors

Edit `/app/components/TransformersVoiceControls.tsx`:

```tsx
// Line ~150: Change button colors
className="bg-blue-600 hover:bg-blue-700"   // Real-time
className="bg-purple-600 hover:bg-purple-700" // Recording
className="bg-green-600 hover:bg-green-700"  // Upload
```

### Hide Specific Buttons

```tsx
const {
  startListening,  // Keep this
  // Don't destructure startRecording if you don't want it
} = useHybridVoice();

// Only render what you need
<button onClick={startListening}>🎤 Voice</button>
```

---

## 🚀 Next Steps

### 1. Basic Integration (5 minutes)

- [x] Install dependency (`npm install @huggingface/transformers`)
- [x] Copy component files
- [ ] Add `<TransformersVoiceControls />` to your UI
- [ ] Test on iPhone Safari

### 2. Production Optimization (10 minutes)

- [ ] Add loading indicators
- [ ] Customize button styles
- [ ] Add error handling UI
- [ ] Test offline mode

### 3. Advanced Features (30 minutes)

- [ ] Integrate with Susan's response TTS
- [ ] Add waveform visualization
- [ ] Implement hands-free mode
- [ ] Add voice command shortcuts

---

## 📚 File Reference

All new files created:

```
/lib
  transformers-voice-service.ts    // Core Transformers.js wrapper
  hybrid-voice-service.ts          // Smart routing (Web Speech + Transformers)

/hooks
  useHybridVoice.ts                // React hook for voice

/app/components
  TransformersVoiceControls.tsx    // Ready-to-use UI component

/docs
  TRANSFORMERS_VOICE_README.md     // Full documentation
  QUICK_START_VOICE.md            // This file
```

---

## ✅ Checklist

Before deploying to production:

- [ ] Test on iPhone Safari
- [ ] Test on Android Chrome
- [ ] Test on desktop Chrome/Firefox
- [ ] Test offline mode (Airplane mode)
- [ ] Test with background noise
- [ ] Test audio file uploads
- [ ] Verify HTTPS (required for microphone access)
- [ ] Check model caching works (IndexedDB)
- [ ] Monitor bundle size (<500KB impact)
- [ ] Add error handling for edge cases

---

## 💡 Pro Tips

### Tip 1: Preload for Speed

```tsx
// In your app layout, preload model on first visit
useEffect(() => {
  const { initializeTransformers } = getHybridVoiceService();
  initializeTransformers(); // Load in background
}, []);
```

### Tip 2: Show Loading Progress

```tsx
const { loadingProgress, transformersStatus } = useHybridVoice();

{transformersStatus === 'loading' && (
  <div>
    Loading AI model: {loadingProgress?.progress || 0}%
    <progress value={loadingProgress?.progress} max="100" />
  </div>
)}
```

### Tip 3: Combine with Susan's TTS

```tsx
// After Susan responds, read it aloud
if (susanResponse) {
  const utterance = new SpeechSynthesisUtterance(susanResponse);
  utterance.voice = speechSynthesis.getVoices().find(v => v.name.includes('Kate'));
  speechSynthesis.speak(utterance);
}
```

---

## 🎉 You're All Set!

Your Susan 21 chatbot now has:

- ✅ **Real-time voice** (Web Speech API)
- ✅ **Offline voice** (Transformers.js)
- ✅ **Zero API costs** for transcription
- ✅ **Privacy-first** (audio never leaves device)
- ✅ **iPhone/iPad optimized**
- ✅ **Production-ready** components

**Questions?** Check the full docs: `TRANSFORMERS_VOICE_README.md`

**Need help?** Console logs show detailed info: `[HybridVoice]`, `[TransformersVoice]`

Happy coding! 🚀
