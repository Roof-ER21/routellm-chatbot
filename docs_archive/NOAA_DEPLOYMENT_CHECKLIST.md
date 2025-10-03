# NOAA Weather Integration - Deployment Checklist

Use this checklist to ensure successful deployment of the NOAA weather integration.

## Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Verify Postgres database is provisioned
- [ ] Confirm `POSTGRES_URL` environment variable is set
- [ ] Generate and set `CRON_SECRET` (recommended for production)
- [ ] Test database connection

```bash
# Test database connection
psql $POSTGRES_URL -c "SELECT NOW();"
```

### 2. Code Review
- [ ] All files committed to repository
- [ ] No sensitive data in code
- [ ] API endpoints properly documented
- [ ] Error handling implemented
- [ ] Rate limiting considerations reviewed

### 3. Database Migration
- [ ] Review `/db/schema.sql` for NOAA tables
- [ ] Backup existing database (if applicable)
- [ ] Run migration script or manual SQL

**Option A: Automated (Recommended)**
```bash
node scripts/migrate-noaa-schema.js
```

**Option B: Manual**
```bash
psql $POSTGRES_URL -f db/schema.sql
```

**Verify Tables:**
```bash
psql $POSTGRES_URL -c "SELECT table_name FROM information_schema.tables WHERE table_name IN ('hail_events', 'weather_sync_log');"
```

## Deployment Steps

### 1. Deploy Application
- [ ] Push code to Git repository
- [ ] Trigger Vercel deployment
- [ ] Monitor build logs for errors
- [ ] Verify deployment successful

```bash
git add .
git commit -m "Add NOAA weather integration"
git push origin main
```

### 2. Verify Cron Job Configuration
- [ ] Check `vercel.json` has cron configuration
- [ ] Verify cron job appears in Vercel dashboard
- [ ] Confirm schedule is "0 2 * * *" (2 AM daily)

**Expected in vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-weather-data",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### 3. Initial Data Sync
- [ ] Manually trigger first sync to populate database
- [ ] Monitor sync progress and logs
- [ ] Verify events are added to database

```bash
# Replace with your domain and secret
curl -X POST https://susanai-21.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer $CRON_SECRET" \
  -v

# Verify data was added
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA" | jq '.count'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    { "state": "VA", "added": 45, "updated": 0 },
    { "state": "MD", "added": 23, "updated": 0 },
    { "state": "PA", "added": 31, "updated": 0 }
  ]
}
```

## Post-Deployment Testing

### 1. API Endpoint Tests
- [ ] Test query endpoints with various parameters
- [ ] Test verification endpoint
- [ ] Verify error handling
- [ ] Check response times

```bash
# Run automated test suite
./scripts/test-weather-integration.sh https://susanai-21.vercel.app

# Or test manually
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA"
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA"
```

### 2. UI Component Tests
- [ ] Open application in browser
- [ ] Locate "Verify Storm Date" button
- [ ] Test storm verification modal
- [ ] Enter test data and verify results
- [ ] Check results display modal
- [ ] Verify error messages display correctly

**Test Data:**
- Date: 2024-10-15
- Location: Richmond, VA or 22101
- Radius: 50 miles

### 3. Performance Tests
- [ ] Check API response times (<500ms)
- [ ] Verify database query performance
- [ ] Test with multiple concurrent requests
- [ ] Monitor server resource usage

```bash
# Simple load test (requires 'ab' - Apache Bench)
ab -n 100 -c 10 "https://susanai-21.vercel.app/api/weather/hail-events?state=VA"
```

### 4. Monitoring Setup
- [ ] Enable Vercel function logs
- [ ] Set up error alerting (optional)
- [ ] Monitor cron job execution
- [ ] Track database growth

**Check Logs:**
- Vercel Dashboard → Your Project → Logs
- Filter by function: `/api/weather/*`
- Filter by function: `/api/cron/sync-weather-data`

## Validation Checklist

### Database
- [ ] `hail_events` table exists
- [ ] `weather_sync_log` table exists
- [ ] All indexes created
- [ ] Sample queries execute successfully
- [ ] Data sync log shows successful runs

**Validation Queries:**
```sql
-- Check event count by state
SELECT state, COUNT(*) as events FROM hail_events GROUP BY state;

-- Check recent sync logs
SELECT * FROM weather_sync_log ORDER BY sync_date DESC LIMIT 5;

-- Check date range of data
SELECT state, MIN(event_date) as earliest, MAX(event_date) as latest
FROM hail_events GROUP BY state;
```

