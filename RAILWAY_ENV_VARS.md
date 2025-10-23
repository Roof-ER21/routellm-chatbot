# Railway Environment Variables Configuration

## Required Variables (Already Configured)

These should already be set in your Railway deployment:

```bash
# Abacus.AI (Primary Provider) - REQUIRED
DEPLOYMENT_TOKEN=your_token_here
ABACUS_DEPLOYMENT_ID=6a1d18f38

# Database
DATABASE_URL=your_railway_postgres_url

# Other existing vars...
```

## Optional Backup Providers

Add these to Railway to enable additional fallback providers:

### HuggingFace (Backup Provider #1) - OPTIONAL

```bash
# Get free API key at: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2  # Optional, has default
```

**Benefits:**
- Adds cloud-based backup when Abacus fails
- Free tier available
- Multiple model options

**How to add:**
1. Go to https://huggingface.co/settings/tokens
2. Create a new token (Read role is sufficient)
3. Add to Railway: `Settings → Variables → Add`

### Ollama (Backup Provider #2) - OPTIONAL (Local only)

```bash
# Only works if Ollama is running on the same server
OLLAMA_API_URL=http://localhost:11434
```

**Note:** Ollama requires local installation and is typically not available on Railway. It will automatically work if you deploy to a VPS where Ollama is running.

## Current Fallback Chain

With just Abacus configured (minimum):
```
1. Abacus.AI (configured ✅)
   ↓ on failure
2. Static Knowledge Base (always available ✅)
```

With HuggingFace added:
```
1. Abacus.AI (configured ✅)
   ↓ on failure
2. HuggingFace (optional)
   ↓ on failure
3. Static Knowledge Base (always available ✅)
```

With all providers (ideal for local development):
```
1. Abacus.AI (cloud, configured ✅)
   ↓ on failure
2. HuggingFace (cloud, optional)
   ↓ on failure
3. Ollama (local, optional)
   ↓ on failure
4. Static Knowledge Base (always available ✅)
```

## Testing Your Configuration

### Test via Railway logs:

```bash
railway logs
```

Look for:
```
[Failover] 🔄 Attempting Abacus.AI...
[AbacusProvider] ✅ Valid response received
[Failover] ✅ SUCCESS with Abacus.AI
```

### Test with curl:

```bash
# Test your deployed API
curl -X POST https://your-app.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"test"}],
    "repName": "test"
  }'
```

Should return:
```json
{
  "message": "...",
  "model": "Susan AI-21",
  "provider": "Abacus.AI"
}
```

## Current Configuration Status

✅ **Working Now (Minimum Viable):**
- Abacus.AI → Static Knowledge fallback
- System will NEVER show generic error
- Static Knowledge provides offline responses

⚡ **Recommended (Add HuggingFace):**
- Abacus.AI → HuggingFace → Static Knowledge
- Better redundancy
- Cloud-based backup before going offline

🚀 **Optimal (Local Dev with Ollama):**
- Abacus.AI → HuggingFace → Ollama → Static Knowledge
- Maximum redundancy
- Local AI available

## How to Add Environment Variables to Railway

1. Open your Railway project
2. Click on your service
3. Go to `Settings` tab
4. Click `Variables` section
5. Click `+ New Variable`
6. Add:
   - **Variable Name**: `HUGGINGFACE_API_KEY`
   - **Value**: Your API key from HuggingFace
7. Click `Add`
8. Railway will automatically redeploy

## Summary

**Current Status:**
- ✅ Abacus working
- ✅ Static Knowledge working (always available)
- ⚠️ HuggingFace not configured (optional)
- ⚠️ Ollama not available on Railway (local only)

**Result:**
Your app will NEVER fail completely. If Abacus goes down, Static Knowledge Base provides offline responses with built-in roofing knowledge.

**To improve redundancy (recommended):**
Add `HUGGINGFACE_API_KEY` to Railway environment variables for an additional cloud-based fallback layer.
