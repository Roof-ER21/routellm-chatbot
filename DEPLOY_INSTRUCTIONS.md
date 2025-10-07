# Railway Deployment - Step by Step

## Quick Deploy (Follow These Steps)

### Step 1: Login to Railway
```bash
railway login
```
This will open your browser for authentication. Complete the login there.

### Step 2: Initialize Project
```bash
railway init
```
Select "Create new project" and give it a name like "routellm-chatbot"

### Step 3: Set Environment Variables

Since Railway v4.x changed the syntax, use the dashboard:

**Option A: Via Dashboard (Recommended)**
1. Run: `railway open`
2. Go to "Variables" tab
3. Add these variables:
   - `DEPLOYMENT_TOKEN` = `2670ce30456644ddad56a334786a3a1a`
   - `ABACUS_DEPLOYMENT_ID` = `6a1d18f38`
   - `NODE_ENV` = `production`

**Option B: Via CLI (One at a time)**
```bash
railway variables --set "DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a"
railway variables --set "ABACUS_DEPLOYMENT_ID=6a1d18f38"
railway variables --set "NODE_ENV=production"
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

## Quick Commands Reference

```bash
# View deployment logs
railway logs

# View all variables
railway variables

# Redeploy
railway up

# Open dashboard
railway open

# Check status
railway status
```

## Environment Variables Needed

Copy these into Railway dashboard:

```
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
NODE_ENV=production
```

Optional:
```
HUGGINGFACE_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
```

## Expected Deployment Time

- Upload: 30 seconds
- Build (npm install + build): 3-5 minutes
- Deploy: 30 seconds

Total: ~5-10 minutes

## Your Production URL

After deployment, you'll get a URL like:
`https://routellm-chatbot-production.up.railway.app`

## Troubleshooting

**If login fails:**
```bash
railway logout
railway login
```

**If deployment fails:**
```bash
railway logs
```

**To redeploy:**
```bash
railway up --detach
```

## Files Already Configured

✅ railway.toml - Railway configuration
✅ nixpacks.toml - Build settings
✅ Procfile - Process definition
✅ start.sh - Startup script
✅ Git repository - Clean and committed

Everything is ready - just follow the 5 steps above!
