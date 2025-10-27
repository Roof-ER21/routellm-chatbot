/**
 * Citation Tracking System for Susan AI-21
 *
 * Automatically tracks which knowledge base documents are used in responses
 * and injects numbered citations into the response text.
 *
 * Features:
 * - Automatic citation detection from KB documents
 * - Superscript citation numbers in responses
 * - Citation metadata for tooltip/navigation
 * - Deduplication of repeated citations
 */

import { InsuranceKBDocument } from './insurance-argumentation-kb'

export interface Citation {
  number: string // Changed to string for grouped format like "1.1", "2.3"
  categoryNumber: number // The category group number (1, 2, 3, etc.)
  documentNumber: number // The document number within the category
  documentId: string
  documentTitle: string
  category: string
  snippet: string // The specific text that was cited
  preview: string // First 100 characters for tooltip
  metadata?: {
    states?: string[]
    success_rate?: number
    code_citations?: string[]
    confidence_level?: 'high' | 'medium' | 'low'
  }
}

export interface CitedResponse {
  text: string // Original response text with citations injected
  citations: Citation[] // Array of all citations used
}

// Map category types to group numbers for citation numbering
const CATEGORY_TO_GROUP: Record<string, number> = {
  'building_codes': 1,
  'pushback': 2,
  'warranties': 3,
  'manufacturer_specs': 4,
  'email_templates': 5,
  'sales_scripts': 6,
  'agreements': 7,
  'training': 8, // Training docs are cited but noted below
  'licenses': 9,
  'photo_examples': 10
}

/**
 * Tracks citations from knowledge base documents in a response
 * Uses grouped sub-numbering: [1.1], [1.2], [2.1], [2.2], [3.1], etc.
 * Where first number = category group, second number = document within group
 */
export class CitationTracker {
  private citations: Map<string, Citation> = new Map()
  private categoryCounters: Map<number, number> = new Map() // Track counter per category group

  /**
   * Add a citation for a specific document
   * Returns the citation number in format "1.1", "2.3", etc.
   */
  addCitation(document: InsuranceKBDocument, snippet?: string): string {
    // Check if this document already has a citation
    if (this.citations.has(document.id)) {
      return this.citations.get(document.id)!.number
    }

    // Get category group number
    const categoryNumber = CATEGORY_TO_GROUP[document.category] || 99

    // Get or initialize counter for this category
    const currentCount = this.categoryCounters.get(categoryNumber) || 0
    const documentNumber = currentCount + 1
    this.categoryCounters.set(categoryNumber, documentNumber)

    // Create citation number in format "1.1", "2.3", etc.
    const citationNumber = `${categoryNumber}.${documentNumber}`

    // Create preview (first 100 characters of content or summary)
    const previewText = document.content.substring(0, 100).trim()
    const preview = previewText.length === 100 ? previewText + '...' : previewText

    // Create new citation
    const citation: Citation = {
      number: citationNumber,
      categoryNumber,
      documentNumber,
      documentId: document.id,
      documentTitle: document.title,
      category: document.category,
      snippet: snippet || document.summary.substring(0, 200),
      preview,
      metadata: {
        states: document.metadata.states,
        success_rate: document.metadata.success_rate,
        code_citations: document.metadata.code_citations,
        confidence_level: document.metadata.confidence_level
      }
    }

    this.citations.set(document.id, citation)
    return citation.number
  }

  /**
   * Get all citations as an array, sorted by category then document number
   */
  getCitations(): Citation[] {
    return Array.from(this.citations.values()).sort((a, b) => {
      // Sort by category number first
      if (a.categoryNumber !== b.categoryNumber) {
        return a.categoryNumber - b.categoryNumber
      }
      // Then by document number within category
      return a.documentNumber - b.documentNumber
    })
  }

  /**
   * Get citation count
   */
  getCount(): number {
    return this.citations.size
  }

  /**
   * Get citation by document ID
   */
  getCitationByDocumentId(documentId: string): Citation | undefined {
    return this.citations.get(documentId)
  }

  /**
   * Reset all citations
   */
  reset(): void {
    this.citations.clear()
    this.categoryCounters.clear()
  }
}

/**
 * Inject citation markers into response text
 *
 * Detects code citations (e.g., "IRC R908.3") and other key phrases,
 * then adds bracketed citation numbers like [1.1], [2.3], etc.
 *
 * EXCLUDES training documents (category: 'training') from citations.
 *
 * @param responseText - The AI response text
 * @param documents - Array of KB documents that were used
 * @returns CitedResponse with citations injected
 */
