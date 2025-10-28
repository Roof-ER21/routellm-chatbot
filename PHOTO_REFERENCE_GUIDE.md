# Photo Reference Component System

## Overview

The Photo Reference Component System allows Susan AI-21 to embed inline, interactive photo thumbnails in chat responses using a simple `[PHOTO:term:N]` syntax.

## Components

### 1. PhotoReference.tsx

The core component that renders individual photo thumbnails.

**Features:**
- 40px x 40px inline thumbnail display
- 200px x 200px hover preview with label (desktop only)
- Click to navigate to Knowledge Base with search filter
- Loading skeleton while fetching data
- Error handling with graceful fallback
- Mobile responsive (touch-friendly, no hover)
- Automatic thumbnail fallback to full image

**Props:**
```typescript
interface PhotoReferenceProps {
  term: string      // Roofing term to search (e.g., "drip edge")
  index: number     // Photo index (1 or 2)
  className?: string // Optional CSS classes
}
```

**Example Usage:**
```tsx
<PhotoReference term="drip edge" index={1} />
```

### 2. MessageWithPhotos.tsx

Wrapper component that parses text for `[PHOTO:term:N]` patterns and renders PhotoReference components inline.

**Features:**
- Regex-based pattern matching
- Preserves text formatting and whitespace
- Handles multiple photo references in one message
- Helper functions for detection and extraction

**Props:**
```typescript
interface MessageWithPhotosProps {
  text: string      // Message text with [PHOTO:term:N] patterns
  className?: string // Optional CSS classes
}
```

**Helper Functions:**
```typescript
// Check if text contains photo references
hasPhotoReferences(text: string): boolean

// Extract all photo references from text
extractPhotoReferences(text: string): Array<{ term: string; index: number }>
```

## Syntax

### Basic Pattern
```
[PHOTO:term:N]
```

- **term**: The roofing term to search for (case-insensitive)
- **N**: Photo index (1 or 2) - which photo to display from search results

### Examples

#### Single Photo Reference
```
Drip edge [PHOTO:drip edge:1] is installed along roof edges.
```

**Renders as:**
> Drip edge [📷] is installed along roof edges.

#### Multiple Photo References
```
Step flashing [PHOTO:step flashing:1] [PHOTO:step flashing:2] prevents water intrusion.
```

**Renders as:**
> Step flashing [📷] [📷] prevents water intrusion.

#### Mixed Terms
```
Compare chimney flashing [PHOTO:chimney:1] to counter flashing [PHOTO:counter flashing:1].
```

**Renders as:**
> Compare chimney flashing [📷] to counter flashing [📷].

## Integration with page.tsx

The main chat page has been updated to automatically detect and render photo references:

```tsx
{message.role === 'assistant' && hasPhotoReferences(message.content) ? (
  <MessageWithPhotos text={cleanMarkdown(message.content)} />
) : (
  <p className="whitespace-pre-wrap break-words leading-relaxed">
    {message.content}
  </p>
)}
```

## User Experience

### Desktop Experience
1. User sees 40px thumbnail inline with text
2. Hovering shows 200px preview with label
3. Clicking navigates to `/knowledge-base?search=term`

