# Database Migrations - Insurance Intelligence

This directory contains SQL migrations to enhance the insurance companies database with digital platform information and strategic intelligence.

## Overview

These migrations add comprehensive intelligence data from our research:
- Digital platform information (apps, portals, login URLs)
- Strategic calling intelligence (best times, hold times)
- Workarounds and alternative channels
- Performance ratings (NAIC, BBB, responsiveness scores)
- Executive escalation contacts

## Migration Files

### 001_add_digital_and_intelligence_fields.sql
Adds new columns to `insurance_companies` table:
- **Digital Fields:** `app_name`, `client_login_url`, `guest_login_url`, `portal_notes`
- **Intelligence Fields:** `best_call_times`, `current_delays`, `proven_workarounds`, `regional_intel`, `social_escalation`, `complaints_pattern`, `alternative_channels`, `executive_escalation`
- **Rating Fields:** `naic_complaint_index`, `bbb_rating`, `avg_hold_time_minutes`, `responsiveness_score`
- **Metadata:** `last_intelligence_update`

Creates performance indexes for fast querying by:
- App availability
- Responsiveness score
- NAIC complaint index
- Average hold time

### 002_populate_intelligence_data.sql
Sample data for top companies (both best and worst performers). Full data population is handled via API endpoint for easier updates.

## Deployment Instructions

### Option 1: API Endpoints (RECOMMENDED)

The easiest way to run migrations in production:

1. **Run Schema Migration:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/run-migrations
   ```

   This adds all new columns and indexes to the database.

2. **Populate Intelligence Data:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/populate-intelligence
   ```

   This updates companies with digital platform and intelligence data.

### Option 2: Direct SQL (Railway Dashboard)

If you prefer direct database access:

1. Go to Railway dashboard
2. Open PostgreSQL service
3. Click "Data" tab
4. Run SQL from `001_add_digital_and_intelligence_fields.sql`
5. Verify columns added successfully
6. Then run migrations via API as above

### Option 3: Local Migration Script

For local development (requires DATABASE_URL):

```bash
# Set environment variable
export DATABASE_URL="your_railway_postgres_url"

# Run migrations
npx tsx scripts/run-migrations.ts
```

## Verification

After running migrations, verify with:

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'insurance_companies'
  AND column_name IN (
    'app_name', 'best_call_times', 'responsiveness_score',
    'naic_complaint_index', 'bbb_rating'
  );

-- Check data populated
SELECT name, app_name, responsiveness_score, bbb_rating
FROM insurance_companies
WHERE responsiveness_score IS NOT NULL
ORDER BY responsiveness_score DESC
LIMIT 10;

-- Check indexes created
SELECT indexname FROM pg_indexes
WHERE tablename = 'insurance_companies'
  AND indexname LIKE 'idx_insurance_%';
```

## Data Sources

All intelligence data sourced from:
- Company official websites (digital platforms)
- Better Business Bureau (BBB ratings, complaint counts)
- NAIC Consumer Information Source (complaint indices)
- J.D. Power studies (digital experience rankings)
- Contractor community forums (real-world workarounds)
- State insurance department records (regulatory actions)
- Social media (escalation patterns, response times)

Research date: October 2025

## Future Updates

To update intelligence data in the future:

1. Edit `/app/api/admin/populate-intelligence/route.ts`
2. Update the `INTELLIGENCE_DATA` array
3. Re-run: `curl -X POST https://your-app/api/admin/populate-intelligence`

No SQL changes needed - just update the API data source.

## Responsiveness Score Legend

- **10:** Exceptional (Amica, USAA)
- **9:** Excellent (State Farm, Erie, Farmers of Salem)
- **7-8:** Good (Allstate, Travelers, Nationwide)
- **5-6:** Average (Farmers, many regional carriers)
- **3-4:** Below Average (requires patience)
- **1-2:** Poor (Liberty Mutual, Philadelphia Contributionship, Universal Property, SWBC)

## Support

For issues with migrations:
1. Check Railway PostgreSQL logs
2. Verify DATABASE_URL is set correctly
3. Ensure table `insurance_companies` exists
4. Review API endpoint logs in Vercel dashboard
