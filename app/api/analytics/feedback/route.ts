import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * User Feedback Analytics
 * GET /api/analytics/feedback
 *
 * Returns:
 * - Feedback summary by type
 * - Feedback by severity
 * - Recent feedback needing review
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    const unreviewed = searchParams.get('unreviewed') === 'true'

    // Summary by type
    const summaryByType = await query(`
      SELECT
        feedback_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') as high_count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY feedback_type
      ORDER BY count DESC
    `)

    // Summary by severity
    const summaryBySeverity = await query(`
      SELECT
        severity,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE reviewed = false) as unreviewed_count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY severity
      ORDER BY CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
    `)

    // Summary by category
    const summaryByCategory = await query(`
      SELECT
        category,
        COUNT(*) as count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY category
      ORDER BY count DESC
    `)

    // Recent feedback needing review
    let whereClause = `WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    if (unreviewed) {
      whereClause += ' AND reviewed = false'
    }

    const recentFeedback = await query(`
      SELECT
        id,
        rep_name,
        feedback_type,
        severity,
        category,
        original_question,
        susan_response,
        user_comment,
        user_correction,
        created_at,
        reviewed,
        reviewed_at,
        action_taken
      FROM user_feedback
      ${whereClause}
      ORDER BY severity DESC, created_at DESC
      LIMIT 100
    `)

    // Top contributors (reps providing most feedback)
    const topContributors = await query(`
      SELECT
        rep_name,
        COUNT(*) as feedback_count,
        COUNT(*) FILTER (WHERE feedback_type = 'correction') as correction_count,
        COUNT(*) FILTER (WHERE feedback_type = 'feature_request') as feature_request_count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY rep_name
      ORDER BY feedback_count DESC
      LIMIT 10
    `)

    // Trends (daily feedback count)
    const trends = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as total_feedback,
        COUNT(*) FILTER (WHERE feedback_type = 'wrong_answer') as wrong_answers,
        COUNT(*) FILTER (WHERE feedback_type = 'not_helpful') as not_helpful
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Calculate overall stats
    const totalFeedback = summaryByType.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
    const unreviewedCount = summaryBySeverity.rows.reduce((sum, row) => sum + parseInt(row.unreviewed_count), 0)
    const criticalUnreviewed = summaryBySeverity.rows.find(row => row.severity === 'critical')?.unreviewed_count || 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalFeedback,
          unreviewed: unreviewedCount,
          critical_unreviewed: criticalUnreviewed
        },
        byType: summaryByType.rows,
        bySeverity: summaryBySeverity.rows,
        byCategory: summaryByCategory.rows,
        recent: recentFeedback.rows,
        topContributors: topContributors.rows,
        trends: trends.rows
      }
    })
  } catch (error: any) {
    console.error('[Analytics API] Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback analytics', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Mark feedback as reviewed
 * PATCH /api/analytics/feedback
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { feedbackId, actionTaken } = body

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing feedbackId' },
        { status: 400 }
      )
    }

    await query(`
      UPDATE user_feedback
      SET reviewed = true,
          reviewed_at = NOW(),
          action_taken = $1
      WHERE id = $2
    `, [actionTaken || null, feedbackId])

    return NextResponse.json({
      success: true,
      message: 'Feedback marked as reviewed'
    })
  } catch (error: any) {
    console.error('[Analytics API] Feedback update error:', error)
    return NextResponse.json(
      { error: 'Failed to update feedback', details: error.message },
      { status: 500 }
    )
  }
}
