# 📎 Unified Document Analyzer - User Guide

## Quick Start

### What is it?
The **Unified Document Analyzer** is your all-in-one tool for analyzing insurance documents, photos, estimates, denial letters, and emails. Just upload your files and let Susan AI-21 extract the critical information you need.

---

## 🚀 How to Use

### Step 1: Click the Upload Button

Look for the **📎 Upload & Analyze** button:
- On the main chat page (next to the message input)
- In the Quick Access Tools section (when chat is empty)

### Step 2: Add Your Files

**Two ways to upload:**

1. **Drag & Drop**
   - Drag files from your computer directly into the upload zone
   - Visual feedback shows when files are being dragged

2. **Browse & Select**
   - Click "Browse Files" button
   - Select one or multiple files
   - Choose up to 20 files at once

**Supported File Types:**
- 📄 PDFs (denial letters, estimates, policies)
- 🖼️ Images (photos, screenshots, scans)
- 📝 Word documents (.docx, .doc)
- 📊 Spreadsheets (.xlsx, .xls, .csv)
- 📃 Text files (.txt)

**File Limits:**
- Maximum 20 files per upload
- Maximum 10MB per file

### Step 3: Choose Analysis Type

Select what you want Susan to analyze:

#### ✨ **Smart Analysis (Auto-detect)** - DEFAULT
**Best for:** When you're not sure what type of document you have

**What it does:**
- Automatically detects the document type
- Provides the most relevant analysis
- Adapts to your content

**When to use:**
- Mixed document types
- Unfamiliar documents
- Quick analysis needed

---

#### ❌ **Denial Letter Review**
**Best for:** Insurance denial letters

**What it extracts:**
- ✅ Approved items with amounts
- ❌ Denied items with amounts and reasons
- 💰 Total approved vs denied
- 📋 Action items to overcome denials
- ⭐ Supplement potential (HIGH/MEDIUM/LOW)
- 💡 Strategic recommendations
- 🎯 Next steps

**Example Output:**
```
❌ DENIED ITEMS ($5,550):
• North slope tear-off: $3,500
  Reason: "Damage pre-dates loss date"
  Supplement Potential: HIGH ⭐

✅ APPROVED ITEMS ($8,850):
• South slope replacement: $8,400

📋 ACTION ITEMS:
1. Get photos of North slope storm damage
2. Provide chimney documentation
```

---

#### 💰 **Estimate Comparison**
**Best for:** Comparing adjuster vs contractor estimates

**What it finds:**
- 🔍 Missing items from adjuster estimate
- 💵 Price differences between estimates
- 📏 Scope gaps (square footage, materials)
- 💸 Total potential shortfall
- 📝 Supplement recommendations

**Upload 2 files:**
1. Adjuster estimate (PDF)
2. Contractor estimate (PDF)

**Example Output:**
```
💰 MISSING FROM ADJUSTER:
- Ice & water shield: $1,200
- Drip edge: $650
- Pipe boots (3): $450
POTENTIAL RECOVERY: $2,300

📊 PRICE GAPS:
- Shingles: Adjuster $85/sq vs Market $110/sq
SHORTFALL: $4,500
```

---

#### 📧 **Email Analysis**
**Best for:** Adjuster emails and correspondence

**What it extracts:**
- 👤 Sender info (name, role, contact)
- ⚠️ Action items with deadlines
- 📞 Key contacts (phone, email)
- 🔢 Claim/policy numbers
- 💬 Sentiment analysis (tone, urgency)
- ✉️ Professional response template

**Example Output:**
```
📧 FROM: John Smith (Adjuster)
📞 Contact: (555) 123-4567

⚠️ ACTION ITEMS:
1. Photos of all 4 slopes - DUE: 3 days (HIGH)
2. Proof of damage date - DUE: ASAP (HIGH)

💬 SENTIMENT: Professional but firm
🎯 URGENCY: HIGH (reinspection soon)

✉️ RESPONSE TEMPLATE:
"Hi John, Thank you for the update..."
```

---

#### 📦 **Full Claims Package**
**Best for:** Complete claim folders with multiple documents

**What it analyzes:**
- 📋 Claim overview (numbers, amounts, dates)
- ⏰ Timeline of events
- 📑 Document inventory
- 💪 Claim strengths
- ⚠️ Claim weaknesses
- ❌ Denied items analysis
- 🔍 Missing items identification
- 💡 Comprehensive strategy
- 🎯 Priority action items
- 💰 Total supplement potential

**Upload multiple files:**
- Denial letter(s)
- Estimate(s)
- Photos
- Emails
- Any other claim documents

---

### Step 4: Review Files

