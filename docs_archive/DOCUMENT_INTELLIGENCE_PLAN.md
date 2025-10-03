# 📄 Document Intelligence - Unified Analyzer Implementation

## 🎯 PRIMARY FOCUS: Smart Document Analysis

### **What Reps Need Most:**
1. **Denial Letter Analysis** 📋
   - Full denials - what was denied and why
   - Partial denials - approved vs denied items
   - Missing documentation requests
   - Action items to overcome denials

2. **Insurance Estimate Review** 💰
   - Line item comparison
   - Missing items
   - Price discrepancies
   - Scope gaps

3. **Email Analysis** 📧
   - Adjuster emails
   - Request for documentation
   - Approval/denial notifications
   - Follow-up requirements

4. **Claim Documents** 📑
   - Initial estimates
   - Supplements
   - Scope sheets
   - Coverage breakdowns

---

## 🔌 Current API Setup (VERIFIED)

### ✅ Abacus AI (Primary - Documents)
- **Status:** OPERATIONAL
- **Token:** `2670ce30456644ddad56a334786a3a1a`
- **Deployment:** `6a1d18f38`
- **Strengths:**
  - Text extraction from PDFs
  - Structured data extraction
  - Insurance-specific analysis
  - Multi-document processing

### ✅ Hugging Face (Secondary - Images)
- **Status:** OPERATIONAL ✅
- **Configuration:** VERIFIED WORKING
- **Usage:** Image analysis (optional)
- **Cost:** FREE (30K/month)

---

## 🎯 Unified Analyzer Focus

### Document Analysis Capabilities

#### 1. **Denial Letter Intelligence** ⭐ TOP PRIORITY
```
User uploads: denial_letter.pdf

Susan analyzes and extracts:
✅ DENIED ITEMS:
   - North slope tear-off ($3,500)
   - Chimney flashing ($850)
   - Ridge vent ($1,200)
   TOTAL DENIED: $5,550

✅ DENIAL REASONS:
   - "Damage pre-dates loss date" (North slope)
   - "Insufficient documentation" (Chimney)
   - "Not covered under policy" (Ridge vent)

✅ APPROVED ITEMS:
   - South slope replacement ($8,400)
   - Gutter repair ($450)
   TOTAL APPROVED: $8,850

✅ WHAT TO DO NEXT:
   1. Get photos of North slope showing storm damage patterns
   2. Provide chimney photos from all 4 sides
   3. Review policy for ridge vent coverage language
   4. Request reinspection for missed items

✅ SUPPLEMENT POTENTIAL:
   - HIGH: North slope has clear hail damage in photos
   - MEDIUM: Chimney damage visible but needs better documentation
   - LOW: Ridge vent likely excluded in policy
```

#### 2. **Estimate Comparison** 💰
```
User uploads: adjuster_estimate.pdf + contractor_estimate.pdf

Susan compares and finds:
✅ MISSING FROM ADJUSTER:
   - Ice & water shield upgrade ($1,200)
   - Drip edge on all sides ($650)
   - Pipe boots (3) ($450)
   POTENTIAL RECOVERY: $2,300

✅ PRICE DIFFERENCES:
   - Shingles: Adjuster $85/sq vs Market $110/sq
   - Labor: Adjuster $45/sq vs Market $65/sq
   POTENTIAL SHORTFALL: $4,500

✅ SCOPE GAPS:
   - Adjuster approved 28 squares
   - Contractor measured 32 squares
   - 4 squares missed = $1,800 shortfall

✅ RECOMMENDATION:
   Submit supplement request with:
   - Missing items list
   - Market rate comparison
   - Re-measurement documentation
```

#### 3. **Email Intelligence** 📧
```
User uploads: adjuster_email.pdf or screenshot

Susan extracts:
✅ ACTION ITEMS:
   - "Need photos of all 4 slopes" - DUE: 3 days
   - "Provide proof of damage date" - DUE: ASAP
   - "Submit supplement request in writing" - DUE: Before reinspection

✅ KEY INFORMATION:
   - Adjuster: John Smith
   - Phone: (555) 123-4567
   - Claim #: ABC-12345
   - Reinspection Date: Next Tuesday 2PM

✅ SENTIMENT ANALYSIS:
   - Tone: Professional but firm
   - Urgency: HIGH (reinspection soon)
   - Openness to supplement: MODERATE
   - Recommended approach: Provide documentation quickly

✅ RESPONSE TEMPLATE:
   "Hi John, Thank you for the update. I have the photos from all 4 slopes ready. I've also attached the weather report showing the storm on [date]. For the supplement items, I'll submit the written request today. Looking forward to the reinspection on Tuesday. Best regards, [Rep Name]"
```