export function injectCitations(
  responseText: string,
  documents: InsuranceKBDocument[]
): CitedResponse {
  const tracker = new CitationTracker()
  let citedText = responseText

  // Filter out training documents - they should NOT be cited
  const citableDocuments = documents.filter(doc =>
    doc.category !== 'training'
  )

  // Create a map of code citations to documents
  const codeCitationMap = new Map<string, InsuranceKBDocument>()
  citableDocuments.forEach(doc => {
    if (doc.metadata.code_citations) {
      doc.metadata.code_citations.forEach(code => {
        codeCitationMap.set(code, doc)
      })
    }
  })

  // Pattern 1: Building code citations (IRC R908.3, IRC 1511.3.1.1, etc.)
  const codePattern = /(IRC|IBC|VA Code|MD IRC|PA)\s+[R]?[\d.]+/gi
  citedText = citedText.replace(codePattern, (match) => {
    // Find matching document
    const doc = codeCitationMap.get(match) || citableDocuments.find(d =>
      d.metadata.code_citations?.some(code =>
        code.toLowerCase() === match.toLowerCase()
      )
    )

    if (doc) {
      const citationNum = tracker.addCitation(doc, match)
      return `${match} [${citationNum}]`
    }
    return match
  })

  // Pattern 2: GAF manufacturer references
  const gafPattern = /(GAF\s+(?:Storm Damage|Silver Pledge|Golden Pledge|manufacturer|guidelines?))/gi
  citedText = citedText.replace(gafPattern, (match) => {
    const doc = citableDocuments.find(d =>
      d.category === 'manufacturer_specs' || d.category === 'warranties'
    )
    if (doc) {
      const citationNum = tracker.addCitation(doc, match)
      return `${match} [${citationNum}]`
    }
    return match
  })

  // Pattern 3: Maryland Bulletin 18-23
  const marylandBulletinPattern = /(Maryland (?:Insurance Administration )?Bulletin 18-23|MD Bulletin 18-23)/gi
  citedText = citedText.replace(marylandBulletinPattern, (match) => {
    const doc = citableDocuments.find(d => d.id === 'MD_BULLETIN_18_23')
    if (doc) {
      const citationNum = tracker.addCitation(doc, match)
      return `${match} [${citationNum}]`
    }
    return match
  })

  // Pattern 4: State regulations (Maryland Code, Virginia Code, etc.)
  const stateCodePattern = /((?:Maryland|Virginia|Pennsylvania) Code § [\d-]+)/gi
  citedText = citedText.replace(stateCodePattern, (match) => {
    const doc = citableDocuments.find(d =>
      d.content.toLowerCase().includes(match.toLowerCase())
    )
    if (doc) {
      const citationNum = tracker.addCitation(doc, match)
      return `${match} [${citationNum}]`
    }
    return match
  })

  // Pattern 5: Warranty references
  const warrantyPattern = /((?:Silver|Golden) Pledge (?:Limited )?Warranty)/gi
  citedText = citedText.replace(warrantyPattern, (match) => {
    const doc = citableDocuments.find(d =>
      d.title.toLowerCase().includes(match.toLowerCase())
    )
    if (doc) {
      const citationNum = tracker.addCitation(doc, match)
      return `${match} [${citationNum}]`
    }
    return match
  })

  // Pattern 6: General document title matching (for remaining documents)
  // If a document was provided but not yet cited, add it at relevant sections
  citableDocuments.forEach(doc => {
    if (!tracker.getCitationByDocumentId(doc.id)) {
      // Look for key phrases from the document in the response
      const keyPhrases = [
        ...doc.keywords.slice(0, 3),
        doc.title.split(' ').slice(0, 3).join(' ')
      ]

      keyPhrases.forEach(phrase => {
        const phrasePattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (phrasePattern.test(citedText) && !tracker.getCitationByDocumentId(doc.id)) {
          // Add citation at first occurrence
          citedText = citedText.replace(phrasePattern, (match) => {
            const citationNum = tracker.addCitation(doc, match)
            return `${match} [${citationNum}]`
          })
        }
      })
    }
  })

  return {
    text: citedText,
    citations: tracker.getCitations()
  }
}

/**
 * Extract code citations from response text
 * Useful for identifying which codes are being referenced
 */
export function extractCodeCitations(text: string): string[] {
  const codePattern = /(IRC|IBC|VA Code|MD IRC|PA)\s+[R]?[\d.]+/gi
  const matches = text.match(codePattern) || []
  return [...new Set(matches)] // Deduplicate
}

/**
 * Format citation for display
 */
export function formatCitationTooltip(citation: Citation): string {
  let tooltip = `${citation.documentTitle}\n\n`
  tooltip += `Category: ${citation.category}\n`

  if (citation.metadata?.success_rate) {
    tooltip += `Success Rate: ${citation.metadata.success_rate}%\n`
  }

  if (citation.metadata?.confidence_level) {
    tooltip += `Confidence Level: ${citation.metadata.confidence_level}\n`
  }

  if (citation.metadata?.states && citation.metadata.states.length > 0) {
    tooltip += `States: ${citation.metadata.states.join(', ')}\n`
  }

  tooltip += `\n${citation.snippet}`

  return tooltip
}

/**
 * Generate Knowledge Base URL with anchor to specific document
 * Note: This will be handled by Next.js router navigation with scroll behavior
 */
export function getCitationUrl(citation: Citation): string {
  return `/knowledge-base?doc=${citation.documentId}`
}

/**
 * Convert citations to JSON for API responses
 */
export function citationsToJSON(citations: Citation[]): string {
  return JSON.stringify(citations, null, 2)
}

/**
 * Parse citations from JSON
 */
export function citationsFromJSON(json: string): Citation[] {
  try {
    return JSON.parse(json)
  } catch (error) {
    console.error('Failed to parse citations JSON:', error)
    return []
  }
}
