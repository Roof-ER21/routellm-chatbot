# Photo Intelligence System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Photo Intelligence System                     │
│                  AI-Powered Roof Damage Analysis                 │
└─────────────────────────────────────────────────────────────────┘
```

## High-Level Architecture

```
┌──────────────┐
│   User UI    │
│ PhotoUpload  │
│  Component   │
└──────┬───────┘
       │
       │ Upload Photo(s) + Context
       ↓
┌──────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                      │
│  ┌────────────────────┐         ┌────────────────────┐      │
│  │  /api/photo/      │         │  /api/photo/       │      │
│  │    analyze        │         │    batch           │      │
│  │  (Single Photo)   │         │  (Up to 20 Photos) │      │
│  └────────┬───────────┘         └────────┬───────────┘      │
└───────────┼──────────────────────────────┼──────────────────┘
            │                              │
            │ Image Buffer(s) + Context    │
            ↓                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Photo Intelligence Engine (Core)                │
│                /lib/photo-intelligence.ts                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Step 1: Image Preprocessing              │    │
│  │                (Sharp Library)                     │    │
│  │  • Metadata extraction                             │    │
│  │  • Statistical analysis                            │    │
│  │  • Feature extraction                              │    │
│  │  • Edge detection                                  │    │
│  │  • Contrast/brightness calculation                 │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Step 2: AI Vision Analysis                 │    │
│  │         (Anthropic Claude Vision)                  │    │
│  │  • Detailed image understanding                    │    │
│  │  • Damage indicator identification                 │    │
│  │  • Material recognition                            │    │
│  │  • Pattern analysis                                │    │
│  │  • Technical assessment generation                 │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │        Step 3: Damage Classification               │    │
│  │         (DamageClassifier Class)                   │    │
│  │  • Hail impact detection                           │    │
│  │  • Wind damage detection                           │    │
│  │  • Missing shingles detection                      │    │
│  │  • Granule loss detection                          │    │
│  │  • Flashing issues detection                       │    │
│  │  • Wear and tear detection                         │    │
│  │  • Confidence scoring                              │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │      Step 4: Code Violation Identification         │    │
│  │         (DamageClassifier Class)                   │    │
│  │  • IRC R905.2.8.2 (Mat exposure)                   │    │
│  │  • IRC R905.2.7 (Underlayment)                     │    │
│  │  • IRC R903.2 (Flashing)                           │    │
│  │  • GAF Guidelines (Impact density)                 │    │
│  │  • IRC R905.2.2 (Slope requirements)               │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │          Step 5: Severity Scoring                  │    │
│  │          (SeverityScorer Class)                    │    │
│  │  • Base scoring by damage type                     │    │
│  │  • Evidence-based modifiers                        │    │
│  │  • Confidence adjustments                          │    │
│  │  • Rating determination (1-10 scale)               │    │
│  │  • Recommendation generation                       │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
│                   ↓                                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │       Step 6: Professional Assessment              │    │
│  │       (AssessmentGenerator Class)                  │    │
│  │  • Overall findings summary                        │    │
│  │  • Detailed analysis by slope                      │    │
│  │  • Code concerns documentation                     │    │
│  │  • Evidence summary with checkmarks                │    │
│  │  • Recommendation with reasoning                   │    │
│  │  • Photo suggestions for claim                     │    │
│  │  • Ready-to-use claim language                     │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                         │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │   Analysis Results    │
        │    (JSON Response)    │
        └───────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│ Image Input │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐     ┌──────────────────────┐
