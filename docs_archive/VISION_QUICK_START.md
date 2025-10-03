# Vision Analysis - Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Get Free API Key
```
https://huggingface.co/settings/tokens
→ Click "New token"
→ Name: susan-ai-vision
→ Type: Read
→ Copy token (hf_xxxxx...)
```

### 2. Add to Vercel
```
Vercel Dashboard
→ Project Settings
→ Environment Variables
→ Add: HUGGINGFACE_API_KEY = hf_xxxxx...
→ Save
```

### 3. Test
```bash
curl https://your-app.vercel.app/api/vision/analyze
# Should return: "status": "operational"
```

**Done!** You're saving $150/month. 💰

---

## 📡 API Endpoints

### Vision Analysis
```bash
POST /api/vision/analyze
Body: multipart/form-data
  - image: File (roof photo)
  - context: string (optional)

Response:
{
  "success": true,
  "analysis": {
    "description": "Asphalt shingle roof with hail damage...",
    "is_roof_image": true,
    "damage_indicators": ["hail", "impact marks"],
    "confidence": 0.85
  }
}
```

### Heavy Document Analysis
```bash
POST /api/document/heavy-analysis
Body: multipart/form-data
  - file0, file1, ... (multiple files)
  - useVision: true (enable vision for images)
  - propertyAddress: string (optional)

Response:
{
  "success": true,
  "documents": [...],
  "analysis": {...},
  "insuranceData": {...}
}
```

---

## 💰 Cost Savings

| Provider | Cost/Image | Your Cost |
|----------|-----------|-----------|
| **Hugging Face** | $0.00006 | **$0/month** |
| Anthropic (old) | $0.015 | ~~$150/month~~ |

**Savings: $1,793/year** (99.6% reduction)

---

## 🧪 Quick Tests

### Test 1: Valid Roof Photo
```bash
curl -X POST http://localhost:4000/api/vision/analyze \
  -F "image=@roof.jpg"

# Expected: is_roof_image: true ✅
```

### Test 2: Invalid Image (Dog)
```bash
curl -X POST http://localhost:4000/api/vision/analyze \
  -F "image=@dog.jpg"

# Expected: error: "not a roof" ✅
```

---

## 🔧 Troubleshooting

### "Vision service not configured"
```bash
# Add API key to .env.local
echo "HUGGINGFACE_API_KEY=hf_xxxxx" >> .env.local
npm run dev
```

### "Model is loading"
```
Wait 10-20 seconds, retry automatically happens.
Models warm up on first use, then stay fast.
```

### Check Status
```bash
curl http://localhost:4000/api/vision/analyze
# Should show: "configured": true
```

---

## 📚 Full Documentation

- **Setup:** `VISION_SETUP.md`
- **Cost Analysis:** `COST_ANALYSIS.md`
- **Implementation:** `VISION_IMPLEMENTATION_COMPLETE.md`
- **Code:** `/lib/vision-service.ts`

---

## ✅ What You Get

- ✅ 250x cost reduction
- ✅ FREE tier (30K images/month)
- ✅ Smart roof validation
- ✅ No chat blocking
- ✅ Accurate results
- ✅ Automatic fallbacks
- ✅ Easy to maintain

**Ready to deploy!** 🚀
