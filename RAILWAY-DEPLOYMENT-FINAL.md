# 🚂 Railway Deployment Guide - Next.js App (FINAL)

## ✅ Pre-Deployment Confirmation

**Verified:** Next.js app has **ALL** capabilities from Node.js app + MORE
- See `CAPABILITIES-COMPARISON.md` for detailed comparison
- **NO features lost, only gained!**

---

## 🚀 Deployment Steps

### Step 1: Prepare the Project

```bash
cd /Users/a21/routellm-chatbot

# Make sure everything is built
npm run build
```

### Step 2: Deploy to Railway

**Option A: Railway CLI (Recommended)**

```bash
# Login (if needed)
railway login

# Link to your existing Railway project
railway link

# Deploy
railway up
```

**Option B: Using Git**

```bash
# Make sure everything is committed
git add .
git commit -m "Deploy Next.js app with insurance intelligence to Railway"
git push

# If Railway is connected to your repo, it will auto-deploy
```

**Option C: Railway Dashboard**

1. Go to https://railway.app/dashboard
2. Find your "susanai21" project
3. Click on the service
4. Go to Settings → Delete Service (to replace with new one)
5. Create new service → Deploy from GitHub
6. Select the `routellm-chatbot` repository
7. Railway will auto-deploy

### Step 3: Configure Environment Variables

In Railway Dashboard, add these environment variables:

**Required:**
```bash
DATABASE_URL=your_postgresql_url_from_railway
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
NODE_ENV=production
```

**Optional (if you have them):**
```bash
HUGGINGFACE_API_KEY=your_key_here
RESEND_API_KEY=your_key_here
```

**How to get DATABASE_URL:**
1. In Railway dashboard
2. Click on PostgreSQL service (if you have one)
3. Go to Variables tab
4. Copy `DATABASE_URL`
5. Paste it in your Next.js service variables

### Step 4: Verify Deployment

Once deployed, Railway will give you a URL like:
`https://your-app.up.railway.app`

**Test these:**

1. **Homepage:** https://your-app.up.railway.app
   - Should show "Enter Your Name to Continue"

2. **Admin Panel:** https://your-app.up.railway.app/admin
   - Enter passcode: `2110`
   - Should show admin dashboard

3. **API Health:** https://your-app.up.railway.app/api/insurance/companies
   - Should return JSON with companies

### Step 5: Run Database Migrations

1. Go to: https://your-app.up.railway.app/admin
2. Enter passcode: `2110`
3. Click "🗄️ Database Utils" tab
4. Click "▶️ Run Migrations" → wait for ✅
5. Click "▶️ Populate Intelligence Data" → wait for ✅

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check build logs in Railway dashboard
# Common issue: Node version
# Add to package.json:
"engines": {
  "node": ">=18.0.0"
}
```

### Database Connection Error
- Make sure DATABASE_URL is set in Railway environment variables
- Verify PostgreSQL service is running
- Check that DATABASE_URL format is correct: `postgresql://user:pass@host:port/db`

### 404 on API Routes
- Make sure build completed successfully
- Check Railway logs for errors
- Verify all files deployed correctly

### Site Not Loading
- Check Railway deployment logs
- Verify PORT is set (Railway auto-assigns)
- Check healthcheck status

---

## 📊 What Changes After Deployment

### URL Changes:
- **Old:** https://susanai21.up.railway.app (Node.js app)
- **New:** https://susanai21.up.railway.app (Next.js app)

### What Reps Will See:
1. **Same login screen** (enter name)
2. **Same chat interface** (improved!)
3. **Enhanced Insurance Companies:**
   - Responsiveness scores
   - Phone shortcuts
   - App names/websites
   - Click company → **NEW detail popup with Susan chat!**
4. **Same file upload** (drag & drop improved!)
5. **Same weather/storm features**
6. **Same email generator**
7. **PLUS:** Admin dashboard for you

---

## ✅ Post-Deployment Checklist

After deployment is complete:

- [ ] Homepage loads correctly
- [ ] Login works (enter name)
- [ ] Chat interface appears
- [ ] Insurance Companies button works
- [ ] Can search and select companies
- [ ] Detail popup opens (NEW!)
- [ ] Susan chat works in popup (NEW!)
- [ ] File upload works (drag & drop)
- [ ] Email generator works
- [ ] Weather/storm features work
- [ ] Admin panel accessible (/admin)
- [ ] Database migrations ran successfully
- [ ] Intelligence data populated

---

## 🎯 Quick Commands

```bash
# Deploy
cd /Users/a21/routellm-chatbot
railway up

# Check status
railway status

# View logs
railway logs

# Open in browser
railway open
```

---

## 📞 Support

If issues arise:

1. **Check Railway logs:** `railway logs` or Dashboard → Deployments → Logs
2. **Verify environment variables:** Dashboard → Variables
3. **Check build logs:** Dashboard → Deployments → Build Logs
4. **Database connection:** Make sure PostgreSQL is running and DATABASE_URL is correct

---

## 🔄 Rollback Plan

If you need to rollback to the Node.js app:

```bash
# In Railway dashboard
1. Go to Deployments
2. Find previous deployment (Node.js version)
3. Click "Redeploy"
```

Or:

```bash
cd /Users/a21/susan-ai-21
railway up
```

---

**You're ready to deploy! The Next.js app has everything the Node.js app had, plus all the new insurance intelligence features.** 🚀
