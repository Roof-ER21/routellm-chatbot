# Performance Optimization Checklist
## The Roof Docs - iOS Mobile

---

## Immediate Performance Wins

### 1. Image Optimization

- [ ] **Generate Apple touch icons** at required sizes:
  - 180x180px (iPhone)
  - 152x152px (iPad)
  - 167x167px (iPad Pro)

- [ ] **Generate splash screens** for all iOS devices (see layout.tsx)

- [ ] **Optimize existing images**:
  ```bash
  # Use Sharp or ImageMagick
  npm install sharp

  # Create optimized versions
  npx sharp -i original.png -o icon-192.png --resize 192 192
  npx sharp -i original.png -o icon-512.png --resize 512 512
  ```

- [ ] **Add lazy loading** to all images:
  ```tsx
  <img
    src="/path/to/image.jpg"
    loading="lazy"
    className="lazy-image"
  />
  ```

### 2. Code Splitting

- [ ] **Dynamic imports** for heavy components:
  ```tsx
  const EmailGenerator = dynamic(() => import('./components/EmailGenerator'), {
    loading: () => <div className="egyptian-shimmer">Loading...</div>
  });
  ```

- [ ] **Route-based splitting** (Next.js handles automatically)

- [ ] **Component-level splitting** for modals:
  ```tsx
  const UnifiedAnalyzerModal = dynamic(() => import('./components/UnifiedAnalyzerModal'));
  ```

### 3. Critical CSS

- [ ] **Extract critical CSS** for above-the-fold content
- [ ] **Inline critical styles** in `<head>`
- [ ] **Defer non-critical CSS**

### 4. Font Loading

- [ ] **Preload critical fonts**:
  ```html
  <link rel="preload" href="/fonts/egyptian.woff2" as="font" type="font/woff2" crossorigin>
  ```

- [ ] **Use font-display: swap**:
  ```css
  @font-face {
    font-display: swap;
  }
  ```

---

## API Optimizations

### 1. Request Optimization

- [ ] **Implement request debouncing** for search/autocomplete
- [ ] **Use SWR or React Query** for data fetching
- [ ] **Cache API responses** locally (localStorage/IndexedDB)
- [ ] **Implement pagination** for large datasets

### 2. Background Sync

- [ ] **Service worker** for offline functionality
- [ ] **Background sync** for form submissions
- [ ] **Cache-first strategy** for static assets

---

## Rendering Optimizations

### 1. React Performance

- [ ] **Memoize expensive components**:
  ```tsx
  const MemoizedComponent = React.memo(MyComponent);
  ```

- [ ] **Use useCallback** for event handlers:
  ```tsx
  const handleClick = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  ```

- [ ] **Use useMemo** for expensive calculations:
  ```tsx
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);
  ```

- [ ] **Virtualize long lists** (react-window or react-virtualized)

### 2. Animation Performance

- [ ] **Use CSS transforms** instead of position changes
- [ ] **Limit will-change** usage (only during animation)
- [ ] **Use requestAnimationFrame** for JS animations
- [ ] **Avoid layout thrashing** (batch DOM reads/writes)

---

## Bundle Optimization

### 1. Tree Shaking

- [ ] **Remove unused dependencies**:
  ```bash
  npm prune
  npx depcheck
  ```

- [ ] **Use named imports**:
  ```tsx
  // Good
  import { useState } from 'react';

  // Bad
  import React from 'react';
  const { useState } = React;
  ```

### 2. Compression

- [ ] **Enable Gzip/Brotli** on server
- [ ] **Minify CSS/JS** (Next.js handles this)
- [ ] **Optimize images** (WebP, AVIF formats)

### 3. Bundle Analysis

- [ ] **Run bundle analyzer**:
  ```bash
  npm install --save-dev @next/bundle-analyzer

  # In next.config.js
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })

  # Run analysis
  ANALYZE=true npm run build
  ```

---

## iOS-Specific Optimizations

### 1. Viewport & Scrolling

- [x] **Fix 100vh issue** (already implemented)
- [x] **Enable momentum scrolling** (already implemented)
- [x] **Prevent zoom on input** (already implemented)
- [ ] **Test on actual iOS devices**

### 2. Touch Performance

- [x] **44px minimum touch targets** (already implemented)
- [x] **Haptic feedback** (already implemented)
- [ ] **Optimize touch event handlers** (use passive listeners):
  ```tsx
  element.addEventListener('touchstart', handler, { passive: true });
  ```

### 3. PWA Optimizations

- [ ] **Generate all required icons**
- [ ] **Create splash screens** for all devices
- [ ] **Test "Add to Home Screen"**
- [ ] **Test offline functionality**

---

## Network Optimizations

### 1. Resource Hints

- [x] **Preconnect to APIs** (already in layout.tsx)
- [ ] **DNS prefetch** for external resources
- [ ] **Preload critical resources**

### 2. Caching Strategy

- [ ] **Service worker** implementation:
  ```tsx
  // public/sw.js
  const CACHE_NAME = 'roof-docs-v1';
  const ASSETS_TO_CACHE = [
    '/',
    '/globals.css',
    '/icon-192.png',
    '/icon-512.png'
  ];
  ```

