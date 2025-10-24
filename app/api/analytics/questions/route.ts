import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

/**
 * Question Analytics
 * GET /api/analytics/questions
 *
 * Returns:
 * - Top asked questions
 * - Questions by category
 * - Questions flagged as wrong
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Top questions (by frequency)
    const topQuestions = await query(`
      SELECT
        question_text,
        question_category,
        COUNT(*) as ask_count,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
        COUNT(*) FILTER (WHERE was_helpful = false) as not_helpful_count,
        COUNT(*) FILTER (WHERE flagged_as_wrong = true) as wrong_count,
        MAX(asked_at) as last_asked
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY question_hash, question_text, question_category
      ORDER BY ask_count DESC
      LIMIT 50
    `)

    // Questions by category
    const byCategory = await query(`
      SELECT
        question_category,
        COUNT(*) as count,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY question_category
      ORDER BY count DESC
    `)

    // Questions flagged as wrong (actionable items!)
    const flaggedWrong = await query(`
      SELECT
        question_text,
        response_text,
        user_correction,
        rep_name,
        asked_at,
        question_category
      FROM question_analytics
      WHERE flagged_as_wrong = true
        AND asked_at >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY asked_at DESC
      LIMIT 50
    `)

    // Questions with no helpful feedback (potential issues)
    const problematicQuestions = await query(`
      SELECT
        question_text,
        question_category,
        COUNT(*) as ask_count,
        COUNT(*) FILTER (WHERE was_helpful = false) as not_helpful_count
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY question_hash, question_text, question_category
      HAVING COUNT(*) FILTER (WHERE was_helpful = false) >= 2
      ORDER BY not_helpful_count DESC
      LIMIT 20
    `)

    // Provider performance
    const providerStats = await query(`
      SELECT
        response_provider,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND response_provider IS NOT NULL
      GROUP BY response_provider
      ORDER BY request_count DESC
    `)

    return NextResponse.json({
      success: true,
      data: {
        topQuestions: topQuestions.rows,
        byCategory: byCategory.rows,
        flaggedWrong: flaggedWrong.rows,
        problematicQuestions: problematicQuestions.rows,
        providerStats: providerStats.rows
      }
    })
  } catch (error: any) {
    console.error('[Analytics API] Questions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch question analytics', details: error.message },
      { status: 500 }
    )
  }
}
