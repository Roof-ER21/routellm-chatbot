# Susan AI Analytics System - Implementation Guide

## Summary of Work Completed

### 1. System Analysis ✅
- **File:** `/Users/a21/Desktop/routellm-chatbot-railway/ANALYTICS_SYSTEM_ANALYSIS.md`
- Comprehensive analysis of current system
- Identified all tracking gaps
- Designed complete analytics architecture

### 2. Database Schema ✅
- **File:** `/Users/a21/Desktop/routellm-chatbot-railway/database/migrations/analytics_schema.sql`
- 8 new analytics tables created
- 4 materialized views for fast queries
- Triggers and helper functions
- Extended existing tables with analytics fields

### 3. Analytics Library ✅
- **File:** `/Users/a21/Desktop/routellm-chatbot-railway/lib/analytics.ts`
- Complete tracking functions for all event types
- Batch processing for performance
- Helper functions and utilities

---

## Remaining Implementation Steps

### STEP 1: Create Analytics API Endpoints

Create the following files in `/app/api/analytics/`:

#### A. Track Endpoint
**File:** `/app/api/analytics/track/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      eventType,
      eventCategory,
      eventSubcategory,
      repName,
      sessionId,
      repId,
      eventData
    } = body

    if (!eventType || !eventCategory || !repName) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, eventCategory, repName' },
        { status: 400 }
      )
    }

    const eventId = await trackEvent({
      eventType,
      eventCategory,
      eventSubcategory,
      repName,
      sessionId,
      repId,
      eventData
    })

    return NextResponse.json({
      success: true,
      eventId
    })
  } catch (error: any) {
    console.error('[Analytics API] Error tracking event:', error)
    return NextResponse.json(
      { error: 'Failed to track event', details: error.message },
      { status: 500 }
    )
  }
}
```

#### B. Dashboard Endpoint
**File:** `/app/api/analytics/dashboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

export async function GET(req: NextRequest) {
  try {
    // Get overview statistics
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

    // Email generation stats
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

    // Performance metrics
    const perfStats = await query(`
      SELECT
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE NOT success) as error_count,
        COUNT(*) as total_requests
      FROM performance_metrics
      WHERE DATE(measured_at) = CURRENT_DATE
    `)

    // Error rate calculation
    const errorRate = perfStats.rows[0]?.total_requests > 0
      ? (perfStats.rows[0].error_count / perfStats.rows[0].total_requests * 100).toFixed(2)
      : '0.00'

    // Success rate for emails
    const emailSuccessRate = emailStats.rows[0]?.total_generated > 0
      ? ((emailStats.rows[0].total_copied + emailStats.rows[0].total_sent) / emailStats.rows[0].total_generated * 100).toFixed(2)
      : '0.00'

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
          avg_response_time_ms: Math.round(perfStats.rows[0]?.avg_response_time || 0),
          error_rate: errorRate,
          email_success_rate: emailSuccessRate
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
```

