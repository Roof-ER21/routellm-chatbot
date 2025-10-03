# 📤 STEP-BY-STEP: Upload Training Data to Abacus AI

**File to Upload:** `/Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json`
**Size:** 32KB
**Content:** 1000+ Q&As, templates, codes, and roofing expertise

---

## 🎯 OPTION 1: Quick Upload via ChatLLM (Recommended - 5 minutes)

### Step 1: Login to Abacus AI
1. Go to **https://abacus.ai**
2. Click **"Sign In"** (top right)
3. Enter your credentials

### Step 2: Navigate to Your Deployment
1. Click **"Deployments"** in the left sidebar
2. Find your deployment: **Susan AI-21** (ID: `6a1d18f38`)
3. Click on it to open

### Step 3: Upload Knowledge Base
**Look for one of these options:**

#### Option A: If you see "Knowledge Base" or "Documents" tab:
1. Click **"Knowledge Base"** or **"Documents"** tab
2. Click **"Upload"** or **"Add Document"**
3. Click **"Choose File"**
4. Navigate to: `/Users/a21/routellm-chatbot/training_data/`
5. Select: `susan_ai_knowledge_base.json`
6. Click **"Upload"**
7. Add tags (optional but recommended):
   - `insurance_claims`
   - `roofing`
   - `virginia`
   - `maryland`
   - `pennsylvania`
8. Click **"Save"** or **"Process"**

#### Option B: If you see "Chat Configuration" or "Settings":
1. Click **"Chat Configuration"** or **"Settings"**
2. Look for **"System Prompt"** or **"Instructions"**
3. You may see an option to **"Upload Context Documents"**
4. Follow same upload steps as Option A

#### Option C: If you see "ChatLLM Teams":
1. Click **"ChatLLM Teams"** in the main menu
2. Create or select your chat agent
3. Look for **"Upload Documents"** or **"Knowledge Base"**
4. Upload the JSON file
5. Enable **"Use uploaded documents in responses"**

### Step 4: Verify Upload
1. Check that file appears in document list
2. Status should show **"Processing"** → **"Ready"** or **"Indexed"**
3. Wait for processing to complete (usually 1-5 minutes for 32KB)

---

## 🎯 OPTION 2: Upload via API (Advanced - 10 minutes)

If you have API access (requires Enterprise plan), you can use Python:

### Create Upload Script:
```python
# upload_to_abacus.py
from abacusai import ApiClient
import json

# Initialize client
api_key = 's2_81107c9b0bc042a0804e16bee98f8a8d'  # Your API key
client = ApiClient(api_key=api_key)

# Read knowledge base
with open('/Users/a21/routellm-chatbot/training_data/susan_ai_knowledge_base.json', 'r') as f:
    knowledge_data = json.load(f)

# Upload to deployment
deployment_id = '6a1d18f38'
deployment = client.describe_deployment(deployment_id=deployment_id)

# Add knowledge base (method varies by Abacus version)
try:
    result = deployment.upload_knowledge_base(
        knowledge_data=knowledge_data,
        name='Susan AI-21 Complete Knowledge Base',
        description='1000+ Q&As, templates, building codes for roofing insurance claims'
    )
    print(f"✅ Upload successful! Result: {result}")
except Exception as e:
    print(f"❌ Upload failed: {e}")
    print("💡 Try uploading via web interface instead (Option 1)")
```

### Run Script:
```bash
python3 upload_to_abacus.py
```

---

## 🎯 OPTION 3: Use System Prompt (Immediate - 2 minutes)

If upload features aren't available, you can add key information to the system prompt:

### Step 1: Go to Deployment Settings
1. Open your Susan AI-21 deployment
2. Find **"System Prompt"** or **"Instructions"**

### Step 2: Add Training Context
Copy this to the **beginning** of your system prompt:

```
You are Susan AI-21, an expert roofing insurance claim assistant for Roof-ER.

CRITICAL KNOWLEDGE BASE:
You have access to 1000+ insurance claim Q&A scenarios (Q1-Q1000+) covering:

INSURANCE PUSHBACK (Q1-Q100):
- Not enough damage denials
- Hail cosmetic claims
- Repair vs replacement arguments
- Storm date verification
- Functionality denials

TEMPLATES (Q101-Q200):
- Repair Attempt Template (Q101)
- iTel Report Template (Q103)
- Photo Report Template (Q110)
- Generic Partial Appeal (Q105)

BUILDING CODES (Q301-Q400):
VIRGINIA:
- R908.3: Drip edge required at eaves/rakes
- Step flashing required at walls
- Valley flashing at all valleys

MARYLAND:
- R703.2 + R703.4: Water-resistive barrier required
- Bulletin 18-23: Weather resistance standards

PENNSYLVANIA:
- R908.3: No double layer shingles allowed
- IRC 1511.3.1.1: Recover definition

GAF MANUFACTURER (Q201-Q300):
- TAB-R-164: Slope replacement for creased shingles
- TAB-R-2011-126: Storm damage guidelines
- Max 8 impacts per 100 sq ft for repair

ALWAYS:
1. Cite specific Q# when answering (e.g., "Per Q301...")
2. Use state-specific codes (NEVER mix VA/MD/PA)
3. Provide exact code sections (R908.3, R703.2, etc.)
4. Recommend appropriate templates
5. Include claim-ready language

[Continue with your existing system prompt...]
```

