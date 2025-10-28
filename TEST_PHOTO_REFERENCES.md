# Testing Photo Reference System

## Quick Test Guide

### Prerequisites
1. Ensure the app is running: `npm run dev`
2. Log in to Susan AI-21
3. Have photo files available in `/public/kb-images/`

## Test Case 1: Basic Photo Reference

### Test Input
Type in chat:
```
where's drip edge
```

### Expected Response Format from Susan
```
Drip edge [PHOTO:drip edge:1] [PHOTO:drip edge:2] is installed along the eaves and rakes...
```

### Expected Visual Output
- Two 40px x 40px thumbnails appear inline with the text
- Thumbnails have gray border, rounded corners
- Text flows naturally around thumbnails

### Desktop Interaction Tests
1. **Hover Test:**
   - Move mouse over first thumbnail
   - Expected: 200px x 200px preview appears above thumbnail
   - Preview should show larger image with label below
   - Preview has shadow and border

2. **Click Test:**
   - Click on first thumbnail
   - Expected: Navigate to `/knowledge-base?search=drip%20edge`
   - Knowledge base should open with "drip edge" search filter active

### Mobile Interaction Tests
1. **Touch Test:**
   - Tap thumbnail (should not show hover preview)
   - Expected: Navigate to knowledge base immediately

## Test Case 2: Multiple Photo References

### Test Input
```
show me step flashing at chimneys
```

### Expected Response
Should contain multiple photo references like:
```
Step flashing [PHOTO:step flashing:1] [PHOTO:step flashing:2] is installed...
Counter flashing [PHOTO:counter flashing:1] covers the step flashing...
Chimney [PHOTO:chimney:1] shows the complete installation...
```

### Visual Verification
- All thumbnails render correctly
- Each thumbnail is independently clickable
- Each has unique hover preview
- Text remains readable with multiple inline images

## Test Case 3: Loading States

### How to Test
1. Throttle network in DevTools (Slow 3G)
2. Send message with photo references
3. Observe loading behavior

### Expected Behavior
- Gray skeleton boxes appear with pulse animation
- Smooth transition to loaded thumbnails
- No layout shift when images load

## Test Case 4: Error Handling

### Test with Non-Existent Term
Use this in a test message:
```
Here is an example [PHOTO:nonexistentterm:1] of something.
```

### Expected Behavior
- Component renders nothing (invisible)
- Text flows normally as if reference wasn't there
- No error messages in UI
- Console may show error (acceptable for debugging)

## Test Case 5: Mixed Content

### Test Input
```
compare drip edge to step flashing
```

### Expected Response
Should include both types:
```
Drip edge [PHOTO:drip edge:1] is different from step flashing [PHOTO:step flashing:1]...
```

### Visual Verification
- Both photo types render
- Each navigates to correct knowledge base search
- Hover previews show different images

## Manual Verification Checklist

### Visual Design
- [ ] Thumbnails are 40px x 40px
- [ ] Thumbnails have rounded corners
- [ ] Border is visible (2px gray)
- [ ] Hover border changes to red
- [ ] Preview is 200px x 200px
- [ ] Preview has shadow effect
- [ ] Label text is readable

### Functionality
- [ ] Thumbnails appear inline with text
- [ ] Hover preview shows on desktop
- [ ] No hover preview on mobile
- [ ] Click navigates to knowledge base
- [ ] Loading skeleton appears briefly
- [ ] Error states don't break UI

### Performance
- [ ] Photos load quickly (< 500ms)
- [ ] No layout shift when loading
- [ ] Smooth hover transitions
- [ ] No lag when clicking
- [ ] Multiple photos don't slow page

### Accessibility
- [ ] Thumbnails have alt text
- [ ] Buttons have aria-label
- [ ] Clickable with keyboard (tab + enter)
- [ ] Screen reader announces properly

## Browser Compatibility Tests

Test in these browsers:
- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## DevTools Debugging

### Check Console for Errors
```javascript
// Should see:
// [Photo] Fetching photo for term: drip edge, index: 1
// [Photo] Loaded photo: doc1_page2_img1.png

// Should NOT see:
// Error: Photo not found
// TypeError: Cannot read property...
```

### Network Tab
1. Check for image requests
2. Verify thumbnails load: `/kb-images/*_thumb.png`
3. Verify full images load on hover (desktop)
4. Status should be 200 OK

### React DevTools
1. Find `PhotoReference` component
2. Verify props: `{ term: "drip edge", index: 1 }`
3. Check state: `{ photoData: {...}, isLoading: false, hasError: false }`

