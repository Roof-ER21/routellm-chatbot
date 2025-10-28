# Troubleshooting Guide

## Common Issues and Solutions

### Knowledge Base 500 Errors

**Symptoms:**
- Knowledge base page returns 500 error
- Error message: "Cannot find module './[number].js'"
- Development server shows webpack chunk errors

**Cause:**
Stale Next.js build artifacts in `.next` directory causing webpack chunk resolution failures.

**Solution:**
```bash
# 1. Clean build artifacts
rm -rf .next

# 2. Kill existing dev server
lsof -ti:4000 | xargs kill -9

# 3. Restart development server
npm run dev
```

**Prevention:**
Run `npm run dev:clean` instead of `npm run dev` if you experience frequent issues.

---

### Module Not Found: 'fs' Errors

**Symptoms:**
- Build fails with "Module not found: Can't resolve 'fs'"
- Error occurs in client-side code

**Cause:**
Attempting to import Node.js `fs` module in client-side code.

**Solution:**
1. Check if you're using `'use client'` directive
2. Move file operations to API routes
3. Use client-side `fetch()` to get data from API

**Example Fix:**
```typescript
// ❌ WRONG - Client-side component
'use client'
import fs from 'fs'  // This will fail

// ✅ CORRECT - API route
// /app/api/data/route.ts
import fs from 'fs'
export async function GET() {
  const data = fs.readFileSync('./data.json')
  return Response.json(JSON.parse(data))
}

// ✅ CORRECT - Client component fetches from API
'use client'
useEffect(() => {
  fetch('/api/data').then(res => res.json())
}, [])
```

---

### Build Failures

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Webpack errors

**Solutions:**

1. **Clean Build:**
   ```bash
   rm -rf .next node_modules/.cache
   npm run build
   ```

2. **Dependency Issues:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **TypeScript Errors:**
   ```bash
   npx tsc --noEmit
   # Fix reported errors
   npm run build
   ```

---

### Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- "Database does not exist" errors

**Solutions:**

1. **Check Environment Variables:**
   ```bash
   # Verify DATABASE_URL is set
   echo $DATABASE_URL
   ```

2. **Run Migrations:**
   ```bash
   npm run migrate
   ```

3. **Populate Sample Data:**
   ```bash
   npm run setup:populate-insurance
   npm run setup:populate-weather
   ```

---

### Hot Reload Not Working

**Symptoms:**
- Code changes don't reflect in browser
- Must manually refresh to see changes

**Solutions:**

1. **Restart Dev Server:**
   ```bash
   # Kill existing process
   lsof -ti:4000 | xargs kill -9
   npm run dev
   ```

2. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Check File Watchers (Linux/Mac):**
   ```bash
   # Increase file watcher limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

---

### Production Build Issues

**Symptoms:**
- Build succeeds locally but fails on Railway
- Missing environment variables
- Memory errors

**Solutions:**

1. **Environment Variables:**
   - Verify all required variables are set in Railway dashboard
   - Check `.env.production` template

2. **Memory Issues:**
   ```json
   // package.json
   "scripts": {
     "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
   }
   ```

3. **Dependency Issues:**
   - Ensure `package-lock.json` is committed
   - Use exact versions in `package.json`

---

### Knowledge Base Data Not Loading

**Symptoms:**
- Knowledge base page shows "0 documents"
- Documents don't appear after search

**Solutions:**

1. **Run Build Scripts:**
   ```bash
   npm run kb:build
   npm run kb:preload
   ```

2. **Verify Data Files:**
   ```bash
   ls -lh public/kb*.json
   # Should show:
   # kb-documents.json (~1.6 MB)
   # kb-images-manifest.json (~14 KB)
   # kb-photo-labels.json (~12 KB)
   ```

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for failed fetch requests
   - Verify JSON files are accessible

---

### API Route Errors

**Symptoms:**
- API returns 500 errors
- "Internal Server Error" messages

**Solutions:**

1. **Check Server Logs:**
   ```bash
   # Development
   # Logs appear in terminal where `npm run dev` is running

   # Production (Railway)
   # Check deployment logs in Railway dashboard
   ```

2. **Test API Directly:**
   ```bash
   curl http://localhost:4000/api/health
   ```

3. **Add Debug Logging:**
   ```typescript
   // In API route
   console.log('[API] Request received:', request.method)
   console.log('[API] Body:', await request.json())
   ```

---

### Performance Issues

**Symptoms:**
- Slow page loads
- Laggy interactions
- High memory usage

**Solutions:**

1. **Enable Production Mode:**
   ```bash
   npm run build
   npm start
   # Much faster than dev mode
   ```

2. **Check Network Tab:**
   - Identify large bundle sizes
   - Look for unoptimized images
   - Check for unnecessary requests

3. **Optimize Images:**
   ```bash
   # Use Next.js Image component
   import Image from 'next/image'
   ```

4. **Code Splitting:**
   ```typescript
   // Lazy load components
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <div>Loading...</div>
   })
   ```

---

## Quick Commands Reference

### Development
```bash
npm run dev              # Start dev server
npm run dev:clean        # Clean + start dev server
npm run build            # Production build
npm start                # Run production build
```

### Database
```bash
npm run migrate          # Run database migrations
npm run setup:populate-insurance  # Populate insurance data
npm run setup:populate-weather    # Populate weather data
```

### Knowledge Base
```bash
npm run kb:build         # Build KB data files
npm run kb:preload       # Preload documents
```

### Cleanup
```bash
rm -rf .next             # Clean Next.js cache
rm -rf node_modules      # Clean dependencies
npm install              # Reinstall dependencies
```

---

## Getting Help

### Check Logs
1. **Development:** Terminal where `npm run dev` is running
2. **Browser:** DevTools Console (F12)
3. **Production:** Railway deployment logs

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Or for specific modules
DEBUG=next:* npm run dev
```

### Common Log Locations
- Next.js: Terminal output
- Browser: DevTools Console
- Railway: Deployment logs in dashboard
- API errors: Check terminal or Railway logs

---

## Still Having Issues?

1. **Check the main documentation:** `/README.md`
2. **Review the architecture guide:** `/KNOWLEDGE_BASE_FIX_REPORT.md`
3. **Search closed issues:** GitHub issues tab
4. **Ask for help:** Create a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Environment (OS, Node version, etc.)
   - What you've already tried
