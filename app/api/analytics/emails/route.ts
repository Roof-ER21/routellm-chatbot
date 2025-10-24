import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Email Generation Analytics
 * GET /api/analytics/emails
 *
 * Query params:
 * - start_date: ISO date string (default: 30 days ago)
 * - end_date: ISO date string (default: now)
 * - rep_name: Filter by specific rep
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const repName = searchParams.get('rep_name')

    // Build where clause
    let whereClause = 'WHERE created_at >= $1 AND created_at <= $2'
    const params: any[] = [startDate, endDate]

    if (repName) {
      whereClause += ' AND rep_name = $3'
      params.push(repName)
    }

    // Total stats
    const totalStats = await query(`
      SELECT
        COUNT(*) as total_generated,
        COUNT(*) FILTER (WHERE was_copied) as total_copied,
        COUNT(*) FILTER (WHERE was_sent) as total_sent,
        AVG(generation_time_ms) as avg_generation_time,
        COUNT(*) FILTER (WHERE regeneration_count > 0) as regenerated_emails,
        COUNT(DISTINCT rep_name) as unique_reps,
        SUM(regeneration_count) as total_regenerations,
        AVG(character_count) as avg_email_length
      FROM email_generation_analytics
      ${whereClause}
    `, params)

    // By template
    const byTemplate = await query(`
      SELECT
        template_name,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE was_copied) as copied_count,
        COUNT(*) FILTER (WHERE was_sent) as sent_count,
        AVG(generation_time_ms) as avg_time
      FROM email_generation_analytics
      ${whereClause}
      GROUP BY template_name
      ORDER BY count DESC
      LIMIT 20
    `, params)

    // By type
    const byType = await query(`
      SELECT
        template_type,
        recipient_type,
        COUNT(*) as count
      FROM email_generation_analytics
      ${whereClause}
      GROUP BY template_type, recipient_type
    `, params)

    // Trends (daily) - last 30 days
    const trends = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as generated,
        COUNT(*) FILTER (WHERE was_copied) as copied,
        COUNT(*) FILTER (WHERE was_sent) as sent
      FROM email_generation_analytics
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `, params)

    // Recommendation stats
    const recommendationStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE was_recommended) as times_recommended,
        COUNT(*) FILTER (WHERE user_accepted_recommendation) as times_accepted,
        AVG(recommendation_confidence) as avg_confidence
      FROM email_generation_analytics
      ${whereClause}
    `, params)

    // Document analysis stats
    const documentStats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE had_pdf_upload) as emails_with_pdf,
        AVG(pdf_pages_analyzed) as avg_pages_analyzed
      FROM email_generation_analytics
      ${whereClause}
    `, params)

    // Calculate success rates
    const totalGen = parseInt(totalStats.rows[0]?.total_generated) || 0
    const copyRate = totalGen > 0
      ? ((parseInt(totalStats.rows[0]?.total_copied) / totalGen) * 100).toFixed(2)
      : '0.00'

    const recommendationAcceptanceRate = parseInt(recommendationStats.rows[0]?.times_recommended) > 0
      ? ((parseInt(recommendationStats.rows[0]?.times_accepted) / parseInt(recommendationStats.rows[0]?.times_recommended)) * 100).toFixed(2)
      : '0.00'

    return NextResponse.json({
      success: true,
      data: {
        total: {
          ...totalStats.rows[0],
          copy_rate: copyRate
        },
        byTemplate: byTemplate.rows,
        byType: byType.rows,
        trends: trends.rows,
        recommendations: {
          ...recommendationStats.rows[0],
          acceptance_rate: recommendationAcceptanceRate
        },
        documents: documentStats.rows[0]
      }
    })
  } catch (error: any) {
    console.error('[Analytics API] Email analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email analytics', details: error.message },
      { status: 500 }
    )
  }
}