## Known Issues & Limitations

### Current Limitations
1. Maximum 2 photos per term (index 1 or 2 only)
2. Hover preview only on desktop
3. Preview position always above thumbnail
4. No gallery view (single click navigation)

### Expected Behaviors (Not Bugs)
1. Missing photos render nothing (invisible)
2. Thumbnail fallback to full image if `_thumb.png` missing
3. Console errors for missing photos (debug info)
4. No animation on photo load (instant display)

## Integration Test with Susan Backend

### Modify Backend to Return Photo References

In `/api/chat/route.ts` or Susan's response generation:
```typescript
// Example: Add photo references to responses about drip edge
if (query.toLowerCase().includes('drip edge')) {
  response += '\n\nDrip edge [PHOTO:drip edge:1] [PHOTO:drip edge:2] is installed...'
}
```

### Full Integration Test Flow
1. User asks: "where's drip edge"
2. Backend detects visual query
3. Backend includes `[PHOTO:drip edge:1]` in response
4. Frontend parses and renders PhotoReference component
5. User hovers to preview
6. User clicks to navigate

## Automated Test Script (Future)

```javascript
// Cypress or Playwright test example
describe('Photo Reference System', () => {
  it('should render inline photo thumbnails', () => {
    cy.visit('/')
    cy.get('input').type('where\'s drip edge{enter}')

    // Wait for response
    cy.contains('Drip edge', { timeout: 10000 })

    // Verify thumbnails appear
    cy.get('button').filter('[title*="knowledge base"]').should('have.length.at.least', 1)

    // Test hover (desktop)
    cy.get('button').filter('[title*="knowledge base"]').first().trigger('mouseover')
    cy.get('img').filter('[style*="200px"]').should('be.visible')

    // Test click navigation
    cy.get('button').filter('[title*="knowledge base"]').first().click()
    cy.url().should('include', '/knowledge-base')
    cy.url().should('include', 'search=drip')
  })
})
```

## Performance Benchmarks

### Target Metrics
- First photo render: < 500ms
- Hover preview appearance: < 100ms
- Click navigation: < 200ms
- Multiple photos (4+): < 1000ms total

### Monitoring
Use Chrome DevTools Performance tab:
1. Start recording
2. Send message with photo references
3. Stop recording
4. Check for:
   - Long tasks (> 50ms)
   - Layout shifts
   - Paint operations

## Success Criteria

The photo reference system is working correctly if:

1. ✅ Thumbnails appear inline with text
2. ✅ Hover preview shows on desktop (not mobile)
3. ✅ Click navigates to knowledge base with search filter
4. ✅ Loading states are smooth
5. ✅ Error states don't break UI
6. ✅ Performance is acceptable (< 500ms load)
7. ✅ Mobile is touch-friendly
8. ✅ All supported terms render correctly

## Troubleshooting Guide

### Problem: Photos Not Appearing

**Possible Causes:**
1. Photo files don't exist in `/public/kb-images/`
2. Term not in photo index
3. JavaScript error preventing render

**Solution:**
```bash
# Check if photos exist
ls public/kb-images/ | grep "drip_edge"

# Check photo index
grep "drip edge" lib/photo-index.ts

# Check browser console for errors
# Open DevTools → Console
```

### Problem: Hover Not Working

**Possible Causes:**
1. Testing on mobile (expected behavior)
2. Z-index conflict with other elements
3. Mouse events not firing

**Solution:**
```javascript
// Check if touch device
console.log('Is touch device:', 'ontouchstart' in window)

// Check z-index in DevTools
// Elements tab → Computed → z-index should be 50
```

### Problem: Click Navigation Fails

**Possible Causes:**
1. Next.js router not available
2. URL malformed
3. Knowledge base page doesn't exist

**Solution:**
```javascript
// Check navigation in console
// Should see: Navigating to /knowledge-base?search=...

// Verify router
import { useRouter } from 'next/navigation'
// Check if router.push is a function
```

### Problem: Performance Issues

**Possible Causes:**
1. Too many photos in one message
2. Images not optimized
3. Network throttling

**Solution:**
```bash
# Optimize images
# Thumbnails should be < 10KB
# Full images should be < 100KB

# Check network tab for image sizes
# Images over 200KB should be compressed
```

## Contact & Support

For issues with photo reference system:
1. Check this guide first
2. Review console errors
3. Check photo index and file existence
4. Verify component props in React DevTools

---

**Last Updated:** 2025-10-27
**System Version:** 1.0.0
**Test Status:** Ready for Manual Testing
