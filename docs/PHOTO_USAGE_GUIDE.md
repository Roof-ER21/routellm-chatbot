# Photo Reference System - Quick Usage Guide

## For Developers

### How It Works

Susan AI-21 now automatically references photo examples when reps ask visual questions about roofing components. The system:

1. **Detects visual intent** in questions like:
   - "What does X look like?"
   - "Show me X"
   - "Where is X located?"
   - "How do I spot X?"

2. **Extracts roofing terms** from the question:
   - "step flashing", "chimney", "ridge vent", etc.

3. **Searches the photo index** for matching examples

4. **Generates knowledge base links** with search filters

5. **Formats references** naturally in responses

### Example Interaction

**User:** "Where's step flashing on a roof?"

**Susan's Response:**
```
Step flashing is installed along the sides of chimneys and
wall-roof intersections. Each piece should overlap the one
below it by at least 2 inches [1.1].

📸 I have 12 photo examples of step flashing installation.
View examples: /knowledge-base?search=step+flashing
```

### Testing Locally

```bash
# Run photo index tests
npx tsx lib/test-photo-index.ts

# Test API endpoints
curl "http://localhost:4000/api/photos/search?q=step+flashing"
curl "http://localhost:4000/api/photos/search?stats=true"
```

### Adding New Photos

1. Add photo files to `/public/kb-images/`
2. Update `/public/kb-photo-labels.json` with labels
3. Update `/public/kb-images-manifest.json` with filenames
4. Photo index rebuilds automatically

### Customizing Search Terms

Edit `/lib/photo-index.ts`:

```typescript
// Add to componentMap in extractTermsFromLabel()
const componentMap: Record<string, string[]> = {
  'new term': ['new term', 'alias1', 'alias2'],
  // ...
};

// Add to keywordMap in getKeywordsForTerm()
const keywordMap: Record<string, string[]> = {
  'new term': ['keyword1', 'keyword2'],
  // ...
};

// Add to SEARCH_TERM_ALIASES
const SEARCH_TERM_ALIASES: Record<string, string[]> = {
  'user query': ['standardized term'],
  // ...
};
```

## For Susan AI-21

### When to Reference Photos

✅ **DO reference photos when:**
- Rep asks "What does X look like?"
- Rep asks "Where is X?"
- Rep asks "Show me examples"
- Rep is learning to identify components
- Rep is training on damage recognition

❌ **DON'T reference photos when:**
- Question is about codes/regulations
- Question is about pricing/estimates
- Question is theoretical/conceptual
- Photos aren't directly relevant

### How to Format References

**Standard Format:**
```
[Technical explanation...]

📸 I have [N] photo examples of [topic].
View examples: /knowledge-base?search=[term]
```

**Keep it brief:**
- 1-2 lines maximum for photo reference
- Always include the knowledge base link
- Use the 📸 emoji for visibility

**Example:**
```
Ridge vents provide continuous ventilation along the roof
peak. They should extend the full length of the ridge and
be properly sealed [1.1].

📸 I have 15 photo examples of ridge vent installations.
View examples: /knowledge-base?search=ridge+vent
```

## Available Photo Categories

### Component Photos (189)
- Step flashing
- Chimney flashing
- Counter/apron flashing
- Skylight flashing
- Valley flashing

### Ventilation (38)
- Ridge vents
- Exhaust caps
- Vent pipes

### Edge Details (75)
- Drip edge
- Ice and water shield
- Overhangs/eaves
- Gutters

### Damage Examples (100+)
- Hail damage
- Wind damage
- Wear and deterioration
- Missing/cracked shingles

### Inspection (50+)
- Test squares
- Slope overviews
- Elevation views
- Metal work

## API Reference

### Search Photos
```javascript
// Query-based search
fetch('/api/photos/search?q=step+flashing&limit=5')

// Term-based search
fetch('/api/photos/search?term=chimney&limit=10')

// Get statistics
fetch('/api/photos/search?stats=true')
```

### Response Format
```json
{
  "success": true,
  "query": "step flashing",
  "hasVisualIntent": true,
  "suggestedTerms": ["step flashing", "flashing"],
  "photoReferences": [
    {
      "searchTerm": "step flashing",
      "knowledgeBaseUrl": "/knowledge-base?search=step+flashing",
      "totalFound": 12,
      "examples": [...]
    }
  ]
}
```

## Integration Points

### Chat API
`/app/api/chat/route.ts` - System prompt includes photo capability

### Susan Prompts
`/lib/susan-prompts.ts` - Core prompt templates with photo instructions

### Photo Index
`/lib/photo-index.ts` - Indexing and search logic

### Photo Search
`/lib/photo-search.ts` - Query analysis and formatting

### Photo API
`/app/api/photos/search/route.ts` - REST endpoints

## Troubleshooting

### Photos Not Appearing

1. Check photo index stats:
```bash
npx tsx lib/test-photo-index.ts
```

2. Verify JSON files are valid:
```bash
cat public/kb-photo-labels.json | jq .
cat public/kb-images-manifest.json | jq .
```

3. Check photo files exist:
```bash
ls -l public/kb-images/ | wc -l
```

### Search Not Working

1. Test search directly:
```bash
curl "http://localhost:4000/api/photos/search?q=test"
```

2. Check server logs for errors

3. Verify terms are indexed:
```typescript
import { getAllPhotoTerms } from '@/lib/photo-index';
console.log(getAllPhotoTerms());
```

## Performance Notes

- **Index size:** ~500KB in memory
- **Search speed:** Instant (in-memory)
- **Indexed photos:** 299 unique photos, 913 indexed instances
- **Terms:** 46 unique roofing terms

## Future Enhancements

Ideas for improvement:
1. Image similarity search
2. Photo annotations/markup
3. Damage severity tagging
4. Comparison galleries
5. Interactive photo viewer
6. Mobile photo upload integration

---

**System Version:** 1.0
**Last Updated:** 2025-10-27
**Status:** Production Ready ✅