### Mobile Experience
1. User sees 40px thumbnail inline with text
2. No hover preview (touch devices don't support hover)
3. Tapping navigates to `/knowledge-base?search=term`

### Loading State
- Gray skeleton box with pulse animation while fetching photo data

### Error Handling
- If photo doesn't exist, component renders nothing (invisible)
- If thumbnail fails, automatically tries full image URL
- Console errors logged for debugging

## Supported Roofing Terms

The system supports all terms indexed in `/lib/photo-index.ts`:

### Common Terms
- `drip edge` - Drip edge examples
- `step flashing` - Step flashing installation
- `chimney` - Chimney and flashing examples
- `ridge vent` - Ridge ventilation systems
- `skylight` - Skylight and flashing
- `valley` - Valley flashing examples
- `exhaust cap` - Exhaust vent caps
- `shingle damage` - Damage examples
- `ice and water shield` - Underlayment examples
- `overhang` - Eave and soffit examples

### How It Works
1. Component calls `getTopPhotoReferences(term, index)`
2. Function searches photo index for matching terms
3. Returns actual image URLs and metadata
4. Component renders thumbnail with hover preview
5. Click navigates to Knowledge Base with search filter

## Example Susan Response

**Input Query:**
```
"Where's drip edge installed?"
```

**Susan Response (with photo references):**
```
Drip edge [PHOTO:drip edge:1] [PHOTO:drip edge:2] is installed along the eaves
and rakes of a roof. It's a metal strip that extends beyond the edge of the roof
to direct water away from the fascia and into the gutters.

Key installation points:
- Along all eaves (bottom edges)
- Along all rakes (side edges)
- Under the first course of shingles
- Over the ice and water shield [PHOTO:ice and water shield:1]
```

**Rendered Output:**
> Drip edge [📷] [📷] is installed along the eaves and rakes of a roof...
> (Each 📷 is an actual 40px clickable/hoverable thumbnail)

## Testing

### Manual Test Cases

1. **Basic Rendering:**
   - Send message: "where's drip edge"
   - Verify thumbnails appear inline
   - Verify hover preview shows (desktop)
   - Verify click navigates to knowledge base

2. **Multiple References:**
   - Send message with 4+ photo references
   - Verify all render correctly
   - Verify each has unique hover preview

3. **Invalid Term:**
   - Use `[PHOTO:nonexistent:1]`
   - Verify component renders nothing (invisible)
   - Verify no errors in UI

4. **Mobile:**
   - Open on mobile device
   - Verify thumbnails are touch-friendly
   - Verify no hover preview
   - Verify tap navigation works

5. **Loading State:**
   - Verify skeleton animation appears briefly
   - Verify smooth transition to loaded state

## Performance Considerations

- **Lazy Loading:** Photos only fetched when component mounts
- **Thumbnail Optimization:** Uses `_thumb.png` for 40px display
- **Fallback Strategy:** Falls back to full image if thumbnail missing
- **Mobile Detection:** Disables hover preview on touch devices
- **Error Boundaries:** Failed photos don't break the UI

## File Locations

```
/app/components/PhotoReference.tsx       - Individual photo component
/app/components/MessageWithPhotos.tsx    - Text parser wrapper
/app/page.tsx                            - Main chat page (integrated)
/lib/photo-search.ts                     - Photo search utilities
/lib/photo-index.ts                      - Photo indexing system
/public/kb-images/                       - Photo storage directory
```

## Future Enhancements

Potential improvements:
1. Support for ranges: `[PHOTO:drip edge:1-3]` (multiple photos)
2. Gallery view on click (instead of navigation)
3. Lazy loading images as user scrolls
4. Preloading hover preview images
5. Animated transitions for hover preview
6. Photo comparison mode (side-by-side)
7. Zoom on click (modal view)

## Troubleshooting

### Photos Not Appearing
- Check that term exists in photo index
- Verify image files exist in `/public/kb-images/`
- Check browser console for errors
- Verify photo index matches manifest

### Hover Preview Not Showing
- Check if device is mobile (hover disabled on touch)
- Verify z-index is not blocked by other elements
- Check for CSS conflicts

### Click Navigation Not Working
- Verify Next.js router is available
- Check network tab for navigation request
- Verify knowledge base page exists

### Performance Issues
- Check if too many photos in one message
- Verify thumbnail images are optimized
- Consider implementing intersection observer for lazy loading

## API Reference

### getTopPhotoReferences(term: string, limit: number)

Returns array of photo references for a given term.

```typescript
import { getTopPhotoReferences } from '@/lib/photo-search'

const photos = getTopPhotoReferences('drip edge', 2)
// Returns: [
//   {
//     id: "doc1_page2_img1",
//     term: "drip edge",
//     imageUrl: "/kb-images/doc1_page2_img1.png",
//     thumbnailUrl: "/kb-images/doc1_page2_img1_thumb.png",
//     label: "Drip edge installation along eave",
//     documentId: "doc1",
//     knowledgeBaseUrl: "/knowledge-base?search=drip%20edge&doc=doc1"
//   },
//   ...
// ]
```

## Production Checklist

Before deploying:
- [ ] All photo files optimized (thumbnails < 10KB)
- [ ] Photo index is up to date
- [ ] Error handling tested
- [ ] Mobile responsive verified
- [ ] Loading states working
- [ ] Navigation URLs correct
- [ ] Performance acceptable (< 100ms load)
- [ ] Accessibility tested (screen readers)
- [ ] Browser compatibility verified

---

**Last Updated:** 2025-10-27
**Version:** 1.0.0
**Author:** Susan AI-21 Development Team
