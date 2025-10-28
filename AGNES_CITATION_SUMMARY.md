# Agnes Citation Fix - Executive Summary

## The Problem
Agnes responses showed incorrect citation format:
```
❌ BEFORE: "...according to the materials [source](search_result_8)[source](search_result_9)"
✅ AFTER:  "...according to Q301 [8.1] and Q302 [8.2]"
```

## Root Cause
The AI was not mentioning Q-numbers (training material IDs like Q301, Q502) in its responses, so the citation injection system had nothing to match and convert to citation markers.

## The Solution
**Explicitly instructed the AI to ALWAYS use Q-numbers when citing training materials.**

### Three-Part Fix:

#### 1. Enhanced System Prompts
- Added "CRITICAL - ALWAYS CITE Q-NUMBERS!" instructions
- Provided clear examples of proper Q-number usage
- Emphasized inline Q-number format (not parentheses or brackets)

#### 2. Enhanced Training Context
- Added reminder at the top of training data context
- Explicit instruction: "When you cite information from below, mention the Q-number inline"

#### 3. Added Debug Logging
- Log AI response before citation injection
- Log Q-numbers detected in response
- Log final citation count and IDs

## Files Modified

| File | Changes |
|------|---------|
| `lib/agnes-prompts.ts` | Enhanced SOURCE INTEGRATION section (lines 153-165)<br>Enhanced TRAINING DATA INTEGRATION for roleplay (lines 242-252) |
| `app/api/agnes-chat/route.ts` | Enhanced training context instructions (lines 122-123)<br>Added debug logging (lines 189-210) |
| `lib/agnes-citation-tracker.ts` | Added debug logging (lines 131-137) |

## How It Works

### Step 1: AI receives explicit instructions
```
"IMPORTANT: You MUST reference Q-numbers when citing training materials.
Format: Mention the Q-number naturally - just 'Q503' inline in text."
```

### Step 2: AI responds with Q-numbers
```
"According to Q301, drip edge is required at all eaves and rakes..."
```

### Step 3: Citation injection matches and converts
```
Input:  "According to Q301, drip edge is required..."
Output: "According to Q301 [8.1], drip edge is required..."
```

### Step 4: Citation object created
```javascript
{
  number: "8.1",
  documentId: "Q301",
  documentTitle: "Drip edge isn't required in Virginia.",
  category: "training",
  snippet: "To whom it may concern, You've denied drip edge...",
  preview: "To whom it may concern...",
  metadata: {
    source: "susan_ai.docx",
    confidence_level: "high"
  }
}
```

## Testing

### Quick Test
1. Ask Agnes: "What are the drip edge requirements in Virginia?"
2. Check server logs for:
   ```
   [Citation Tracker] Q-numbers found in response: ['Q301']
   [Agnes] Injected 1 citations
   ```
3. Verify response contains `Q301 [8.1]`

### Expected Behavior

**Expert Mode:**
```
User: "Tell me about drip edge requirements"
Agnes: "Great question! According to Q301 [8.1], drip edge is required..."
Citations: [{number: "8.1", documentId: "Q301", ...}]
```

**Roleplay Mode (Coaching):**
```
Agnes: "[AGNES COACHING]
Good job! You cited the code correctly, which aligns with Q301 [8.1]
about drip edge requirements. Consider also mentioning Q302 [8.2] about
step flashing replacement..."

Citations: [{number: "8.1", documentId: "Q301", ...},
           {number: "8.2", documentId: "Q302", ...}]
```

## Success Metrics

✅ AI responses contain Q-numbers (Q301, Q502, etc.)
✅ Server logs show "Q-numbers found in response"
✅ Citations array length > 0
✅ Frontend displays clickable [8.1], [8.2] markers
✅ Citation preview opens on click
✅ No raw markdown links

## Troubleshooting

### If citations still don't appear:

**Check 1: Training data loading**
```bash
# Should see in logs:
[Agnes] Loaded 300 training items
```

**Check 2: Q-numbers in AI response**
```bash
# Should see in logs:
[Citation Tracker] Q-numbers found in response: ['Q301', ...]
```

**Check 3: Citation injection working**
```bash
# Should see in logs:
[Agnes] Injected 2 citations
[Agnes] Citation IDs: ['Q301', 'Q302']
```

## Why This Fix Works

### Before:
- System prompt: Generic "reference training materials"
- AI response: "According to the training materials, drip edge is required..."
- Citation injection: **No Q-numbers to match** ❌
- Result: No citations injected

### After:
- System prompt: **"ALWAYS cite Q-numbers"** with examples
- AI response: "According to Q301, drip edge is required..."
- Citation injection: **Matches Q301** ✅
- Result: Q301 → [8.1] + citation object created

## Additional Documentation

- **AGNES_CITATION_FIX.md** - Detailed technical explanation
- **TESTING_AGNES_CITATIONS.md** - Step-by-step testing guide

## Deployment Checklist

- [ ] Code changes deployed
- [ ] Training data files present and valid
- [ ] Server restarted to load new prompts
- [ ] Test with simple question
- [ ] Test with multiple citations
- [ ] Test roleplay coaching feedback
- [ ] Monitor logs for 24 hours
- [ ] Verify frontend citation display
- [ ] Remove debug logging (optional)

## Next Steps

1. **Deploy immediately** - These changes are backward compatible
2. **Monitor closely** - Watch server logs for citation detection
3. **Iterate if needed** - If AI still doesn't use Q-numbers, make prompts even more explicit
4. **Clean up** - Once stable, reduce debug logging for production

---

**Expected Time to Fix**: Immediate (prompt changes only, no breaking changes)
**Risk Level**: Low (enhanced prompts, backward compatible)
**Impact**: High (fixes critical citation functionality)