Before analyzing:
- ✅ Check file previews (images show thumbnails)
- ✅ Verify file names are correct
- ✅ Remove any unwanted files (click ✖ button)

### Step 5: Click "Analyze Files"

- Loading spinner appears
- Analysis typically takes 10-30 seconds
- Modal closes automatically when done

### Step 6: Review Results in Chat

Results appear as a formatted message with:
- 📌 Clear section headers
- 💵 Highlighted dollar amounts
- 📋 Numbered action items
- 💡 Strategic recommendations
- 🎯 Next steps

---

## 📖 Real-World Examples

### Example 1: Denied Claim

**Situation:** Client's roof claim was partially denied

**What to upload:**
- `denial_letter.pdf`

**Select:**
- ❌ Denial Letter Review

**What you get:**
- List of all denied items with amounts
- Specific denial reasons for each item
- Supplement potential ratings
- Strategic approach to challenge denials
- Action items with priorities

**Next steps:**
- Focus on HIGH supplement potential items
- Gather recommended documentation
- Prepare supplement request

---

### Example 2: Low Estimate

**Situation:** Adjuster's estimate is $6,000 lower than yours

**What to upload:**
- `adjuster_estimate.pdf`
- `my_estimate.pdf`

**Select:**
- 💰 Estimate Comparison

**What you get:**
- Missing line items
- Price differences per item
- Scope discrepancies
- Total shortfall calculation
- Supplement recommendations

**Next steps:**
- Draft supplement with missing items
- Provide market rate justifications
- Request re-measurement if needed

---

### Example 3: Adjuster Email

**Situation:** Adjuster sent email with multiple requests

**What to upload:**
- `adjuster_email.pdf` or screenshot

**Select:**
- 📧 Email Analysis

**What you get:**
- All action items extracted
- Deadlines highlighted
- Contact information organized
- Sentiment analysis
- Professional response template

**Next steps:**
- Complete action items by deadlines
- Send professional response
- Schedule follow-up if needed

---

## 💡 Pro Tips

### For Best Results:

1. **Clear Scans**
   - Use good lighting for photos
   - Ensure text is readable
   - High resolution is better

2. **Complete Information**
   - Include all relevant pages
   - Don't crop important details
   - Upload related documents together

3. **File Naming**
   - Use descriptive names
   - Include dates if relevant
   - Example: `denial_letter_smith_06272024.pdf`

4. **Multiple Documents**
   - Upload related files together
   - Use Claims Package for full analysis
   - Separate unrelated claims

5. **Follow Up**
   - Copy important findings to notes
   - Save analysis results
   - Use insights for communication

---

## ⚠️ Common Issues

### "No analyzable content found"

**Cause:** PDF is a scanned image without text
**Solution:**
- Use OCR software to convert first
- Upload as image instead
- Try different file format

### "File too large"

**Cause:** File exceeds 10MB limit
**Solution:**
- Compress PDF (many online tools)
- Split into multiple files
- Reduce image resolution

### "Analysis failed"

**Cause:** Server error or network issue
**Solution:**
- Check internet connection
- Try again in a moment
- Contact support if persists

### "Upload failed"

**Cause:** Unsupported file type
**Solution:**
- Check file extension
- Convert to supported format (PDF, JPG, DOCX)
- Try different file

---

## 🎯 When to Use Each Analysis Type

| Document Type | Recommended Analysis | Why |
|--------------|---------------------|-----|
| Denial letter | Denial Letter Review | Extracts denied items and supplement potential |
| 2+ estimates | Estimate Comparison | Finds missing items and price gaps |
| Adjuster email | Email Analysis | Extracts action items and creates response |
| Complete claim folder | Claims Package | Comprehensive review of all documents |
| Unknown document | Smart Analysis | Auto-detects and adapts |
| Mixed files | Claims Package or Smart | Handles multiple document types |

---

## 📞 Need Help?

If you have questions or encounter issues:

1. Check this guide first
2. Review the example outputs
3. Try Smart Analysis (auto-detect)
4. Contact support with:
   - File type you're uploading
   - Analysis type selected
   - Error message (if any)
   - Screenshot of issue

---

## 🚀 Quick Reference Card

**Upload:**
- Click 📎 button
- Drag/drop or browse
- Up to 20 files, 10MB each

**Choose Analysis:**
- ✨ Smart = Auto-detect
- ❌ Denial = Extract denied items
- 💰 Estimate = Compare prices
- 📧 Email = Action items
- 📦 Package = Complete review

**Get Results:**
- Wait 10-30 seconds
- Review formatted output
- Act on recommendations

**Best Practices:**
- Clear scans
- Descriptive file names
- Related files together
- Review before analyzing

---

**Made with ❤️ for Susan AI-21 users**

Happy analyzing! 🎉