#### 4. **Claims Package Analysis** 📦
```
User uploads: Multiple files (estimate + denial + photos + emails)

Susan provides:
✅ CLAIM OVERVIEW:
   - Claim Number: ABC-12345
   - Property: 123 Main St
   - Date of Loss: 06/27/2024
   - Initial Estimate: $15,400
   - Approved: $8,850
   - Denied: $6,550

✅ TIMELINE:
   - Loss Date: 06/27/2024
   - Reported: 07/01/2024
   - Inspection: 07/15/2024
   - Estimate: 07/20/2024
   - Denial: 08/01/2024
   - STATUS: 42 days in process

✅ STRENGTHS:
   - Good photo documentation
   - Clear storm evidence
   - Quick reporting

✅ WEAKNESSES:
   - Missing slope coverage in photos
   - No interior damage documented
   - Incomplete measurements

✅ STRATEGY:
   1. Submit supplement within 7 days
   2. Get additional photos this week
   3. Document interior damage
   4. Re-measure all slopes
   5. Challenge denial reasons with evidence
```

---

## 🚀 Implementation Strategy

### Phase 1: Enhanced Document Processing

#### Update Document Processor
**File:** `/lib/document-processor.ts`

**Add Smart Extraction:**
```typescript
export const intelligentExtractor = {
  // Denial letter specific
  analyzeDenialLetter(text: string) {
    return {
      deniedItems: extractLineItems(text, 'denied'),
      approvedItems: extractLineItems(text, 'approved'),
      denialReasons: extractReasons(text),
      actionItems: extractActionItems(text),
      totalDenied: calculateTotal('denied'),
      totalApproved: calculateTotal('approved'),
      supplementPotential: assessSupplementViability(text)
    }
  },

  // Estimate comparison
  compareEstimates(adjusterText: string, contractorText: string) {
    return {
      missingItems: findMissingItems(adjusterText, contractorText),
      priceDifferences: comparePrices(adjusterText, contractorText),
      scopeGaps: findScopeGaps(adjusterText, contractorText),
      totalShortfall: calculateShortfall(),
      recommendations: generateSupplementRecommendations()
    }
  },

  // Email analysis
  analyzeEmail(text: string) {
    return {
      sender: extractSender(text),
      subject: extractSubject(text),
      actionItems: extractTasks(text),
      deadlines: extractDeadlines(text),
      keyInfo: extractContactInfo(text),
      sentiment: analyzeSentiment(text),
      urgency: assessUrgency(text),
      responseTemplate: generateResponse(text)
    }
  }
}
```

### Phase 2: Unified API Endpoint

**File:** `/app/api/analyze/unified/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = extractFiles(formData);
  const analysisType = formData.get('analysisType') as string;

  // Smart routing based on analysis type
  switch(analysisType) {
    case 'denial_letter':
      return analyzeDenialLetters(files);

    case 'estimate_comparison':
      return compareEstimates(files);

    case 'email_analysis':
      return analyzeEmails(files);

    case 'claims_package':
      return analyzeFullPackage(files);

    case 'custom':
      return customAnalysis(files, formData.get('customRequest'));
  }
}

async function analyzeDenialLetters(files: File[]) {
  // Extract text from PDFs
  const documents = await documentProcessor.processMultipleFiles(files);

  // Use Abacus AI for intelligent extraction
  const analysisPrompt = `
    You are an expert insurance claim analyst. Analyze this denial letter and extract:

    1. DENIED ITEMS (with amounts and reasons)
    2. APPROVED ITEMS (with amounts)
    3. DENIAL REASONS (categorized)
    4. ACTION ITEMS (what contractor must do)
    5. SUPPLEMENT POTENTIAL (rate each denied item HIGH/MEDIUM/LOW)
    6. RECOMMENDED STRATEGY

    Document text:
    ${documents[0].extractedText}
  `;

  const result = await abacusAI.analyze(analysisPrompt);

  return {
    success: true,
    analysisType: 'denial_letter',
    insights: {
      deniedItems: parsedenied Items(result),
      approvedItems: parseApprovedItems(result),
      denialReasons: parseDenialReasons(result),
      actionItems: parseActionItems(result),
      supplementPotential: assessSupplement(result),
      strategy: extractStrategy(result)
    },
    recommendations: generateRecommendations(result)
  }
}
```

### Phase 3: Context-Aware Analysis

**Smart Document Type Detection:**
```typescript
function detectDocumentType(text: string): DocumentType {
  const keywords = {
    denial_letter: ['denied', 'rejection', 'not covered', 'excluded'],
    estimate: ['line item', 'quantity', 'unit price', 'total'],
    email: ['from:', 'to:', 'subject:', 're:'],
    supplement: ['supplement', 'additional', 'missed items'],
    policy: ['policy number', 'coverage', 'premium', 'deductible']
  };

  // Count keyword matches
  const scores = {};
  for (const [type, terms] of Object.entries(keywords)) {
    scores[type] = terms.filter(term =>
      text.toLowerCase().includes(term)
    ).length;
  }

  // Return type with highest score
  return Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );
}
```

