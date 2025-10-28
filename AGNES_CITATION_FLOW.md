# Agnes Citation System - Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                            │
│              "What are drip edge requirements?"                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE HANDLER                                │
│              /app/api/agnes-chat/route.ts                       │
│                                                                 │
│  1. Load training data (agnes-training-data.json)              │
│  2. Search for relevant Q-numbers based on query               │
│  3. Build context with Q-number instructions                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTEM PROMPT                                │
│              /lib/agnes-prompts.ts                              │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ CRITICAL: ALWAYS CITE Q-NUMBERS!                          ║ │
│  ║ Format: "According to Q301, drip edge is required..."     ║ │
│  ║ NOT: "According to training materials..."                 ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│                                                                 │
│  PLUS Training Context:                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ [IMPORTANT: Reference these Q-numbers in response!]     │  │
│  │                                                         │  │
│  │ Q301: Drip edge isn't required in Virginia             │  │
│  │ Answer: Per Virginia Building Code, drip edge is       │  │
│  │         required at all eaves and rakes...             │  │
│  │                                                         │  │
│  │ Q302: Step flashing can be reused                      │  │
│  │ Answer: Per Virginia flashing codes, step flashing     │  │
│  │         must be replaced...                            │  │
│  └─────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI MODEL                                   │
│                    (RouteLL/Abacus)                            │
│                                                                 │
│  Processes prompt and responds WITH Q-numbers:                 │
│  "Great question! According to Q301, drip edge is required     │
│   at all eaves and rakes when reroofing in Virginia. Per the  │
│   Virginia Building Code, excluding it violates state code."   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│               CITATION INJECTION                                │
│           /lib/agnes-citation-tracker.ts                        │
│                                                                 │
│  Step 1: Scan response for Q-numbers                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Pattern Match: /Q\d{3,4}/g                               │  │
│  │ Found: ["Q301"]                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 2: Create citation object                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                        │  │
│  │   number: "8.1",                                         │  │
│  │   documentId: "Q301",                                    │  │
│  │   documentTitle: "Drip edge isn't required...",          │  │
│  │   category: "training",                                  │  │
│  │   snippet: "To whom it may concern...",                  │  │
│  │   preview: "To whom it may concern...",                  │  │
│  │   metadata: { source: "susan_ai.docx" }                  │  │
│  │ }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Step 3: Inject citation markers                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ BEFORE: "According to Q301, drip edge is required..."   │  │
│  │ AFTER:  "According to Q301 [8.1], drip edge is req..."  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API RESPONSE                                 │
│                                                                 │
│  {                                                              │
│    message: "Great question! According to Q301 [8.1], drip     │
│              edge is required at all eaves and rakes...",      │
│    citations: [                                                │
│      {                                                         │
│        number: "8.1",                                          │
│        documentId: "Q301",                                     │
│        documentTitle: "Drip edge isn't required in Virginia.", │
│        category: "training",                                   │
│        snippet: "To whom it may concern...",                   │
│        preview: "To whom it may concern...",                   │
│        metadata: { source: "susan_ai.docx" }                   │
│      }                                                         │
│    ],                                                          │
│    photos: [],                                                 │
│    characterId: "none",                                        │
│    provider: "Abacus.AI"                                       │
│  }                                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND DISPLAY                             │
│                                                                 │
│  Agnes: "Great question! According to Q301 [8.1], drip edge   │
│          is required at all eaves and rakes when reroofing..." │
│                                                                 │
│  [8.1] ← Clickable citation                                    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📄 Citation Preview                              [×]    │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ [8.1] training                                          │   │
│  │                                                         │   │
│  │ Drip edge isn't required in Virginia.                  │   │
│  │                                                         │   │
│  │ "To whom it may concern, You've denied drip edge..."   │   │
│  │                                                         │   │
│  │ Source: susan_ai.docx                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## The Fix - What Changed

### BEFORE (Broken)

```
System Prompt: "Reference training materials when needed"
         ↓
AI Response: "According to the training materials, drip edge is required..."
         ↓
Citation Injection: ❌ No Q-numbers found
         ↓
Result: No citations, maybe wrong format [source](search_result_8)
```

### AFTER (Fixed)

```
System Prompt: "CRITICAL: ALWAYS CITE Q-NUMBERS! (with examples)"
         ↓
AI Response: "According to Q301, drip edge is required..."
         ↓
Citation Injection: ✅ Found Q301 → Create [8.1] marker
         ↓
Result: "According to Q301 [8.1], drip edge..." + citation object
```

