# Weather API Reference

Complete API reference for NOAA weather integration endpoints.

## Base URL

```
Production: https://susanai-21.vercel.app
Development: http://localhost:4000
```

## Authentication

Most endpoints are public. The cron sync endpoint requires authentication:

```http
Authorization: Bearer {CRON_SECRET}
```

---

## Endpoints

### 1. Query Hail Events

Retrieve hail events from the database with flexible filtering.

```http
GET /api/weather/hail-events
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `state` | string | No | - | State code (VA, MD, PA) |
| `zip` | string | No | - | ZIP code |
| `lat` | number | No | - | Latitude (requires lon) |
| `lon` | number | No | - | Longitude (requires lat) |
| `radius` | number | No | 50 | Search radius in miles |
| `date` | string | No | - | Single date (YYYY-MM-DD) |
| `startDate` | string | No | 3 years ago | Range start (YYYY-MM-DD) |
| `endDate` | string | No | Today | Range end (YYYY-MM-DD) |
| `minHailSize` | number | No | - | Minimum hail size (inches) |

#### Examples

```bash
# All events in Virginia
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA"

# Events near ZIP 22101 within 50 miles
curl "https://susanai-21.vercel.app/api/weather/hail-events?zip=22101&radius=50"

# Events on specific date
curl "https://susanai-21.vercel.app/api/weather/hail-events?date=2024-10-15&state=VA"

# Large hail (>1 inch) in Maryland
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=MD&minHailSize=1.0"

# Events by coordinates (38.88° N, 77.19° W) within 25 miles
curl "https://susanai-21.vercel.app/api/weather/hail-events?lat=38.88&lon=-77.19&radius=25"

# Date range query
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=PA&startDate=2024-01-01&endDate=2024-12-31"
```

#### Response

```json
{
  "success": true,
  "count": 3,
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
      "eventNarrative": "Large hail reported causing roof damage in McLean area...",
      "episodeNarrative": "Severe thunderstorm system moved through Northern Virginia...",
      "beginTime": "2024-10-15T14:30:00.000Z",
      "endTime": "2024-10-15T15:45:00.000Z",
      "source": "NOAA"
    }
  ],
  "query": {
    "state": "VA",
    "zipCode": null,
    "location": null,
    "dateRange": {
      "start": "2021-10-15",
      "end": "2024-10-15"
    },
    "minHailSize": null
  }
}
```

#### Error Responses

```json
// Invalid state
{
  "error": "Invalid state. Must be VA, MD, or PA."
}

// Server error
{
  "error": "Failed to query hail events",
  "details": "Connection timeout"
}
```

---

### 2. Verify Insurance Claim

Verify if a hail event occurred for insurance claim validation.

```http
GET /api/weather/verify-claim
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `date` | string | **Yes** | - | Claim date (YYYY-MM-DD) |
| `location` | string | **Yes** | - | City, State or ZIP code |
| `radius` | number | No | 50 | Search radius (miles) |

#### Examples

```bash
# Verify with city and state
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA"

# Verify with ZIP code
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=22101"

# Custom search radius
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=McLean,VA&radius=25"

# Pennsylvania claim
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-08-20&location=Philadelphia,PA"
```

#### Response

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
        "narrative": "Large hail reported causing significant roof damage across Richmond metropolitan area. Multiple reports of 1-2 inch hail.",
        "distance": null
      },
      {
        "date": "2024-10-15",
        "time": "3:15:00 PM",
        "location": "Henrico County, VA",
        "hailSize": "1.25 inches",
        "magnitude": "1.25",
        "narrative": "Quarter to half-dollar size hail reported.",
        "distance": null
      }
    ],
    "recommendation": "High confidence: Multiple hail events recorded on or very close to the claim date. This strongly supports the insurance claim. Document the NOAA event IDs for claim submission."
  }
}
```

#### Confidence Levels

| Level | Description |
|-------|-------------|
| `high` | Exact date match with events in the area |
| `medium` | Events within ±7 days of claim date |
| `low` | Few or no matching events found |

#### Error Responses

```json
// Missing parameters
{
  "error": "Missing required parameters",
  "required": {
    "date": "Claim date in YYYY-MM-DD format",
    "location": "Location as \"City, State\" or zip code"
  }
}

// Invalid date
{
  "error": "Invalid date format. Use YYYY-MM-DD."
}
```

---

### 3. Sync Weather Data (Cron)

Daily synchronization with NOAA database.

```http
GET /api/cron/sync-weather-data
POST /api/cron/sync-weather-data
```

#### Headers

```http
Authorization: Bearer {CRON_SECRET}
```

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `states` | string | No | VA,MD,PA | Comma-separated state codes |
| `days` | number | No | 30 | Days to sync backwards |

#### Examples

```bash
# Default sync (all states, last 30 days)
curl -X POST https://susanai-21.vercel.app/api/cron/sync-weather-data \
  -H "Authorization: Bearer your-secret"

# Sync specific state
curl -X POST "https://susanai-21.vercel.app/api/cron/sync-weather-data?states=VA&days=60" \
  -H "Authorization: Bearer your-secret"

