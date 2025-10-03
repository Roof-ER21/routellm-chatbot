# 🔌 Unified Analyzer - API Architecture & Data Sources

## 📊 Current State Analysis

### Available APIs & Services

#### ✅ **Abacus AI** (Currently Active)
- **Status:** ✅ Configured with valid token
- **Deployment ID:** `6a1d18f38`
- **Token:** `2670ce30456644ddad56a334786a3a1a`
- **Current Usage:**
  - Document analysis
  - Text extraction and processing
  - Insurance data extraction
  - General AI analysis
- **Capabilities:**
  - Multi-format document processing
  - Structured data extraction
  - Natural language understanding
  - Context-aware analysis

#### ⚠️ **Hugging Face** (Not Configured)
- **Status:** ⚠️ Placeholder API key
- **Current Key:** `your_huggingface_api_key_here`
- **Intended Usage:**
  - Vision analysis (fallback)
  - Free tier available
- **Action Needed:** Get real API key OR remove

#### ❌ **Anthropic Claude Vision** (Not Configured)
- **Status:** ❌ No API key found
- **Code Usage:** Used in `photo-intelligence.ts`
- **Capabilities:**
  - Advanced image analysis
  - Damage detection
  - Vision AI
- **Problem:** Code expects Anthropic but no key configured

#### ✅ **Vercel Postgres** (Active)
- **Status:** ✅ Working
- **Usage:**
  - Insurance companies data
  - Weather/hail events data
  - Session tracking

---

## 🚨 Current Issues to Fix

### Issue 1: Photo Analysis API Mismatch
**Problem:**
- Code in `lib/photo-intelligence.ts` imports Anthropic SDK
- But no `ANTHROPIC_API_KEY` in environment
- Photos are failing because of missing Anthropic key

**Current Code:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
```

**Options to Fix:**

**Option A: Use Abacus AI for Everything** ⭐ **RECOMMENDED**
- Use Abacus AI for both documents AND photos
- Abacus AI can handle image analysis
- Single API, lower cost, already configured
- No need for multiple services

**Option B: Add Anthropic API Key**
- Get Anthropic API key ($)
- Keep dual-API approach
- More complex but specialized

**Option C: Use Hugging Face (Free)**
- Get free Hugging Face API key
- Use their vision models
- Free tier available
- Good for testing

### Issue 2: Document Analysis Works, Photo Analysis Doesn't
**Current State:**
- ✅ Documents: Using Abacus AI (working)
- ❌ Photos: Trying to use Anthropic (not configured)

**Need to decide:** Single API or multi-API approach?

---

## 🎯 Recommended API Architecture

### **Strategy: Unified Abacus AI Approach** ⭐

#### Why Abacus AI for Everything?
1. **Already Configured** - Token working, deployment ready
2. **Multi-Modal** - Handles text, images, documents
3. **Cost Effective** - One API to manage
4. **Simpler Architecture** - Less complexity
5. **Proven Working** - Document analyzer already uses it

#### How It Works:

```
┌─────────────────────────────────────────┐
│     Unified File Analyzer               │
│  (Photos + Documents + Mixed)           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│     File Type Router                    │
│                                         │
│  - Photos → Image Analysis Pipeline     │
│  - PDFs → Document Processing Pipeline  │
│  - Mixed → Combined Pipeline            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      ABACUS AI API                      │
│   (Single Unified Backend)              │
│                                         │
│  Deployment: 6a1d18f38                  │
│  Token: 2670...a1a                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Response Processor                 │
│                                         │
│  - Extract damage data                  │
│  - Extract insurance data               │
│  - Format for display                   │
│  - Generate recommendations             │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Phase 1: Update Photo Analysis to Use Abacus AI

#### Current Photo API (Broken):
```typescript
// lib/photo-intelligence.ts
import Anthropic from '@anthropic-ai/sdk'; // ❌ Not configured

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // ❌ Doesn't exist
});
```

#### New Photo API (Using Abacus):
```typescript
// lib/photo-intelligence.ts
import { abacusVisionAnalyzer } from './abacus-vision';

export const photoIntelligence = {
  async analyzePhoto(buffer: Buffer, context: any) {
    // Convert image to base64
    const base64Image = buffer.toString('base64');

    // Call Abacus AI with image
    const response = await fetch('https://api.abacus.ai/chat/deployment/6a1d18f38', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEPLOYMENT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this roof photo for damage. Context: ${JSON.stringify(context)}`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    const result = await response.json();
    return formatPhotoAnalysisResult(result);
  }
};
```

### Phase 2: Unified Endpoint

#### New Unified API Endpoint:
```
POST /api/analyze/unified
```

**Request Format:**
```typescript
{
  files: File[],                    // Array of any file types
  analysisType: 'roof_damage' | 'insurance_doc' | 'mixed' | 'custom',
  context: {
    propertyAddress?: string,
    claimDate?: string,
    roofAge?: string,
    hailSize?: string,
    customRequest?: string          // For custom analysis
  }
}
```

**Response Format:**
```typescript
{
  success: boolean,
  analysisType: string,
  results: {
    photos?: {
      analyzed: number,
      damageDetected: boolean,
      severity: { score: number, rating: string },
      detections: Array<{
        type: string,
        confidence: number,
        description: string
      }>,
      recommendations: string[]
    },
    documents?: {
      processed: number,
      insuranceData: {
        claimNumber?: string,
        policyNumber?: string,
        // ... other fields
      },
      extractedText: string,
      keyFindings: string[]
    },
    mixed?: {
      // Combined analysis
      photoAnalysis: {...},
      documentAnalysis: {...},
      crossReferences: string[],
      recommendations: string[]
    }
  },
  timestamp: string,
  processingTime: number
}
```

---

## 📋 Abacus AI Integration Details

### Image Analysis with Abacus AI

**Endpoint:** `https://api.abacus.ai/chat/deployment/6a1d18f38`

