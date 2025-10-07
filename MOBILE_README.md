# Mobile Optimization - The Roof Docs
## iOS Safari Edition with Egyptian Theme

---

## Quick Start

### 1. Generate Icons & Splash Screens (REQUIRED)

```bash
# Install Sharp
npm install sharp

# Generate all icons and splash screens
node scripts/generate-icons.js
```

This will create:
- Apple touch icons (180x180, 152x152, 167x167)
- PWA icons (192x192, 512x512)
- iOS splash screens for all devices
- All with Egyptian theme (red/gold/black)

### 2. Test Locally

```bash
# Build production version
npm run build

# Start server
npm start

# Access from iOS device
# Find your IP: ipconfig (Windows) or ifconfig (Mac)
# Visit: http://[YOUR_IP]:3000
```

### 3. Deploy to Production

```bash
# Deploy to Vercel/Railway
npm run deploy

# Or push to git (auto-deploy)
git add .
git commit -m "Add iOS mobile optimizations"
git push
```

---

## What's Included

### CSS Optimizations (/app/globals.css)
- ✅ Egyptian theme variables (red/gold/black)
- ✅ iOS safe area handling
- ✅ 100vh viewport fix
- ✅ Touch target sizing (44px minimum)
- ✅ Smooth momentum scrolling
- ✅ No-zoom inputs
- ✅ GPU-accelerated animations
- ✅ Pull-to-refresh styling
- ✅ Swipe gesture indicators
- ✅ Haptic feedback visuals
- ✅ Bottom sheet modals
- ✅ Responsive breakpoints

### React Hooks (/hooks/useIOSFeatures.ts)
- `useHapticFeedback()` - Vibration with visual cue
- `useIOSDetection()` - Device info
- `useSafeAreaInsets()` - Dynamic measurements
- `usePullToRefresh()` - Pull-down refresh
- `useSwipeGesture()` - Swipe left/right
- `useLongPress()` - Long press detection
- `useOrientation()` - Portrait/landscape
- `useNetworkStatus()` - Online/offline
- `useKeyboardVisible()` - Keyboard state

### Utilities (/lib/ios-utils.ts)
- Device detection (iOS, iPad, PWA)
- Haptic feedback (6 types)
- Clipboard operations
- Native share sheet
- File downloads
- Notifications
- Image lazy loading
- Viewport fixes

### Documentation
- **IOS_MOBILE_OPTIMIZATION.md** - Complete guide
- **PERFORMANCE_CHECKLIST.md** - Action items
- **IOS_QUICK_REFERENCE.md** - Quick lookup
- **MOBILE_OPTIMIZATION_SUMMARY.md** - Overview
- **MOBILE_README.md** - This file

---

## Usage Examples

### Add Haptic to Button

```tsx
import { useHapticFeedback } from '@/hooks/useIOSFeatures';

export default function MyButton() {
  const haptic = useHapticFeedback();

  return (
    <button
      className="egyptian-button touch-smooth"
      onClick={(e) => {
        haptic('medium', e.currentTarget);
        // Your action
      }}
    >
      Submit
    </button>
  );
}
```

### Pull to Refresh

```tsx
import { usePullToRefresh } from '@/hooks/useIOSFeatures';

export default function MyList() {
  const { isPulling, isRefreshing } = usePullToRefresh(
    async () => await fetchData()
  );

  return (
    <div>
      {isPulling && <div className="pull-to-refresh visible">🔄</div>}
      {/* Your list */}
    </div>
  );
}
```

### Safe Area Padding

```tsx
<header className="safe-area-top bg-egyptian-black">
  {/* Header content */}
</header>

<footer className="safe-area-bottom">
  {/* Footer content */}
</footer>
```

---

## Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device mode (Cmd+Shift+M)
3. Select iPhone/iPad
4. Test all features

### Real iOS Device
1. Find your local IP address
2. Access from iPhone/iPad
3. Test "Add to Home Screen"
4. Test as installed PWA

### Lighthouse Audit
```bash
npx lighthouse http://localhost:3000 --view
```

Target scores: All > 90

---

## Egyptian Theme

### Colors
- Primary Red: `#8B0000`
- Accent Gold: `#D4AF37`
- Background: `#000000`
- Text: `#E8DCC4` (Papyrus)

### CSS Classes
- `.egyptian-button` - Themed button
- `.egyptian-card` - Themed card
- `.egyptian-red-glow` - Red glow effect
- `.egyptian-gold-glow` - Gold glow effect
- `.text-glow-red` - Red text glow
- `.text-glow-gold` - Gold text glow

---

## File Reference

**Modified Files**:
1. `/app/layout.tsx` - iOS meta tags, splash screens
2. `/app/globals.css` - Egyptian theme + iOS optimizations
3. `/public/manifest.json` - PWA configuration

**New Files**:
1. `/lib/ios-utils.ts` - Utility functions (8KB)
2. `/hooks/useIOSFeatures.ts` - React hooks (9KB)
3. `/scripts/generate-icons.js` - Icon generator (11KB)
4. Documentation files (multiple)

---

## Next Steps

### Before Production
1. ✅ Run icon generator
2. ⬜ Test on real iPhone
3. ⬜ Test on real iPad
4. ⬜ Run Lighthouse audit
5. ⬜ Test PWA installation
6. ⬜ Verify all gestures work

### Optional Enhancements
- Service worker for offline mode
- Performance monitoring
- Advanced gesture recognition
- Keyboard shortcuts (iPad)

---

## Support

**Issues?** Check the documentation:
- Full guide: `IOS_MOBILE_OPTIMIZATION.md`
- Quick reference: `IOS_QUICK_REFERENCE.md`
- Performance: `PERFORMANCE_CHECKLIST.md`

**Common Problems**:
- Inputs zoom? → Fixed (16px minimum)
- Safe areas not working? → Check viewport-fit=cover
- 100vh too tall? → Fixed (-webkit-fill-available)
- Haptic not working? → Older devices may not support

---

## Performance Targets

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- Bundle Size: < 300KB (gzipped)

---

**The Roof Docs**
Ancient Wisdom, Modern Protection

Optimized for iOS Safari | Egyptian Theme | PWA Ready
