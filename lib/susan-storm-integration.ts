/**
 * Susan AI Storm Data Integration
 *
 * Provides helper functions for Susan AI to access and reference storm data
 * in her responses to reps
 */

import { searchStormsByLocation, getStormSummary } from './db'

export interface StormContext {
  hasStormData: boolean
  summary?: {
    totalEvents: number
    severeEvents: number
    maxHailSize: number
    recentEvent?: string
  }
  events?: Array<{
    date: string
    hailSize?: number
    location: string
  }>
}

/**
 * Get storm data context for Susan AI based on location mentioned in conversation
 */
export async function getStormContextForSusan(params: {
  address?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
}): Promise<StormContext> {
  try {
    // Search for storms in the area (last 2 years)
    const storms = await searchStormsByLocation({
      ...params,
      radiusMiles: 25,
      startYear: new Date().getFullYear() - 2,
      endYear: new Date().getFullYear()
    })

    if (storms.length === 0) {
      return { hasStormData: false }
    }

    // Get summary if coordinates available
    let summary
    if (params.latitude && params.longitude) {
      const summaryData = await getStormSummary({
        latitude: params.latitude,
        longitude: params.longitude,
        radiusMiles: 25,
        years: 2
      })

      if (summaryData) {
        summary = {
          totalEvents: summaryData.total_events || 0,
          severeEvents: summaryData.severe_hail_events || 0,
          maxHailSize: summaryData.max_hail_size || 0,
          recentEvent: summaryData.most_recent_event
        }
      }
    }

    // Format top 5 events for Susan to reference
    const events = storms.slice(0, 5).map(storm => ({
      date: new Date(storm.event_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      hailSize: storm.hail_size,
      location: `${storm.city}, ${storm.state}`
    }))

    return {
      hasStormData: true,
      summary,
      events
    }
  } catch (error) {
    console.error('[Susan Storm Integration] Error:', error)
    return { hasStormData: false }
  }
}

/**
 * Generate Susan AI prompt enhancement with storm data
 */
export function enhanceSusanPromptWithStormData(stormContext: StormContext): string {
  if (!stormContext.hasStormData) {
    return ''
  }

  let enhancement = '\n\n**STORM DATA AVAILABLE FOR THIS LOCATION:**\n'

  if (stormContext.summary) {
    enhancement += `- Total hail events (last 2 years): ${stormContext.summary.totalEvents}\n`
    enhancement += `- Severe hail events (1"+): ${stormContext.summary.severeEvents}\n`
    enhancement += `- Largest hail: ${stormContext.summary.maxHailSize}" diameter\n`
    if (stormContext.summary.recentEvent) {
      enhancement += `- Most recent event: ${new Date(stormContext.summary.recentEvent).toLocaleDateString()}\n`
    }
  }

  if (stormContext.events && stormContext.events.length > 0) {
    enhancement += '\n**Recent Storm Events:**\n'
    stormContext.events.forEach((event, i) => {
      enhancement += `${i + 1}. ${event.date} - ${event.location}`
      if (event.hailSize) {
        enhancement += ` (${event.hailSize}" hail)`
      }
      enhancement += '\n'
    })
  }

  enhancement += '\n**HOW TO USE THIS DATA:**\n'
  enhancement += '- Reference specific storm dates when discussing damage timelines\n'
  enhancement += '- Mention hail sizes to support damage severity claims\n'
  enhancement += '- Use this data to strengthen insurance claim arguments\n'
  enhancement += '- Suggest the rep use the Storm Data button for full details\n'

  return enhancement
}
