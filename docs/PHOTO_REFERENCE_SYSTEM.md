# Photo Reference System - Susan AI-21

## Overview

Susan AI-21 now has access to 299 professional roofing photo examples from the knowledge base. She can intelligently reference these photos when answering questions about roof components, damage identification, installation techniques, and inspection procedures.

## System Components

### 1. Photo Index (`/lib/photo-index.ts`)

The photo index creates a searchable database of all roofing photos by:
- Parsing photo labels from `kb-photo-labels.json`
- Extracting roofing terminology from each label
- Creating keyword mappings for search aliases
- Building an inverted index for fast lookups

**Key Functions:**
- `searchPhotos(query, limit)` - Search photos by query string
- `getPhotosByTerm(term)` - Get all photos for a specific term
- `getPhotoIndexStats()` - Get index statistics
- `getAllPhotoTerms()` - List all indexed terms

### 2. Photo Search Service (`/lib/photo-search.ts`)

Provides intelligent search and query analysis:
- Detects visual intent in user queries
- Extracts roofing terms from natural language
- Generates knowledge base URLs with search filters
- Formats photo references for Susan's responses

**Key Functions:**
- `searchPhotoExamples(query, limit)` - Search with results formatting
- `isVisualQuery(query)` - Detect if query requests visual examples
- `extractRoofingTerms(query)` - Extract roofing terms from text
- `analyzeQueryForPhotos(query)` - Complete query analysis

### 3. Photo Search API (`/app/api/photos/search/route.ts`)

RESTful API for photo search:

**GET Endpoints:**
```
GET /api/photos/search?q=step+flashing&limit=5
GET /api/photos/search?term=chimney&limit=10
GET /api/photos/search?stats=true
```

**POST Endpoint:**
```json
POST /api/photos/search
{
  "query": "What does step flashing look like?",
  "limit": 10
}
```

## Indexed Photo Categories

The system indexes 299 photos across these categories:

### Flashing Types (189 photos)
- Step flashing (wall/chimney intersections)
- Chimney flashing (base and counter flashing)
- Counter/Apron flashing (wall transitions)
- Skylight flashing (curb flashing)
- Valley flashing
- Other flashing types

### Ventilation (38 photos)
- Ridge vents
- Exhaust caps
- Vent pipes and penetrations

### Edge Details (75 photos)
- Drip edge
- Ice and water shield
- Overhangs and eaves
- Gutters and covers

### Damage Examples (100+ photos)
- Shingle damage (hail, wind, wear)
- Granule loss
- Missing or cracked shingles
- Storm damage

### Inspection Areas (50+ photos)
- Test squares
- Roof slopes
- Elevation views
- Metal work

### Additional Categories
- House overviews
- Interior/attic views
- Metal trim details

## How Susan References Photos

### Automatic Detection

Susan detects when to reference photos based on:

1. **Visual Keywords:**
   - "what does X look like"
   - "show me X"
   - "where is X"
   - "how do I spot X"

2. **Roofing Terms:**
   - Automatically extracts terms like "step flashing", "chimney", "ridge vent"
   - Maps aliases (e.g., "eave" → "overhang")

3. **Context:**
   - Installation questions
   - Damage identification
   - Training requests
   - Inspection guidance

### Reference Format

Susan uses this natural format:

```
[Technical explanation of the component...]

📸 I have 12 photo examples of step flashing installation.
View examples: /knowledge-base?search=step+flashing
```

### Example Responses

**Question:** "Where's step flashing on a roof?"

**Susan's Response:**
```
Step flashing is installed along the sides of chimneys and
wall-roof intersections. Each piece should overlap the one
below it by at least 2 inches to prevent water infiltration [1.1].

📸 I have 12 photo examples of step flashing installation.
View examples: /knowledge-base?search=step+flashing
```

**Question:** "What does hail damage look like?"

**Susan's Response:**
```
Hail damage typically appears as circular bruises on shingles
with exposed fiberglass mat, loss of granules in concentrated
areas, or small indentations. Look for random patterns across
the roof, not in lines [2.3].

📸 I have 45 photo examples of shingle damage.
View examples: /knowledge-base?search=shingle+damage
```

