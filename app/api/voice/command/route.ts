import { NextRequest, NextResponse } from 'next/server'
import { VoiceCommandHandler } from '@/lib/voice-command-handler'
import { logChatMessage, getOrCreateRep } from '@/lib/db'

// Conditionally import email if Resend API key is available
let sendRealTimeNotification: any = null
if (process.env.RESEND_API_KEY) {
  import('@/lib/email').then((module) => {
    sendRealTimeNotification = module.sendRealTimeNotification
  })
}

/**
 * POST /api/voice/command
 *
 * Process voice commands using natural language detection
 *
 * Request body:
 * {
 *   transcript: string           // Voice transcript
 *   repName?: string             // Rep name for logging
 *   sessionId?: string           // Session ID for logging
 *   context?: {                  // Optional context
 *     userId?: string
 *     location?: {
 *       latitude?: number
 *       longitude?: number
 *       address?: string
 *     }
 *     propertyAddress?: string
 *     photoData?: string
 *   }
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   command: {                   // Parsed command details
 *     type: string               // DOCUMENT, CITE, DRAFT, ANALYZE, HELP, EMERGENCY, QUERY
 *     originalText: string
 *     confidence: number         // 0-1
 *     parameters: object
 *   }
 *   result: {                    // Command execution result
 *     success: boolean
 *     action: string
 *     voiceResponse: string      // Optimized for text-to-speech
 *     ... (action-specific fields)
 *   }
 *   transcript: string
 *   timestamp: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { transcript, repName, sessionId, context = {} } = body

    // Validate required fields
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        {
          error: 'Transcript is required and must be a string',
        },
        { status: 400 }
      )
    }

    console.log('Voice command received:', {
      transcript,
      repName,
      sessionId,
      hasContext: !!context,
    })

    // Initialize voice command handler
    const handler = new VoiceCommandHandler()

    // Process command with context
    const result = await handler.processCommand(transcript, {
      ...context,
      repName,
      sessionId,
    })

    // Log to database if rep and session are provided
    if (repName && sessionId && result.success) {
      try {
        const rep = await getOrCreateRep(repName)

        // Log user command (transcript)
        await logChatMessage(sessionId, rep.id, repName, 'user', transcript)

        // Log assistant response
        const assistantResponse = result.result?.voiceResponse || 'Command processed'
        await logChatMessage(sessionId, rep.id, repName, 'assistant', assistantResponse)

        // Send real-time notification (non-blocking) - only if email is configured
        if (sendRealTimeNotification) {
          sendRealTimeNotification(repName, transcript, assistantResponse).catch((err: any) => {
            console.error('Failed to send notification:', err)
          })
        }
      } catch (logError) {
        console.error('Error logging voice command:', logError)
        // Don't fail the request if logging fails
      }
    }

    // Return the result
    return NextResponse.json({
      success: result.success,
      command: result.command,
      result: result.result,
      transcript: result.transcript,
      timestamp: result.timestamp,
      error: result.error,
    })
  } catch (error) {
    console.error('Error in voice command API:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/voice/command
 *
 * Get voice command handler status
 */
export async function GET() {
  try {
    const handler = new VoiceCommandHandler()
    const status = handler.getStatus()

    return NextResponse.json({
      ...status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error getting voice command status:', error)
    return NextResponse.json(
      {
        error: 'Failed to get status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