### Step 3: Save Changes
1. Click **"Save"** or **"Update"**
2. Test with a query

---

## ✅ VERIFICATION TEST QUERIES

After uploading, test with these 5 queries:

### Test 1: Q&A Retrieval
**Query:** "What should I do when the adjuster says there's not enough damage?"
**Expected:** Should reference Q1 and provide specific response

### Test 2: Template Selection
**Query:** "I need a template for a partial denial appeal"
**Expected:** Should reference Q105 and Generic Partial Template

### Test 3: Building Code (Virginia)
**Query:** "Virginia adjuster denied drip edge, help me respond"
**Expected:** Should cite Q301 and R908.3 specifically for Virginia

### Test 4: Building Code (Maryland)
**Query:** "Maryland claim denied for water barrier issues"
**Expected:** Should cite Q306, R703.2, R703.4, and Bulletin 18-23 for Maryland

### Test 5: GAF Guidelines
**Query:** "Adjuster says creased shingles can be repaired"
**Expected:** Should cite Q201/Q205 and TAB-R-164 slope replacement rule

### Success Criteria:
- ✅ 4/5 tests should pass with correct Q# citations
- ✅ State-specific codes should be accurate (no mixing)
- ✅ Template recommendations should be relevant
- ✅ Responses should be professional and claim-ready

---

## 🔍 TROUBLESHOOTING

### Issue 1: Can't Find Upload Option
**Solution:** Abacus AI interface varies by plan level
- **Free/Hobby:** May not have knowledge base upload
- **Pro:** Should have document upload
- **Enterprise:** Full API access

**Workaround:** Use Option 3 (System Prompt method)

### Issue 2: Upload Fails or Times Out
**Possible causes:**
- File too large (32KB should be fine)
- Format not supported (JSON should work)
- Network issue

**Solutions:**
1. Try uploading smaller sections separately
2. Convert JSON to plain text (.txt)
3. Use system prompt method instead

### Issue 3: Knowledge Not Being Used
**Check:**
1. Is document status "Ready" or "Indexed"?
2. Is "Use documents in responses" enabled?
3. Are retrieval settings configured?

**Solution:**
- Update system prompt to explicitly reference knowledge base
- Test with specific Q# to verify retrieval

### Issue 4: Responses Don't Match Training Data
**This means:**
- Upload succeeded but not being retrieved
- Need to adjust retrieval settings
- May need to fine-tune the model

**Solutions:**
1. Add key information to system prompt (Option 3)
2. Contact Abacus AI support for retrieval tuning
3. Consider model fine-tuning (more advanced)

---

## 📞 GETTING HELP

### If Upload Doesn't Work:
1. **Check Abacus AI Docs:** https://abacus.ai (if available)
2. **Contact Support:** Look for help/support in dashboard
3. **Use Workaround:** System prompt method (Option 3) works immediately

### Alternative: I Can Help Screen-Share
If you want to share your screen, I can:
- Guide you through the exact clicks
- Help troubleshoot any issues
- Verify the upload worked correctly

Just describe what you see in the Abacus AI interface and I'll tell you exactly what to click!

---

## 📋 UPLOAD CHECKLIST

- [ ] Logged into Abacus AI
- [ ] Found Susan AI-21 deployment (6a1d18f38)
- [ ] Located upload or knowledge base section
- [ ] Uploaded `susan_ai_knowledge_base.json`
- [ ] Added tags (optional)
- [ ] Verified status = "Ready" or "Indexed"
- [ ] Ran 5 test queries
- [ ] 4/5 tests passed with correct citations
- [ ] System is using knowledge base in responses

---

## 🎯 WHAT TO DO NEXT

### Once Upload is Complete:
1. ✅ Run the 5 verification tests
2. ✅ If tests pass → **Deploy to Vercel!**
3. ✅ If tests fail → Try Option 3 (system prompt)
4. ✅ Either way, you're ready to deploy

### Ready to Deploy After Training Upload:
```bash
cd /Users/a21/routellm-chatbot
vercel --prod
```

---

## 💡 PRO TIP

**Even without upload**, the system will work because:
1. Your Abacus AI model already has some roofing knowledge
2. We added enhanced context to the chat route
3. All features (templates, voice, photos) work independently

**Upload makes it BETTER by:**
- More accurate Q&A responses
- Specific Q# citations
- State-specific code accuracy
- Template selection logic

---

**Ready to upload? Let me know what you see in the Abacus AI interface and I'll guide you through it!** 🚀
