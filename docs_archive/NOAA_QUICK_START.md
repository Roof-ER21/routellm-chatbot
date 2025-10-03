# NOAA Weather Integration - Quick Start Guide

Get up and running with storm verification in 5 minutes!

## Prerequisites

- Vercel Postgres database configured
- Application deployed to Vercel
- Environment variables set

## Step 1: Deploy Database Schema (1 minute)

Run the SQL schema to create the necessary tables:

```bash
# Option A: Using psql command line
psql $POSTGRES_URL -f db/schema.sql

# Option B: Using Vercel Postgres dashboard
# Copy and paste the contents of db/schema.sql into the query editor
```

The schema creates two tables:
- `hail_events` - Stores NOAA storm data
- `weather_sync_log` - Tracks sync operations

## Step 2: Initial Data Sync (2 minutes)

Populate the database with historical data:

```bash
# Replace with your actual domain and secret
curl -X POST https://susanai-21.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-cron-secret"
```

This will fetch the last 30 days of hail events for VA, MD, and PA.

**Expected Output:**
```json
{
  "success": true,
  "results": [
    { "state": "VA", "added": 45, "updated": 0 },
    { "state": "MD", "added": 23, "updated": 0 },
    { "state": "PA", "added": 31, "updated": 0 }
  ],
  "totals": { "added": 99, "updated": 0 }
}
```

## Step 3: Test the API (1 minute)

### Test 1: Query Events

```bash
# Get all Virginia events
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA"

# Get events near zip code
curl "https://susanai-21.vercel.app/api/weather/hail-events?zip=22101&radius=50"
```

### Test 2: Verify a Claim

```bash
# Verify claim with city/state
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA"

# Verify claim with zip code
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=22101"
```

## Step 4: Use the UI (1 minute)

The storm verification is integrated into your application:

1. Navigate to the main page
2. Look for the "Verify Storm Date" button (integrated into claim form)
3. Click to open the Storm Verification Modal
4. Enter:
   - Property address or zip code
   - Storm date
   - Search radius (default: 25 miles)
5. Click "Verify Storm"
6. View results with all matching hail events

## API Quick Reference

### Get Hail Events

```
GET /api/weather/hail-events
```

**Common Queries:**

```bash
# By state
?state=VA

# By zip code and radius
?zip=22101&radius=50

# By date
?date=2024-10-15&state=VA

# By date range
?startDate=2024-01-01&endDate=2024-12-31&state=MD

# Large hail only (>1 inch)
?minHailSize=1.0&state=PA
```

### Verify Claim

```
GET /api/weather/verify-claim
```

**Required Parameters:**
- `date` - Claim date (YYYY-MM-DD)
- `location` - City,State or zip code

**Optional:**
- `radius` - Search radius in miles (default: 50)

```bash
curl "https://your-domain.vercel.app/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA"
```

## Cron Job Schedule

The system automatically syncs new data:
- **Frequency:** Daily at 2:00 AM UTC
- **States:** VA, MD, PA
- **Data Range:** Last 30 days

No manual intervention needed!

## Troubleshooting

### "No events found"

**Solution 1:** Run initial sync
```bash
curl -X POST https://your-domain.vercel.app/api/cron/sync-weather-data
```

**Solution 2:** Check if events exist
```bash
curl "https://your-domain.vercel.app/api/weather/hail-events?state=VA&startDate=2020-01-01"
```

### "Unauthorized" on cron endpoint

Set the `CRON_SECRET` environment variable in Vercel:
```
CRON_SECRET=your-random-secret-here
```

### Database connection errors

Verify `POSTGRES_URL` is set in Vercel environment variables.

## Environment Variables

Required:
```
POSTGRES_URL=postgresql://...
```

Optional:
```
CRON_SECRET=random-secret-for-cron-security
```

## Example Integration

Add to your claim form:

```tsx
import StormVerificationModal from '@/app/components/StormVerificationModal'
import StormVerificationResults from '@/app/components/StormVerificationResults'

function ClaimForm() {
  const [showVerify, setShowVerify] = useState(false)
  const [report, setReport] = useState(null)

  return (
    <>
      {/* Verify Storm Button */}
      <button onClick={() => setShowVerify(true)}>
        ⛈️ Verify Storm Date
      </button>

      {/* Verification Modal */}
      <StormVerificationModal
        isOpen={showVerify}
        onClose={() => setShowVerify(false)}
        onVerified={(result) => {
          setReport(result)
          setShowVerify(false)
        }}
      />

      {/* Results Display */}
      {report && (
        <StormVerificationResults
          report={report}
          onClose={() => setReport(null)}
        />
      )}
    </>
  )
}
```

## Next Steps

- [ ] Integrate "Verify Storm" button into claim forms
- [ ] Add PDF export functionality for verification reports
- [ ] Set up monitoring for cron job execution
- [ ] Review NOAA data quality and coverage
- [ ] Add additional weather event types (optional)

## Support

See full documentation: [NOAA_WEATHER_INTEGRATION.md](./NOAA_WEATHER_INTEGRATION.md)

---

**Ready to verify storms in production!** 🌩️
