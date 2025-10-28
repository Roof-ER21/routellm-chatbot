# Agnes Citation Fix - Deployment Checklist

## Pre-Deployment Verification

### 1. Code Changes Verified
- [ ] `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-prompts.ts` modified
  - Lines 153-165: SOURCE INTEGRATION section enhanced
  - Lines 242-252: TRAINING DATA INTEGRATION section enhanced
- [ ] `/Users/a21/Desktop/routellm-chatbot-railway/app/api/agnes-chat/route.ts` modified
  - Lines 122-137: Training context instructions enhanced
  - Lines 189-210: Debug logging added
- [ ] `/Users/a21/Desktop/routellm-chatbot-railway/lib/agnes-citation-tracker.ts` modified
  - Lines 131-137: Debug logging added
  - Variable name conflict resolved

### 2. Training Data Files Present
```bash
# Verify files exist
ls -la /Users/a21/Desktop/routellm-chatbot-railway/public/ | grep -E "(agnes-|kb-)"

# Expected output:
# agnes-training-data.json
# agnes-scenarios.json
# kb-documents.json
```

- [ ] `public/agnes-training-data.json` exists
- [ ] `public/agnes-scenarios.json` exists
- [ ] `public/kb-documents.json` exists

### 3. Training Data Format Validated
```bash
# Check Q-number format in training data
head -20 /Users/a21/Desktop/routellm-chatbot-railway/public/agnes-training-data.json

# Should see entries like:
# "id": "Q301",
# "id": "Q302",
# etc.
```

- [ ] Training items have `id` field
- [ ] IDs follow format: Q + 3-4 digits (Q301, Q502, etc.)
- [ ] JSON is valid (no syntax errors)

## Deployment Steps

### Step 1: Backup Current Version
```bash
cd /Users/a21/Desktop/routellm-chatbot-railway

# Create backup branch
git branch backup-before-citation-fix-$(date +%Y%m%d)

# Or create backup directory
cp -r . ../routellm-chatbot-railway-backup-$(date +%Y%m%d)
```

- [ ] Backup created

### Step 2: Commit Changes
```bash
git add lib/agnes-prompts.ts
git add app/api/agnes-chat/route.ts
git add lib/agnes-citation-tracker.ts
git commit -m "Fix Agnes citation injection - Add Q-number instructions and debug logging"
```

- [ ] Changes committed

### Step 3: Deploy to Environment

#### Option A: Railway/Cloud Platform
```bash
git push origin main
# Wait for Railway to deploy
```

- [ ] Code pushed to repository
- [ ] Deployment started
- [ ] Deployment completed successfully

#### Option B: Local Development
```bash
# Stop current server
# Restart with changes
npm run dev
```

- [ ] Server restarted
- [ ] No startup errors

### Step 4: Verify Deployment

#### Check Server Logs
Look for these lines on startup:
```
[Agnes] Loaded X training items
[Agnes] Loaded X scenario items
[Agnes] Loaded X knowledge base items
```

- [ ] Training data loaded (X > 0)
- [ ] Scenarios loaded (X > 0)
- [ ] Knowledge base loaded (X > 0)
- [ ] No loading errors

## Post-Deployment Testing

### Test 1: Simple Question (Expert Mode)

**Request:**
```bash
curl -X POST https://your-domain.com/api/agnes-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What are drip edge requirements in Virginia?"}],
    "characterId": "none"
  }'
```

**Expected in Logs:**
```
[Agnes] AI Response (first 500 chars): ...According to Q301...
[Citation Tracker] Q-numbers found in response: ['Q301']
[Agnes] Injected 1 citations
[Agnes] Citation IDs: ['Q301']
```

**Expected in Response:**
```json
{
  "message": "...Q301 [8.1]...",
  "citations": [{"number": "8.1", "documentId": "Q301", ...}]
}
```

- [ ] Q-numbers appear in AI response (check logs)
- [ ] Citations detected (check logs)
- [ ] Citations injected (check logs)
- [ ] Response contains citation markers [8.1]
- [ ] Citations array has items

### Test 2: Multiple Citations

**Request:**
```bash
curl -X POST https://your-domain.com/api/agnes-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Tell me about all flashing requirements in Virginia"}],
    "characterId": "none"
  }'
```

**Expected:**
- [ ] Multiple Q-numbers in response (Q301, Q302, Q303)
- [ ] Multiple citations injected
- [ ] Multiple citation markers [8.1], [8.2], [8.3]
- [ ] Citations array has multiple items

### Test 3: Roleplay Mode

**Request:**
```bash
# Start roleplay
curl -X POST https://your-domain.com/api/agnes-chat \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "characterId": "skeptical_veteran"
  }'

# Then exchange 3-4 messages and check coaching feedback
```

