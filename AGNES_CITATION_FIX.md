# Agnes Citation System Fix

## Problem Analysis

The Agnes citation system was not injecting citations properly. The response showed raw markdown links like `[source](search_result_8)[source](search_result_9)` instead of the expected `[8.1][8.2]` format.

### Root Cause

The AI was **not mentioning Q-numbers in its responses**, so the `injectAgnesCitations` function had nothing to match and convert to citation markers.

The citation injection function works by:
1. Scanning the AI response for Q-numbers (Q301, Q502, etc.)
2. Replacing those Q-numbers with formatted citation markers like `[8.1]`
3. Building a citations array with document details

**If the AI doesn't mention Q-numbers, there's nothing to inject!**

## Solution Implemented

### 1. Enhanced System Prompt Instructions

**File**: `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-prompts.ts`

Added explicit instructions in multiple places:

#### Expert Mode (lines 153-165)
```typescript
## SOURCE INTEGRATION (CRITICAL - ALWAYS CITE Q-NUMBERS!)

**IMPORTANT**: You MUST reference Q-numbers when citing training materials. This is required for proper citation tracking.

Reference training materials conversationally:
✅ "Your training materials Q503 outline three specific steps..."
✅ "According to Q502, the IRC requires..."
✅ "Per Q301, drip edge is required..."
✅ "The training Q504 shows proper installation..."

❌ Avoid: "See reference Q503." or "Citation: [Q503]" or generic "training materials say..."

**Format**: Mention the Q-number naturally in the sentence WITHOUT parentheses or brackets - just "Q503" inline in text. The system will automatically convert these to citation markers.
```

#### Roleplay Mode (lines 242-252)
```typescript
TRAINING DATA INTEGRATION (CRITICAL - USE Q-NUMBERS!):
**ALWAYS cite Q-numbers** when referencing training materials in your coaching feedback.
Reference Q301-Q600 training materials using the Q-number inline in your text.

✅ Examples:
- "Good use of code citation! That aligns with Q506 about manufacturer guidelines."
- "Per Q301, drip edge is required at all eaves and rakes in Virginia."
- "You should have referenced Q502 about step flashing replacement requirements."
- "According to Q304, explain why flashing must be replaced even if it looks fine."

❌ Do NOT use generic references like "the training materials" or "according to best practices" - ALWAYS use the specific Q-number.
```

### 2. Enhanced Training Context

**File**: `/Users/a21/Desktop/routellm-chatbot-railway/app/api/agnes-chat/route.ts` (lines 121-137)

Modified the training context to explicitly remind the AI to use Q-numbers:

```typescript
if (relevantTraining.length > 0) {
  trainingContext = '\n\n[TRAINING DATA CONTEXT - IMPORTANT: Reference these Q-numbers in your response!]:\n'
  trainingContext += '[When you cite information from below, mention the Q-number inline, like "According to Q301" or "Per Q502"]\n\n'

  relevantTraining.forEach(item => {
    const qNumber = item.id || 'Unknown'
    // ... rest of context building
  })
}
```

### 3. Added Debug Logging

**File**: `/Users/a21/Desktop/routellm-chatbot-railway/app/api/agnes-chat/route.ts` (lines 189-203)

```typescript
// DEBUG: Log AI response before citation injection
console.log('[Agnes] AI Response (first 500 chars):', response.message.substring(0, 500))
console.log('[Agnes] Looking for Q-numbers in response...')

const citedResponse = injectAgnesCitations(
  response.message,
  agnesTrainingData,
  susanKnowledgeBase
)

console.log('[Agnes] Injected', citedResponse.citations.length, 'citations')
console.log('[Agnes] Citation IDs:', citedResponse.citations.map(c => c.documentId))
console.log('[Agnes] Cited text (first 500 chars):', citedResponse.text.substring(0, 500))
```

**File**: `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-citation-tracker.ts` (lines 131-137)

```typescript
console.log('[Citation Tracker] Q-numbers in map:', Array.from(qNumberMap.keys()).slice(0, 10))
console.log('[Citation Tracker] Response text length:', responseText.length)

// Extract all Q-numbers from response for debugging
const debugPattern = /Q\d{3,4}/g
const foundQNumbers = responseText.match(debugPattern) || []
console.log('[Citation Tracker] Q-numbers found in response:', foundQNumbers)
```

## How Citation Injection Works

### Pattern Matching

The `injectAgnesCitations` function looks for three patterns:

1. **Direct Q-numbers**: `Q503`, `Q502`
   - Replaced with: `Q503 [8.1]`, `Q502 [8.2]`

2. **Prefixed Q-numbers**: `Per Q503`, `According to Q502`, `Reference Q504`
   - Replaced with: `Per Q503 [8.1]`, `According to Q502 [8.2]`

3. **Wrapped Q-numbers**: `(Q503)`, `[Q502]`
   - Replaced with: `[8.1]`, `[8.2]`

### Citation Object Structure

Each citation gets a structured object:

```typescript
{
  number: "8.1",              // Display format
  categoryNumber: 8,          // Training category
  documentNumber: 1,          // Sequential number
  documentId: "Q503",         // Original Q-number
  documentTitle: "...",       // Question or title
  category: "training",
  snippet: "...",            // First 200 chars
  preview: "...",            // First 100 chars
  metadata: {
    source: "susan_ai.docx",
    confidence_level: "high"
  }
}
```

