# Quick Testing Guide for Agnes Citations

## Quick Test Commands

### 1. Start the Development Server
```bash
cd /Users/a21/Desktop/routellm-chatbot-railway
npm run dev
```

### 2. Watch Server Logs
Open a separate terminal and watch the logs:
```bash
# If using PM2 or similar
pm2 logs

# Or just watch the npm run dev terminal
```

### 3. Test Queries

#### Test A: Simple Question (Expert Mode)
```
Question: "What are the drip edge requirements in Virginia?"

Expected in logs:
✅ [Citation Tracker] Q-numbers found in response: ['Q301']
✅ [Agnes] Injected 1 citations
✅ [Agnes] Citation IDs: ['Q301']

Expected in response:
✅ Text contains: "Q301 [8.1]" or similar
✅ citations array has 1 item with documentId: "Q301"
```

#### Test B: Multiple Citations
```
Question: "Tell me about flashing requirements - step flashing, valley flashing, and drip edge in Virginia"

Expected in logs:
✅ [Citation Tracker] Q-numbers found in response: ['Q301', 'Q302', 'Q303']
✅ [Agnes] Injected 3 citations
✅ [Agnes] Citation IDs: ['Q301', 'Q302', 'Q303']

Expected in response:
✅ Text contains multiple markers: [8.1], [8.2], [8.3]
✅ citations array has 3 items
```

#### Test C: Roleplay Mode
```
1. Start roleplay with character: "skeptical_veteran"
2. Exchange 3-4 messages
3. Wait for coaching feedback

Expected in coaching feedback:
✅ References to Q-numbers like "Per Q301" or "According to Q502"
✅ Citation markers [8.1], [8.2] after Q-numbers
✅ citations array populated
```

## What to Look For

### ✅ SUCCESS Indicators

**In Server Logs:**
```
[Agnes] Loaded 300 training items          ← Files loading correctly
[Agnes] AI Response (first 500 chars): According to Q301...  ← AI using Q-numbers!
[Citation Tracker] Q-numbers found in response: ['Q301', 'Q302']  ← Detection working
[Agnes] Injected 2 citations               ← Injection working
[Agnes] Citation IDs: ['Q301', 'Q302']     ← Correct IDs
```

**In API Response:**
```json
{
  "message": "According to Q301 [8.1], drip edge is required...",
  "citations": [
    {
      "number": "8.1",
      "documentId": "Q301",
      "documentTitle": "Drip edge isn't required in Virginia.",
      "category": "training",
      "snippet": "To whom it may concern...",
      "preview": "To whom it may concern...",
      "metadata": {
        "source": "susan_ai.docx",
        "confidence_level": "high"
      }
    }
  ]
}
```

**In Frontend:**
- Clickable citation numbers like [8.1], [8.2]
- Citation preview panel opens on click
- Shows document title and preview text

### ❌ FAILURE Indicators

**Problem 1: No Q-numbers in AI response**
```
[Citation Tracker] Q-numbers found in response: []  ← PROBLEM!
[Agnes] Injected 0 citations
```
**Solution**: AI not following instructions. Check if system prompt was deployed.

**Problem 2: Training data not loading**
```
[Agnes] Loaded 0 training items  ← PROBLEM!
```
**Solution**: Check file paths and JSON syntax in training files.

**Problem 3: Q-numbers found but not injected**
```
[Citation Tracker] Q-numbers found in response: ['Q301']
[Agnes] Injected 0 citations  ← PROBLEM!
```
**Solution**: Q-numbers in response don't match training data IDs.

## Manual API Test

Use curl or Postman to test the API directly:

```bash
curl -X POST http://localhost:3000/api/agnes-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What are the drip edge requirements in Virginia?"
      }
    ],
    "characterId": "none"
  }'
```

Expected response format:
```json
{
  "message": "Great question! According to Q301 [8.1], drip edge is required at all eaves and rakes...",
  "citations": [
    {
      "number": "8.1",
      "documentId": "Q301",
      ...
    }
  ],
  "photos": [],
  "characterId": "none",
  "provider": "Abacus.AI"
}
```

## Frontend Test

1. Open Agnes chat interface
2. Ask: "What are Virginia's drip edge requirements?"
3. Check that:
   - Response includes clickable citations like [8.1]
   - Clicking citation opens preview panel
   - Preview shows document title and snippet

## Debug Checklist

If citations aren't working, check these in order:

- [ ] Training data files exist and have valid JSON
- [ ] Server logs show "Loaded X training items" (X > 0)
- [ ] Q-numbers are in training data (id: "Q301", etc.)
- [ ] AI response contains Q-numbers (check logs)
- [ ] Citation tracker finds Q-numbers (check logs)
- [ ] Citations are injected (check logs)
- [ ] Response includes citation markers [8.1], [8.2]
- [ ] Frontend displays citations correctly

## Common Issues

### Issue: "Training data not found"
```bash
# Check if files exist
ls -la /Users/a21/Desktop/routellm-chatbot-railway/public/*.json

# Should see:
# agnes-training-data.json
# agnes-scenarios.json
# kb-documents.json
```

### Issue: "Q-numbers not matching"
```bash
# Check training data format
head -50 /Users/a21/Desktop/routellm-chatbot-railway/public/agnes-training-data.json

# Should see:
# "id": "Q301",
# "id": "Q302",
# etc.
```

### Issue: "AI not using Q-numbers"
This is the original problem! Solutions:
1. Verify system prompt changes deployed
2. Check training context is being sent
3. Try more explicit user prompts: "Cite specific Q-numbers"
4. Check AI provider is receiving full context

## Next Steps After Testing

1. If working: Remove or reduce debug logging
2. If not working: Check AGNES_CITATION_FIX.md for troubleshooting
3. Monitor in production for a few days
4. Collect feedback on citation quality

## Quick Verification Script

Create a test script to verify the system:

```javascript
// test-agnes-citations.js
const response = await fetch('http://localhost:3000/api/agnes-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'What are drip edge requirements in Virginia?' }
    ],
    characterId: 'none'
  })
});

const data = await response.json();

console.log('Citations found:', data.citations.length);
console.log('Citation IDs:', data.citations.map(c => c.documentId));
console.log('Has citation markers:', /\[\d+\.\d+\]/.test(data.message));
```

Run with:
```bash
node test-agnes-citations.js
```

Expected output:
```
Citations found: 1
Citation IDs: ['Q301']
Has citation markers: true
```