**Expected in Coaching Feedback:**
- [ ] Q-numbers mentioned in coaching
- [ ] Citation markers added to Q-numbers
- [ ] Citations array populated

### Test 4: Frontend Integration

**Steps:**
1. Open Agnes chat interface
2. Ask: "What are Virginia's drip edge requirements?"
3. Observe:

- [ ] Response displays with clickable citation markers [8.1]
- [ ] Clicking citation opens preview panel
- [ ] Preview shows document title
- [ ] Preview shows document snippet
- [ ] Preview shows source information
- [ ] No error messages in browser console

## Monitoring Checklist (24 Hours)

### Hour 1
- [ ] Check server logs for citation injection
- [ ] Verify no errors or exceptions
- [ ] Test 3-5 sample queries

### Hour 4
- [ ] Check error rate in logs
- [ ] Review citation detection rate
- [ ] Verify Q-numbers being used by AI

### Hour 12
- [ ] Review aggregate statistics
- [ ] Check if any queries failed
- [ ] Verify citation quality

### Hour 24
- [ ] Full review of logs
- [ ] Check user feedback
- [ ] Verify all character modes working

## Success Criteria

All of these must be true:

- [ ] ✅ Server logs show Q-numbers found in responses
- [ ] ✅ Citations are being injected (count > 0)
- [ ] ✅ Frontend displays citation markers correctly
- [ ] ✅ Citation preview panel works
- [ ] ✅ No increase in error rate
- [ ] ✅ No regression in response quality
- [ ] ✅ No performance degradation

## Rollback Plan

If issues occur, rollback steps:

### Quick Rollback (Remove Debug Logging Only)
```bash
# Comment out debug console.log statements
# Redeploy
```

### Full Rollback (Revert All Changes)
```bash
git revert HEAD
git push origin main
# Or restore from backup
```

Rollback triggers:
- Citation injection failing completely (0 citations for all requests)
- Server errors or crashes
- Significant performance degradation
- User complaints about incorrect information

## Debug Commands

### Check Training Data
```bash
# Count Q-numbers in training data
grep -o '"id": "Q[0-9]*"' /Users/a21/Desktop/routellm-chatbot-railway/public/agnes-training-data.json | wc -l

# List first 10 Q-numbers
grep -o '"id": "Q[0-9]*"' /Users/a21/Desktop/routellm-chatbot-railway/public/agnes-training-data.json | head -10
```

### Check Server Logs
```bash
# If using PM2
pm2 logs --lines 100 | grep Agnes

# If using Railway
railway logs | grep Agnes

# If using npm run dev
# Check terminal output
```

### Test Citation Tracker Directly
```javascript
// test-citation-tracker.js
import { injectAgnesCitations } from './lib/agnes-citation-tracker'

const testResponse = "According to Q301, drip edge is required. Per Q302, step flashing must be replaced."
const testData = [
  { id: "Q301", question: "Drip edge test", answer: "Test answer" },
  { id: "Q302", question: "Step flashing test", answer: "Test answer" }
]

const result = injectAgnesCitations(testResponse, testData, [])
console.log('Citations found:', result.citations.length)
console.log('Text:', result.text)
```

## Optimization (After 7 Days Stable)

Once citations are working consistently:

- [ ] Remove verbose debug logging (keep essential logs)
- [ ] Optimize Q-number pattern matching if needed
- [ ] Consider caching training data lookups
- [ ] Add analytics for citation usage
- [ ] Document most commonly cited Q-numbers

## Documentation Updates

- [ ] Update API documentation with citation format
- [ ] Update frontend documentation for citation display
- [ ] Update training materials about Q-number usage
- [ ] Create internal wiki page about citation system

## Support Preparation

Prepare support team with:
- [ ] Overview of citation system
- [ ] How to identify citation issues in logs
- [ ] Common user questions about citations
- [ ] Escalation path for citation problems

## Final Sign-Off

- [ ] Technical lead review
- [ ] QA testing completed
- [ ] Production deployment approved
- [ ] Support team notified
- [ ] Documentation updated
- [ ] Monitoring dashboards configured

## Contact Information

**Issue Escalation:**
- Check logs first: `/api/agnes-chat` endpoint
- Review AGNES_CITATION_FIX.md for troubleshooting
- Review TESTING_AGNES_CITATIONS.md for test scenarios

**Files Modified:**
- `lib/agnes-prompts.ts`
- `app/api/agnes-chat/route.ts`
- `lib/agnes-citation-tracker.ts`

**Documentation:**
- AGNES_CITATION_SUMMARY.md (executive overview)
- AGNES_CITATION_FIX.md (detailed technical)
- AGNES_CITATION_FLOW.md (visual flow)
- TESTING_AGNES_CITATIONS.md (testing guide)
- AGNES_CITATION_DEPLOYMENT.md (this file)

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Sign-Off:** _____________
