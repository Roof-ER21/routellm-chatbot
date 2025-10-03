# RouteLLM Chatbot - Vercel Deployment Guide

## Prerequisites
- GitHub account (for code hosting)
- Vercel account (free - sign up at https://vercel.com)
- Your Abacus.AI credentials:
  - Deployment Token: `2670ce30456644ddad56a334786a3a1a`
  - Deployment ID: `6a1d18f38`

---

## Deployment Steps

### Step 1: Prepare Repository
```bash
cd /Users/a21/routellm-chatbot

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - RouteLLM chatbot for roofing teams"
```

### Step 2: Push to GitHub
```bash
# Create a new repository on GitHub.com
# Then link it:
git remote add origin https://github.com/YOUR_USERNAME/routellm-chatbot.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Easiest)
1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Add Environment Variables:
   - Name: `DEPLOYMENT_TOKEN`
   - Value: `2670ce30456644ddad56a334786a3a1a`

   - Name: `DEPLOYMENT_ID`
   - Value: `6a1d18f38`
6. Click "Deploy"
7. Wait 2-3 minutes for deployment
8. Your app will be live at: `https://your-app-name.vercel.app`

#### Option B: Using Vercel CLI (Advanced)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (will prompt for settings)
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project's name? routellm-chatbot
# - In which directory is your code located? ./
# - Want to override settings? No

# Add environment variables
vercel env add DEPLOYMENT_TOKEN
# Paste: 2670ce30456644ddad56a334786a3a1a

vercel env add DEPLOYMENT_ID
# Paste: 6a1d18f38

# Deploy to production
vercel --prod
```

---

## Step 4: Configure Custom Domain (Optional)

### Using Vercel's Free Domain
- Your app is automatically available at: `https://routellm-chatbot.vercel.app`

### Using Your Own Domain
1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add your domain (e.g., `chatbot.yourcompany.com`)
3. Update your DNS records as instructed by Vercel
4. Vercel will automatically provision SSL certificate

---

## Step 5: Mobile Access Setup

### For Field Teams:

#### iOS (iPhone/iPad):
1. Open Safari
2. Navigate to your Vercel URL
3. Tap the Share button
4. Select "Add to Home Screen"
5. Name it "Roofer AI" or similar
6. Now it works like a native app!

#### Android:
1. Open Chrome
2. Navigate to your Vercel URL
3. Tap the menu (three dots)
4. Select "Add to Home Screen"
5. Name it "Roofer AI"
6. Now it works like a native app!

---

## Step 6: Testing

### Test on Desktop:
```bash
# Open in browser
open https://your-app-name.vercel.app
```

### Test on Mobile:
1. Share the Vercel URL with team via SMS/Email
2. Each person can add to home screen
3. Test chat functionality
4. Verify Abacus.AI responses work

### Test Checklist:
- [ ] Chat interface loads correctly
- [ ] Can send messages
- [ ] AI responds appropriately
- [ ] Quick links work
- [ ] Mobile responsive design works
- [ ] "Add to Home Screen" works on iOS/Android
- [ ] HTTPS is enabled (automatic on Vercel)

---

## Monitoring & Maintenance

### View Logs:
```bash
vercel logs https://your-app-name.vercel.app
```

### View Analytics:
- Go to Vercel Dashboard > Your Project > Analytics
- See real-time usage, performance, errors

### Update Deployment:
```bash
# Make code changes
git add .
git commit -m "Update feature X"
git push

# Vercel automatically redeploys!
```

---

## Troubleshooting

### Issue: Environment variables not working
**Solution:**
1. Go to Vercel Dashboard > Settings > Environment Variables
2. Ensure `DEPLOYMENT_TOKEN` and `DEPLOYMENT_ID` are set
3. Redeploy: Deployments > Three dots > Redeploy

### Issue: Build fails
**Solution:**
```bash
# Test build locally first
npm run build

# If it works locally, check Vercel build logs
vercel logs --output
```

### Issue: API calls failing
**Solution:**
1. Check Vercel Function Logs in dashboard
2. Verify Abacus.AI token is valid
3. Test API endpoint directly:
```bash
curl -X POST https://your-app-name.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

### Issue: Slow performance
**Solution:**
- Vercel free tier has some limits but should be fine for 5-10 users
- If needed, upgrade to Pro ($20/month) for better performance

---

## Cost Breakdown

### Vercel Free Tier (Recommended for 5-10 users):
- **Cost:** $0/month
- **Includes:**
  - 100GB bandwidth
  - Unlimited projects
  - Automatic HTTPS
  - CDN
  - Serverless functions
  - Team collaboration (3 members)

### When to Upgrade to Pro ($20/month):
- More than 10 active daily users
- Need more than 100GB bandwidth
- Want advanced analytics
- Need password protection
- Require more team members

### Abacus.AI Costs:
- Your existing Abacus.AI plan (already budgeted)
- API calls are charged per your Abacus.AI plan

### Total Monthly Cost:
- **Initial:** $0/month (Vercel free tier)
- **If scaling:** $20/month (Vercel Pro)
- **Abacus.AI:** Your existing plan

---

## Security Best Practices

### Environment Variables:
- ✅ NEVER commit `.env.local` to git
- ✅ Use Vercel Environment Variables feature
- ✅ Different tokens for dev/production

### API Security:
- ✅ API routes are server-side only
- ✅ Deployment token never exposed to client
- ✅ HTTPS enforced by default

### Access Control (Optional):
If you need to restrict access:
1. Vercel Pro: Enable password protection
2. OR implement simple auth in your Next.js app
3. OR use IP whitelisting in Vercel

---

## Alternative: Railway Deployment (Backup Option)

If Vercel doesn't work for any reason:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
railway variables set DEPLOYMENT_ID=6a1d18f38

# Deploy
railway up
```

**Cost:** $5/month (Railway free credit)

---

## Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Next.js Documentation:** https://nextjs.org/docs
- **Abacus.AI Documentation:** https://docs.abacus.ai
- **This Project:** Contact your development team

---

## Quick Reference Commands

```bash
# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# View deployments
vercel ls

# Roll back to previous deployment
vercel rollback

# Remove project
vercel remove
```

---

## Success Criteria

✅ App deployed and accessible via URL
✅ Mobile-friendly interface
✅ Field teams can add to home screen
✅ AI chatbot responds correctly
✅ HTTPS enabled
✅ Fast loading times (<2 seconds)
✅ No downtime
✅ Zero monthly cost (free tier)

---

**Your app will be production-ready and accessible to field teams worldwide in under 10 minutes!**
