# RouteLLM Chatbot - Railway Deployment Guide

## 🚀 Quick Deploy to Railway

This is a Railway-optimized copy of the RouteLLM Chatbot with all configurations ready.

### Environment Variables Required

Copy these to your Railway project environment variables:

```bash
# Abacus.AI API Configuration
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38

# Optional: Hugging Face API (for vision analysis)
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Optional: Resend API (for email notifications)
RESEND_API_KEY=re_placeholder

# Railway automatically sets PORT - don't override it
NODE_ENV=production
```

### Deployment Steps

1. **Initialize Git (if not already done)**
   ```bash
   cd /Users/a21/routellm-chatbot-railway
   git init
   git add .
   git commit -m "Initial Railway deployment"
   ```

2. **Link to Railway**
   ```bash
   railway link
   # Or create new project:
   railway init
   ```

3. **Set Environment Variables**
   ```bash
   railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
   railway variables set ABACUS_DEPLOYMENT_ID=6a1d18f38
   railway variables set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   railway up
   ```

### Configuration Files

- **Procfile** - Defines web process
- **railway.toml** - Railway-specific build and deploy settings
- **nixpacks.toml** - Nixpacks build configuration
- **.env.railway** - Environment variables template
- **start.sh** - Startup script that handles Railway's PORT

### Features

- ✅ Next.js 15 optimized
- ✅ Abacus.AI integration
- ✅ Vision analysis capabilities
- ✅ Email notifications
- ✅ Automatic port handling
- ✅ Health checks configured
- ✅ Auto-restart on failure

### Differences from Vercel Version

- Uses `start.sh` instead of Vercel's serverless functions
- PORT is dynamically assigned by Railway
- Build process optimized for Railway's environment
- No cron jobs (configure separately in Railway if needed)

### Post-Deployment

After deployment, Railway will provide a URL like:
`https://routellm-chatbot-railway-production.up.railway.app`

### Troubleshooting

If deployment fails:
1. Check Railway logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Ensure PORT is not hardcoded anywhere
4. Check build logs for npm install errors

### Support

Original Vercel deployment: https://routellm-chatbot-p8x1hwc2p-ahmedmahmoud-1493s-projects.vercel.app/
