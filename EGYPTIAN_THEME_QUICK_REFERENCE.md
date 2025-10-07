# Egyptian Theme - Quick Reference Guide

## Quick Copy-Paste Snippets

### Egyptian Logo (House with Circular Border)
```tsx
<div className="egyptian-circle-border w-16 h-16 flex items-center justify-center bg-gradient-to-br from-egyptian-red to-egyptian-red-light egyptian-gold-glow">
  <svg className="w-10 h-10 text-egyptian-gold-light" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
</div>
```

### App Title with Tagline
```tsx
<div>
  <h1 className="text-3xl font-bold tracking-tight text-glow-gold">
    THE <span className="text-egyptian-gold-light">ROOF DOCS</span>
  </h1>
  <p className="text-xs text-egyptian-gold uppercase tracking-widest">
    Ancient Wisdom, Modern Protection
  </p>
</div>
```

### Egyptian Button
```tsx
<button className="egyptian-button">
  Your Text Here
</button>
```

### Egyptian Circular Button
```tsx
<button className="egyptian-button-circle egyptian-gold-glow">
  <span className="text-2xl">📎</span>
</button>
```

### Egyptian Card
```tsx
<div className="egyptian-card p-6">
  Your content here
</div>
```

### Papyrus Texture Background
```tsx
<div className="papyrus-texture p-8">
  Your content here
</div>
```

### Hieroglyphic Pattern Background
```tsx
<div className="egyptian-pattern">
  Your content here
</div>
```

---

## Color Palette CSS Variables

### In Tailwind Classes
Use with `bg-`, `text-`, `border-`, etc.

```
egyptian-red
egyptian-red-light
egyptian-gold
egyptian-gold-light
egyptian-gold-dark
egyptian-brass
egyptian-black
egyptian-black-light
egyptian-stone
egyptian-stone-light
papyrus
papyrus-dark
```

### Example Usage
```tsx
<div className="bg-egyptian-black border-2 border-egyptian-gold text-papyrus">
  Content with Egyptian colors
</div>
```

---

## Effect Classes

### Glow Effects
```tsx
<div className="egyptian-red-glow">Red glow shadow</div>
<div className="egyptian-gold-glow">Gold glow shadow</div>
```

### Text Glow
```tsx
<h1 className="text-glow-red">Red glowing text</h1>
<h1 className="text-glow-gold">Gold glowing text</h1>
```

---

## iOS Safe Area Classes

```tsx
<header className="safe-area-top">Header with notch safety</header>
<footer className="safe-area-bottom">Footer with home indicator safety</footer>
<div className="safe-area-left safe-area-right">Sides with safety</div>
```

---

## Loading Animations

### Hieroglyphic Pulse
```tsx
<div className="w-3 h-3 bg-egyptian-gold rounded-full hieroglyph-loading"></div>
```

### Egyptian Shimmer
```tsx
<div className="h-4 w-32 egyptian-shimmer rounded"></div>
```

---

## Mobile Optimizations

### Touch-Friendly
```tsx
<button className="egyptian-button touch-smooth">
  Touch-optimized button
</button>
```

### GPU Accelerated
```tsx
<div className="gpu-accelerated">
  Hardware-accelerated animations
</div>
```

### iOS Container
```tsx
<div className="ios-container">
  Full-height scrollable content
</div>
```

---

## Complete Component Examples

### Header
```tsx
<header className="bg-egyptian-black text-papyrus shadow-2xl border-b-4 border-egyptian-gold egyptian-red-glow safe-area-top">
  <div className="max-w-7xl mx-auto px-6 py-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="egyptian-circle-border w-16 h-16 flex items-center justify-center bg-gradient-to-br from-egyptian-red to-egyptian-red-light">
          <svg className="w-10 h-10 text-egyptian-gold-light" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-glow-gold">
            THE <span className="text-egyptian-gold-light">ROOF DOCS</span>
          </h1>
          <p className="text-xs text-egyptian-gold uppercase tracking-widest">
            Ancient Wisdom, Modern Protection
          </p>
        </div>
      </div>
    </div>
  </div>
</header>
```

### Feature Card
```tsx
<div className="egyptian-card p-6 hover:border-egyptian-gold-light hover:egyptian-gold-glow transition-all">
  <div className="flex items-start gap-4">
    <div className="egyptian-button-circle egyptian-gold-glow">
      <span className="text-3xl">📎</span>
    </div>
    <div>
      <h3 className="font-bold text-egyptian-gold-light mb-2 uppercase tracking-wide">
        Feature Title
      </h3>
      <p className="text-sm text-papyrus">
        Feature description goes here
      </p>
    </div>
  </div>
</div>
```

### Chat Message (User)
```tsx
<div className="max-w-[80%] rounded-2xl p-5 shadow-xl bg-gradient-to-br from-egyptian-red to-egyptian-red-light text-papyrus border-2 border-egyptian-gold egyptian-red-glow">
  <div className="flex items-start gap-3">
    <div className="text-2xl">👤</div>
    <div className="flex-1">
      <p className="whitespace-pre-wrap">User message here</p>
      <p className="text-xs mt-2 text-egyptian-gold-light">12:34 PM</p>
    </div>
  </div>
</div>
```

