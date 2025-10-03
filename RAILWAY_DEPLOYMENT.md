# Railway Deployment Guide

## ✅ Pre-Deployment Checklist

Your codebase is ready:
- ✅ Code committed to git
- ✅ `railway.json` configuration created
- ✅ `.railwayignore` optimized for deployment
- ✅ Documentation archived
- ✅ Railway CLI installed

## 🚀 Deployment Steps

### Step 1: Link to Your Railway Project

```bash
cd /Users/a21/routellm-chatbot
railway login
```

This will open your browser to authenticate with Railway.

### Step 2: Create or Link Project

**Option A: Create New Project**
```bash
railway init
```

**Option B: Link Existing Project** (if you already created one in the Railway dashboard)
```bash
railway link
```

### Step 3: Set Environment Variables

```bash
# Add your Abacus AI credentials
railway variables set DEPLOYMENT_TOKEN="2670ce30456644ddad56a334786a3a1a"
railway variables set ABACUS_DEPLOYMENT_ID="6a1d18f38"

# Add Hugging Face API key (if you have one)
railway variables set HUGGINGFACE_API_KEY="your_key_here"

# Add PostgreSQL connection (Railway will provide this automatically)
# No need to set manually - Railway auto-provisions database
```

### Step 4: Deploy

```bash
railway up
```

This will:
1. Upload your code to Railway
2. Install dependencies (npm install)
3. Build your Next.js app (npm run build)
4. Start the server (npm start)
5. Provide you with a live URL

### Step 5: Add PostgreSQL Database (Optional)

```bash
railway add --database postgres
```

Railway will automatically set the `DATABASE_URL` environment variable.

## 📊 Monitor Deployment

```bash
# View deployment logs
railway logs

# Open deployed app
railway open

# Check deployment status
railway status
```

## 🔧 Post-Deployment

### 1. Test PDF Upload
- Open your Railway URL
- Upload "Roof letter.pdf"
- Check if text extraction works

### 2. Verify Environment Variables
```bash
railway variables
```

### 3. Check Logs
```bash
railway logs --tail
```

Look for:
- `[DocumentProcessor]` logs for PDF extraction
- `[UnifiedAnalyzer]` logs for analysis
- Any errors related to pdf-parse

## 🔄 Update Deployment

When you make code changes:

```bash
git add .
git commit -m "Your change description"
railway up
```

## 💰 Monitor Usage

```bash
railway status
```

Shows:
- CPU usage
- Memory usage
- Estimated cost
- Number of active deployments

## 🎯 Expected Costs

With Hobby plan ($5/month):
- Base: $5/month subscription
- Includes: $5 usage credit
- Your app: ~$3-8/month total (if low-medium traffic)
- Free trial: $5 credit for 30 days

## 🐛 Troubleshooting

### PDF Extraction Fails
```bash
# Check if pdf-parse is installed correctly
railway run npm list pdf-parse

# View detailed logs
railway logs --tail | grep PDF
```

### Build Fails
```bash
# Check build logs
railway logs --deployment [deployment-id]

# Verify package.json scripts
cat package.json | grep scripts
```

### Environment Variables Missing
```bash
# List all variables
railway variables

# Add missing ones
railway variables set KEY="value"
```

## 🔐 Security Notes

- Never commit `.env.local` or `.env` files
- All secrets are in Railway's encrypted storage
- Use `railway variables` command to manage secrets
- `.railwayignore` prevents sensitive files from deploying

## ✅ Success Indicators

You'll know it's working when:
1. `railway up` completes without errors
2. You can access the URL Railway provides
3. PDF uploads extract text (check console logs)
4. Abacus AI returns document-specific analysis (not generic responses)

## 🆘 Need Help?

```bash
railway help
railway docs
```

Or check Railway docs: https://docs.railway.com
