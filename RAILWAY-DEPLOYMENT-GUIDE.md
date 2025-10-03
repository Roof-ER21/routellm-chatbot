# 🚂 Railway Deployment Guide - Insurance Intelligence Features

## Current Status
- ✅ All code ready and built
- ✅ Features tested on Vercel
- ⏳ Need to deploy to Railway: https://susanai21.up.railway.app

## Quick Deployment Steps

### Option 1: Railway CLI (Recommended)

```bash
# 1. Login to Railway (if not already)
railway login

# 2. Link to your project (if not already linked)
railway link

# 3. Deploy the latest code
railway up

# 4. Check deployment status
railway status
```

### Option 2: Git Push Deployment

If Railway is connected to your GitHub repo:

```bash
# 1. Commit all changes
git add .
git commit -m "Add insurance intelligence system with detail popup and Susan chat"

# 2. Push to main branch
git push origin main

# Railway will auto-deploy from GitHub
```

### Option 3: Railway Dashboard

1. Go to https://railway.app
2. Find your "susanai21" project
3. Click on the service
4. Click "Deploy" → "Deploy Now"
5. Or redeploy from GitHub if connected

## After Deployment: Run Migrations

Once the new code is deployed to Railway:

### Step 1: Access Admin Panel
1. Go to: https://susanai21.up.railway.app/admin
2. Enter passcode: **2110**

### Step 2: Navigate to Database Utils
1. Click on "🗄️ Database Utils" tab
2. You'll see two buttons:
   - "▶️ Run Migrations"
   - "▶️ Populate Intelligence Data"

### Step 3: Run Migrations (in order)
1. **First**: Click "▶️ Run Migrations"
   - This adds all new fields to the database
   - Wait for: "✅ Migrations completed successfully!"

2. **Second**: Click "▶️ Populate Intelligence Data"
   - This updates all 64 companies with research data
   - Wait for: "✅ Intelligence data populated! Updated 15 companies, 0 errors"

## What Gets Deployed

### New Files:
- `app/components/InsuranceDetailPopup.tsx` - Detail popup with Susan chat
- `app/api/admin/run-migrations/route.ts` - Migration endpoint
- `app/api/admin/populate-intelligence/route.ts` - Data population endpoint
- `db/migrations/*.sql` - All migration files

### Updated Files:
- `app/components/InsuranceCompanyModal.tsx` - Enhanced selector
- `app/page.tsx` - New flow integration
- `app/admin/page.tsx` - Database utils tab

## Testing After Deployment

### 1. Test Insurance Company Selector
1. Go to: https://susanai21.up.railway.app
2. Enter your name
3. Click "🏢 Insurance Companies"
4. Search for "State Farm"
5. **Look for:**
   - ✅ Responsiveness score badge (Score: 9/10)
   - ✅ Phone with shortcut underneath
   - ✅ App name: "State Farm"
   - ✅ Best call times displayed
   - ✅ "View Details →" button

### 2. Test Detail Popup
1. Click "View Details →" on any company
2. **Check left side:**
   - Contact info with phone shortcuts
   - App/website links
   - Intelligence cards (delays, workarounds, etc.)
   - Escalation paths
3. **Check right side:**
   - Susan AI chat header
   - Initial greeting mentioning company name
   - Chat input box

### 3. Test Susan Chat
1. In the detail popup, ask Susan:
   - "What's the best time to call?"
   - "How do I escalate a claim?"
   - "What workarounds work with this company?"
2. Susan should respond with specific info about that company

## Troubleshooting

### If /api/admin/run-migrations returns 404:
- Code not fully deployed yet
- Wait a few minutes for Railway build to complete
- Check Railway dashboard for build logs

### If migrations fail:
- Check DATABASE_URL is set in Railway environment variables
- Verify PostgreSQL service is running
- Check Railway logs for detailed error messages

### If no data appears:
- Make sure you ran migrations FIRST, then population
- Check Railway logs: `railway logs`
- Verify database connection in Railway dashboard

## Environment Variables Required

Make sure these are set in Railway dashboard:

```
DATABASE_URL=postgresql://...  (should already exist)
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
ABACUS_DEPLOYMENT_ID=6a1d18f38
```

## Verification Checklist

After deployment and migrations:

- [ ] Railway build completed successfully
- [ ] Admin panel accessible at /admin
- [ ] Database Utils tab visible
- [ ] Migrations ran successfully
- [ ] Intelligence data populated
- [ ] Insurance selector shows new fields
- [ ] Detail popup opens on company select
- [ ] Susan chat works in popup
- [ ] Company intelligence displays correctly

## Quick Test Commands

```bash
# Check if new endpoints exist
curl https://susanai21.up.railway.app/api/admin/run-migrations
# Should return JSON (not 404)

# Check deployment
railway status

# View logs
railway logs
```

## Support

If you encounter issues:
1. Check Railway build logs in dashboard
2. Verify DATABASE_URL is set
3. Make sure PostgreSQL service is running
4. Check that npm run build completed successfully

---

**Once deployed and migrated, the insurance intelligence system will be fully active on Railway!** 🚀