## Testing the Fix

### 1. Check Server Logs

When you make a request to Agnes, look for these log messages:

```
[Agnes] Loaded X training items
[Agnes] Loaded X scenario items
[Agnes] Loaded X knowledge base items
[Agnes] Calling AI provider with X messages
[Agnes] AI Response (first 500 chars): ...
[Agnes] Looking for Q-numbers in response...
[Citation Tracker] Q-numbers in map: ['Q301', 'Q302', 'Q303', ...]
[Citation Tracker] Response text length: XXXX
[Citation Tracker] Q-numbers found in response: ['Q301', 'Q502', ...]
[Agnes] Injected X citations
[Agnes] Citation IDs: ['Q301', 'Q502', ...]
[Agnes] Cited text (first 500 chars): ...
```

### 2. Expected Behavior

**Before Fix**:
```
AI Response: "According to the training materials, drip edge is required..."
Citations: [] (empty)
```

**After Fix**:
```
AI Response: "According to Q301, drip edge is required..."
After injection: "According to Q301 [8.1], drip edge is required..."
Citations: [{number: "8.1", documentId: "Q301", ...}]
```

### 3. Test Scenarios

#### Test 1: Expert Mode
```
User: "Tell me about drip edge requirements in Virginia"

Expected AI Response:
"Great question! According to Q301, drip edge is required at all eaves
and rakes when reroofing in Virginia. Per the Virginia Building Code,
excluding drip edge violates state code."

Expected After Injection:
"Great question! According to Q301 [8.1], drip edge is required at all
eaves and rakes when reroofing in Virginia. Per the Virginia Building
Code, excluding drip edge violates state code."
```

#### Test 2: Roleplay Mode (Coaching Feedback)
```
After roleplay exchanges, Agnes provides coaching:

Expected AI Response:
"[AGNES COACHING]
Performance Review:
- Good job citing code requirements! This aligns with Q301 about drip
  edge requirements.
- Consider referencing Q302 about step flashing replacement next time.
- Per Q304, always explain WHY code compliance matters to the homeowner."

Expected After Injection:
Same text but with [8.1], [8.2], [8.3] markers added after each Q-number.
```

## Troubleshooting

### Issue: Still no citations appearing

**Check 1**: Are Q-numbers in the AI response?
```bash
# Look for this log line:
[Citation Tracker] Q-numbers found in response: []
```
- If empty `[]`, the AI is still not mentioning Q-numbers
- Solution: Make the system prompt even more explicit

**Check 2**: Are training files loading?
```bash
# Look for these log lines:
[Agnes] Loaded X training items
[Agnes] Loaded X scenario items
```
- If 0 items, files aren't loading correctly
- Solution: Check file paths and JSON syntax

**Check 3**: Are Q-numbers in the training data?
```bash
# Look for this log line:
[Citation Tracker] Q-numbers in map: ['Q301', 'Q302', ...]
```
- If empty or wrong format, training data is malformed
- Solution: Verify JSON structure

### Issue: Citations appear but wrong format

**Check**: Are citation markers being injected?
```typescript
// The citation tracker should add markers like [8.1]
// Check if the cited text contains these markers
console.log('[Agnes] Cited text (first 500 chars):', citedResponse.text.substring(0, 500))
```

Look for patterns like:
- `Q301 [8.1]` ✅ Correct
- `Q301` ❌ Not injected
- `[source](search_result_8)` ❌ Wrong format (this is what we're fixing!)

## Files Modified

1. `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-prompts.ts`
   - Enhanced SOURCE INTEGRATION section
   - Enhanced TRAINING DATA INTEGRATION section
   - Made Q-number usage requirements explicit

2. `/Users/a21/Desktop/routellm-chatbot-railway/app/api/agnes-chat/route.ts`
   - Enhanced training context instructions
   - Added debug logging for AI responses
   - Added debug logging for citation injection

3. `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-citation-tracker.ts`
   - Added debug logging for Q-number detection
   - Fixed duplicate variable declaration

## Next Steps

1. **Deploy and Test**: Deploy these changes and test with various queries
2. **Monitor Logs**: Check server logs to see if Q-numbers are appearing in AI responses
3. **Iterate if Needed**: If AI still doesn't use Q-numbers, make prompts even more explicit
4. **Remove Debug Logs**: Once working, remove or reduce debug logging for production

## Training Data Format Reference

Q-numbers should appear in training data like this:

```json
{
  "id": "Q301",
  "question": "Drip edge isn't required in Virginia.",
  "answer": "To whom it may concern, You've denied drip edge installation. Per Virginia Building Code...",
  "category": "building_codes",
  "metadata": {
    "source": "susan_ai.docx",
    "code_references": [...]
  }
}
```

The `id` field must start with "Q" followed by 3-4 digits (Q301, Q502, Q1234, etc.).

## Success Metrics

When working properly, you should see:
- ✅ AI responses contain Q-numbers (Q301, Q502, etc.)
- ✅ Console logs show Q-numbers found in response
- ✅ Citations array has length > 0
- ✅ Frontend shows clickable citation markers like [8.1], [8.2]
- ✅ Clicking citations opens preview panel
- ✅ No raw markdown links like `[source](search_result_8)`
