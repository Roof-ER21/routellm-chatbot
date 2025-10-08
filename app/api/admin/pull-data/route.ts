import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateRep, createChatSession, logChatMessage, ensureTablesExist } from '@/lib/db'

/**
 * Admin API endpoint to pull and sync localStorage data to PostgreSQL
 *
 * This endpoint accepts conversation data from client devices (phone, iPad, computer)
 * and syncs it to the Railway PostgreSQL database.
 *
 * Expected payload:
 * {
 *   conversations: [
 *     {
 *       id: string,           // client-side session ID
 *       repName: string,      // rep name
 *       messages: [
 *         {
 *           role: 'user' | 'assistant',
 *           content: string,
 *           timestamp: number
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { conversations } = await req.json()

    if (!conversations || !Array.isArray(conversations)) {
      return NextResponse.json(
        {
          success: false,
          error: 'conversations array is required'
        },
        { status: 400 }
      )
    }

    console.log(`[Pull Data] Received ${conversations.length} conversations to sync`)

    // Ensure database tables exist
    await ensureTablesExist()

    let totalSynced = 0
    let totalMessages = 0
    let errors: string[] = []
    const syncedConversations: any[] = []

    for (const conv of conversations) {
      try {
        const { id: clientSessionId, repName, messages } = conv

        if (!repName || !messages || !Array.isArray(messages)) {
          errors.push(`Invalid conversation format for session ${clientSessionId}`)
          continue
        }

        // Get or create rep in database
        const rep = await getOrCreateRep(repName)

        // Create a new chat session in database
        const dbSession = await createChatSession(rep.id, repName)

        console.log(`[Pull Data] Created session ${dbSession.id} for ${repName} (client: ${clientSessionId})`)

        // Sort messages by timestamp to maintain order
        const sortedMessages = messages.sort((a, b) => a.timestamp - b.timestamp)

        let messageCount = 0
        for (const msg of sortedMessages) {
          try {
            if (!msg.role || !msg.content) {
              continue
            }

            // Insert message into database
            await logChatMessage(
              dbSession.id,
              rep.id,
              repName,
              msg.role as 'user' | 'assistant',
              msg.content
            )

            messageCount++
            totalMessages++
          } catch (msgError: any) {
            errors.push(`Failed to insert message in session ${dbSession.id}: ${msgError.message}`)
          }
        }

        syncedConversations.push({
          clientSessionId,
          dbSessionId: dbSession.id,
          repName,
          messageCount
        })

        totalSynced++
        console.log(`[Pull Data] Synced ${messageCount} messages for ${repName}`)
      } catch (convError: any) {
        errors.push(`Failed to process conversation: ${convError.message}`)
      }
    }

    const response = {
      success: true,
      conversationsSynced: totalSynced,
      totalMessages,
      conversationsReceived: conversations.length,
      errors: errors.length > 0 ? errors : undefined,
      syncedConversations
    }

    console.log(`[Pull Data] Sync complete: ${totalSynced}/${conversations.length} conversations, ${totalMessages} messages`)

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('[Pull Data] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync data',
        details: error.message
      },
      { status: 500 }
    )
  }
}