### Chat Message (Assistant)
```tsx
<div className="max-w-[80%] rounded-2xl p-5 shadow-xl egyptian-card text-papyrus">
  <div className="flex items-start gap-3">
    <div className="egyptian-circle-border w-10 h-10 flex items-center justify-center bg-gradient-to-br from-egyptian-gold to-egyptian-gold-dark">
      <svg className="w-6 h-6 text-egyptian-red" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>
    </div>
    <div className="flex-1">
      <p className="whitespace-pre-wrap">Assistant message here</p>
      <p className="text-xs mt-2 text-egyptian-stone-light">12:34 PM</p>
    </div>
  </div>
</div>
```

### Input Form
```tsx
<div className="bg-egyptian-stone border-t-2 border-egyptian-gold p-4 shadow-2xl safe-area-bottom egyptian-pattern">
  <form className="max-w-5xl mx-auto">
    <div className="flex gap-3">
      <button
        type="button"
        className="egyptian-button-circle egyptian-gold-glow hover:scale-110 transition-transform"
        title="Upload"
      >
        <span className="text-2xl">📎</span>
      </button>

      <input
        type="text"
        placeholder="Type your message..."
        className="flex-1 bg-egyptian-black-light border-2 border-egyptian-gold focus:border-egyptian-gold-light rounded-xl px-5 py-4 text-papyrus placeholder-egyptian-stone-light focus:outline-none focus:ring-4 focus:ring-egyptian-gold-glow transition-all"
      />

      <button type="submit" className="egyptian-button">
        Send
      </button>
    </div>
  </form>
</div>
```

### Modal/Bottom Sheet
```tsx
<div className="ios-modal-overlay">
  <div className="ios-bottom-sheet p-6">
    <h2 className="text-2xl font-bold text-egyptian-gold-light mb-4 uppercase tracking-wide">
      Modal Title
    </h2>
    <p className="text-papyrus mb-6">
      Modal content goes here
    </p>
    <div className="flex gap-3">
      <button className="egyptian-button flex-1">
        Confirm
      </button>
      <button className="egyptian-button flex-1">
        Cancel
      </button>
    </div>
  </div>
</div>
```

### Loading State
```tsx
<div className="flex justify-center items-center gap-3">
  <div className="egyptian-circle-border w-10 h-10 flex items-center justify-center bg-gradient-to-br from-egyptian-gold to-egyptian-gold-dark">
    <svg className="w-6 h-6 text-egyptian-red" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  </div>
  <div className="flex gap-2">
    <div className="w-3 h-3 bg-egyptian-gold rounded-full hieroglyph-loading" style={{animationDelay: '0ms'}}></div>
    <div className="w-3 h-3 bg-egyptian-gold rounded-full hieroglyph-loading" style={{animationDelay: '200ms'}}></div>
    <div className="w-3 h-3 bg-egyptian-gold rounded-full hieroglyph-loading" style={{animationDelay: '400ms'}}></div>
  </div>
</div>
```

---

## Responsive Breakpoints

### Mobile First Approach
```tsx
{/* Mobile: Full width */}
<div className="w-full md:w-1/2 lg:w-1/3">
  Content
</div>

{/* Mobile: Stack vertically, Tablet: 2 columns, Desktop: 3 columns */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Device Specific
```
sm: 640px   (Large phones)
md: 768px   (Tablets)
lg: 1024px  (Small laptops)
xl: 1280px  (Desktops)
2xl: 1536px (Large screens)
```

---

## SVG House Icon (Logo)

Use this SVG path for the house icon representing "The Roof Docs":

```tsx
<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
</svg>
```

---

## Gradients

### Red Gradient (Primary)
```tsx
<div className="bg-gradient-to-br from-egyptian-red to-egyptian-red-light">
  Red gradient background
</div>
```

### Gold Gradient (Accent)
```tsx
<div className="bg-gradient-to-br from-egyptian-gold to-egyptian-gold-dark">
  Gold gradient background
</div>
```

### Stone Gradient (Background)
```tsx
<div className="bg-gradient-to-br from-egyptian-stone to-egyptian-black-light">
  Stone gradient background
</div>
```

---

## Best Practices

1. **Always use safe area classes** for headers and footers on mobile
2. **Combine effects** for richer visuals (e.g., `egyptian-card egyptian-gold-glow`)
3. **Use circular borders** for important icons and logos
4. **Apply touch-smooth** class to all interactive elements on mobile
5. **Use hieroglyph-loading** for loading indicators instead of generic spinners
6. **Maintain contrast** - papyrus text on black backgrounds, gold accents
7. **Add hover effects** with `hover:egyptian-gold-glow` and `hover:scale-110`
8. **Use uppercase + tracking-wide** for important headings
9. **Apply GPU acceleration** to animated elements with `gpu-accelerated`
10. **Test on real iOS devices** to verify safe areas and touch targets

---

## Common Patterns

### Page Background
```tsx
<div className="min-h-screen bg-egyptian-black egyptian-pattern">
  {/* Content */}
</div>
```

### Section Container
```tsx
<section className="max-w-7xl mx-auto px-6 py-8">
  {/* Content */}
</section>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Items */}
</div>
```

### Flex Layout
```tsx
<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
  {/* Items */}
</div>
```

---

## Accessibility Checklist

- [ ] All buttons have min 44px touch targets
- [ ] Focus states visible (gold outline)
- [ ] Color contrast meets WCAG AA
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Reduced motion respected

---

## Performance Tips

1. Use `gpu-accelerated` class for smooth animations
2. Limit glow effects to important elements (CPU intensive)
3. Use `will-change` only during active animations
4. Optimize images and lazy load where possible
5. Test on lower-end iOS devices (iPhone SE, older iPads)

---

**Last Updated:** 2025-10-05
**Version:** 1.0