#### C. Email Analytics Endpoint
**File:** `/app/api/analytics/emails/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('end_date') || new Date().toISOString()
    const repName = searchParams.get('rep_name')

    // Base query
    let whereClause = 'WHERE created_at >= $1 AND created_at <= $2'
    const params = [startDate, endDate]

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
        SUM(regeneration_count) as total_regenerations
      FROM email_generation_analytics
      ${whereClause}
    `, params)

    // By template
    const byTemplate = await query(`
      SELECT
        template_name,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE was_copied) as copied_count,
        COUNT(*) FILTER (WHERE was_sent) as sent_count
      FROM email_generation_analytics
      ${whereClause}
      GROUP BY template_name
      ORDER BY count DESC
      LIMIT 10
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

    // Trends (daily)
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

    return NextResponse.json({
      success: true,
      data: {
        total: totalStats.rows[0],
        byTemplate: byTemplate.rows,
        byType: byType.rows,
        trends: trends.rows
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
```

#### D. Questions Endpoint
**File:** `/app/api/analytics/questions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

export async function GET(req: NextRequest) {
  try {
    // Top questions
    const topQuestions = await query(`
      SELECT
        question_text,
        question_category,
        COUNT(*) as ask_count,
        AVG(response_time_ms) as avg_response_time,
        COUNT(*) FILTER (WHERE was_helpful = true) as helpful_count,
        COUNT(*) FILTER (WHERE flagged_as_wrong = true) as wrong_count
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY question_hash, question_text, question_category
      ORDER BY ask_count DESC
      LIMIT 50
    `)

    // By category
    const byCategory = await query(`
      SELECT
        question_category,
        COUNT(*) as count
      FROM question_analytics
      WHERE asked_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY question_category
      ORDER BY count DESC
    `)

    // Flagged as wrong
    const flaggedWrong = await query(`
      SELECT
        question_text,
        response_text,
        user_correction,
        rep_name,
        asked_at
      FROM question_analytics
      WHERE flagged_as_wrong = true
      ORDER BY asked_at DESC
      LIMIT 20
    `)

    return NextResponse.json({
      success: true,
      data: {
        topQuestions: topQuestions.rows,
        byCategory: byCategory.rows,
        flaggedWrong: flaggedWrong.rows
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
```

#### E. Feedback Endpoint
**File:** `/app/api/analytics/feedback/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'

export async function GET(req: NextRequest) {
  try {
    // Summary stats
    const summary = await query(`
      SELECT
        feedback_type,
        COUNT(*) as count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY feedback_type
      ORDER BY count DESC
    `)

    // By severity
    const bySeverity = await query(`
      SELECT
        severity,
        COUNT(*) as count
      FROM user_feedback
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY severity
      ORDER BY CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END
    `)

    // Recent feedback needing review
    const needsReview = await query(`
      SELECT
        id,
        rep_name,
        feedback_type,
        severity,
        original_question,
        susan_response,
        user_comment,
        user_correction,
        created_at
      FROM user_feedback
      WHERE reviewed = false
      ORDER BY severity DESC, created_at DESC
      LIMIT 50
    `)

    return NextResponse.json({
      success: true,
      data: {
        summary: summary.rows,
        bySeverity: bySeverity.rows,
        needsReview: needsReview.rows
      }
    })
  } catch (error: any) {
    console.error('[Analytics API] Feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback', details: error.message },
      { status: 500 }
    )
  }
}
```

---

### STEP 2: Run Database Migration

Create admin endpoint to run the migration:

**File:** `/app/api/admin/run-analytics-migration/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/railway-db'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    // Read migration file
    const migrationPath = path.join(process.cwd(), 'database', 'migrations', 'analytics_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    // Split into individual statements (very basic)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`[Migration] Running ${statements.length} SQL statements...`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const statement of statements) {
      try {
        await query(statement)
        successCount++
      } catch (error: any) {
        errorCount++
        errors.push(`Statement failed: ${error.message}`)
        console.error('[Migration] Statement error:', error.message)
      }
    }

    // Refresh materialized views
    try {
      await query('SELECT refresh_all_analytics_views()')
      console.log('[Migration] Materialized views refreshed')
    } catch (error: any) {
      console.warn('[Migration] Could not refresh views:', error.message)
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `Migration completed: ${successCount} successful, ${errorCount} errors`,
      successCount,
      errorCount,
      errors: errorCount > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('[Migration] Fatal error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    )
  }
}
```

---

### STEP 3: Add Tracking to Chat Route

**Modify:** `/app/api/chat/route.ts`

Add these imports at the top:
```typescript
import {
  trackChatMessage,
  trackChatResponse,
  trackPerformance
} from '@/lib/analytics'
```

Add tracking AFTER logging the user message (around line 582):
```typescript
// Track chat message (ANALYTICS)
try {
  await trackChatMessage(
    repName,
    sessionId,
    userMessage.length,
    educationMode ? 'education' : handsFreeMode ? 'hands_free' : 'text'
  )
} catch (analyticsError) {
  console.error('[Chat] Analytics tracking error:', analyticsError)
}
```

Add performance tracking BEFORE returning response (around line 620):
```typescript
// Track response performance (ANALYTICS)
try {
  await trackChatResponse(
    repName,
    sessionId,
    Date.now() - startTime, // You'll need to add: const startTime = Date.now() at function start
    aiResponse.provider,
    message.length,
    aiResponse.model
  )

  await trackPerformance({
    metricType: 'chat_response',
    responseTimeMs: Date.now() - startTime,
    success: true,
    providerUsed: aiResponse.provider,
    failoverOccurred: aiResponse.offline || false,
    repName,
    sessionId
  })
} catch (analyticsError) {
  console.error('[Chat] Analytics tracking error:', analyticsError)
}
```

---

### STEP 4: Add Tracking to EmailGenerator

**Modify:** `/app/components/EmailGenerator.tsx`

Add these imports at the top:
```typescript
import {
  trackEmailGeneration,
  trackPdfUpload,
  trackTemplateSelection,
  trackFeatureUsage,
  wordCount
} from '@/lib/analytics'
```

Add tracking in `handleGenerate` function (after successful generation):
```typescript
// Track email generation (ANALYTICS)
try {
  const emailGenId = await trackEmailGeneration({
    repName,
    sessionId,
    templateId: selectedTemplate?.template_id,
    templateName: selectedTemplate?.template_name,
    templateType: selectedTemplate?.sender,
    recipientType: emailType.toLowerCase().includes('homeowner') ? 'homeowner' : 'insurance',
    wasRecommended: !!recommendedTemplate,
    recommendationConfidence: recommendedTemplate?.confidence,
    userAcceptedRecommendation: selectedTemplate?.template_id === recommendedTemplate?.template.template_id,
    argumentsSelected: selectedArguments,
    hadPdfUpload: uploadedFiles.length > 0,
    pdfPagesAnalyzed: documentAnalysis?.pageCount,
    documentAnalysisSummary: documentAnalysis?.summary,
    generationTimeMs: generationEndTime - generationStartTime,
    characterCount: generatedEmail.body.length,
    wordCount: wordCount(generatedEmail.body),
    wasCopied: false,
    wasSent: false,
    regenerationCount: 0
  })

  // Store emailGenId for later updates (when copied/sent)
  setCurrentEmailGenId(emailGenId)
} catch (analyticsError) {
  console.error('[EmailGen] Analytics error:', analyticsError)
}
```

Add tracking in `copyToClipboard` function:
```typescript
// Track copy event (ANALYTICS)
try {
  if (currentEmailGenId) {
    await updateEmailGeneration(currentEmailGenId, {
      wasCopied: true
    })
  }

  await trackFeatureUsage('email_copy_to_clipboard', repName, 'email_generation', undefined, true)
} catch (analyticsError) {
  console.error('[EmailGen] Analytics error:', analyticsError)
}
```

Add tracking in `handleFileUpload` function (PDF upload):
```typescript
// Track PDF upload (ANALYTICS)
try {
  await trackPdfUpload(
    repName,
    sessionId,
    file.size,
    pdfResult.pageCount,
    pdfResult.success,
    pdfResult.error
  )
} catch (analyticsError) {
  console.error('[EmailGen] Analytics error:', analyticsError)
}
```

---

### STEP 5: Create Admin Analytics Dashboard

**File:** `/app/admin/analytics/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface DashboardData {
  today: { users: number; sessions: number; messages: number; emails: number }
  week: { users: number; sessions: number; messages: number }
  month: { users: number; sessions: number; messages: number }
  performance: { avg_response_time_ms: number; error_rate: string; email_success_rate: string }
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'emails' | 'questions' | 'feedback'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/dashboard')
      const data = await response.json()

      if (data.success) {
        setDashboardData(data.dashboard)
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8">Susan AI Analytics Dashboard</h1>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 uppercase">Active Users Today</div>
          <div className="text-3xl font-bold mt-2">{dashboardData?.today.users || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 uppercase">Messages Today</div>
          <div className="text-3xl font-bold mt-2">{dashboardData?.today.messages || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 uppercase">Emails Generated</div>
          <div className="text-3xl font-bold mt-2">{dashboardData?.today.emails || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 uppercase">Avg Response Time</div>
          <div className="text-3xl font-bold mt-2">{dashboardData?.performance.avg_response_time_ms || 0}ms</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            activeTab === 'emails'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Email Analytics
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            activeTab === 'questions'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-6 py-3 rounded-lg font-semibold ${
            activeTab === 'feedback'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Feedback
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">System Overview</h2>
            <p>Overview charts and statistics go here...</p>
          </div>
        )}

        {activeTab === 'emails' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Email Generation Analytics</h2>
            <p>Email analytics charts go here...</p>
          </div>
        )}

        {activeTab === 'questions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Question Analytics</h2>
            <p>Question analytics tables go here...</p>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">User Feedback</h2>
            <p>Feedback list goes here...</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Deployment Steps

### 1. Run Database Migration
1. Go to Admin Dashboard (`/admin`)
2. Navigate to Database tab
3. Click "Run Analytics Migration" button
4. Verify success message

### 2. Verify Tracking
1. Send a few test chat messages
2. Generate a test email
3. Check database tables to confirm events are being tracked

### 3. View Analytics
1. Navigate to `/admin/analytics`
2. Verify dashboard loads with data
3. Test all tabs and features

---

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Analytics library functions work
- [ ] Chat messages are tracked
- [ ] Email generation is tracked
- [ ] PDF uploads are tracked
- [ ] Template selections are tracked
- [ ] Dashboard API returns data
- [ ] Email analytics API returns data
- [ ] Questions API returns data
- [ ] Feedback API returns data
- [ ] Admin dashboard displays correctly
- [ ] Charts render properly
- [ ] No performance degradation

---

## Future Enhancements

1. **Real-time Analytics** - WebSocket updates for live dashboard
2. **Advanced Visualizations** - More chart types, heatmaps, etc.
3. **Export Functionality** - CSV/Excel export for all analytics
4. **Automated Reports** - Daily/weekly email reports
5. **Machine Learning** - Predictive analytics and recommendations
6. **A/B Testing** - Template and argument effectiveness testing
7. **User Segmentation** - Cohort analysis and user journeys
8. **Alerting** - Notifications for anomalies and issues

---

## Maintenance

### Refresh Materialized Views
Run this query periodically (or set up a cron job):
```sql
SELECT refresh_all_analytics_views();
```

### Archive Old Data
For performance, consider archiving old analytics data:
```sql
-- Example: Archive events older than 1 year
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '1 year';
```

### Monitor Database Size
Keep an eye on database growth and optimize as needed.

---

**Implementation Status:** 70% Complete ✅

**Remaining Work:**
- Complete all API endpoints
- Build full analytics dashboard UI
- Add visualization components
- Integrate tracking into all components
- Test end-to-end

**Estimated Time to Complete:** 4-6 hours
