import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/railway-db'
import { getAllConversations, getConversationStats } from '@/lib/simple-auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'conversations'
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const user = searchParams.get('user')

    // Build date filter
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `AND created_at BETWEEN '${startDate}' AND '${endDate}'`
    }

    // Build user filter
    let userFilter = ''
    if (user && user !== 'all') {
      userFilter = `AND rep_name = '${user}'`
    }

    let data: any[] = []

    switch (type) {
      case 'conversations':
        // Get all conversations from database
        const conversationsResult = await sql`
          SELECT
            cs.id,
            cs.rep_name as user,
            cs.started_at,
            cs.message_count,
            json_agg(
              json_build_object(
                'role', cm.role,
                'content', cm.content,
                'timestamp', cm.created_at
              ) ORDER BY cm.created_at
            ) as messages
          FROM chat_sessions cs
          LEFT JOIN chat_messages cm ON cs.id = cm.session_id
          WHERE 1=1 ${dateFilter ? sql.unsafe(dateFilter) : sql``} ${userFilter ? sql.unsafe(userFilter) : sql``}
          GROUP BY cs.id, cs.rep_name, cs.started_at, cs.message_count
          ORDER BY cs.started_at DESC
        `
        data = conversationsResult.rows.map(row => ({
          id: row.id,
          user: row.user,
          started_at: row.started_at,
          message_count: row.message_count,
          messages: row.messages || []
        }))
        break

      case 'emails':
        // Get all sent emails
        const emailsResult = await sql`
          SELECT
            id,
            rep_name as user,
            template_used as template,
            to_email,
            from_email,
            subject,
            body,
            delivery_status,
            sent_at as generated_at
          FROM sent_emails
          WHERE 1=1 ${dateFilter ? sql.unsafe(dateFilter.replace('created_at', 'sent_at')) : sql``} ${userFilter ? sql.unsafe(userFilter.replace('rep_name', 'rep_name')) : sql``}
          ORDER BY sent_at DESC
        `
        data = emailsResult.rows
        break

      case 'feedback':
        // Currently not implemented in database - return empty array
        // This would need a new table: user_feedback
        data = []
        break

      case 'user_activity':
        // Get user activity summary
        const activityResult = await sql`
          SELECT
            r.name as user,
            COUNT(DISTINCT cs.id) as total_sessions,
            COUNT(cm.id) as total_messages,
            COUNT(DISTINCT se.id) as total_emails,
            MAX(r.last_active) as last_active
          FROM reps r
          LEFT JOIN chat_sessions cs ON r.id = cs.rep_id
          LEFT JOIN chat_messages cm ON cs.id = cm.session_id
          LEFT JOIN sent_emails se ON r.name = se.rep_name
          WHERE 1=1
          GROUP BY r.id, r.name
          ORDER BY total_messages DESC
        `

        data = activityResult.rows.map(row => ({
          user: row.user,
          total_sessions: row.total_sessions || 0,
          total_messages: row.total_messages || 0,
          total_emails: row.total_emails || 0,
          most_used_template: 'N/A', // Would need template usage tracking
          error_rate: 0, // Would need error tracking
          last_active: row.last_active
        }))
        break

      case 'logs':
        // Get system logs (threat alerts as proxy for now)
        const logsResult = await sql`
          SELECT
            id,
            severity as level,
            CONCAT(category, ': ', pattern) as message,
            created_at as timestamp,
            json_build_object(
              'rep_name', rep_name,
              'matched_text', matched_text,
              'risk_score', risk_score
            ) as metadata
          FROM threat_alerts
          WHERE 1=1 ${dateFilter ? sql.unsafe(dateFilter) : sql``}
          ORDER BY created_at DESC
          LIMIT 500
        `
        data = logsResult.rows
        break

      case 'questions':
        // Get all user questions (from chat messages where role = 'user')
        const questionsResult = await sql`
          SELECT
            cm.content as question,
            cm.rep_name as user,
            cm.created_at as timestamp,
            COUNT(*) OVER (PARTITION BY cm.content) as frequency
          FROM chat_messages cm
          WHERE cm.role = 'user'
          ${dateFilter ? sql.unsafe(dateFilter) : sql``}
          ${userFilter ? sql.unsafe(userFilter) : sql``}
          ORDER BY cm.created_at DESC
          LIMIT 1000
        `
        data = questionsResult.rows
        break

      case 'analytics':
        // Get comprehensive analytics
        const analyticsResult = await sql`
          SELECT
            DATE(cm.created_at) as date,
            COUNT(DISTINCT cs.id) as conversations,
            COUNT(cm.id) as messages,
            COUNT(DISTINCT cm.rep_name) as active_users,
            COUNT(DISTINCT CASE WHEN cm.role = 'user' THEN cm.id END) as user_messages,
            COUNT(DISTINCT CASE WHEN cm.role = 'assistant' THEN cm.id END) as assistant_messages
          FROM chat_messages cm
          LEFT JOIN chat_sessions cs ON cm.session_id = cs.id
          WHERE 1=1 ${dateFilter ? sql.unsafe(dateFilter) : sql``}
          GROUP BY DATE(cm.created_at)
          ORDER BY date DESC
        `
        data = analyticsResult.rows
        break

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    // Return data in requested format
    if (format === 'csv') {
      // Convert to CSV
      if (data.length === 0) {
        return new NextResponse('No data available', {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }

      const headers = Object.keys(data[0])
      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header]
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
            return `"${stringValue.replace(/"/g, '""')}"`
          }).join(',')
        )
      ]

      return new NextResponse(csvRows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Default to JSON
    return NextResponse.json({
      success: true,
      type,
      count: data.length,
      data,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[Export Data API] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export data'
      },
      { status: 500 }
    )
  }
}

// POST endpoint for complex exports with filters
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      type,
      format = 'json',
      filters = {},
      includeMetadata = true
    } = body

    // Similar logic to GET but with more complex filtering
    // For now, redirect to GET with query params
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('format', format)

    if (filters.startDate) params.set('start_date', filters.startDate)
    if (filters.endDate) params.set('end_date', filters.endDate)
    if (filters.user) params.set('user', filters.user)

    // Use internal fetch to GET endpoint
    const url = `${req.nextUrl.origin}/api/admin/export-data?${params.toString()}`
    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[Export Data API POST] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to export data'
      },
      { status: 500 }
    )
  }
}