│  Visual Features    │────▶│   Vision Analysis    │
│  • Brightness       │     │   (Claude Vision)    │
│  • Contrast         │     │   • Description      │
│  • Edge density     │     │   • Indicators       │
│  • Color variance   │     │   • Confidence       │
│  • Texture          │     │   • Materials        │
└──────┬──────────────┘     └──────────┬───────────┘
       │                               │
       └───────────┬───────────────────┘
                   │
                   ↓
       ┌───────────────────────┐
       │ Damage Classification │
       │  • Type detection     │
       │  • Confidence calc    │
       │  • Evidence extract   │
       └───────────┬───────────┘
                   │
                   ↓
       ┌───────────────────────┐
       │  Code Violations      │
       │  • IRC compliance     │
       │  • Manufacturer rules │
       └───────────┬───────────┘
                   │
                   ↓
       ┌───────────────────────┐
       │  Severity Scoring     │
       │  • 1-10 scale        │
       │  • Rating            │
       │  • Recommendation    │
       └───────────┬───────────┘
                   │
                   ↓
       ┌───────────────────────┐
       │ Professional Report   │
       │  • Structured data   │
       │  • Claim language    │
       │  • Next steps        │
       └───────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PhotoIntelligence                        │
│                   (Main Orchestrator)                       │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │ DamageClassifier│  │ SeverityScorer  │  │ Assessment │ │
│  │                 │  │                 │  │ Generator  │ │
│  │ • Detect types  │  │ • Calculate    │  │ • Format   │ │
│  │ • Calculate     │  │   scores       │  │   reports  │ │
│  │   confidence    │  │ • Determine    │  │ • Generate │ │
│  │ • Extract       │  │   ratings      │  │   language │ │
│  │   evidence      │  │ • Recommend    │  │ • Suggest  │ │
│  │ • Identify      │  │   actions      │  │   photos   │ │
│  │   violations    │  │                │  │            │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │             External Services                         │ │
│  │                                                       │ │
│  │  ┌──────────────┐          ┌──────────────┐         │ │
│  │  │   Anthropic  │          │  Sharp Lib   │         │ │
│  │  │ Claude Vision│          │   (Image     │         │ │
│  │  │     API      │          │ Processing)  │         │ │
│  │  └──────────────┘          └──────────────┘         │ │
│  │                                                       │ │
│  │  ┌──────────────┐                                    │ │
│  │  │  Abacus AI   │  ← Future Integration             │ │
│  │  │  (Roofing    │                                    │ │
│  │  │  Expertise)  │                                    │ │
│  │  └──────────────┘                                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Class Relationships

```
PhotoIntelligence
    │
    ├── has-a → DamageClassifier
    │              │
    │              ├── defines → DamageTypes
    │              └── defines → CodeViolations
    │
    ├── has-a → SeverityScorer
    │              │
    │              └── uses → DamageDetection[]
    │
    ├── has-a → AssessmentGenerator
    │              │
    │              └── uses → Analysis Results
    │
    └── uses → Anthropic Client
                   └── provides → Vision Analysis
```

## Type System

```
┌──────────────────────────────────────────────────────────┐
│                    Core Types                            │
│                                                          │
│  DamageDetection                                        │
│  ├── type: DamageType                                   │
│  ├── name: string                                       │
│  ├── confidence: number                                 │
│  ├── indicators: string[]                               │
│  ├── patterns?: Record<string, any>                     │
│  └── evidence: Record<string, any>                      │
│                                                          │
│  SeverityScore                                          │
│  ├── score: number (1-10)                               │
│  ├── rating: string                                     │
│  ├── recommendation: RecommendationType                 │
│  ├── explanation: string                                │
│  ├── factors: Factor[]                                  │
│  ├── code_violations: boolean                           │
│  ├── mat_exposure: boolean                              │
│  └── impact_density: number                             │
│                                                          │
│  PhotoAnalysisResult                                    │
│  ├── success: boolean                                   │
│  ├── timestamp: string                                  │
│  ├── photo_id: string                                   │
│  ├── damage_detected: boolean                           │
│  ├── detections: DamageDetection[]                      │
│  ├── severity: SeverityScore                            │
│  ├── code_violations: CodeViolation[]                   │
│  ├── assessment: string                                 │
│  ├── structured_report: any                             │
│  ├── recommendation: RecommendationType                 │
│  ├── next_steps: NextStep[]                             │
│  └── additional_photos_needed: string[]                 │
└──────────────────────────────────────────────────────────┘
```