---

## 🎨 UI/UX for Document Focus

### Unified Upload Modal

```
┌──────────────────────────────────────────┐
│  📄 Upload & Analyze Documents        ✕  │
├──────────────────────────────────────────┤
│                                          │
│  [Drag & drop PDFs, images, docs here]  │
│  or click to browse                      │
│                                          │
│  📄 PDFs  📧 Emails  📊 Estimates        │
│                                          │
├──────────────────────────────────────────┤
│  Uploaded Files (2):                     │
│  📄 denial_letter.pdf     [preview] [×]  │
│  💰 adjuster_estimate.pdf [preview] [×]  │
├──────────────────────────────────────────┤
│  What do you want to analyze?           │
│  ● Smart Analysis (Auto-detect) ⭐       │
│  ○ Denial Letter Review                 │
│  ○ Estimate Comparison                  │
│  ○ Email Analysis                       │
│  ○ Full Claims Package                  │
│  ○ Custom Request                       │
│                                          │
│         [Cancel]  [Analyze Documents]    │
└──────────────────────────────────────────┘
```

### Results Display (Chat Format)

```
📄 Document Analysis Results

DENIAL LETTER ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━

❌ DENIED ITEMS ($5,550):
• North slope tear-off: $3,500
  Reason: "Damage pre-dates loss date"
  Supplement Potential: HIGH ⭐

• Chimney flashing: $850
  Reason: "Insufficient documentation"
  Supplement Potential: MEDIUM

• Ridge vent: $1,200
  Reason: "Not covered under policy"
  Supplement Potential: LOW

✅ APPROVED ITEMS ($8,850):
• South slope replacement: $8,400
• Gutter repair: $450

📋 ACTION ITEMS:
1. Get photos of North slope storm damage (DUE: ASAP)
2. Provide chimney documentation (DUE: Before reinspection)
3. Review policy for ridge vent coverage (DUE: This week)

💡 STRATEGY:
Focus on North slope supplement - strong evidence of storm damage.
Chimney requires better photo documentation. Ridge vent likely not
recoverable per policy exclusions.

🎯 RECOMMENDED NEXT STEPS:
1. Upload North slope photos for supplement support
2. Schedule property visit for chimney documentation
3. Prepare supplement request letter
```

---

## ✅ Implementation Checklist

### Document Processing:
- [x] Abacus AI configured and working
- [x] Hugging Face configured and working
- [ ] Add denial letter intelligence
- [ ] Add estimate comparison logic
- [ ] Add email analysis
- [ ] Add multi-document package analysis

### Unified API:
- [ ] Create `/api/analyze/unified/route.ts`
- [ ] Implement smart document type detection
- [ ] Add denial letter analysis
- [ ] Add estimate comparison
- [ ] Add email analysis
- [ ] Add full package analysis

### Frontend:
- [ ] Create UnifiedAnalyzerModal.tsx
- [ ] Add document type selector
- [ ] Implement drag-and-drop
- [ ] Add file previews
- [ ] Display results in chat

### Testing:
- [ ] Test with real denial letters
- [ ] Test with insurance estimates
- [ ] Test with adjuster emails
- [ ] Test with full claims packages
- [ ] Verify accuracy of extractions

---

## 🎯 Expected User Experience

### Scenario 1: Denial Letter
```
Rep: [Uploads denial_letter.pdf]
Susan: "I've analyzed your denial letter. Here's what I found:

The adjuster denied $5,550 in items:
- North slope ($3,500) - They claim damage pre-dates storm
- Chimney flashing ($850) - Need better documentation
- Ridge vent ($1,200) - Policy exclusion

BUT - I see supplement potential for North slope! The photos you
uploaded earlier show clear hail patterns. Want me to help draft
a supplement request?"

Rep: "Yes please!"
Susan: [Generates supplement letter with evidence references]
```

### Scenario 2: Estimate Comparison
```
Rep: [Uploads adjuster_estimate.pdf + contractor_estimate.pdf]
Susan: "I've compared both estimates. Found $6,800 in potential recovery:

MISSING ITEMS:
- Ice & water shield: $1,200
- Drip edge: $650
- Pipe boots (3): $450

PRICE GAPS:
- Shingles under market by $25/sq
- Labor under market by $20/sq

SCOPE GAPS:
- Adjuster measured 28 sq, contractor has 32 sq
- 4 squares missed = $1,800

Want me to draft a supplement request?"
```

---

## 🚀 Ready to Build?

**Focus Areas:**
1. ✅ Document intelligence (denial letters, estimates, emails)
2. ✅ Abacus AI for text analysis
3. ✅ Hugging Face for image support (optional)
4. ✅ Smart analysis type detection
5. ✅ Actionable recommendations
6. ✅ Test before and after

**Decision:** Proceed with document-focused unified analyzer?