- [ ] **HTTP caching headers** (on server)
- [ ] **CDN** for static assets (Vercel Edge)

---

## Monitoring & Metrics

### 1. Performance Monitoring

- [ ] **Lighthouse CI** in build pipeline
- [ ] **Web Vitals tracking**:
  ```tsx
  import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
  ```

- [ ] **Real User Monitoring** (RUM) with Vercel Analytics

### 2. Error Tracking

- [ ] **Sentry** or similar for error tracking
- [ ] **Performance budgets**:
  ```json
  {
    "budgets": [
      {
        "resourceSizes": [
          { "resourceType": "script", "budget": 300 },
          { "resourceType": "style", "budget": 100 }
        ]
      }
    ]
  }
  ```

---

## Database & API

### 1. Query Optimization

- [ ] **Add indexes** to frequently queried fields
- [ ] **Optimize JOIN queries**
- [ ] **Use database connection pooling**
- [ ] **Implement query caching**

### 2. API Response Optimization

- [ ] **Compress responses** (gzip)
- [ ] **Implement pagination**
- [ ] **Return only necessary fields**
- [ ] **Use GraphQL** for flexible queries (optional)

---

## Quick Command Reference

```bash
# Build and analyze bundle
ANALYZE=true npm run build

# Test production build locally
npm run build && npm start

# Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Check bundle size
npm run build
du -sh .next/static

# Optimize images with Sharp
npm install -g sharp-cli
sharp -i input.png -o output.png --resize 512 512 --webp

# Test PWA
npx lighthouse http://localhost:3000 --preset=desktop --view

# Check for unused dependencies
npx depcheck

# Security audit
npm audit
```

---

## Target Metrics

### Core Web Vitals

- **LCP** (Largest Contentful Paint): < 2.5s ✅
- **FID** (First Input Delay): < 100ms ✅
- **CLS** (Cumulative Layout Shift): < 0.1 ✅

### Additional Metrics

- **FCP** (First Contentful Paint): < 1.8s
- **TTI** (Time to Interactive): < 3.8s
- **Speed Index**: < 3.4s
- **Total Bundle Size**: < 300KB (gzipped)

---

## Egyptian Theme Performance

### Gradient Optimization

- [ ] **Use solid colors** for static elements
- [ ] **Limit gradient usage** to key UI elements
- [ ] **Cache gradient backgrounds** (CSS custom properties)

### Animation Performance

- [x] **GPU acceleration** (already implemented)
- [x] **will-change optimization** (already implemented)
- [ ] **Reduce animation complexity** on low-end devices

### Glow Effects

- [ ] **Optimize box-shadow layers** (max 3 layers)
- [ ] **Use filter: drop-shadow** for better performance
- [ ] **Disable on low-end devices**

---

## Testing Commands

```bash
# iOS Safari Simulation (Chrome DevTools)
# 1. Open Chrome DevTools
# 2. Toggle device toolbar (Cmd+Shift+M)
# 3. Select iPad/iPhone
# 4. Enable touch simulation

# Test different network speeds
# Chrome DevTools > Network > Throttling > Slow 3G

# Test offline mode
# Chrome DevTools > Network > Offline

# Performance profiling
# Chrome DevTools > Performance > Record
```

---

## Asset Generation

### Icons

```bash
# Install Sharp
npm install sharp

# Node script to generate all icons
node scripts/generate-icons.js
```

### Splash Screens

```bash
# Use pwa-asset-generator
npx pwa-asset-generator icon.png public/splash --scrape false --portrait-only --type png --padding "20px" --background "#000000"
```

---

## Deployment Checklist

- [ ] **Run production build** locally
- [ ] **Test on real iOS devices** (iPhone & iPad)
- [ ] **Run Lighthouse audit** (score > 90)
- [ ] **Test offline mode**
- [ ] **Verify PWA installability**
- [ ] **Check bundle size** (< 300KB)
- [ ] **Test all gestures** (swipe, pull-to-refresh, haptic)
- [ ] **Verify safe areas** on notched devices
- [ ] **Test both orientations**
- [ ] **Verify Egyptian theme** colors/animations

---

## Priority Order

### High Priority (Do First)

1. ✅ iOS viewport fixes
2. ✅ Touch target sizes
3. ✅ Safe area handling
4. ⬜ Generate all icons/splash screens
5. ⬜ Code splitting for modals
6. ⬜ Image lazy loading

### Medium Priority

7. ⬜ Service worker implementation
8. ⬜ Bundle analysis & optimization
9. ⬜ API response caching
10. ⬜ Performance monitoring

### Low Priority

11. ⬜ Advanced animations
12. ⬜ Additional PWA features
13. ⬜ GraphQL implementation (optional)

---

## Notes

- All CSS optimizations are already implemented in `/Users/a21/routellm-chatbot-railway/app/globals.css`
- React hooks are ready in `/Users/a21/routellm-chatbot-railway/hooks/useIOSFeatures.ts`
- Utility functions available in `/Users/a21/routellm-chatbot-railway/lib/ios-utils.ts`
- Next.js handles most bundling/minification automatically

**Next Steps**: Generate icons and splash screens, then test on real iOS devices.