## Batch Processing Architecture

```
┌───────────────────────────────────────────────────────────┐
│                  Batch Analysis Flow                      │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Photo 1 │  │ Photo 2 │  │ Photo 3 │  │ Photo N │    │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘    │
│       │            │            │            │          │
│       └────────────┴────────────┴────────────┘          │
│                    │                                     │
│                    ↓                                     │
│       ┌────────────────────────────┐                    │
│       │  Sequential Analysis       │                    │
│       │  (for each photo)          │                    │
│       └────────────┬───────────────┘                    │
│                    │                                     │
│                    ↓                                     │
│       ┌────────────────────────────┐                    │
│       │  Collect All Results       │                    │
│       └────────────┬───────────────┘                    │
│                    │                                     │
│                    ↓                                     │
│       ┌────────────────────────────┐                    │
│       │  Aggregate Analysis        │                    │
│       │  • Highest severity        │                    │
│       │  • All damage types        │                    │
│       │  • All violations          │                    │
│       │  • Coverage check          │                    │
│       └────────────┬───────────────┘                    │
│                    │                                     │
│                    ↓                                     │
│       ┌────────────────────────────┐                    │
│       │  Generate Comprehensive    │                    │
│       │  Batch Assessment          │                    │
│       └────────────────────────────┘                    │
└───────────────────────────────────────────────────────────┘
```

## API Request/Response Flow

```
┌────────────┐
│   Client   │
└─────┬──────┘
      │
      │ POST /api/photo/analyze
      │ FormData: {
      │   photo: File,
      │   propertyAddress: string,
      │   claimDate: string,
      │   roofAge: number,
      │   hailSize: string
      │ }
      ↓
┌──────────────────┐
│  API Endpoint    │
│  - Validate      │
│  - Parse form    │
│  - Convert to    │
│    buffer        │
└─────┬────────────┘
      │
      │ Buffer + Context
      ↓
┌──────────────────┐
│ PhotoIntelligence│
│  .analyzePhoto() │
└─────┬────────────┘
      │
      │ Analysis Pipeline
      ↓
┌──────────────────┐
│  JSON Response   │
│  {               │
│    success: true,│
│    detections: [],│
│    severity: {}, │
│    assessment: "",│
│    ...          │
│  }               │
└─────┬────────────┘
      │
      ↓
┌────────────┐
│   Client   │
│  (Display  │
│   Results) │
└────────────┘
```

## File System Architecture