## System Prompt Integration

The photo capability is added to Susan's system prompt in `/app/api/chat/route.ts`:

```typescript
PHOTO EXAMPLES CAPABILITY:
You have access to 299 professional roofing photo examples...

WHEN TO REFERENCE PHOTOS:
- Visual identification questions
- Damage recognition queries
- Installation guidance requests
- Training questions

HOW TO REFERENCE PHOTOS:
Format: "📸 I have [N] photo examples of [topic].
View examples: /knowledge-base?search=[term]"

PHOTO REFERENCE RULES:
✅ Only mention when relevant
✅ Keep references brief (1-2 lines)
✅ Always provide KB link
✅ Use 📸 emoji for visibility
❌ Don't force into every response
```

## Search Term Mapping

Common roofing terms are mapped for better search:

| User Term | Maps To |
|-----------|---------|
| "sidewall flashing" | step flashing |
| "fireplace" | chimney |
| "peak" | ridge, ridge vent |
| "eave" | overhang, drip edge |
| "iws" | ice and water shield |
| "hail damage" | shingle damage, damage |
| "penetration" | exhaust cap, skylight |

## Testing

Run the test suite to verify functionality:

```bash
npx tsx lib/test-photo-index.ts
```

This tests:
- Index statistics
- Term searches
- Visual query detection
- Term extraction
- Full query analysis
- Direct term lookup

## Performance

- **Index size:** 46 unique terms
- **Total photos:** 913 indexed instances (299 unique photos)
- **Search speed:** Instant (in-memory index)
- **Memory footprint:** ~500KB for full index

## Future Enhancements

Potential improvements:
1. Add fuzzy matching for typos
2. Implement image similarity search
3. Add photo tagging by damage severity
4. Create photo galleries by topic
5. Add photo comparison features
6. Implement photo annotation viewer

## API Usage Examples

### Get Index Statistics
```javascript
fetch('/api/photos/search?stats=true')
  .then(r => r.json())
  .then(data => console.log(data.stats))
```

### Search by Term
```javascript
fetch('/api/photos/search?term=chimney&limit=5')
  .then(r => r.json())
  .then(data => console.log(data.examples))
```

### Analyze Query
```javascript
fetch('/api/photos/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: "What does step flashing look like?",
    limit: 10
  })
})
.then(r => r.json())
.then(data => console.log(data.photoReferences))
```

## Maintenance

### Adding New Photos

When new photos are added to the knowledge base:

1. Update `kb-photo-labels.json` with new labels
2. Update `kb-images-manifest.json` with new filenames
3. Photo index rebuilds automatically on module load
4. No code changes required

### Adding New Terms

To add new roofing terminology:

1. Update `extractTermsFromLabel()` in `photo-index.ts`
2. Add keyword mappings in `getKeywordsForTerm()`
3. Add search aliases in `SEARCH_TERM_ALIASES`

## File Locations

```
/lib/photo-index.ts              # Core indexing system
/lib/photo-search.ts             # Search service
/lib/test-photo-index.ts         # Test suite
/app/api/photos/search/route.ts  # REST API
/app/api/chat/route.ts           # Susan system prompt integration
/public/kb-photo-labels.json     # Photo labels (299 photos)
/public/kb-images-manifest.json  # Image filenames
/public/kb-images/               # Actual photo files
```

## Benefits

1. **Enhanced Training:** Reps can see visual examples instantly
2. **Better Understanding:** Visual context improves learning
3. **Faster Answers:** Direct links to relevant photos
4. **Consistent References:** Standardized photo linking
5. **Improved UX:** Natural language photo discovery
6. **Knowledge Preservation:** Professional photo library indexed

## Support

For questions or issues:
- Check test output: `npx tsx lib/test-photo-index.ts`
- Review API logs for search errors
- Verify photo files exist in `/public/kb-images/`
- Confirm JSON data files are valid

---

**Last Updated:** 2025-10-27
**System Version:** 1.0
**Total Photos Indexed:** 299
