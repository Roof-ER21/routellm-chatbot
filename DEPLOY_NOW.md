# Deploy RouteLLM Chatbot to Railway - Quick Guide

## Immediate Deployment (Option 1 - Recommended)

### Run the Deployment Script

Open your terminal and run:

```bash
cd /Users/a21/routellm-chatbot-railway
./quick-deploy.sh
```

This script will:
1. Check Railway CLI installation
2. Login to Railway (browser authentication)
3. Create/link Railway project
4. Set environment variables automatically
5. Deploy your application
6. Provide the production URL

---

## Manual Deployment (Option 2)

If you prefer to run commands manually:

### Step 1: Login to Railway
```bash
cd /Users/a21/routellm-chatbot-railway
railway login
```

### Step 2: Initialize Project
```bash
railway init
```

### Step 3: Set Environment Variables
```bash
railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
railway variables set ABACUS_DEPLOYMENT_ID=6a1d18f38
railway variables set NODE_ENV=production
```

### Step 4: Deploy
```bash
railway up
```

### Step 5: Get Your URL
```bash
railway status
railway open
```

---

## Alternative: Deploy via Railway Dashboard

1. Go to https://railway.app
2. Click "New Project"
3. Choose "Deploy from GitHub repo" or "Empty Project"
4. If empty project:
   - Connect your GitHub account
   - Select repository: routellm-chatbot-railway
   - Or use "Deploy from CLI"
5. Add environment variables in Railway dashboard:
   - DEPLOYMENT_TOKEN: 2670ce30456644ddad56a334786a3a1a
   - ABACUS_DEPLOYMENT_ID: 6a1d18f38
   - NODE_ENV: production
6. Railway will auto-detect Next.js and deploy

---

## Environment Variables Reference

### Required Variables
```
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
NODE_ENV=production
```

### Optional Variables (Set if needed)
```
HUGGINGFACE_API_KEY=<your-key>
RESEND_API_KEY=<your-key>
DATABASE_URL=<auto-set-by-railway-postgres>
```

---

## After Deployment

### Check Deployment Status
```bash
railway status
```

### View Logs
```bash
railway logs
railway logs --follow  # Real-time
```

### Open Dashboard
```bash
railway open
```

### Add Custom Domain
```bash
railway domain
```

---

## Quick Commands Reference

```bash
railway login          # Login to Railway
railway whoami         # Check who's logged in
railway init           # Create new project
railway up             # Deploy
railway status         # Check status
railway logs           # View logs
railway open           # Open dashboard
railway variables      # List env vars
railway domain         # Add domain
```

---

## Expected Deployment Time

- Build time: 3-5 minutes
- Start time: 30 seconds
- Total: ~5-6 minutes

---

## Production URL

After deployment, your URL will be:
- Format: https://your-project-name.up.railway.app
- Get it from: railway status or railway open

---

**Ready to Deploy?**

Just run:
```bash
cd /Users/a21/routellm-chatbot-railway
./quick-deploy.sh
```

Or open your terminal and follow the manual steps above.
# Railway Deployment: Mon Oct  6 15:55:16 EDT 2025