### API Endpoints
- [ ] `/api/weather/hail-events` returns data
- [ ] `/api/weather/verify-claim` works with city/state
- [ ] `/api/weather/verify-claim` works with zip code
- [ ] Error responses are properly formatted
- [ ] CORS headers set (if needed)

### Cron Job
- [ ] First manual sync completed
- [ ] Cron job scheduled in Vercel
- [ ] Next execution time is correct
- [ ] Sync logs are being created
- [ ] No errors in recent runs

**Check Cron Status:**
```bash
# View sync logs from database
psql $POSTGRES_URL -c "SELECT * FROM weather_sync_log ORDER BY sync_date DESC LIMIT 10;"
```

### UI Components
- [ ] Storm verification modal opens
- [ ] Form validation works
- [ ] API calls complete successfully
- [ ] Results display correctly
- [ ] Error messages are user-friendly
- [ ] Mobile responsive (test on phone)

## Troubleshooting

### Issue: No events returned
**Solutions:**
1. Check if initial sync ran
2. Verify date range in query
3. Check database connection
4. Review API logs

```bash
# Check event count
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA" | jq '.count'

# If 0, run sync
curl -X POST https://susanai-21.vercel.app/api/cron/sync-weather-data
```

### Issue: Cron job not running
**Solutions:**
1. Check Vercel dashboard for cron jobs
2. Verify vercel.json is committed
3. Redeploy application
4. Check function logs for errors

### Issue: API returns 500 errors
**Solutions:**
1. Check Vercel function logs
2. Verify database connection
3. Check environment variables
4. Review error messages in logs

### Issue: Verification returns low confidence
**Expected Behavior:**
- Low confidence is normal if no events match
- Medium confidence if events are nearby but not exact
- High confidence only for exact matches

## Security Checklist

- [ ] CRON_SECRET is set and secure
- [ ] Database credentials are not exposed
- [ ] API endpoints validate input
- [ ] SQL injection prevention verified
- [ ] Rate limiting considered (optional)
- [ ] HTTPS enforced for all requests

## Documentation Checklist

- [ ] `NOAA_WEATHER_INTEGRATION.md` reviewed
- [ ] `NOAA_QUICK_START.md` tested
- [ ] `NOAA_INTEGRATION_SUMMARY.md` accurate
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Team notified of new features

## Maintenance Schedule

Set reminders for:

### Daily
- [ ] Automated cron sync runs (2 AM UTC)
- [ ] No action needed unless errors

### Weekly
- [ ] Review sync logs for errors
- [ ] Check data completeness
- [ ] Monitor API usage

### Monthly
- [ ] Review database size and performance
- [ ] Update documentation if needed
- [ ] Check for NOAA API changes

### Quarterly
- [ ] Evaluate data retention policy
- [ ] Review and optimize database indexes
- [ ] Plan feature enhancements

## Sign-Off

### Deployment Lead
- Name: _______________________
- Date: _______________________
- Signature: ___________________

### Technical Review
- Name: _______________________
- Date: _______________________
- Signature: ___________________

### QA Approval
- Name: _______________________
- Date: _______________________
- Signature: ___________________

## Rollback Plan

If issues arise:

1. **Immediate Rollback:**
   ```bash
   # Revert to previous deployment in Vercel dashboard
   # Or via CLI:
   vercel rollback
   ```

2. **Database Rollback:**
   ```sql
   -- Drop weather tables (if needed)
   DROP TABLE IF EXISTS hail_events CASCADE;
   DROP TABLE IF EXISTS weather_sync_log CASCADE;
   ```

3. **Disable Cron Job:**
   - Remove cron configuration from `vercel.json`
   - Redeploy

4. **Notify Team:**
   - Document issues encountered
   - Plan fixes and re-deployment

## Success Criteria

✅ Deployment is successful when:

1. All tables created without errors
2. Initial data sync populates database
3. API endpoints return valid responses
4. UI components work in production
5. Cron job scheduled and running
6. No errors in logs
7. Performance meets requirements (<500ms response)
8. Documentation complete
9. Team trained on features
10. Monitoring active

## Post-Deployment Tasks

- [ ] Update project README with new features
- [ ] Notify stakeholders of deployment
- [ ] Share API documentation with team
- [ ] Schedule training session (if needed)
- [ ] Update user documentation
- [ ] Celebrate successful deployment! 🎉

## Notes

_Add any deployment-specific notes here:_

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** 1.0.0
**Status:** [ ] Pending [ ] In Progress [ ] Complete [ ] Failed