## Citation Number Format

```
[8.1]
 │ │
 │ └─ Document number (sequential)
 └─── Category number (8 = training materials)

[8.2]
 │ │
 │ └─ Second document cited
 └─── Same category (training)

[8.3]
 │ │
 │ └─ Third document cited
 └─── Same category (training)
```

## Pattern Matching Examples

The citation tracker looks for these patterns:

### Pattern 1: Direct Q-number
```
Input:  "...Q503 shows the proper way..."
Output: "...Q503 [8.1] shows the proper way..."
```

### Pattern 2: Prefixed Q-number
```
Input:  "...According to Q502, step flashing..."
Output: "...According to Q502 [8.1], step flashing..."
```

### Pattern 3: Wrapped Q-number
```
Input:  "...building codes (Q301) require..."
Output: "...building codes [8.1] require..."
```

## Debug Logging Flow

```
[Agnes] Loaded 300 training items              ← Files loaded
         ↓
[Agnes] AI Response (first 500 chars): ...     ← AI responded
         ↓
[Citation Tracker] Q-numbers in map: [Q301...] ← Training data ready
         ↓
[Citation Tracker] Q-numbers found: ['Q301']   ← Detection working ✓
         ↓
[Agnes] Injected 1 citations                   ← Injection working ✓
         ↓
[Agnes] Citation IDs: ['Q301']                 ← Correct ID ✓
         ↓
[Agnes] Cited text (first 500 chars): ...      ← Final result ✓
```

## Training Data Structure

```json
{
  "id": "Q301",           ← MUST start with Q + 3-4 digits
  "question": "...",      ← Used as citation title
  "answer": "...",        ← Used as citation snippet
  "category": "...",
  "metadata": {
    "source": "susan_ai.docx"  ← Shown in citation preview
  }
}
```

## Critical Success Factors

1. **Q-Number Format**: Training data IDs MUST be Q + digits (Q301, Q502)
2. **AI Instruction**: System prompt MUST tell AI to use Q-numbers
3. **Pattern Matching**: Citation tracker MUST find Q-numbers in response
4. **Data Loading**: Training files MUST load successfully

## Complete Data Flow

```
Training Files → Load → Build Context → Send to AI → AI Responds
   (Q301...)      ↓         ↓              ↓           ↓
                  ✓    Add Q-number    Include Q's  "...Q301..."
                       instructions         ↓           ↓
                            ↓          Pattern Match  Create [8.1]
                            ↓               ↓           ↓
                       Return JSON ← Build Citations ← Replace
```

## Troubleshooting Decision Tree

```
No citations appearing?
    │
    ├─ Check: Training data loaded? [Agnes] Loaded X items
    │   ├─ NO → Fix file paths or JSON syntax
    │   └─ YES → Continue
    │
    ├─ Check: Q-numbers in AI response? [Citation Tracker] found: [...]
    │   ├─ NO → AI not following instructions
    │   │       → Check system prompt deployed
    │   │       → Make instructions more explicit
    │   └─ YES → Continue
    │
    ├─ Check: Citations injected? [Agnes] Injected X citations
    │   ├─ NO → Q-numbers don't match training data
    │   │       → Verify training data IDs
    │   └─ YES → Continue
    │
    └─ Check: Frontend displaying? Clickable [8.1] markers
        ├─ NO → Frontend issue, check citation component
        └─ YES → ✓ WORKING!
```

## Key Files Reference

| File | Purpose | Key Lines |
|------|---------|-----------|
| `lib/agnes-prompts.ts` | System prompt instructions | 153-165, 242-252 |
| `app/api/agnes-chat/route.ts` | Route handler, context building | 122-137, 189-210 |
| `lib/agnes-citation-tracker.ts` | Pattern matching, injection | 107-188 |
| `public/agnes-training-data.json` | Training Q-numbers | All entries |

## Summary

The fix ensures that:
1. ✅ AI receives clear instructions to use Q-numbers
2. ✅ Training context emphasizes Q-number usage
3. ✅ Pattern matching finds Q-numbers in responses
4. ✅ Citations are properly formatted and tracked
5. ✅ Frontend displays clickable citation markers
6. ✅ Debug logging helps troubleshoot issues

**Result**: Proper citation tracking matching Susan's system with [8.1], [8.2] format instead of incorrect markdown links.
