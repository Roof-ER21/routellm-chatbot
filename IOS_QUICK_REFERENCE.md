# iOS Quick Reference Card
## The Roof Docs - Egyptian Theme

---

## CSS Classes

### Safe Areas
```css
.safe-area-top          /* Padding for notch */
.safe-area-bottom       /* Padding for home indicator */
.safe-area-left         /* Padding for left edge */
.safe-area-right        /* Padding for right edge */
.status-bar-safe        /* Status bar specific */
.home-indicator-safe    /* Home indicator specific */
```

### Egyptian Theme
```css
.egyptian-button        /* Red/gold button with glow */
.egyptian-button-circle /* Circular button variant */
.egyptian-card          /* Themed card container */
.egyptian-pattern       /* Hieroglyphic background */
.egyptian-red-glow      /* Red glow effect */
.egyptian-gold-glow     /* Gold glow effect */
.text-glow-red          /* Red text glow */
.text-glow-gold         /* Gold text glow */
```

### Touch & Gestures
```css
.touch-smooth           /* Smooth touch feedback */
.touch-action-pan-y     /* Vertical scroll only */
.touch-action-pan-x     /* Horizontal scroll only */
.swipeable              /* Enable swipe gestures */
.haptic-active          /* Visual haptic feedback */
```

### Performance
```css
.gpu-accelerated        /* Force GPU rendering */
.lazy-image             /* Lazy load images */
.lazy-image-skeleton    /* Egyptian loading skeleton */
.animating              /* Optimize during animation */
```

### Modals
```css
.ios-modal-overlay      /* Blurred dark overlay */
.ios-bottom-sheet       /* iOS-style bottom sheet */
```

---

## React Hooks

### Import
```tsx
import {
  useHapticFeedback,
  useIOSDetection,
  useSafeAreaInsets,
  usePullToRefresh,
  useSwipeGesture,
  useLongPress,
  useOrientation,
  useNetworkStatus,
  useKeyboardVisible
} from '@/hooks/useIOSFeatures';
```

### Haptic Feedback
```tsx
const haptic = useHapticFeedback();

<button onClick={(e) => {
  haptic('medium', e.currentTarget);
  // Your action
}}>
  Click Me
</button>

// Types: 'light', 'medium', 'heavy', 'success', 'warning', 'error'
```

### Device Detection
```tsx
const { isIOS, isIPad, isPWA, isTouch } = useIOSDetection();

{isIOS && <div>iOS-specific content</div>}
{isIPad && <div>iPad layout</div>}
{isPWA && <div>Running as PWA</div>}
```

### Safe Area Insets
```tsx
const insets = useSafeAreaInsets();

<div style={{ paddingTop: insets.top }}>
  Content
</div>
```

### Pull to Refresh
```tsx
const { isPulling, isRefreshing } = usePullToRefresh(
  async () => {
    await fetchData();
  },
  { threshold: 80 }
);

{isPulling && <div className="pull-to-refresh visible">🔄</div>}
```

### Swipe Gestures
```tsx
const swipeDirection = useSwipeGesture(
  () => console.log('Left'),
  () => console.log('Right'),
  { threshold: 50 }
);

<div className={`swipeable ${swipeDirection ? 'swiping' : ''}`}>
  Swipe me
</div>
```

### Long Press
```tsx
const longPressHandlers = useLongPress(
  () => console.log('Long press'),
  { threshold: 500 }
);

<div {...longPressHandlers}>Hold me</div>
```

### Orientation
```tsx
const orientation = useOrientation();

{orientation === 'portrait' && <div>Portrait layout</div>}
{orientation === 'landscape' && <div>Landscape layout</div>}
```

### Network Status
```tsx
const isOnline = useNetworkStatus();

{!isOnline && <div>Offline mode</div>}
```

### Keyboard Visibility
```tsx
const isKeyboardVisible = useKeyboardVisible();

<div className={isKeyboardVisible ? 'keyboard-open' : ''}>
  Content adjusts for keyboard
</div>
```

---

## Utility Functions

### Import
```tsx
import {
  triggerHaptic,
  isIOS,
  isIOSPWA,
  isIPad,
  copyToClipboard,
  shareContent,
  downloadFile,
  showIOSNotification,
  lazyLoadImage,
  preloadImages
} from '@/lib/ios-utils';
```

### Haptic
```tsx
triggerHaptic('light');    // Subtle
triggerHaptic('medium');   // Standard
triggerHaptic('heavy');    // Strong
triggerHaptic('success');  // 3 taps
triggerHaptic('warning');  // 2 taps
triggerHaptic('error');    // 3 strong taps
```

### Clipboard
```tsx
const copied = await copyToClipboard('Text to copy');
if (copied) {
  triggerHaptic('success');
}
```

### Share
```tsx
const shared = await shareContent({
  title: 'The Roof Docs',
  text: 'Check out this roofing analysis',
  url: window.location.href
});
```

### Download
```tsx
const blob = new Blob([data], { type: 'application/pdf' });
downloadFile(blob, 'report.pdf');
```

### Notifications
```tsx
const permission = await requestIOSNotificationPermission();
if (permission === 'granted') {
  showIOSNotification('Title', {
    body: 'Message',
    icon: '/apple-touch-icon.png'
  });
}
```

