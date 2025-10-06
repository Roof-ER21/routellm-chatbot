/**
 * Insider Threat Detection Library
 * Analyzes user messages for suspicious patterns indicating potential insider threats
 */

import threatPatterns from '../insider_threat_patterns.json'

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low'

export interface ThreatMatch {
  pattern: string
  category: string
  severity: SeverityLevel
  matchedText: string
  position: {
    start: number
    end: number
  }
}

export interface ThreatAnalysis {
  isSuspicious: boolean
  riskScore: number
  severity: SeverityLevel
  matches: ThreatMatch[]
  categories: string[]
  recommendedAction: string
}

/**
 * Normalize severity from JSON format to our standard format
 */
function normalizeSeverity(severity: string): SeverityLevel {
  const normalizedSeverity = severity.toLowerCase()

  if (normalizedSeverity === 'critical') return 'critical'
  if (normalizedSeverity === 'high') return 'high'
  if (normalizedSeverity.includes('medium')) return 'medium'
  return 'low'
}

/**
 * Calculate risk score based on matches
 */
function calculateRiskScore(matches: ThreatMatch[]): number {
  if (matches.length === 0) return 0

  const severityScores = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3
  }

  let totalScore = 0
  for (const match of matches) {
    totalScore += severityScores[match.severity]
  }

  // Cap at 100
  return Math.min(totalScore, 100)
}

/**
 * Get overall severity based on risk score
 */
function getOverallSeverity(riskScore: number): SeverityLevel {
  if (riskScore >= 90) return 'critical'
  if (riskScore >= 70) return 'high'
  if (riskScore >= 40) return 'medium'
  return 'low'
}

/**
 * Get recommended action based on risk score
 */
function getRecommendedAction(riskScore: number): string {
  if (riskScore >= 90) {
    return 'Immediate investigation, restrict access, legal review'
  }
  if (riskScore >= 70) {
    return 'Close monitoring, manager notification, access review'
  }
  if (riskScore >= 40) {
    return 'Document and monitor, periodic review'
  }
  return 'Normal monitoring, no special action'
}

/**
 * Find pattern matches in text using case-insensitive search
 */
function findPatternMatch(text: string, pattern: string): { found: boolean; position: { start: number; end: number } } | null {
  const lowerText = text.toLowerCase()
  const lowerPattern = pattern.toLowerCase()

  const index = lowerText.indexOf(lowerPattern)

  if (index !== -1) {
    return {
      found: true,
      position: {
        start: index,
        end: index + pattern.length
      }
    }
  }

  return null
}

/**
 * Analyze a message for suspicious patterns
 */
export function analyzeThreatPatterns(message: string): ThreatAnalysis {
  const matches: ThreatMatch[] = []
  const categoriesFound = new Set<string>()

  if (!message || message.trim().length === 0) {
    return {
      isSuspicious: false,
      riskScore: 0,
      severity: 'low',
      matches: [],
      categories: [],
      recommendedAction: 'Normal monitoring, no special action'
    }
  }

  // Search through all suspicious pattern categories
  for (const category of threatPatterns.suspiciousPatterns) {
    const categoryName = category.category
    const severity = normalizeSeverity(category.severity)

    // Check each pattern in the category
    for (const pattern of category.patterns) {
      const match = findPatternMatch(message, pattern)

      if (match) {
        categoriesFound.add(categoryName)

        matches.push({
          pattern,
          category: categoryName,
          severity,
          matchedText: message.substring(match.position.start, match.position.end),
          position: match.position
        })
      }
    }

    // Also check keywords for additional context
    if (category.keywords) {
      for (const keyword of category.keywords) {
        const match = findPatternMatch(message, keyword)

        if (match && !matches.some(m =>
          m.position.start === match.position.start &&
          m.position.end === match.position.end
        )) {
          categoriesFound.add(categoryName)

          // Keywords get slightly lower severity
          const keywordSeverity = severity === 'critical' ? 'high' : severity

          matches.push({
            pattern: `keyword: ${keyword}`,
            category: categoryName,
            severity: keywordSeverity,
            matchedText: message.substring(match.position.start, match.position.end),
            position: match.position
          })
        }
      }
    }
  }

  const riskScore = calculateRiskScore(matches)
  const overallSeverity = getOverallSeverity(riskScore)
  const recommendedAction = getRecommendedAction(riskScore)

  return {
    isSuspicious: matches.length > 0,
    riskScore,
    severity: overallSeverity,
    matches,
    categories: Array.from(categoriesFound),
    recommendedAction
  }
}

/**
 * Highlight suspicious text in a message
 */
export function highlightSuspiciousText(message: string, matches: ThreatMatch[]): Array<{
  text: string
  isSuspicious: boolean
  severity?: SeverityLevel
  pattern?: string
}> {
  if (matches.length === 0) {
    return [{ text: message, isSuspicious: false }]
  }

  // Sort matches by position
  const sortedMatches = [...matches].sort((a, b) => a.position.start - b.position.start)

  const segments: Array<{
    text: string
    isSuspicious: boolean
    severity?: SeverityLevel
    pattern?: string
  }> = []

  let lastIndex = 0

  for (const match of sortedMatches) {
    // Add non-suspicious text before this match
    if (match.position.start > lastIndex) {
      segments.push({
        text: message.substring(lastIndex, match.position.start),
        isSuspicious: false
      })
    }

    // Add suspicious text
    segments.push({
      text: message.substring(match.position.start, match.position.end),
      isSuspicious: true,
      severity: match.severity,
      pattern: match.pattern
    })

    lastIndex = match.position.end
  }

  // Add remaining text
  if (lastIndex < message.length) {
    segments.push({
      text: message.substring(lastIndex),
      isSuspicious: false
    })
  }

  return segments
}

/**
 * Get severity color for UI display
 */
export function getSeverityColor(severity: SeverityLevel): {
  bg: string
  border: string
  text: string
  badge: string
} {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        badge: 'bg-red-600'
      }
    case 'high':
      return {
        bg: 'bg-orange-100',
        border: 'border-orange-500',
        text: 'text-orange-800',
        badge: 'bg-orange-600'
      }
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        badge: 'bg-yellow-600'
      }
    case 'low':
      return {
        bg: 'bg-gray-100',
        border: 'border-gray-500',
        text: 'text-gray-800',
        badge: 'bg-gray-600'
      }
  }
}

/**
 * Format alert for display
 */
export function formatAlertSummary(analysis: ThreatAnalysis): string {
  if (!analysis.isSuspicious) {
    return 'No suspicious patterns detected'
  }

  const categoryList = analysis.categories.join(', ')
  const matchCount = analysis.matches.length

  return `${matchCount} suspicious pattern${matchCount > 1 ? 's' : ''} detected (${analysis.severity.toUpperCase()}): ${categoryList}`
}
