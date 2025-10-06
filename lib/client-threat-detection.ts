/**
 * Client-Side Threat Detection Integration
 * This module handles threat detection when saving conversations to localStorage
 */

import { analyzeThreatPatterns } from './threat-detection'
import { addAlertToConversation, type ThreatAlert, type Message } from './simple-auth'

/**
 * Analyze messages and add alerts to conversation if suspicious patterns detected
 * This runs client-side when saving conversations
 */
export function analyzeAndFlagConversation(
  conversationId: string,
  messages: Message[]
): void {
  // Only analyze user messages (not assistant responses)
  const userMessages = messages.filter(m => m.role === 'user')

  userMessages.forEach((message, index) => {
    const analysis = analyzeThreatPatterns(message.content)

    if (analysis.isSuspicious && analysis.matches.length > 0) {
      // Create alerts for each match
      analysis.matches.forEach(match => {
        const alert: ThreatAlert = {
          pattern: match.pattern,
          severity: match.severity,
          category: match.category,
          timestamp: message.timestamp instanceof Date
            ? message.timestamp.getTime()
            : new Date(message.timestamp).getTime(),
          messageIndex: messages.indexOf(message),
          highlightedText: match.matchedText,
          riskScore: analysis.riskScore
        }

        // Add alert to conversation (silent - user won't see this)
        addAlertToConversation(conversationId, alert)
      })

      // Log for debugging (admin can see this in console)
      console.log(`[Threat Detection] Suspicious pattern detected in conversation ${conversationId}:`, {
        severity: analysis.severity,
        riskScore: analysis.riskScore,
        categories: analysis.categories,
        matchCount: analysis.matches.length
      })
    }
  })
}

/**
 * Check if a single message contains suspicious patterns
 * Returns true if suspicious, false otherwise
 */
export function isMessageSuspicious(messageContent: string): boolean {
  const analysis = analyzeThreatPatterns(messageContent)
  return analysis.isSuspicious
}

/**
 * Get threat analysis for a message (for admin use)
 */
export function getMessageThreatAnalysis(messageContent: string) {
  return analyzeThreatPatterns(messageContent)
}