### Lazy Load
```tsx
const img = document.querySelector('img');
lazyLoadImage(img, '/path/to/image.jpg');
```

### Preload
```tsx
preloadImages([
  '/apple-touch-icon.png',
  '/icon-192.png'
]);
```

---

## Color Palette

```css
/* CSS Variables */
var(--color-egyptian-red)         /* #8B0000 */
var(--color-egyptian-red-light)   /* #DC143C */
var(--color-egyptian-gold)        /* #D4AF37 */
var(--color-egyptian-gold-light)  /* #FFD700 */
var(--color-egyptian-gold-dark)   /* #B8860B */
var(--color-egyptian-black)       /* #000000 */
var(--color-egyptian-black-light) /* #1a1a1a */
var(--color-egyptian-stone)       /* #2a2a2a */
var(--color-papyrus)              /* #E8DCC4 */
```

---

## Responsive Breakpoints

```css
/* iPhone Portrait */
@media screen and (max-width: 428px) and (orientation: portrait) {
  /* 375px - 428px */
}

/* iPhone Landscape */
@media screen and (max-height: 428px) and (orientation: landscape) {
  /* Reduce vertical spacing */
}

/* iPad Portrait */
@media screen and (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  /* 768px - 1024px */
}

/* iPad Landscape */
@media screen and (min-width: 1024px) and (max-width: 1366px) and (orientation: landscape) {
  /* 1024px - 1366px */
}
```

---

## Common Patterns

### Button with Haptic
```tsx
const haptic = useHapticFeedback();

<button
  className="egyptian-button touch-smooth gpu-accelerated"
  onClick={(e) => {
    haptic('medium', e.currentTarget);
    handleAction();
  }}
>
  Submit
</button>
```

### Modal with Safe Areas
```tsx
{isOpen && (
  <>
    <div className="ios-modal-overlay" onClick={onClose} />
    <div className="ios-bottom-sheet safe-area-bottom">
      <h2>Modal Title</h2>
      {/* Content */}
    </div>
  </>
)}
```

### Swipeable Card
```tsx
useSwipeGesture(
  () => nextCard(),
  () => prevCard()
);

<div className="swipeable egyptian-card">
  <div className="swipe-indicator-left">◀</div>
  <div className="swipe-indicator-right">▶</div>
  {/* Card content */}
</div>
```

### Image with Lazy Load
```tsx
<img
  src="placeholder.jpg"
  data-src="actual-image.jpg"
  loading="lazy"
  className="lazy-image"
  onLoad={(e) => e.currentTarget.classList.add('loaded')}
  alt="Description"
/>
```

### Header with Safe Area
```tsx
<header className="safe-area-top bg-egyptian-black">
  <div className="max-w-7xl mx-auto px-6 py-4">
    {/* Header content */}
  </div>
</header>
```

### Footer with Home Indicator
```tsx
<footer className="home-indicator-safe bg-egyptian-stone">
  {/* Footer content */}
</footer>
```

---

## Performance Tips

1. **GPU Acceleration**: Add `gpu-accelerated` class to animated elements
2. **Will-Change**: Use `animating` class during animations only
3. **Touch Events**: Use `{ passive: true }` for scroll listeners
4. **Images**: Always use `loading="lazy"` and `lazy-image` class
5. **Code Splitting**: Dynamic import heavy components
6. **Memoization**: Use `React.memo`, `useCallback`, `useMemo`

---

## Testing

### Chrome DevTools
```
1. Open DevTools (F12)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select iPhone/iPad
4. Enable touch simulation
5. Test gestures
```

### Real Device
```
1. Build: npm run build
2. Start: npm start
3. Get local IP: ipconfig / ifconfig
4. Access from device: http://[IP]:3000
5. Test PWA: Add to Home Screen
```

### Lighthouse
```bash
npx lighthouse http://localhost:3000 --view
```

---

## File Locations

- **Layout**: `/Users/a21/routellm-chatbot-railway/app/layout.tsx`
- **Styles**: `/Users/a21/routellm-chatbot-railway/app/globals.css`
- **Hooks**: `/Users/a21/routellm-chatbot-railway/hooks/useIOSFeatures.ts`
- **Utils**: `/Users/a21/routellm-chatbot-railway/lib/ios-utils.ts`
- **Manifest**: `/Users/a21/routellm-chatbot-railway/public/manifest.json`
- **Docs**: `/Users/a21/routellm-chatbot-railway/IOS_MOBILE_OPTIMIZATION.md`

---

## Egyptian Theme Animations

### Hieroglyphic Pulse
```css
.hieroglyph-loading {
  animation: hieroglyph-pulse 2s ease-in-out infinite;
}
```

### Egyptian Shimmer
```css
.egyptian-shimmer {
  background: linear-gradient(90deg, ...);
  animation: egyptian-shimmer 3s linear infinite;
}
```

### Haptic Pulse (Visual)
```css
.haptic-active {
  animation: haptic-pulse 0.4s ease-out;
}
```

---

## Shortcuts

### Install PWA
- iOS: Share → Add to Home Screen
- Android: Menu → Install App

### DevTools
- Device Emulation: `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Windows)
- Performance: `Cmd+Shift+P` → "Performance"
- Network: `Cmd+Shift+P` → "Network"

---

**The Roof Docs** - Ancient Wisdom, Modern Protection
