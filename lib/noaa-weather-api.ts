/**
 * NOAA Weather API Client
 *
 * Provides access to NOAA Storm Events Database for hail storm data
 * in Virginia, Maryland, and Pennsylvania.
 *
 * API Documentation: https://www.ncei.noaa.gov/access/services/data/v1
 */

import sql, { query as dbQuery } from './railway-db'

// Types
export interface HailEvent {
  id?: number
  eventId: string
  eventDate: Date
  state: string
  county?: string
  city?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  hailSize?: number
  magnitude?: string
  eventNarrative?: string
  episodeNarrative?: string
  beginTime?: Date
  endTime?: Date
  source?: string
}

export interface WeatherQueryParams {
  state?: string
  zipCode?: string
  latitude?: number
  longitude?: number
  radius?: number // miles
  startDate?: Date
  endDate?: Date
  minHailSize?: number // inches
}

export interface NOAAStormEvent {
  EVENT_ID: string
  BEGIN_DATE: string
  BEGIN_TIME: string
  END_DATE: string
  END_TIME: string
  STATE: string
  STATE_FIPS: string
  YEAR: string
  MONTH_NAME: string
  EVENT_TYPE: string
  CZ_TYPE: string
  CZ_FIPS: string
  CZ_NAME: string
  BEGIN_LAT: string
  BEGIN_LON: string
  END_LAT: string
  END_LAN: string
  MAGNITUDE: string
  MAGNITUDE_TYPE: string
  EVENT_NARRATIVE: string
  EPISODE_NARRATIVE: string
}

// Constants
const NOAA_BASE_URL = 'https://www.ncei.noaa.gov/access/services/data/v1'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const RATE_LIMIT_DELAY = 1000 // 1 second between requests
const MAX_RETRIES = 3

// State FIPS codes for VA, MD, PA
const STATE_FIPS = {
  VA: '51',
  MD: '24',
  PA: '42',
}

/**
 * Fetch hail events from NOAA Storm Events Database
 */
