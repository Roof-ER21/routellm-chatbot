import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Admin API endpoint for retrieving ALL conversations from PostgreSQL database
 * Fetches messages from all devices (phone, iPad, computer) across all users
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Admin] Fetching all conversations from database...')

    // Get all chat messages from database, ordered by time
    const result = await query(`
      SELECT
        cm.id,
        cm.session_id,
        cm.rep_id,
        cm.rep_name,
        cm.role,
        cm.content,
        cm.created_at,
        r.name as rep_full_name
      FROM chat_messages cm
      LEFT JOIN reps r ON cm.rep_id = r.id
      ORDER BY cm.created_at DESC
      LIMIT 10000
    `)

    const messages = result.rows

    console.log(`[Admin] Found ${messages.length} total messages in database`)

    // Group messages by session_id to create conversations
    const conversationsMap = new Map()

    for (const msg of messages) {
      const sessionId = msg.session_id

      if (!conversationsMap.has(sessionId)) {
        conversationsMap.set(sessionId, {
          id: sessionId,
          repName: msg.rep_name || msg.rep_full_name || 'Unknown',
          repId: msg.rep_id,
          messages: [],
          firstMessage: msg.created_at,
          lastMessage: msg.created_at,
          messageCount: 0
        })
      }

      const conversation = conversationsMap.get(sessionId)
      conversation.messages.push({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at
      })
      conversation.messageCount++

      // Update time range
      if (new Date(msg.created_at) < new Date(conversation.firstMessage)) {
        conversation.firstMessage = msg.created_at
      }
      if (new Date(msg.created_at) > new Date(conversation.lastMessage)) {
        conversation.lastMessage = msg.created_at
      }
    }

    // Convert map to array and add preview/title
    const conversations = Array.from(conversationsMap.values()).map(conv => {
      const firstUserMsg = conv.messages.find((m: any) => m.role === 'user')
      const preview = firstUserMsg ? firstUserMsg.content.substring(0, 100) : 'No messages'
      const title = firstUserMsg ? firstUserMsg.content.substring(0, 50) : 'Empty conversation'

      return {
        ...conv,
        title: title.length < firstUserMsg?.content.length ? title + '...' : title,
        preview: preview.length < firstUserMsg?.content.length ? preview + '...' : preview,
        date: new Date(conv.lastMessage).getTime()
      }
    })

    // Sort by most recent first
    conversations.sort((a, b) => b.date - a.date)

    console.log(`[Admin] Grouped into ${conversations.length} conversations`)
    console.log(`[Admin] Unique users: ${new Set(conversations.map(c => c.repName)).size}`)

    return NextResponse.json({
      success: true,
      conversations,
      totalMessages: messages.length,
      totalConversations: conversations.length,
      users: Array.from(new Set(conversations.map(c => c.repName)))
    })
  } catch (error: any) {
    console.error('[Admin] Error fetching conversations:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch conversations',
        details: error.message
      },
      { status: 500 }
    )
  }
}
