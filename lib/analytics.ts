/**
 * SUSAN AI ANALYTICS LIBRARY
 *
 * Comprehensive event tracking and analytics functions
 * Used throughout the application to track user interactions,
 * system performance, and business metrics
 */

import sql from './railway-db'
import crypto from 'crypto'

// ================================================
// TYPE DEFINITIONS
// ================================================

export interface AnalyticsEvent {
  eventType: string
  eventCategory: string
  eventSubcategory?: string
  repId?: number
  repName: string
  sessionId?: number
  eventData?: Record<string, any>
  userAgent?: string
  ipAddress?: string
  deviceType?: string
}

export interface EmailGenerationEvent {
  repId?: number
  repName: string
  sessionId?: number
  sentEmailId?: number
  templateId?: string
  templateName?: string
  templateType?: 'rep_sent' | 'customer_sent'
  recipientType?: 'insurance' | 'homeowner' | 'adjuster'
  wasRecommended?: boolean
  recommendationConfidence?: number
  userAcceptedRecommendation?: boolean
  argumentsSelected?: string[]
  hadPdfUpload?: boolean
  pdfPagesAnalyzed?: number
  documentAnalysisSummary?: string
  generationTimeMs?: number
  characterCount?: number
  wordCount?: number
  wasCopied?: boolean
  wasSent?: boolean
  regenerationCount?: number
  userRating?: 'positive' | 'negative' | 'neutral'
  userFeedbackText?: string
}

export interface QuestionEvent {
  questionText: string
  repName: string
  sessionId?: number
  responseText?: string
  responseTimeMs?: number
  responseProvider?: string
  templatesSuggested?: string[]
  templateWasUsed?: boolean
  wasHelpful?: boolean
  userCorrection?: string
  flaggedAsWrong?: boolean
}

export interface FeedbackEvent {
  repId?: number
  repName: string
  sessionId?: number
  messageId?: number
  feedbackType: 'helpful' | 'not_helpful' | 'wrong_answer' | 'correction' | 'feature_request'
  severity?: 'low' | 'medium' | 'high' | 'critical'
  originalQuestion?: string
  susanResponse?: string
  userComment?: string
  userCorrection?: string
  category?: 'accuracy' | 'relevance' | 'formatting' | 'feature' | 'other'
}

export interface PerformanceMetric {
  metricType: string
  responseTimeMs: number
  success: boolean
  errorMessage?: string
  providerUsed?: string
  failoverOccurred?: boolean
  repName?: string
  sessionId?: number
}

// ================================================
// CORE TRACKING FUNCTIONS
// ================================================

/**
 * Track a generic analytics event
 * Most flexible function - can track any type of event
 */
export async function trackEvent(event: AnalyticsEvent): Promise<number | null> {
  try {
    const result = await sql`
      INSERT INTO analytics_events (
        event_type,
        event_category,
        event_subcategory,
        rep_id,
        rep_name,
        session_id,
        event_data,
        user_agent,
        ip_address,
        device_type,
        created_at
      )
      VALUES (
        ${event.eventType},
        ${event.eventCategory},
        ${event.eventSubcategory || null},
        ${event.repId || null},
        ${event.repName},
        ${event.sessionId || null},
        ${JSON.stringify(event.eventData || {})},
        ${event.userAgent || null},
        ${event.ipAddress || null},
        ${event.deviceType || null},
        NOW()
      )
      RETURNING id
    `

    return result.rows[0]?.id || null
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error)
    return null
  }
}

/**
 * Track email generation with full details
 * Called whenever an email is generated, copied, or sent
 */
