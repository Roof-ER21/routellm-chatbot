# 📋 Unified File Analyzer - Comprehensive Implementation Plan

## 🎯 Goal
Combine Photo Analyzer and Document Analyzer into ONE powerful upload button that can analyze:
- Photos (roof damage, hail damage, property photos)
- Documents (PDFs, Word docs, Excel, insurance forms)
- Any combination of files reps need help with

---

## 📊 Current State Analysis

### Photo Analyzer (Current Features)
- ✅ Upload up to 20 photos
- ✅ Single or batch analysis mode
- ✅ Property details input (address, claim date, roof age, hail size)
- ✅ AI damage detection
- ✅ Severity scoring (1-10)
- ✅ Confidence ratings
- ✅ Damage recommendations
- ✅ Results displayed in chat

### Document Analyzer (Current Features)
- ✅ Multi-file drag-and-drop
- ✅ Supports PDFs, Word, Excel, Text, Images
- ✅ Insurance data extraction (claim #, policy #, adjuster info)
- ✅ AI-powered document analysis
- ✅ Key findings and recommendations
- ✅ Export as PDF report
- ✅ Separate page at /document-analyzer

---

## 🎨 Unified Analyzer - Feature Options

### Option 1: Simple Unified Modal (Recommended)
**What it does:**
- Replace both buttons with ONE "Upload & Analyze" button
- Single modal that accepts ANY file type
- Auto-detects whether files are photos, documents, or mixed
- Provides appropriate analysis based on file types

**Pros:**
- ✅ Simple user experience
- ✅ One button to rule them all
- ✅ Less confusion for reps
- ✅ Faster workflow

**Cons:**
- ⚠️ May need smart file type detection
- ⚠️ Different UI for different file types

### Option 2: Tabbed Unified Modal
**What it does:**
- One button opens modal with tabs
- Tab 1: Photos (current photo analyzer)
- Tab 2: Documents (current doc analyzer)
- Tab 3: Mixed (handles both)

**Pros:**
- ✅ Clear separation of analysis types
- ✅ Dedicated UI for each type
- ✅ Easy to understand

**Cons:**
- ⚠️ Extra clicks (tab selection)
- ⚠️ More complex UI

### Option 3: Smart Upload with Context Selection (BEST)
**What it does:**
- One "Upload & Analyze" button
- Drag-and-drop or click to upload ANY files
- After upload, shows smart context selector:
  - "Roof Damage Assessment"
  - "Insurance Document Review"
  - "General Property Analysis"
  - "Custom Analysis" (specify what you need)
- AI analyzes based on selected context

**Pros:**
- ✅ Maximum flexibility
- ✅ Context-aware analysis
- ✅ Handles all use cases
- ✅ Single upload flow

**Cons:**
- ⚠️ Slightly more complex to implement

---

## 🔧 Recommended Implementation: Option 3 - Smart Upload

### File Upload Features
1. **Drag & Drop Zone**
   - Visual feedback when dragging
   - Support for multiple files at once
   - Show file previews (thumbnails for images)

2. **File Type Support**
   - Images: JPG, PNG, HEIC, WebP
   - Documents: PDF, DOCX, DOC, TXT
   - Spreadsheets: XLSX, XLS, CSV
   - Max 20 files total
   - Max 10MB per file

3. **File Management**
   - Preview thumbnails
   - Remove individual files
   - See file sizes
   - Upload progress indicators

### Analysis Context Options
After files are uploaded, rep selects analysis type:

#### 1. 🏠 Roof Damage Assessment
- Best for: Roof photos, damage images
- Asks for:
  - Property address
  - Date of damage/storm
  - Roof age
  - Hail size (if known)
  - Type of roofing material
- Analyzes:
  - Damage severity
  - Hail impact patterns
  - Recommended repairs
  - Scope of work needed
  - Photo quality for claims

#### 2. 📄 Insurance Document Review
- Best for: PDFs, claim forms, adjuster reports
- Extracts:
  - Claim number
  - Policy number
  - Insurance company
  - Adjuster contact info
  - Date of loss
  - Coverage amounts
  - Deductible
  - Approved/denied items
- Analyzes:
  - Missing information
  - Discrepancies
  - Action items needed

#### 3. 🔍 Mixed Analysis (Photos + Docs)
- Best for: Complete claim packages
- Combines:
  - Photo damage analysis
  - Document data extraction
  - Cross-reference findings
- Provides:
  - Unified claim summary
  - Damage vs coverage comparison
  - Recommended next steps

#### 4. 💬 Custom Analysis
- Rep types what they need:
  - "Compare these estimates"
  - "Find missing items from scope"
  - "Analyze supplement potential"
  - "Review denial letter"
- AI analyzes based on custom request

### Analysis Output Options

#### Output Format 1: Chat Integration (Current)
- Results appear in chat
- Clean, readable format
- Can ask follow-up questions
- History preserved in session

#### Output Format 2: Dedicated Results Panel (New)
- Split screen view
- Left: Uploaded files with previews
- Right: Analysis results
- Export options (PDF, DOCX)
- Copy to clipboard
- Share via email

#### Output Format 3: Action Cards (New)
- Key findings as action cards
- Each card has:
  - Finding/issue
  - Importance level (High/Medium/Low)
  - Recommended action
  - Quick action buttons:
    - "Add to email"
    - "Create supplement"
    - "Check with Susan AI"

### Enhanced Features

#### AI Enhancement Options:
1. **Damage Comparison**
   - Compare multiple photos
   - Track damage progression
   - Before/after analysis

2. **Estimate Generation**
   - Auto-generate scope from photos
   - Xactimate integration hints
   - Line item suggestions

3. **Missing Items Finder**
   - Compare adjuster report vs photos
   - Identify missed damage
   - Suggest supplement items

4. **Claim Strength Analyzer**
   - Rate claim strength 1-10
   - Identify weak points
   - Suggest documentation needed

5. **Template Matching**
   - Match damage to templates
   - Pre-fill common fields
   - Speed up workflow

---

## 🎯 Recommended Feature Set for V1

### Core Features (Must Have)
✅ Single "Upload & Analyze" button
✅ Drag-and-drop file upload
✅ Support photos + documents
✅ Context selector (4 analysis types)
✅ Smart file type detection
✅ Progress indicators
✅ Results in chat (current behavior)
✅ Error handling

### Enhanced Features (Should Have)
✅ File previews/thumbnails
✅ Remove individual files
✅ Property details input
✅ Insurance data extraction
✅ Export results (PDF)
✅ Copy to clipboard

### Advanced Features (Nice to Have)
⭐ Dedicated results panel
⭐ Action cards with quick actions
⭐ Damage comparison
⭐ Missing items finder
⭐ Claim strength analyzer
⭐ Before/after tracking

---

## 🚀 Implementation Steps

### Phase 1: Unified Upload Component
1. Create `UnifiedAnalyzerModal.tsx`
2. Merge file upload logic from both analyzers
3. Implement drag-and-drop zone
4. Add file type detection
5. Create file preview system

### Phase 2: Context Selection
1. Create context selector UI
2. Implement 4 analysis modes
3. Build dynamic input forms based on context
4. Add validation

### Phase 3: Analysis Engine
1. Route to appropriate API based on context
2. Handle mixed file types
3. Combine results from multiple analyses
4. Format output for chat

### Phase 4: Results & Export
1. Display results in chat
2. Add export to PDF
3. Implement copy to clipboard
4. Create shareable links

### Phase 5: Polish
1. Loading states
2. Error handling
3. Success animations
4. Mobile responsive
5. Accessibility

---

## 🎨 UI/UX Design

### Button Design
```
📎 Upload & Analyze Files
```
- Red gradient (matches existing photo button)
- Prominent position next to chat input
- Tooltip: "Upload photos, documents, or both for AI analysis"

### Modal Layout
```
┌─────────────────────────────────────────┐
│  📎 Upload & Analyze                 ✕  │
├─────────────────────────────────────────┤
│                                         │
│  [Drag & drop files here]              │
│  or click to browse                     │
│                                         │
│  📸 Photos  📄 Documents  📊 Spreadsheets│
│                                         │
├─────────────────────────────────────────┤
│  Uploaded Files (3):                    │
│  ▣ roof-damage.jpg      [preview] [×]   │
│  ▣ claim-form.pdf       [preview] [×]   │
│  ▣ estimate.xlsx        [preview] [×]   │
├─────────────────────────────────────────┤
│  What do you want to analyze?          │
│  ○ Roof Damage Assessment              │
│  ○ Insurance Document Review           │
│  ○ Mixed Analysis (Photos + Docs)      │
│  ● Custom Analysis                      │
│                                         │
│  [Tell me what you need...]            │
│                                         │
│         [Cancel]  [Analyze Files]       │
└─────────────────────────────────────────┘
```

---

## 📝 Technical Architecture

### New Files to Create
1. `/app/components/UnifiedAnalyzerModal.tsx` - Main modal
2. `/app/components/FileUploadZone.tsx` - Drag-drop zone
3. `/app/components/AnalysisContextSelector.tsx` - Context picker
4. `/app/components/FilePreviewGrid.tsx` - File previews
5. `/lib/unified-analyzer.ts` - Analysis orchestration
6. `/app/api/analyze/unified/route.ts` - Unified API endpoint

### API Endpoints to Create/Update
- `POST /api/analyze/unified` - Main analysis endpoint
  - Accepts mixed file types
  - Routes to appropriate analyzers
  - Combines results

### Files to Modify
- `/app/page.tsx` - Replace photo button with unified button
- Remove document analyzer page (or redirect to unified)

---

## 🧪 Testing Checklist

### File Upload Testing
- [ ] Single photo upload
- [ ] Multiple photos (up to 20)
- [ ] Single document upload
- [ ] Multiple documents
- [ ] Mixed photos + documents
- [ ] Drag and drop
- [ ] Click to browse
- [ ] File size validation (10MB)
- [ ] File type validation
- [ ] Remove files before analysis

### Analysis Testing
- [ ] Roof damage assessment with photos
- [ ] Insurance doc review with PDF
- [ ] Mixed analysis with photos + docs
- [ ] Custom analysis with specific request
- [ ] Error handling for failed uploads
- [ ] Error handling for failed analysis
- [ ] Progress indicators during upload
- [ ] Progress indicators during analysis

### Output Testing
- [ ] Results display in chat correctly
- [ ] Photo analysis severity scores
- [ ] Document data extraction accuracy
- [ ] Mixed analysis combines results
- [ ] Export to PDF works
- [ ] Copy to clipboard works
- [ ] Results are actionable

---

## 🎯 Success Metrics

### User Experience
- ✅ Single button for all uploads
- ✅ < 3 clicks to analyze files
- ✅ Results in < 30 seconds
- ✅ 100% mobile compatible

### Functionality
- ✅ Handles 20 files simultaneously
- ✅ Supports 10+ file types
- ✅ 95%+ accuracy in data extraction
- ✅ Actionable results every time

### Technical
- ✅ < 2 second upload time
- ✅ < 30 second analysis time
- ✅ Zero data loss
- ✅ Graceful error handling

---

## 🚀 Ready to Build!

**Next Steps:**
1. Review this plan and approve feature set
2. Launch mega claude with all agents for implementation
3. Build Phase 1-5 in sequence
4. Test thoroughly
5. Deploy to production

**Command to execute:**
```
mega claude build unified file analyzer following UNIFIED_ANALYZER_PLAN.md
```

---

**Questions to Answer Before Starting:**
1. Should we keep document analyzer as separate page OR redirect to unified?
2. Do we want action cards or just chat results for V1?
3. Should export be PDF, DOCX, or both?
4. Mobile-first or desktop-first design priority?
5. Any specific Xactimate integration needs?