**Request for Photo Analysis:**
```json
{
  "messages": [{
    "role": "user",
    "content": [
      {
        "type": "text",
        "text": "Analyze this roof photo for hail damage, wind damage, missing shingles, granule loss, and other issues. Property: [ADDRESS], Storm Date: [DATE], Hail Size: [SIZE]. Provide:\n1. Damage severity (1-10)\n2. Damage types detected\n3. Evidence for each finding\n4. Repair recommendations\n5. Claim viability"
      },
      {
        "type": "image",
        "source": {
          "type": "base64",
          "media_type": "image/jpeg",
          "data": "base64_encoded_image_here"
        }
      }
    ]
  }],
  "conversation_id": "photo_analysis_session_id"
}
```

**Expected Response:**
```json
{
  "response": "Based on the roof photo analysis:\n\n1. Damage Severity: 7/10\n2. Damage Types:\n   - Hail Impact: Multiple bruises visible, 1.5\" consistent with reported hail size\n   - Granule Loss: Moderate, approximately 30% coverage\n   - Missing Shingles: 2-3 shingles displaced on north slope\n\n3. Evidence:\n   - Circular impact marks consistent with 1.5\" hail\n   - Random distribution pattern indicates storm event\n   - Shingle displacement shows wind uplift\n\n4. Recommendations:\n   - Full roof replacement recommended\n   - Document all slopes for comprehensive claim\n   - Check gutters for granule accumulation\n\n5. Claim Viability: STRONG - Clear storm damage evidence",
  "conversation_id": "photo_analysis_session_id"
}
```

### Document Analysis with Abacus AI (Already Working)

**Current Implementation:** ✅ Working in `app/api/analyze/documents/route.ts`

**Request:**
```json
{
  "messages": [{
    "role": "user",
    "content": "Analyze these insurance documents and extract:\n- Claim number\n- Policy number\n- Adjuster info\n- Coverage amounts\n- Approved/denied items\n\nDocuments:\n[extracted_text_here]"
  }]
}
```

---

## 🎯 Analysis Type Routing

### 1. Roof Damage Assessment (Photos)
**Triggers when:**
- Files are primarily images
- User selects "Roof Damage Assessment"

**Process:**
1. Convert images to base64
2. Build context prompt with property details
3. Call Abacus AI vision endpoint
4. Parse damage findings
5. Calculate severity score
6. Generate recommendations

**Prompt Template:**
```
You are a professional roof inspector analyzing photos for insurance claims.

PROPERTY DETAILS:
- Address: {propertyAddress}
- Storm Date: {claimDate}
- Roof Age: {roofAge} years
- Hail Size: {hailSize} inches

ANALYSIS REQUIREMENTS:
1. Identify ALL damage types (hail, wind, missing shingles, granule loss, flashing issues)
2. Rate severity 1-10 for each damage type
3. Provide evidence for each finding
4. Determine if damage is storm-related or age-related
5. Recommend: Full Replacement / Slope Replacement / Repair / Monitor / No Action

FORMAT YOUR RESPONSE AS:
{
  "damage_severity": 7,
  "damage_types": [...],
  "evidence": [...],
  "storm_related": true/false,
  "recommendation": "full_replacement",
  "reasoning": "..."
}
```

### 2. Insurance Document Review (PDFs/Docs)
**Triggers when:**
- Files are documents (PDF, DOCX, etc.)
- User selects "Insurance Document Review"

**Process:**
1. Extract text from documents
2. Call Abacus AI for structured extraction
3. Parse insurance fields
4. Identify discrepancies
5. Flag missing information

**Prompt Template:**
```
Extract insurance claim information from these documents.

EXTRACT:
- Claim Number
- Policy Number
- Insurance Company
- Adjuster Name, Phone, Email
- Date of Loss
- Property Address
- Coverage Amounts (RCV, ACV)
- Deductible
- Approved Items
- Denied Items
- Missing Information

FORMAT AS JSON:
{
  "claim_number": "...",
  "policy_number": "...",
  ...
}
```

### 3. Mixed Analysis (Photos + Documents)
**Triggers when:**
- Both images and documents uploaded
- User selects "Mixed Analysis"

**Process:**
1. Run photo analysis
2. Run document analysis
3. Cross-reference findings
4. Identify gaps
5. Generate unified recommendations