export async function trackEmailGeneration(event: EmailGenerationEvent): Promise<number | null> {
  try {
    const result = await sql`
      INSERT INTO email_generation_analytics (
        rep_id,
        rep_name,
        session_id,
        sent_email_id,
        template_id,
        template_name,
        template_type,
        recipient_type,
        was_recommended,
        recommendation_confidence,
        user_accepted_recommendation,
        arguments_selected,
        arguments_count,
        had_pdf_upload,
        pdf_pages_analyzed,
        document_analysis_summary,
        generation_time_ms,
        character_count,
        word_count,
        was_copied,
        was_sent,
        regeneration_count,
        user_rating,
        user_feedback_text,
        created_at
      )
      VALUES (
        ${event.repId || null},
        ${event.repName},
        ${event.sessionId || null},
        ${event.sentEmailId || null},
        ${event.templateId || null},
        ${event.templateName || null},
        ${event.templateType || null},
        ${event.recipientType || null},
        ${event.wasRecommended || false},
        ${event.recommendationConfidence || null},
        ${event.userAcceptedRecommendation || null},
        ${event.argumentsSelected || []},
        ${event.argumentsSelected?.length || 0},
        ${event.hadPdfUpload || false},
        ${event.pdfPagesAnalyzed || null},
        ${event.documentAnalysisSummary || null},
        ${event.generationTimeMs || null},
        ${event.characterCount || null},
        ${event.wordCount || null},
        ${event.wasCopied || false},
        ${event.wasSent || false},
        ${event.regenerationCount || 0},
        ${event.userRating || null},
        ${event.userFeedbackText || null},
        NOW()
      )
      RETURNING id
    `

    // Update session email count
    if (event.sessionId) {
      await sql`
        UPDATE chat_sessions
        SET emails_generated = emails_generated + 1
        WHERE id = ${event.sessionId}
      `
    }

    return result.rows[0]?.id || null
  } catch (error) {
    console.error('[Analytics] Error tracking email generation:', error)
    return null
  }
}

/**
 * Update email generation event (e.g., when copied or sent)
 */
export async function updateEmailGeneration(
  emailGenId: number,
  updates: Partial<EmailGenerationEvent>
): Promise<boolean> {
  try {
    const setClauses = []
    const values: any[] = []
    let paramCount = 1

    if (updates.wasCopied !== undefined) {
      setClauses.push(`was_copied = $${paramCount}, copied_at = NOW()`)
      values.push(updates.wasCopied)
      paramCount++
    }

    if (updates.wasSent !== undefined) {
      setClauses.push(`was_sent = $${paramCount}, sent_at = NOW()`)
      values.push(updates.wasSent)
      paramCount++
    }

    if (updates.regenerationCount !== undefined) {
      setClauses.push(`regeneration_count = $${paramCount}`)
      values.push(updates.regenerationCount)
      paramCount++
    }

    if (updates.userRating !== undefined) {
      setClauses.push(`user_rating = $${paramCount}`)
      values.push(updates.userRating)
      paramCount++
    }

    if (updates.userFeedbackText !== undefined) {
      setClauses.push(`user_feedback_text = $${paramCount}`)
      values.push(updates.userFeedbackText)
      paramCount++
    }

    if (setClauses.length === 0) return true

    const query = `
      UPDATE email_generation_analytics
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
    `
    values.push(emailGenId)

    const { query: dbQuery } = await import('./railway-db')
    await dbQuery(query, values)

    return true
  } catch (error) {
    console.error('[Analytics] Error updating email generation:', error)
    return false
  }
}

/**
 * Track a question and its response
 */
export async function trackQuestion(event: QuestionEvent): Promise<number | null> {
  try {
    // Create hash for deduplication
    const questionHash = crypto
      .createHash('sha256')
      .update(event.questionText.toLowerCase().trim())
      .digest('hex')

    // Auto-categorize question (basic implementation)
    const category = categorizeQuestion(event.questionText)

    const result = await sql`
      INSERT INTO question_analytics (
        question_text,
        question_hash,
        question_category,
        rep_name,
        session_id,
        response_text,
        response_time_ms,
        response_provider,
        templates_suggested,
        template_was_used,
        was_helpful,
        user_correction,
        flagged_as_wrong,
        asked_at
      )
      VALUES (
        ${event.questionText},
        ${questionHash},
        ${category},
        ${event.repName},
        ${event.sessionId || null},
        ${event.responseText || null},
        ${event.responseTimeMs || null},
        ${event.responseProvider || null},
        ${event.templatesSuggested || []},
        ${event.templateWasUsed || false},
        ${event.wasHelpful || null},
        ${event.userCorrection || null},
        ${event.flaggedAsWrong || false},
        NOW()
      )
      RETURNING id
    `

    return result.rows[0]?.id || null
  } catch (error) {
    console.error('[Analytics] Error tracking question:', error)
    return null
  }
}

/**
 * Track user feedback
 */
export async function trackFeedback(event: FeedbackEvent): Promise<number | null> {
  try {
    const result = await sql`
      INSERT INTO user_feedback (
        rep_id,
        rep_name,
        session_id,
        message_id,
        feedback_type,
        severity,
        original_question,
        susan_response,
        user_comment,
        user_correction,
        category,
        created_at
      )
      VALUES (
        ${event.repId || null},
        ${event.repName},
        ${event.sessionId || null},
        ${event.messageId || null},
        ${event.feedbackType},
        ${event.severity || 'low'},
        ${event.originalQuestion || null},
        ${event.susanResponse || null},
        ${event.userComment || null},
        ${event.userCorrection || null},
        ${event.category || 'other'},
        NOW()
      )
      RETURNING id
    `

    return result.rows[0]?.id || null
  } catch (error) {
    console.error('[Analytics] Error tracking feedback:', error)
    return null
  }
}

