# Quick Reference Card

## Deploy in 3 Commands

```bash
# 1. Initialize and commit
git init && git add . && git commit -m "Deploy roofing chatbot"

# 2. Install Vercel CLI and deploy
npm install -g vercel && vercel

# 3. Set environment variables (in Vercel dashboard)
# DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
# DEPLOYMENT_ID=6a1d18f38
```

**Done! App is live.**

---

## Essential Information

| Item | Value |
|------|-------|
| **Project Location** | /Users/a21/routellm-chatbot |
| **Deployment Token** | 2670ce30456644ddad56a334786a3a1a |
| **Deployment ID** | 6a1d18f38 |
| **AI Model** | Susan AI-21 (Abacus.AI) |
| **Local Port** | 4000 |
| **Recommended Platform** | Vercel (free) |
| **Estimated Cost** | $0/month |
| **Setup Time** | 10 minutes |

---

## Deployment Comparison (Quick View)

| Platform | Cost | Time | Difficulty | Mobile | Recommendation |
|----------|------|------|------------|--------|----------------|
| **Vercel** | **$0** | **10m** | **Easy** | **⭐⭐⭐⭐⭐** | **✓ BEST** |
| Railway | $5 | 15m | Easy | ⭐⭐⭐⭐⭐ | Good |
| Netlify | $0 | 15m | Easy | ⭐⭐⭐⭐ | OK |
| Fly.io | $3 | 30m | Medium | ⭐⭐⭐⭐ | Advanced |
| Self-Host | $20+ | 4h+ | Hard | ⭐⭐⭐ | Not recommended |

---

## Mobile Setup (For Field Teams)

### iPhone:
```
1. Open Safari
2. Go to your Vercel URL
3. Tap Share (📤)
4. "Add to Home Screen"
5. Name: "Roofer AI"
```

### Android:
```
1. Open Chrome
2. Go to your Vercel URL
3. Tap menu (⋮)
4. "Add to home screen"
5. Name: "Roofer AI"
```

---

## Files You Need

✓ **vercel.json** - Deployment config (created)
✓ **.env.local** - Local environment (add tokens)
✓ **DEPLOYMENT_GUIDE.md** - Full instructions (read this)
✓ **package.json** - Dependencies (already configured)

---

## Common Commands

```bash
# Development
npm install              # Install dependencies
npm run dev             # Run locally on port 4000
npm run build           # Test production build

# Deployment
./deploy.sh             # Automated deployment
vercel                  # Deploy to preview
vercel --prod           # Deploy to production

# Monitoring
vercel logs             # View logs
vercel ls               # List deployments
vercel inspect          # Deployment details
```

---

## Environment Variables

```bash
# Required for deployment
DEPLOYMENT_TOKEN=2670ce30456644ddad56a334786a3a1a
DEPLOYMENT_ID=6a1d18f38
```

**Where to set:**
- **Local**: `.env.local` file
- **Vercel**: Dashboard > Project > Settings > Environment Variables

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Run `npm run build` locally to test |
| Env vars not working | Restart dev server: `npm run dev` |
| API errors | Check deployment token in Vercel |
| Port in use | Change port in package.json or kill: `lsof -ti:4000 \| xargs kill` |
| Vercel deploy fails | Check GitHub integration, re-import repo |

---

## Key URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Abacus.AI Console**: https://api.abacus.ai/
- **Next.js Docs**: https://nextjs.org/docs
- **Your GitHub Repo**: (create at github.com)

---

## Cost Breakdown

```
Vercel Free Tier:
├─ Hosting:           $0/month
├─ Bandwidth:         100GB free
├─ Functions:         Unlimited
├─ Team:              3 members
├─ Domain:            Custom (optional: $12/year)
└─ Total:             $0-1/month

Vercel Pro (if needed):
├─ Hosting:           $20/month
├─ Everything above
└─ Plus:              Analytics, password protection, priority support
```

---

## Performance Expectations

| Metric | Expected Value |
|--------|---------------|
| Page Load | 1-2 seconds |
| AI Response | 2-5 seconds |
| Mobile Score | 95-100/100 |
| Uptime | 99.99% |
| Build Time | <2 minutes |

---

## Support Contacts

| Issue | Resource |
|-------|----------|
| Deployment | DEPLOYMENT_GUIDE.md |
| Platform comparison | DEPLOYMENT_COMPARISON.md |
| Non-technical guide | QUICK_START.md |
| Project overview | README.md |
| Vercel issues | https://vercel.com/support |
| Abacus.AI issues | https://docs.abacus.ai |

---

## Decision Tree

```
Need to deploy? → Read this file
Need detailed steps? → Read DEPLOYMENT_GUIDE.md
Want platform comparison? → Read DEPLOYMENT_COMPARISON.md
Executive overview? → Read DEPLOYMENT_SUMMARY.md
Non-technical person? → Read QUICK_START.md
```

---

## Success Checklist

### Pre-Deployment:
- [x] App builds successfully (`npm run build`)
- [x] Configuration files created
- [x] Environment variables documented
- [ ] GitHub account created
- [ ] Vercel account created

### Deployment:
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set in Vercel
- [ ] App deployed successfully
- [ ] Custom domain configured (optional)

### Post-Deployment:
- [ ] Tested on desktop browser
- [ ] Tested on iPhone
- [ ] Tested on Android
- [ ] URL shared with team
- [ ] Team trained on usage
- [ ] Feedback collected

---

## ROI Quick Math

```
Time saved per worker:  30 min/day
Number of workers:      5
Working days/month:     20
Hourly rate:           $30/hour

Monthly value:
  = 5 workers × 0.5 hours/day × 20 days × $30/hour
  = $1,500/month

Monthly cost (Vercel):  $0

ROI:                    Infinite
Payback period:         Immediate
```

---

## One-Line Summary

**Deploy your Next.js roofing chatbot to Vercel for free in 10 minutes and give your field team mobile AI assistance.**

---

**Ready? Run: `./deploy.sh`**