**Example Cross-Reference:**
- Photo shows hail damage on 3 slopes
- Adjuster report only approves 1 slope
- **Flag:** "Photos show damage on North, South, and West slopes but adjuster report only approves North slope. Consider supplement for missed slopes."

### 4. Custom Analysis
**Triggers when:**
- User types custom request
- User selects "Custom Analysis"

**Process:**
1. Use custom request as main prompt
2. Attach all files as context
3. Let Abacus AI interpret freely
4. Return raw analysis

---

## 🔐 API Keys & Configuration

### Current Setup:
```env
# .env.local
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
```

### What We Need:
- ✅ Abacus AI Token (already have)
- ✅ Deployment ID (already have)
- ❌ No additional APIs needed!

### Optional Enhancements:
```env
# Optional: For advanced vision (if Abacus vision is limited)
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx  # FREE tier available

# Optional: For enterprise features
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx  # $$ paid
```

---

## 💰 Cost Analysis

### Abacus AI Only (Recommended):
- **Cost:** Based on existing Abacus AI plan
- **Tokens:** Pay per analysis
- **Estimate:** ~$0.01-0.05 per analysis
- **Scalability:** Good for 1000+ analyses/month

### Multi-API Approach:
- **Abacus AI:** Documents + some vision
- **Anthropic:** Advanced vision ($$$)
- **Cost:** Higher, ~$0.10-0.20 per analysis
- **Complexity:** Higher (multiple APIs to manage)

---

## 🚀 Implementation Checklist

### Immediate Actions:
- [ ] Update `lib/photo-intelligence.ts` to use Abacus AI instead of Anthropic
- [ ] Create `lib/abacus-vision.ts` for image analysis via Abacus
- [ ] Test Abacus AI with base64 image input
- [ ] Verify Abacus AI can handle vision tasks

### API Development:
- [ ] Create `/api/analyze/unified/route.ts`
- [ ] Implement file type detection
- [ ] Build routing logic (photo/doc/mixed)
- [ ] Add prompt templates for each type
- [ ] Handle response parsing

### Frontend Integration:
- [ ] Update UnifiedAnalyzerModal to call new API
- [ ] Handle different response types
- [ ] Display results appropriately
- [ ] Add error handling

### Testing:
- [ ] Test with photos only
- [ ] Test with documents only
- [ ] Test with mixed files
- [ ] Test custom analysis
- [ ] Verify accuracy vs current system

---

## 🎯 Decision Points

### ❓ Question 1: Single API or Multi-API?
**Option A: Abacus AI Only** ⭐ RECOMMENDED
- ✅ Already configured
- ✅ Lower cost
- ✅ Simpler architecture
- ✅ One token to manage
- ❓ Vision quality unknown (need to test)

**Option B: Abacus + Anthropic**
- ✅ Best vision quality
- ❌ Higher cost
- ❌ Need Anthropic API key
- ❌ More complex

**Option C: Abacus + Hugging Face**
- ✅ Hugging Face is free
- ✅ Good vision models
- ❌ Need HF API key
- ❌ More complexity

### ❓ Question 2: Image Format?
**Option A: Base64 Encoding** ⭐ RECOMMENDED
- ✅ Direct API integration
- ✅ No storage needed
- ❌ Larger payload

**Option B: Upload to Storage First**
- ✅ Smaller API payloads
- ❌ Need storage service
- ❌ More steps

### ❓ Question 3: Analysis Depth?
**Option A: Quick Analysis** (< 10 seconds)
- Basic damage detection
- Simple severity score
- Quick recommendations

**Option B: Deep Analysis** (30-60 seconds) ⭐ RECOMMENDED
- Detailed damage assessment
- Code violation checking
- Comprehensive recommendations
- Cross-referencing with docs

---

## 📊 Next Steps

1. **Test Abacus AI Vision Capabilities**
   ```bash
   curl -X POST https://api.abacus.ai/chat/deployment/6a1d18f38 \
     -H "Authorization: Bearer 2670ce30456644ddad56a334786a3a1a" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{
         "role": "user",
         "content": [
           {"type": "text", "text": "Describe this roof photo"},
           {"type": "image", "source": {"type": "base64", "data": "..."}}
         ]
       }]
     }'
   ```

2. **If Abacus Vision Works:**
   - ✅ Use Abacus for everything
   - Update photo-intelligence.ts
   - Build unified endpoint
   - Deploy!

3. **If Abacus Vision Limited:**
   - Get Hugging Face API key (free)
   - Use HF for vision, Abacus for text
   - Hybrid approach

---

## 🤔 Questions for You:

1. **Do you have budget for Anthropic API?** (Better vision but costs $$)
2. **Should we test Abacus AI vision first?** (Free, already have access)
3. **Preference: Fast analysis (10s) or Deep analysis (30-60s)?**
4. **Any specific vision requirements?** (e.g., need to detect specific damage patterns)
5. **Want to keep photo/doc separate pages or fully unified?**

---

**Recommended Decision:**
✅ Test Abacus AI vision capabilities first
✅ If good enough, use Abacus for everything (simplest, cheapest)
✅ If not, add free Hugging Face for vision
✅ Only get Anthropic if vision quality is critical
