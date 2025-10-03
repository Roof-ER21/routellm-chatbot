# NOAA Weather Integration - Complete Documentation

## Overview

This integration provides historical hail storm data from NOAA (National Oceanic and Atmospheric Administration) for insurance claim verification in Virginia, Maryland, and Pennsylvania. The system caches NOAA data locally and provides APIs for querying hail events.

## Table of Contents

1. [Architecture](#architecture)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [UI Components](#ui-components)
5. [Cron Job Setup](#cron-job-setup)
6. [Usage Examples](#usage-examples)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Susan AI-21 Application                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storm Verification UI                      │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │ Verification     │      │ Results Display  │            │
│  │ Modal            │      │ Component        │            │
│  └──────────────────┘      └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ /api/weather/    │  │ /api/weather/    │  │ /api/cron/│ │
│  │ hail-events      │  │ verify-claim     │  │ sync-*    │ │
│  └──────────────────┘  └──────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              NOAA Weather API Client Library                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - fetchNOAAHailEvents()                              │   │
│  │ - parseNOAAEvent()                                   │   │
│  │ - saveHailEvents()                                   │   │
│  │ - queryHailEvents()                                  │   │
│  │ - verifyHailClaim()                                  │   │
│  │ - syncNOAAData()                                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────┐            ┌─────────────────────────┐
│   NOAA Storm API    │            │  Postgres Database      │
│   (External)        │            │  ┌───────────────────┐  │
│                     │            │  │ hail_events       │  │
│  - Storm Events DB  │            │  │ weather_sync_log  │  │
│  - Historical Data  │            │  └───────────────────┘  │
└─────────────────────┘            └─────────────────────────┘
```

## Database Schema

### Table: `hail_events`

Stores cached hail event data from NOAA.

```sql
CREATE TABLE hail_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_date DATE NOT NULL,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  city VARCHAR(100),
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  hail_size DECIMAL(5, 2),
  magnitude VARCHAR(50),
  event_narrative TEXT,
  episode_narrative TEXT,
  begin_time TIMESTAMP,
  end_time TIMESTAMP,
  source VARCHAR(50) DEFAULT 'NOAA',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_hail_date_state` - (event_date, state)
- `idx_hail_location` - (state, county, city)
- `idx_hail_zip` - (zip_code)
- `idx_hail_coordinates` - (latitude, longitude)
- `idx_hail_event_id` - (event_id)

### Table: `weather_sync_log`

Tracks daily sync operations.

```sql
CREATE TABLE weather_sync_log (
  id SERIAL PRIMARY KEY,
  sync_date DATE NOT NULL,
  state VARCHAR(2) NOT NULL,
  events_added INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  sync_status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(sync_date, state)
);
```

## API Endpoints

### 1. Query Hail Events

**Endpoint:** `GET /api/weather/hail-events`

Retrieve hail events from the database with various filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| state | string | No | State abbreviation (VA, MD, PA) |
| zip | string | No | Zip code |
| lat | number | No | Latitude (requires lon and radius) |
| lon | number | No | Longitude (requires lat and radius) |
| radius | number | No | Search radius in miles (default: 50) |
| date | string | No | Single date (YYYY-MM-DD) |
| startDate | string | No | Start date (YYYY-MM-DD) |
| endDate | string | No | End date (YYYY-MM-DD) |
| minHailSize | number | No | Minimum hail size in inches |

**Examples:**

```bash
# Get all hail events in Virginia
GET /api/weather/hail-events?state=VA

# Get hail events near zip code 22101 within 50 miles
GET /api/weather/hail-events?zip=22101&radius=50

# Get hail events on specific date
GET /api/weather/hail-events?date=2024-10-15&state=VA

# Get large hail events (>1 inch)
GET /api/weather/hail-events?state=MD&minHailSize=1.0
```

**Response:**

```json
{
  "success": true,
  "count": 5,
  "events": [
    {
      "id": 123,
      "eventId": "NOAA-12345-VA",
      "eventDate": "2024-10-15T00:00:00.000Z",
      "state": "VA",
      "county": "Fairfax",
      "city": "McLean",
      "zipCode": "22101",
      "latitude": 38.9341,
      "longitude": -77.1773,
      "hailSize": 1.5,
      "magnitude": "1.50",
      "eventNarrative": "Large hail reported in McLean area...",
      "beginTime": "2024-10-15T14:30:00.000Z",
      "endTime": "2024-10-15T15:45:00.000Z"
    }
  ],
  "query": {
    "state": "VA",
    "zipCode": "22101",
    "dateRange": {
      "start": "2021-10-15",
      "end": "2024-10-15"
    }
  }
}
```

### 2. Verify Insurance Claim

**Endpoint:** `GET /api/weather/verify-claim`

Verify if a hail event occurred at a specific location and date for insurance claims.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | string | Yes | Claim date (YYYY-MM-DD) |
| location | string | Yes | Location as "City, State" or zip code |
| radius | number | No | Search radius in miles (default: 50) |

**Examples:**

```bash
# Verify claim with city/state
GET /api/weather/verify-claim?date=2024-10-15&location=Richmond,VA

# Verify claim with zip code
GET /api/weather/verify-claim?date=2024-10-15&location=22101&radius=25
```

**Response:**

```json
{
  "success": true,
  "report": {
    "verified": true,
    "confidence": "high",
    "claimDate": "2024-10-15",
    "location": "Richmond,VA",
    "searchRadius": 50,
    "eventsFound": 3,
    "events": [
      {
        "date": "2024-10-15",
        "time": "2:30:00 PM",
        "location": "Richmond, VA",
        "hailSize": "1.5 inches",
        "magnitude": "1.50",
        "narrative": "Large hail reported causing roof damage...",
        "distance": null
      }
    ],
    "recommendation": "High confidence: Multiple hail events recorded on or very close to the claim date. This strongly supports the insurance claim. Document the NOAA event IDs for claim submission."
  }
}
```

### 3. Sync NOAA Data (Cron Job)

**Endpoint:** `GET /api/cron/sync-weather-data`

Daily cron job to sync NOAA weather data. Scheduled to run at 2:00 AM daily.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| states | string | No | Comma-separated list (default: VA,MD,PA) |
| days | number | No | Days to sync backwards (default: 30) |

**Authorization:**

Requires `Authorization: Bearer {CRON_SECRET}` header if `CRON_SECRET` environment variable is set.

**Examples:**

```bash
# Sync all states (default)
GET /api/cron/sync-weather-data

# Sync specific state
GET /api/cron/sync-weather-data?states=VA&days=60

# Manual trigger via POST
POST /api/cron/sync-weather-data
```

**Response:**

```json
{
  "success": true,
  "timestamp": "2024-10-15T02:00:00.000Z",
  "dateRange": {
    "start": "2024-09-15",
    "end": "2024-10-15"
  },
  "results": [
    {
      "state": "VA",
      "success": true,
      "added": 45,
      "updated": 12
    },
    {
      "state": "MD",
      "success": true,
      "added": 23,
      "updated": 8
    },
    {
      "state": "PA",
      "success": true,
      "added": 31,
      "updated": 5
    }
  ],
  "totals": {
    "added": 99,
    "updated": 25
  }
}
```

## UI Components

### StormVerificationModal

Modal for initiating storm verification.

**Location:** `/app/components/StormVerificationModal.tsx`

**Usage:**

```tsx
import StormVerificationModal from '@/app/components/StormVerificationModal'

const [showVerification, setShowVerification] = useState(false)
const [verificationResult, setVerificationResult] = useState(null)

<StormVerificationModal
  isOpen={showVerification}
  onClose={() => setShowVerification(false)}
  onVerified={(result) => {
    setVerificationResult(result)
    // Show results modal
  }}
/>
```

**Props:**

- `isOpen` (boolean) - Controls modal visibility
- `onClose` (function) - Called when modal is closed
- `onVerified` (function) - Called with verification results

### StormVerificationResults

Display verification results with detailed event information.

**Location:** `/app/components/StormVerificationResults.tsx`

**Usage:**

```tsx
import StormVerificationResults from '@/app/components/StormVerificationResults'

<StormVerificationResults
  report={verificationReport}
  onClose={() => setVerificationReport(null)}
  onExportPDF={() => {
    // Export PDF functionality
  }}
/>
```

**Props:**

- `report` (object) - Verification report from API
- `onClose` (function) - Called when results are closed
- `onExportPDF` (function, optional) - Called to export PDF

## Cron Job Setup

The system uses Vercel Cron to automatically sync NOAA data daily.

### Configuration

In `vercel.json`:

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

**Schedule:** Runs daily at 2:00 AM UTC

### Environment Variables

Set in Vercel dashboard or `.env.local`:

```bash
# Optional: Secure cron endpoint
CRON_SECRET=your-random-secret-here

# Required: Database connection
POSTGRES_URL=your-postgres-connection-string
```

### Manual Sync

You can manually trigger a sync:

```bash
# Via API
curl https://your-domain.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-cron-secret"

# Or POST request
curl -X POST https://your-domain.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-cron-secret"
```

## Usage Examples

### Example 1: Basic Storm Verification

```typescript
// User enters claim information
const claimDate = '2024-10-15'
const location = 'Richmond, VA'

// Call verification API
const response = await fetch(
  `/api/weather/verify-claim?date=${claimDate}&location=${encodeURIComponent(location)}`
)

const data = await response.json()

if (data.success && data.report.verified) {
  console.log(`Found ${data.report.eventsFound} hail events`)
  console.log(`Confidence: ${data.report.confidence}`)
  // Show results to user
}
```

### Example 2: Search by Zip Code and Radius

```typescript
// Search for hail events within 25 miles of zip code
const response = await fetch(
  '/api/weather/hail-events?zip=22101&radius=25&minHailSize=1.0'
)

const data = await response.json()

data.events.forEach(event => {
  console.log(`${event.eventDate}: ${event.hailSize}" hail in ${event.city}`)
})
```

### Example 3: Query Events by Date Range

```typescript
// Get all events in Virginia for the last 90 days
const endDate = new Date().toISOString().split('T')[0]
const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0]

const response = await fetch(
  `/api/weather/hail-events?state=VA&startDate=${startDate}&endDate=${endDate}`
)

const data = await response.json()
console.log(`Found ${data.count} events in the last 90 days`)
```

### Example 4: Integration with Claim Form

```tsx
function ClaimForm() {
  const [showStormVerification, setShowStormVerification] = useState(false)
  const [verificationReport, setVerificationReport] = useState(null)

  return (
    <div>
      <button onClick={() => setShowStormVerification(true)}>
        Verify Storm Date
      </button>

      <StormVerificationModal
        isOpen={showStormVerification}
        onClose={() => setShowStormVerification(false)}
        onVerified={(report) => {
          setVerificationReport(report)
          setShowStormVerification(false)
        }}
      />

      {verificationReport && (
        <StormVerificationResults
          report={verificationReport}
          onClose={() => setVerificationReport(null)}
        />
      )}
    </div>
  )
}
```

## Deployment

### Initial Setup

1. **Create Database Tables**

Run the schema migration:

```sql
-- Execute /db/schema.sql in your Postgres database
psql $POSTGRES_URL -f db/schema.sql
```

2. **Set Environment Variables**

In Vercel dashboard:

```
POSTGRES_URL=your-postgres-connection-string
CRON_SECRET=your-random-secret (optional)
```

3. **Deploy Application**

```bash
npm run build
vercel --prod
```

4. **Initial Data Sync**

Manually trigger the first sync to populate the database:

```bash
curl https://your-domain.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-cron-secret"
```

This will sync the last 30 days of data for VA, MD, and PA.

### Vercel Cron Configuration

The cron job is automatically configured in `vercel.json`. After deployment:

1. Go to Vercel Dashboard → Your Project → Settings → Cron
2. Verify the cron job is enabled
3. Check execution logs

## Troubleshooting

### No Events Found

**Possible Causes:**
1. Database is empty (initial sync not run)
2. NOAA has no recorded events for that location/date
3. Location parsing failed

**Solutions:**
```bash
# Check if data exists
curl "https://your-domain.vercel.app/api/weather/hail-events?state=VA&startDate=2020-01-01"

# Run manual sync
curl -X POST "https://your-domain.vercel.app/api/cron/sync-weather-data"

# Check sync logs
SELECT * FROM weather_sync_log ORDER BY sync_date DESC LIMIT 10;
```

### Cron Job Not Running

**Check:**
1. Vercel dashboard cron logs
2. Function execution logs
3. Environment variables set

**Debug:**
```bash
# Manual trigger to test
curl -X POST https://your-domain.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-cron-secret" \
  -v
```

### NOAA API Errors

**Rate Limiting:**
- NOAA allows 1000 requests/day
- System includes 1-second delays between requests
- Check sync logs for rate limit errors

**Timeouts:**
- Requests timeout after 30 seconds
- Retries 3 times with exponential backoff
- Check error logs in database

### Database Connection Issues

**Verify Connection:**
```bash
# Test database connection
psql $POSTGRES_URL -c "SELECT COUNT(*) FROM hail_events;"
```

**Check Tables:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('hail_events', 'weather_sync_log');
```

## Performance Optimization

### Database Indexes

All critical indexes are created automatically. Monitor slow queries:

```sql
-- Find slow queries
SELECT * FROM pg_stat_statements
WHERE query LIKE '%hail_events%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Caching Strategy

- NOAA data is cached in Postgres (24-hour refresh)
- API responses can be cached at CDN level
- Consider adding Redis for frequent queries

### Rate Limiting

The system implements:
- 1-second delay between NOAA API calls
- 3 retry attempts with exponential backoff
- Error logging to prevent cascading failures

## Data Sources

### NOAA Storm Events Database

- **URL:** https://www.ncdc.noaa.gov/stormevents/
- **Coverage:** 1950-present (quality improves after 1996)
- **Update Frequency:** Monthly (with 1-2 month delay)
- **States Covered:** All US states (we use VA, MD, PA)

### Data Quality Notes

- Not all hail events are recorded
- Small hail (<0.75") may not be reported
- Location accuracy varies (city/county level)
- Timing may be approximate
- Use as supporting evidence, not sole proof

## Security Considerations

1. **API Authentication:** Cron endpoint secured with bearer token
2. **Input Validation:** All user inputs sanitized
3. **SQL Injection:** Using parameterized queries
4. **Rate Limiting:** Consider adding rate limits to public APIs
5. **Data Privacy:** No personal information stored

## Future Enhancements

- [ ] Add geocoding service integration
- [ ] Implement PDF export functionality
- [ ] Add weather radar imagery
- [ ] Support additional weather events (wind, tornado)
- [ ] Real-time weather alerts
- [ ] Historical weather patterns analysis
- [ ] Integration with other weather APIs (Weather.gov)
- [ ] Mobile app support
- [ ] Email notifications for new events

## Support

For issues or questions:
- Check troubleshooting section
- Review API logs in Vercel dashboard
- Check database sync logs
- Contact development team

---

**Last Updated:** October 2, 2025
**Version:** 1.0.0
**Maintained by:** Susan AI-21 Development Team