# Sync multiple states with custom date range
curl -X POST "https://susanai-21.vercel.app/api/cron/sync-weather-data?states=VA,MD&days=90" \
  -H "Authorization: Bearer your-secret"
```

#### Response

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

#### Error Responses

```json
// Unauthorized
{
  "error": "Unauthorized"
}

// Sync failure
{
  "error": "Sync failed",
  "details": "NOAA API timeout",
  "timestamp": "2024-10-15T02:00:00.000Z"
}
```

---

## Rate Limiting

### NOAA API Limits
- 1000 requests per day
- System uses ~3 requests/day (daily sync)
- Manual operations: 997 requests/day available

### Recommended Client Limits
- Max 100 requests/minute per IP
- Cache responses for 1 hour
- Implement exponential backoff on errors

---

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 401 | Unauthorized (missing/invalid auth) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Data Models

### HailEvent

```typescript
interface HailEvent {
  id: number
  eventId: string           // NOAA-{id}-{state}
  eventDate: Date          // Date of event
  state: string            // VA, MD, or PA
  county?: string          // County name
  city?: string            // City name
  zipCode?: string         // ZIP code
  latitude?: number        // Decimal degrees
  longitude?: number       // Decimal degrees
  hailSize?: number        // Size in inches
  magnitude?: string       // NOAA magnitude code
  eventNarrative?: string  // Event description
  episodeNarrative?: string // Episode description
  beginTime?: Date         // Event start
  endTime?: Date           // Event end
  source: string           // Always "NOAA"
}
```

### VerificationReport

```typescript
interface VerificationReport {
  verified: boolean        // Event found
  confidence: string       // high, medium, low
  claimDate: string        // Original claim date
  location: string         // Search location
  searchRadius: number     // Search radius (miles)
  eventsFound: number      // Count of events
  events: HailEvent[]      // Matching events
  recommendation: string   // Action recommendation
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Query events
async function getHailEvents(state: string) {
  const response = await fetch(
    `https://susanai-21.vercel.app/api/weather/hail-events?state=${state}`
  )
  const data = await response.json()
  return data.events
}

// Verify claim
async function verifyClaim(date: string, location: string) {
  const response = await fetch(
    `https://susanai-21.vercel.app/api/weather/verify-claim?` +
    `date=${date}&location=${encodeURIComponent(location)}`
  )
  const data = await response.json()
  return data.report
}

// Usage
const events = await getHailEvents('VA')
console.log(`Found ${events.length} events`)

const report = await verifyClaim('2024-10-15', 'Richmond, VA')
console.log(`Verified: ${report.verified}`)
console.log(`Confidence: ${report.confidence}`)
```

### Python

```python
import requests

# Query events
def get_hail_events(state):
    response = requests.get(
        f'https://susanai-21.vercel.app/api/weather/hail-events',
        params={'state': state}
    )
    return response.json()['events']

# Verify claim
def verify_claim(date, location):
    response = requests.get(
        'https://susanai-21.vercel.app/api/weather/verify-claim',
        params={'date': date, 'location': location}
    )
    return response.json()['report']

# Usage
events = get_hail_events('VA')
print(f"Found {len(events)} events")

report = verify_claim('2024-10-15', 'Richmond, VA')
print(f"Verified: {report['verified']}")
print(f"Confidence: {report['confidence']}")
```

### cURL

```bash
# Save response to file
curl "https://susanai-21.vercel.app/api/weather/hail-events?state=VA" \
  -o events.json

# Pretty print with jq
curl "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=Richmond,VA" \
  | jq '.'

# Get only event count
curl -s "https://susanai-21.vercel.app/api/weather/hail-events?state=VA" \
  | jq '.count'

# Check if verified
curl -s "https://susanai-21.vercel.app/api/weather/verify-claim?date=2024-10-15&location=22101" \
  | jq '.report.verified'
```

---

## Best Practices

### Caching
```typescript
// Cache responses for 1 hour
const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

async function getCachedEvents(state: string) {
  const cacheKey = `events-${state}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const data = await getHailEvents(state)
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}
```

### Error Handling
```typescript
async function safeVerifyClaim(date: string, location: string) {
  try {
    const response = await fetch(
      `/api/weather/verify-claim?date=${date}&location=${encodeURIComponent(location)}`
    )

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Verification failed:', error)
    return {
      success: false,
      report: {
        verified: false,
        confidence: 'low',
        eventsFound: 0,
        events: [],
        recommendation: 'Unable to verify due to API error'
      }
    }
  }
}
```

### Retry Logic
```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return response

      if (response.status >= 500) {
        await sleep(1000 * Math.pow(2, i)) // Exponential backoff
        continue
      }

      return response // Don't retry 4xx errors
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await sleep(1000 * Math.pow(2, i))
    }
  }
}
```

---

## Support

For API issues:
- Check [NOAA_WEATHER_INTEGRATION.md](./NOAA_WEATHER_INTEGRATION.md)
- Review Vercel function logs
- Contact development team

---

**Last Updated:** October 2, 2025
**API Version:** 1.0.0
**Base URL:** https://susanai-21.vercel.app