```
/Users/a21/routellm-chatbot/
│
├── lib/
│   └── photo-intelligence.ts          ← Core engine (1,554 lines)
│       ├── PhotoIntelligence          Main class
│       ├── DamageClassifier           Damage detection
│       ├── SeverityScorer             Scoring system
│       └── AssessmentGenerator        Report generation
│
├── app/
│   ├── api/
│   │   └── photo/
│   │       ├── analyze/
│   │       │   └── route.ts           ← Single photo API
│   │       └── batch/
│   │           └── route.ts           ← Batch API
│   │
│   ├── components/
│   │   └── PhotoUpload.tsx            ← UI component
│   │
│   └── photo-demo/
│       └── page.tsx                   ← Demo page
│
├── .env.local                         ← Config (API keys)
│
└── Documentation/
    ├── PHOTO_INTELLIGENCE_README.md          ← Full docs
    ├── PHOTO_INTELLIGENCE_SUMMARY.md         ← Summary
    ├── PHOTO_INTELLIGENCE_QUICKSTART.md      ← Quick start
    └── PHOTO_INTELLIGENCE_ARCHITECTURE.md    ← This file
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                   Technology Layers                     │
│                                                         │
│  ┌───────────────────────────────────────────────┐    │
│  │              Frontend Layer                   │    │
│  │  • React 19                                   │    │
│  │  • Next.js 15 (App Router)                    │    │
│  │  • TypeScript 5                               │    │
│  │  • Tailwind CSS                               │    │
│  └───────────────────────────────────────────────┘    │
│                        ↕                              │
│  ┌───────────────────────────────────────────────┐    │
│  │              API Layer                        │    │
│  │  • Next.js API Routes                         │    │
│  │  • Server Components                          │    │
│  │  • Edge Runtime Support                       │    │
│  └───────────────────────────────────────────────┘    │
│                        ↕                              │
│  ┌───────────────────────────────────────────────┐    │
│  │           Business Logic Layer                │    │
│  │  • PhotoIntelligence Engine                   │    │
│  │  • DamageClassifier                           │    │
│  │  • SeverityScorer                             │    │
│  │  • AssessmentGenerator                        │    │
│  └───────────────────────────────────────────────┘    │
│                        ↕                              │
│  ┌───────────────────────────────────────────────┐    │
│  │            Processing Layer                   │    │
│  │  • Sharp (Image processing)                   │    │
│  │  • Feature extraction                         │    │
│  │  • Statistical analysis                       │    │
│  └───────────────────────────────────────────────┘    │
│                        ↕                              │
│  ┌───────────────────────────────────────────────┐    │
│  │              AI Layer                         │    │
│  │  • Anthropic Claude 3.5 Sonnet                │    │
│  │  • Vision API                                 │    │
│  │  • [Future] Abacus AI                         │    │
│  └───────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Security & Performance

```
┌─────────────────────────────────────────────────────────┐
│                  Security Measures                      │
│                                                         │
│  • API key stored in .env.local (not committed)        │
│  • File type validation (images only)                  │
│  • File size limits (10MB per photo)                   │
│  • Rate limiting ready (Vercel built-in)               │
│  • Input sanitization on all parameters                │
│  • Error messages don't leak sensitive info            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Performance Optimizations                 │
│                                                         │
│  • Image optimization with Sharp                       │
│  • Efficient buffer handling                           │
│  • Parallel processing where possible                  │
│  • Response streaming for large batches                │
│  • Edge runtime support                                │
│  • Lazy loading of components                          │
└─────────────────────────────────────────────────────────┘
```

## Future Architecture Enhancements

```
Current:
Photo → Sharp → Claude Vision → Classification → Assessment

Future v2 (with Abacus AI):
Photo → Sharp → Claude Vision ─┐
                               ├─→ Merge → Classification → Assessment
                  Abacus AI ───┘

Future v3 (Custom Model):
Photo → Sharp → Custom Model → Classification → Assessment
                    ↑
              Trained on roof damage dataset

Future v4 (Full Platform):
Photo → Processing Pipeline → Multi-Model Ensemble →
        → Database Storage → PDF Generation →
        → CRM Integration → Customer Portal
```

## Deployment Architecture

```
┌───────────────────────────────────────────────────────┐
│                  Vercel Deployment                    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │         Edge Network (CDN)                  │    │
│  │  • Static assets                            │    │
│  │  • Client components                        │    │
│  └─────────────────┬───────────────────────────┘    │
│                    │                                 │
│  ┌─────────────────┴───────────────────────────┐    │
│  │      Serverless Functions (Node.js)         │    │
│  │  • /api/photo/analyze                       │    │
│  │  • /api/photo/batch                         │    │
│  │  • Max duration: 60s (single), 300s (batch) │    │
│  └─────────────────┬───────────────────────────┘    │
│                    │                                 │
│  ┌─────────────────┴───────────────────────────┐    │
│  │         External API Calls                  │    │
│  │  • Anthropic Claude Vision                  │    │
│  │  • [Future] Abacus AI                       │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

---

**Architecture Status**: Complete & Production-Ready
**Last Updated**: October 2, 2025
**Version**: 1.0.0