export async function fetchNOAAHailEvents(
  state: string,
  startDate: Date,
  endDate: Date
): Promise<NOAAStormEvent[]> {
  const stateFips = STATE_FIPS[state as keyof typeof STATE_FIPS]

  if (!stateFips) {
    throw new Error(`Invalid state: ${state}. Must be VA, MD, or PA.`)
  }

  const formattedStartDate = formatDate(startDate)
  const formattedEndDate = formatDate(endDate)

  // NOAA Storm Events API endpoint
  const url = new URL(`${NOAA_BASE_URL}`)
  url.searchParams.append('dataset', 'storm-events')
  url.searchParams.append('dataTypes', 'details')
  url.searchParams.append('startDate', formattedStartDate)
  url.searchParams.append('endDate', formattedEndDate)
  url.searchParams.append('states', state)
  url.searchParams.append('eventTypes', 'Hail')
  url.searchParams.append('format', 'json')

  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'Susan-AI-21-Roofing-Assistant/1.0',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        throw new Error(`NOAA API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      // Handle different response formats
      if (Array.isArray(data)) {
        return data
      } else if (data.results && Array.isArray(data.results)) {
        return data.results
      } else if (data.data && Array.isArray(data.data)) {
        return data.data
      }

      return []
    } catch (error) {
      lastError = error as Error
      console.error(`NOAA API attempt ${attempt + 1} failed:`, error)

      if (attempt < MAX_RETRIES - 1) {
        await sleep(RATE_LIMIT_DELAY * (attempt + 1))
      }
    }
  }

  throw new Error(`Failed to fetch NOAA data after ${MAX_RETRIES} attempts: ${lastError?.message}`)
}

/**
 * Parse and normalize NOAA event data
 */
export function parseNOAAEvent(event: NOAAStormEvent): HailEvent {
  const beginDate = parseNOAADate(event.BEGIN_DATE, event.BEGIN_TIME)
  const endDate = parseNOAADate(event.END_DATE, event.END_TIME)

  return {
    eventId: `NOAA-${event.EVENT_ID}-${event.STATE}`,
    eventDate: beginDate,
    state: event.STATE,
    county: event.CZ_NAME || undefined,
    latitude: parseFloat(event.BEGIN_LAT) || undefined,
    longitude: parseFloat(event.BEGIN_LON) || undefined,
    hailSize: parseMagnitude(event.MAGNITUDE, event.MAGNITUDE_TYPE),
    magnitude: event.MAGNITUDE || undefined,
    eventNarrative: event.EVENT_NARRATIVE || undefined,
    episodeNarrative: event.EPISODE_NARRATIVE || undefined,
    beginTime: beginDate,
    endTime: endDate,
    source: 'NOAA',
  }
}

/**
 * Save hail events to database
 */
export async function saveHailEvents(events: HailEvent[]): Promise<{ added: number; updated: number }> {
  let added = 0
  let updated = 0

  for (const event of events) {
    try {
      // Check if event exists
      const existing = await sql`
        SELECT id FROM hail_events WHERE event_id = ${event.eventId}
      `

      if (existing.rows.length > 0) {
        // Update existing event
        await sql`
          UPDATE hail_events
          SET
            event_date = ${event.eventDate.toISOString()},
            state = ${event.state},
            county = ${event.county || null},
            city = ${event.city || null},
            zip_code = ${event.zipCode || null},
            latitude = ${event.latitude || null},
            longitude = ${event.longitude || null},
            hail_size = ${event.hailSize || null},
            magnitude = ${event.magnitude || null},
            event_narrative = ${event.eventNarrative || null},
            episode_narrative = ${event.episodeNarrative || null},
            begin_time = ${event.beginTime?.toISOString() || null},
            end_time = ${event.endTime?.toISOString() || null},
            updated_at = NOW()
          WHERE event_id = ${event.eventId}
        `
        updated++
      } else {
        // Insert new event
        await sql`
          INSERT INTO hail_events (
            event_id, event_date, state, county, city, zip_code,
            latitude, longitude, hail_size, magnitude,
            event_narrative, episode_narrative, begin_time, end_time, source
          ) VALUES (
            ${event.eventId},
            ${event.eventDate.toISOString()},
            ${event.state},
            ${event.county || null},
            ${event.city || null},
            ${event.zipCode || null},
            ${event.latitude || null},
            ${event.longitude || null},
            ${event.hailSize || null},
            ${event.magnitude || null},
            ${event.eventNarrative || null},
            ${event.episodeNarrative || null},
            ${event.beginTime?.toISOString() || null},
            ${event.endTime?.toISOString() || null},
            ${event.source || 'NOAA'}
          )
        `
        added++
      }
    } catch (error) {
      console.error('Error saving hail event:', error)
    }
  }

  return { added, updated }
}

/**
 * Query hail events from database
 */
export async function queryHailEvents(params: WeatherQueryParams): Promise<HailEvent[]> {
  let query = 'SELECT * FROM hail_events WHERE 1=1'
  const values: any[] = []
  let paramCount = 1

  // Filter by state
  if (params.state) {
    query += ` AND state = $${paramCount}`
    values.push(params.state)
    paramCount++
  }

  // Filter by zip code
  if (params.zipCode) {
    query += ` AND zip_code = $${paramCount}`
    values.push(params.zipCode)
    paramCount++
  }

  // Filter by date range
  if (params.startDate) {
    query += ` AND event_date >= $${paramCount}`
    values.push(params.startDate.toISOString().split('T')[0])
    paramCount++
  }

  if (params.endDate) {
    query += ` AND event_date <= $${paramCount}`
    values.push(params.endDate.toISOString().split('T')[0])
    paramCount++
  }

  // Filter by minimum hail size
  if (params.minHailSize) {
    query += ` AND hail_size >= $${paramCount}`
    values.push(params.minHailSize)
    paramCount++
  }

  // Filter by location radius (using Haversine formula)
  if (params.latitude && params.longitude && params.radius) {
    const radiusMiles = params.radius
    query += ` AND (
      3959 * acos(
        cos(radians($${paramCount})) * cos(radians(latitude)) *
        cos(radians(longitude) - radians($${paramCount + 1})) +
        sin(radians($${paramCount})) * sin(radians(latitude))
      )
    ) <= $${paramCount + 2}`
    values.push(params.latitude, params.longitude, radiusMiles)
    paramCount += 3
  }

  query += ' ORDER BY event_date DESC LIMIT 100'

  const result = await dbQuery(query, values)

  return result.rows.map(row => ({
    id: row.id,
    eventId: row.event_id,
    eventDate: new Date(row.event_date),
    state: row.state,
    county: row.county,
    city: row.city,
    zipCode: row.zip_code,
    latitude: row.latitude ? parseFloat(row.latitude) : undefined,
    longitude: row.longitude ? parseFloat(row.longitude) : undefined,
    hailSize: row.hail_size ? parseFloat(row.hail_size) : undefined,
    magnitude: row.magnitude,
    eventNarrative: row.event_narrative,
    episodeNarrative: row.episode_narrative,
    beginTime: row.begin_time ? new Date(row.begin_time) : undefined,
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    source: row.source,
  }))
}

/**
 * Verify if a hail event occurred at a specific location and date
 */
export async function verifyHailClaim(
  date: Date,
  location: string,
  radius: number = 50
): Promise<{ verified: boolean; events: HailEvent[]; confidence: string }> {
  // Parse location (could be "City, State" or zip code)
  const locationParts = location.split(',').map(s => s.trim())
  let params: WeatherQueryParams = {
    startDate: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
    endDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
  }

  if (locationParts.length === 2) {
    // Assume "City, State" format
    params.state = locationParts[1].toUpperCase()
  } else if (/^\d{5}$/.test(location)) {
    // Assume zip code
    params.zipCode = location
  }

  const events = await queryHailEvents(params)

  // Calculate confidence based on proximity and time
  const exactDateEvents = events.filter(e =>
    e.eventDate.toISOString().split('T')[0] === date.toISOString().split('T')[0]
  )

  let confidence = 'low'
  if (exactDateEvents.length > 0) {
    confidence = 'high'
  } else if (events.length > 0) {
    confidence = 'medium'
  }

  return {
    verified: events.length > 0,
    events: events.slice(0, 10), // Return top 10 matches
    confidence,
  }
}

/**
 * Sync hail data from NOAA for a specific state and date range
 */
export async function syncNOAAData(
  state: string,
  startDate: Date,
  endDate: Date
): Promise<{ success: boolean; added: number; updated: number; error?: string }> {
  try {
    // Log sync start
    await sql`
      INSERT INTO weather_sync_log (sync_date, state, sync_status)
      VALUES (CURRENT_DATE, ${state}, 'running')
      ON CONFLICT (sync_date, state)
      DO UPDATE SET sync_status = 'running', started_at = NOW()
    `

    // Fetch data from NOAA
    const noaaEvents = await fetchNOAAHailEvents(state, startDate, endDate)

    // Parse and save events
    const parsedEvents = noaaEvents.map(parseNOAAEvent)
    const { added, updated } = await saveHailEvents(parsedEvents)

    // Log sync completion
    await sql`
      UPDATE weather_sync_log
      SET
        sync_status = 'completed',
        events_added = ${added},
        events_updated = ${updated},
        completed_at = NOW()
      WHERE sync_date = CURRENT_DATE AND state = ${state}
    `

    return { success: true, added, updated }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Log sync error
    await sql`
      UPDATE weather_sync_log
      SET
        sync_status = 'failed',
        error_message = ${errorMessage},
        completed_at = NOW()
      WHERE sync_date = CURRENT_DATE AND state = ${state}
    `

    return { success: false, added: 0, updated: 0, error: errorMessage }
  }
}

// Helper functions

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function parseNOAADate(dateStr: string, timeStr?: string): Date {
  // NOAA date format: YYYY-MM-DD
  // NOAA time format: HHMM
  const dateParts = dateStr.split('-')
  const year = parseInt(dateParts[0])
  const month = parseInt(dateParts[1]) - 1
  const day = parseInt(dateParts[2])

  let hour = 0
  let minute = 0

  if (timeStr && timeStr.length === 4) {
    hour = parseInt(timeStr.substring(0, 2))
    minute = parseInt(timeStr.substring(2, 4))
  }

  return new Date(year, month, day, hour, minute)
}

function parseMagnitude(magnitude: string, magnitudeType: string): number | undefined {
  if (!magnitude || magnitude === '0') return undefined

  // Hail size is typically in inches
  const size = parseFloat(magnitude)

  if (isNaN(size)) return undefined

  return size
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get geocoding data for a location (simplified version)
 * In production, you'd integrate with a geocoding service
 */
export async function geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
  // This is a placeholder. In production, integrate with:
  // - Google Maps Geocoding API
  // - OpenStreetMap Nominatim
  // - Census.gov geocoding service

  // For now, return null and rely on zip code/city/county matching
  return null
}
