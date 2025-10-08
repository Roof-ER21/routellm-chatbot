import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Admin API endpoint for retrieving ALL conversations from PostgreSQL database
 * Fetches messages from all devices (phone, iPad, computer) across all users
 * Includes threat_alerts data for security monitoring
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[Admin] Fetching all conversations from database...')

    // Get all chat messages from database, ordered by time
    const messagesResult = await query(`
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

    const messages = messagesResult.rows
    console.log(`[Admin] Found ${messages.length} total messages in database`)

    // Get all threat alerts from database
    const alertsResult = await query(`
      SELECT
        ta.id,
        ta.session_id,
        ta.message_id,
        ta.rep_name,
        ta.category,
        ta.pattern,
        ta.severity,
        ta.risk_score,
        ta.matched_text,
        ta.created_at
      FROM threat_alerts ta
      ORDER BY ta.created_at DESC
    `)

    const alerts = alertsResult.rows
    console.log(`[Admin] Found ${alerts.length} threat alerts in database`)

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
          alerts: [],
          firstMessage: msg.created_at,
          lastMessage: msg.created_at,
          messageCount: 0,
          isFlagged: false,
          highestSeverity: undefined
        })
      }

      const conversation = conversationsMap.get(sessionId)
      conversation.messages.push({
        id: msg.id,
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

    // Add alerts to conversations
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }

    for (const alert of alerts) {
      const sessionId = alert.session_id
      if (!sessionId || !conversationsMap.has(sessionId)) {
        continue
      }

      const conversation = conversationsMap.get(sessionId)

      // Find message index for this alert
      const messageIndex = conversation.messages.findIndex((m: any) => m.id === alert.message_id)

      conversation.alerts.push({
        pattern: alert.pattern,
        severity: alert.severity,
        category: alert.category,
        timestamp: new Date(alert.created_at).getTime(),
        messageIndex: messageIndex >= 0 ? messageIndex : 0,
        highlightedText: alert.matched_text,
        riskScore: alert.risk_score
      })

      conversation.isFlagged = true

      // Update highest severity
      if (!conversation.highestSeverity ||
          severityOrder[alert.severity] > severityOrder[conversation.highestSeverity]) {
        conversation.highestSeverity = alert.severity
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

    // Calculate alert statistics
    const totalAlerts = alerts.length
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length
    const highAlerts = alerts.filter(a => a.severity === 'high').length
    const mediumAlerts = alerts.filter(a => a.severity === 'medium').length
    const lowAlerts = alerts.filter(a => a.severity === 'low').length

    console.log(`[Admin] Grouped into ${conversations.length} conversations`)
    console.log(`[Admin] Unique users: ${new Set(conversations.map(c => c.repName)).size}`)
    console.log(`[Admin] Flagged conversations: ${conversations.filter(c => c.isFlagged).length}`)
    console.log(`[Admin] Alert severity breakdown: ${criticalAlerts} critical, ${highAlerts} high, ${mediumAlerts} medium, ${lowAlerts} low`)

    return NextResponse.json({
      success: true,
      conversations,
      totalMessages: messages.length,
      totalConversations: conversations.length,
      totalAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      users: Array.from(new Set(conversations.map(c => c.repName)))
    })
  } catch (error: any) {
    console.error('[Admin] Error fetching conversations:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversations',
        details: error.message
      },
      { status: 500 }
    )
  }
}