/**
 * Track performance metrics
 */
export async function trackPerformance(metric: PerformanceMetric): Promise<number | null> {
  try {
    const result = await sql`
      INSERT INTO performance_metrics (
        metric_type,
        response_time_ms,
        success,
        error_message,
        provider_used,
        failover_occurred,
        rep_name,
        session_id,
        measured_at
      )
      VALUES (
        ${metric.metricType},
        ${metric.responseTimeMs},
        ${metric.success},
        ${metric.errorMessage || null},
        ${metric.providerUsed || null},
        ${metric.failoverOccurred || false},
        ${metric.repName || null},
        ${metric.sessionId || null},
        NOW()
      )
      RETURNING id
    `

    return result.rows[0]?.id || null
  } catch (error) {
    console.error('[Analytics] Error tracking performance:', error)
    return null
  }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(
  featureName: string,
  repName: string,
  featureCategory?: string,
  durationSeconds?: number,
  success: boolean = true,
  loadTimeMs?: number
): Promise<boolean> {
  try {
    await sql`
      INSERT INTO feature_usage_analytics (
        feature_name,
        feature_category,
        rep_name,
        times_accessed,
        average_session_duration_seconds,
        success_count,
        error_count,
        average_load_time_ms,
        last_used_at,
        updated_at
      )
      VALUES (
        ${featureName},
        ${featureCategory || null},
        ${repName},
        1,
        ${durationSeconds || 0},
        ${success ? 1 : 0},
        ${success ? 0 : 1},
        ${loadTimeMs || 0},
        NOW(),
        NOW()
      )
      ON CONFLICT (feature_name, rep_name)
      DO UPDATE SET
        times_accessed = feature_usage_analytics.times_accessed + 1,
        average_session_duration_seconds = (
          (feature_usage_analytics.average_session_duration_seconds * feature_usage_analytics.times_accessed) +
          ${durationSeconds || 0}
        ) / (feature_usage_analytics.times_accessed + 1),
        success_count = feature_usage_analytics.success_count + ${success ? 1 : 0},
        error_count = feature_usage_analytics.error_count + ${success ? 0 : 1},
        average_load_time_ms = (
          (feature_usage_analytics.average_load_time_ms * feature_usage_analytics.times_accessed) +
          ${loadTimeMs || 0}
        ) / (feature_usage_analytics.times_accessed + 1),
        last_used_at = NOW(),
        updated_at = NOW()
    `

    return true
  } catch (error) {
    console.error('[Analytics] Error tracking feature usage:', error)
    return false
  }
}

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Simple question categorization
 * Can be enhanced with ML/NLP in the future
 */
function categorizeQuestion(question: string): string {
  const lowerQuestion = question.toLowerCase()

  // Insurance-related
  if (
    lowerQuestion.includes('insurance') ||
    lowerQuestion.includes('claim') ||
    lowerQuestion.includes('adjuster') ||
    lowerQuestion.includes('denial')
  ) {
    return 'insurance'
  }

  // Email/communication
  if (
    lowerQuestion.includes('email') ||
    lowerQuestion.includes('letter') ||
    lowerQuestion.includes('write') ||
    lowerQuestion.includes('communicate')
  ) {
    return 'communication'
  }

  // Technical/roofing
  if (
    lowerQuestion.includes('roof') ||
    lowerQuestion.includes('shingle') ||
    lowerQuestion.includes('damage') ||
    lowerQuestion.includes('repair')
  ) {
    return 'roofing_technical'
  }

  // Process/procedure
  if (
    lowerQuestion.includes('how to') ||
    lowerQuestion.includes('process') ||
    lowerQuestion.includes('procedure') ||
    lowerQuestion.includes('steps')
  ) {
    return 'process'
  }

  // Pricing/estimates
  if (
    lowerQuestion.includes('price') ||
    lowerQuestion.includes('cost') ||
    lowerQuestion.includes('estimate') ||
    lowerQuestion.includes('quote')
  ) {
    return 'pricing'
  }

  // Storm/weather
  if (
    lowerQuestion.includes('storm') ||
    lowerQuestion.includes('hail') ||
    lowerQuestion.includes('wind') ||
    lowerQuestion.includes('weather')
  ) {
    return 'weather'
  }

  return 'general'
}

/**
 * Get device type from user agent
 */
export function getDeviceType(userAgent?: string): string {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile'
  }

  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet'
  }

  return 'desktop'
}

