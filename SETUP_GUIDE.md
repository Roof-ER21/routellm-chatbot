# 🚀 Railway Setup & Feature Verification Guide

## ✅ What's Working

Your PDF OCR conversion is **working perfectly**! 🎉

---

## 📋 Insurance Companies Setup

### Problem
Insurance companies from Vercel didn't transfer to Railway (separate databases)

### Solution
Simple one-time setup to populate Railway database with 64 insurance companies

### Steps:

1. **Go to Setup Page**
   ```
   https://your-railway-url.up.railway.app/setup
   ```

2. **Click "Populate Insurance Companies"**
   - Loads 64 companies into Railway database
   - Includes: State Farm, Allstate, USAA, Progressive, etc.
   - Has phone numbers, extensions, emails for each

3. **Click "Check Insurance Companies"** to verify
   - Should show 64 companies loaded
   - Sample companies displayed

4. **Done!** Insurance selector will now work on main page

---

## 📧 Email Generator Status

### ✅ Component Exists and is Integrated

**Location:** Already built into main chat interface

**How to Access:**
1. Open main chat page
2. Look for **"Generate Email"** button (orange button in action bar)
3. Click to open email generator modal

**Features:**
- 9 email types (Denial Appeal, Follow-up, etc.)
- AI-generated professional emails
- Copy to clipboard
- Send directly from app (requires RESEND_API_KEY)

**Email Types Available:**
1. Homeowner Communication
2. Adjuster Follow-up
3. Partial Denial Appeal
4. Full Denial Appeal
5. Reinspection Request
6. Estimate Follow-up
7. Initial Claim Submission
8. Supplement Request
9. Payment Status Inquiry

**To Enable Email Sending** (Optional):
Add to Railway environment variables:
```
RESEND_API_KEY=your_resend_api_key
```

Without API key:
- ✅ Email generation works
- ✅ Copy to clipboard works
- ⚠️ Direct sending disabled (can copy/paste to email client)

---

## 🎯 Feature Checklist

### PDF Analysis ✅
- [x] Text-based PDFs extract perfectly
- [x] Scanned PDFs auto-convert to images
- [x] Client-side OCR working
- [x] Progress indicators show
- [x] "Roof letter.pdf" works!

### Insurance Companies ⏳
- [ ] Needs one-time population via /setup page
- [x] Database schema exists
- [x] API endpoints ready
- [x] 64 companies ready to import

### Email Generator ✅
- [x] Component built and integrated
- [x] AI generation working (uses Abacus AI)
- [x] 9 email types available
- [x] Copy to clipboard works
- [x] Professional formatting
- [ ] Direct sending (needs RESEND_API_KEY - optional)

### Other Features ✅
- [x] Document analysis (Word, Excel, PDFs, Images)
- [x] Weather verification (NOAA API)
- [x] Photo analysis (if HUGGINGFACE_API_KEY set)
- [x] Voice commands
- [x] Templates system

---

## 🔧 Railway Environment Variables

**Required (Already Set):**
```
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
```

**Optional Enhancements:**
```
RESEND_API_KEY=your_key_here       # For email sending
HUGGINGFACE_API_KEY=your_key_here  # For advanced photo analysis
```

---

## 📊 Database Tables on Railway

Your Railway Postgres has these tables ready:

1. **insurance_companies** - 64 companies (needs population)
2. **chat_sessions** - User chat history
3. **reps** - Sales rep tracking
4. **sent_emails** - Email logs
5. **weather_events** - NOAA weather data

---

## 🎯 Quick Start After Railway Deploy

### Step 1: Populate Insurance Companies
```
1. Go to: https://your-railway-url.up.railway.app/setup
2. Click "Populate Insurance Companies"
3. Wait for success message
4. Click "Check Insurance Companies" to verify
```

### Step 2: Test Features
```
1. Upload "Roof letter.pdf" - should extract text ✅
2. Click insurance button - should show 64 companies ✅
3. Click email button - should generate emails ✅
```

### Step 3: Optional Enhancements
```
1. Add RESEND_API_KEY for email sending
2. Add HUGGINGFACE_API_KEY for advanced photo analysis
```

---

## 🐛 Troubleshooting

### Insurance Companies Not Showing
- Go to `/setup` page
- Click "Populate Insurance Companies"
- Should only need to do once

### Email Generator Not Working
- Check if button is visible on main page
- Look for orange "Generate Email" button
- Component should auto-open when clicked

### PDF Still Not Working
- Clear browser cache
- Check Railway deployment logs
- Verify latest code is deployed

---

## 📞 Support

All features are deployed and ready!

**Working:**
- ✅ PDF OCR (scanned + text-based)
- ✅ Email Generator UI
- ✅ Insurance Company schema

**Needs One-Time Setup:**
- ⏳ Insurance companies population (via /setup page)

**Optional:**
- 📧 Email sending (add RESEND_API_KEY)
- 📸 Advanced photo analysis (add HUGGINGFACE_API_KEY)
