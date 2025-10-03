import { NextResponse } from 'next/server'
import { VoiceCommandHandler, CommandType } from '@/lib/voice-command-handler'

/**
 * GET /api/voice/suggestions
 *
 * Get example voice commands and supported command types
 *
 * Response:
 * {
 *   suggestions: string[]        // Example voice commands
 *   commandTypes: string[]       // Supported command types
 *   categories: {
 *     [category]: {
 *       description: string
 *       examples: string[]
 *     }
 *   }
 * }
 */
export async function GET() {
  try {
    const handler = new VoiceCommandHandler()
    const suggestions = handler.getCommandSuggestions()
    const commandTypes = Object.values(CommandType)

    // Organize suggestions by category
    const categories = {
      documentation: {
        description: 'Document damage and findings',
        examples: [
          'Susan, document hail damage',
          'Susan, record wind damage on north side',
          'Susan, note missing shingles',
          'Susan, log granular loss on roof',
        ],
      },
      citations: {
        description: 'Get building code citations',
        examples: [
          'Susan, cite IRC flashing code',
          'Susan, what is the code for roof ventilation',
          'Susan, building code for valley flashing',
          'Susan, NFPA fire rating requirements',
        ],
      },
      drafts: {
        description: 'Generate emails, letters, and templates',
        examples: [
          'Susan, draft State Farm appeal letter',
          'Susan, create an estimate template',
          'Susan, write email to insurance adjuster',
          'Susan, generate appeal for denied claim',
        ],
      },
      analysis: {
        description: 'Analyze photos and situations',
        examples: [
          'Susan, analyze photo',
          'Susan, examine the damage',
          'Susan, assess the situation',
          'Susan, evaluate roof condition',
        ],
      },
      help: {
        description: 'Get guidance and assistance',
        examples: [
          'Susan, help with roof measurements',
          'Susan, how do I measure a valley',
          'Susan, guide me through the inspection',
          'Susan, what is pitch calculation',
        ],
      },
      emergency: {
        description: 'Emergency assistance and safety',
        examples: [
          'Susan, emergency',
          'Susan, need help now',
          'Susan, safety concern',
          'Susan, urgent assistance',
        ],
      },
      general: {
        description: 'General questions and queries',
        examples: [
          'What are common hail damage indicators',
          'How long does a roof inspection take',
          'What materials are best for high winds',
          'Explain underlayment requirements',
        ],
      },
    }

    return NextResponse.json({
      suggestions,
      commandTypes,
      categories,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting voice suggestions:', error)
    return NextResponse.json(
      {
        error: 'Failed to get suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