/**
 * Calculate word count from text
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length
}

// ================================================
// BATCH TRACKING (FOR PERFORMANCE)
// ================================================

interface BatchedEvent {
  event: AnalyticsEvent
  timestamp: number
}

class EventBatcher {
  private events: BatchedEvent[] = []
  private batchSize: number = 50
  private flushInterval: number = 30000 // 30 seconds
  private timer: NodeJS.Timeout | null = null

  constructor() {
    this.startTimer()
  }

  add(event: AnalyticsEvent) {
    this.events.push({
      event,
      timestamp: Date.now()
    })

    if (this.events.length >= this.batchSize) {
      this.flush()
    }
  }

  private startTimer() {
    if (this.timer) clearTimeout(this.timer)

    this.timer = setTimeout(() => {
      this.flush()
      this.startTimer()
    }, this.flushInterval)
  }

  async flush() {
    if (this.events.length === 0) return

    const eventsToFlush = [...this.events]
    this.events = []

    try {
      // Batch insert all events
      await Promise.all(eventsToFlush.map(e => trackEvent(e.event)))
      console.log(`[Analytics] Flushed ${eventsToFlush.length} events`)
    } catch (error) {
      console.error('[Analytics] Error flushing events:', error)
      // Re-add failed events
      this.events = [...eventsToFlush, ...this.events]
    }
  }
}

// Export singleton batcher
export const eventBatcher = new EventBatcher()

// ================================================
// CONVENIENCE FUNCTIONS (HIGH-LEVEL)
// ================================================

/**
 * Track chat message sent by user
 */
export async function trackChatMessage(
  repName: string,
  sessionId: number,
  messageLength: number,
  mode?: 'text' | 'voice' | 'education' | 'hands_free'
) {
  return trackEvent({
    eventType: 'chat_message_sent',
    eventCategory: 'chat',
    eventSubcategory: mode || 'text',
    repName,
    sessionId,
    eventData: {
      message_length: messageLength,
      mode
    }
  })
}

/**
 * Track chat response from Susan AI
 */
export async function trackChatResponse(
  repName: string,
  sessionId: number,
  responseTimeMs: number,
  provider: string,
  responseLength: number,
  model?: string
) {
  return trackEvent({
    eventType: 'chat_response_received',
    eventCategory: 'chat',
    repName,
    sessionId,
    eventData: {
      response_time_ms: responseTimeMs,
      provider,
      response_length: responseLength,
      model
    }
  })
}

/**
 * Track PDF upload
 */
export async function trackPdfUpload(
  repName: string,
  sessionId: number,
  fileSize: number,
  pageCount: number,
  success: boolean,
  errorMessage?: string
) {
  return trackEvent({
    eventType: success ? 'pdf_uploaded' : 'pdf_extraction_failed',
    eventCategory: 'document_analysis',
    repName,
    sessionId,
    eventData: {
      file_size: fileSize,
      page_count: pageCount,
      success,
      error: errorMessage
    }
  })
}

/**
 * Track template selection
 */
export async function trackTemplateSelection(
  repName: string,
  sessionId: number,
  templateId: string,
  templateName: string,
  wasRecommended: boolean,
  userOverride: boolean
) {
  return trackEvent({
    eventType: 'template_selected',
    eventCategory: 'email_generation',
    repName,
    sessionId,
    eventData: {
      template_id: templateId,
      template_name: templateName,
      was_recommended: wasRecommended,
      user_override: userOverride
    }
  })
}

/**
 * Track mode change (education mode, hands-free, etc.)
 */
export async function trackModeChange(
  repName: string,
  sessionId: number,
  modeFrom: string,
  modeTo: string
) {
  return trackEvent({
    eventType: 'mode_changed',
    eventCategory: 'user_preference',
    repName,
    sessionId,
    eventData: {
      mode_from: modeFrom,
      mode_to: modeTo
    }
  })
}

// ================================================
// EXPORTS
// ================================================

export default {
  trackEvent,
  trackEmailGeneration,
  updateEmailGeneration,
  trackQuestion,
  trackFeedback,
  trackPerformance,
  trackFeatureUsage,
  trackChatMessage,
  trackChatResponse,
  trackPdfUpload,
  trackTemplateSelection,
  trackModeChange,
  getDeviceType,
  wordCount,
  eventBatcher
}
