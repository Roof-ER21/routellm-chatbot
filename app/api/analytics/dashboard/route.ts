import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Analytics Dashboard Overview
 * GET /api/analytics/dashboard
 *
 * Returns:
 * - Today/week/month statistics
 * - Performance metrics
 * - Email success rates
 */
export async function GET(req: NextRequest) {
  try {
    // Calculate date ranges
    const today = new Date()
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Today's stats
    const todayStats = await query(`
      SELECT
        COUNT(DISTINCT rep_name) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages
      FROM chat_messages
      WHERE DATE(created_at) = CURRENT_DATE
    `)

    // Week stats
    const weekStats = await query(`
      SELECT
        COUNT(DISTINCT rep_name) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages
      FROM chat_messages
      WHERE created_at >= $1
    `, [weekAgo])

    // Month stats
    const monthStats = await query(`
      SELECT
        COUNT(DISTINCT rep_name) as unique_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_messages
      FROM chat_messages
      WHERE created_at >= $1
    `, [monthAgo])

    // Email generation stats (today)
    const emailStats = await query(`
      SELECT
        COUNT(*) as total_generated,
        COUNT(*) FILTER (WHERE was_copied) as total_copied,
        COUNT(*) FILTER (WHERE was_sent) as total_sent,
        AVG(generation_time_ms) as avg_generation_time,
        COUNT(*) FILTER (WHERE regeneration_count > 0) as regenerated_count
      FROM email_generation_analytics
      WHERE created_at >= CURRENT_DATE
    `)

    // Performance metrics (today)
    const perfStats = await query(`
      SELECT
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE NOT success) as error_count,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE failover_occurred) as failover_count
      FROM performance_metrics
      WHERE DATE(measured_at) = CURRENT_DATE
    `)

    // Calculate rates
    const errorRate = perfStats.rows[0]?.total_requests > 0
      ? ((perfStats.rows[0].error_count / perfStats.rows[0].total_requests) * 100).toFixed(2)
      : '0.00'

    const emailSuccessRate = emailStats.rows[0]?.total_generated > 0
      ? (((parseInt(emailStats.rows[0].total_copied) + parseInt(emailStats.rows[0].total_sent)) / parseInt(emailStats.rows[0].total_generated)) * 100).toFixed(2)
      : '0.00'

    // Feedback stats (today)
    const feedbackStats = await query(`
      SELECT
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE feedback_type = 'wrong_answer') as wrong_answers,
        COUNT(*) FILTER (WHERE feedback_type = 'not_helpful') as not_helpful
      FROM user_feedback
      WHERE DATE(created_at) = CURRENT_DATE
    `)

    return NextResponse.json({
      success: true,
      dashboard: {
        today: {
          users: todayStats.rows[0]?.unique_users || 0,
          sessions: todayStats.rows[0]?.total_sessions || 0,
          messages: todayStats.rows[0]?.total_messages || 0,
          emails: emailStats.rows[0]?.total_generated || 0
        },
        week: {
          users: weekStats.rows[0]?.unique_users || 0,
          sessions: weekStats.rows[0]?.total_sessions || 0,
          messages: weekStats.rows[0]?.total_messages || 0
        },
        month: {
          users: monthStats.rows[0]?.unique_users || 0,
          sessions: monthStats.rows[0]?.total_sessions || 0,
          messages: monthStats.rows[0]?.total_messages || 0
        },
        performance: {
          avg_response_time_ms: Math.round(parseFloat(perfStats.rows[0]?.avg_response_time) || 0),
          error_rate: errorRate,
          email_success_rate: emailSuccessRate,
          failover_count: perfStats.rows[0]?.failover_count || 0
        },
        feedback: {
          total: feedbackStats.rows[0]?.total_feedback || 0,
          wrong_answers: feedbackStats.rows[0]?.wrong_answers || 0,
          not_helpful: feedbackStats.rows[0]?.not_helpful || 0
        }
      }
    })
  } catch (error: any) {
    console.error('[Analytics API] Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    )
  }
}
