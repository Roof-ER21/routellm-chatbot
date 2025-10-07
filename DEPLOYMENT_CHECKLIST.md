# Conversation Sync - Deployment Checklist

## Pre-Deployment Checklist

### Database Setup
- [ ] Verify `DATABASE_URL` environment variable is set
- [ ] Test database connection
- [ ] Run table initialization: `npx tsx scripts/init-sync-tables.ts`
- [ ] Verify all tables created successfully
- [ ] Check indexes are in place

### API Testing
- [ ] Run automated test suite: `npx tsx scripts/test-sync-api.ts`
- [ ] Test signup endpoint manually
- [ ] Test login endpoint manually
- [ ] Test conversation sync endpoint manually
- [ ] Test admin endpoints with correct passcode
- [ ] Verify admin endpoints fail without passcode

### Code Review
- [ ] Review all TypeScript types in `sync-types.ts`
- [ ] Check error handling in all API endpoints
- [ ] Verify SQL queries use parameterized statements
- [ ] Confirm CORS headers are correct
- [ ] Review transaction usage in batch operations

### Security Checklist
- [ ] Admin passcode is secure (change from default if needed)
- [ ] SQL injection prevention verified
- [ ] User data isolation confirmed
- [ ] Sensitive data not logged
- [ ] Error messages don't leak sensitive info

## Deployment Steps

### Step 1: Database Initialization
```bash
# Connect to your Railway/production database
export DATABASE_URL="your_production_database_url"

# Run initialization script
npx tsx scripts/init-sync-tables.ts

# Expected output:
# ✓ Tables created successfully:
#   - sync_alerts
#   - sync_conversations
#   - sync_messages
#   - sync_users
# ✓ Indexes created
# ✓ Database initialization complete!
```

### Step 2: Deploy to Railway/Vercel
```bash
# Commit all changes
git add .
git commit -m "Add conversation sync API endpoints"
git push

# Railway auto-deploys
# or for Vercel:
# vercel --prod
```

### Step 3: Verify Deployment
```bash
# Test signup
curl -X POST https://your-domain.com/api/sync/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"test_user","code":"test123","displayName":"Test User"}'

# Expected: {"success":true,"userId":1,"displayName":"Test User"}

# Test login
curl -X POST https://your-domain.com/api/sync/login \
  -H "Content-Type: application/json" \
  -d '{"name":"test_user","code":"test123"}'

# Expected: {"success":true,"userId":1,"displayName":"Test User","lastActive":"..."}

# Test admin stats
curl https://your-domain.com/api/admin/sync-stats?passcode=2110

# Expected: {"success":true,"stats":{...},"userStats":[...]}
```

### Step 4: Frontend Integration
```bash
# Install any missing dependencies
npm install

# Add the sync hook to your React components
# See example in useConversationSync.ts
```

## Post-Deployment Checklist

### Functionality Testing
- [ ] Create a test user account
- [ ] Login with test user
- [ ] Save a test conversation
- [ ] Verify conversation appears in database
- [ ] Test offline functionality (disconnect network, save locally)
- [ ] Test sync queue (reconnect network, verify auto-sync)
- [ ] Access admin endpoints and verify data

### Performance Testing
- [ ] Test with multiple users
- [ ] Test with large conversations (100+ messages)
- [ ] Test concurrent sync requests
- [ ] Monitor database connection pool
- [ ] Check response times

### Admin Dashboard
- [ ] Access admin stats endpoint
- [ ] Verify all users appear
- [ ] Check conversation counts
- [ ] Test filtering by flagged alerts
- [ ] Test filtering by severity
- [ ] Verify specific conversation retrieval

### Monitoring
- [ ] Set up error logging
- [ ] Monitor API response times
- [ ] Track sync success/failure rates
- [ ] Set up alerts for critical errors
- [ ] Monitor database connection pool usage

## Rollback Plan

If issues occur:

```bash
# Option 1: Revert deployment
git revert HEAD
git push

# Option 2: Drop sync tables (CAUTION: Deletes all data)
# Only do this in development/testing
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_alerts CASCADE"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_messages CASCADE"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_conversations CASCADE"
psql $DATABASE_URL -c "DROP TABLE IF EXISTS sync_users CASCADE"
```

## Common Issues & Solutions

### Issue: Tables not created
**Solution:** Run `npx tsx scripts/init-sync-tables.ts` manually

### Issue: Connection timeout
**Solution:** Check DATABASE_URL, verify Railway database is running

### Issue: Foreign key constraint error
**Solution:** Ensure user exists before syncing conversations

### Issue: Duplicate user error
**Solution:** Username already exists (case-insensitive), use different name

### Issue: Admin endpoint returns 401
**Solution:** Check passcode is correct (default: 2110)

### Issue: Sync queue not processing
**Solution:** Check browser console for errors, verify internet connection

## Maintenance Tasks

### Daily
- [ ] Check error logs
- [ ] Monitor sync success rate

### Weekly
- [ ] Review flagged conversations
- [ ] Check critical alerts
- [ ] Review user growth

### Monthly
- [ ] Database performance review
- [ ] Clean up old test data
- [ ] Review and optimize slow queries
- [ ] Update admin passcode (if needed)

## Success Criteria

Deployment is successful when:
- ✅ All API endpoints return expected responses
- ✅ Users can signup and login
- ✅ Conversations sync to database
- ✅ Admin can view all conversations
- ✅ Offline functionality works
- ✅ Auto-sync processes queue
- ✅ No errors in logs
- ✅ Response times under 500ms

## Contact & Support

For issues:
1. Check logs in Railway dashboard
2. Review database connection status
3. Test endpoints with cURL
4. Check browser console for client errors
5. Review SYNC_API_README.md for detailed documentation

## Files Reference

**Database:**
- `/lib/sync-db.ts` - Database operations
- `/lib/railway-db.ts` - Connection pool

**API Endpoints:**
- `/app/api/sync/signup/route.ts`
- `/app/api/sync/login/route.ts`
- `/app/api/sync/conversation/route.ts`
- `/app/api/sync/conversations/route.ts`
- `/app/api/admin/all-conversations/route.ts`
- `/app/api/admin/sync-stats/route.ts`

**Client:**
- `/lib/sync-types.ts` - Types and SyncClient
- `/lib/useConversationSync.ts` - React hook

**Scripts:**
- `/scripts/init-sync-tables.ts` - Initialize database
- `/scripts/test-sync-api.ts` - Test suite

**Documentation:**
- `/SYNC_API_README.md` - Complete API docs
- `/SYNC_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- `/DEPLOYMENT_CHECKLIST.md` - This file
