/**
 * Citation Lookup API
 *
 * Provides detailed information about specific citations
 * Used for tooltips and navigation to Knowledge Base
 *
 * Supports grouped sub-numbering format: [1.1], [1.2], [2.1], [3.1], etc.
 */

import { NextRequest, NextResponse } from 'next/server'
import { INSURANCE_KB_DOCUMENTS } from '@/lib/insurance-argumentation-kb'
import { getCitationUrl } from '@/lib/citation-tracker'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId parameter is required', success: false },
        { status: 400 }
      )
    }

    // Find the document in the knowledge base
    const document = INSURANCE_KB_DOCUMENTS.find(doc => doc.id === documentId)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found', success: false },
        { status: 404 }
      )
    }

    // Create preview (first 100 characters for tooltip)
    const previewText = document.content.substring(0, 100).trim()
    const preview = previewText.length === 100 ? previewText + '...' : previewText

    // Build citation object with preview
    const citation = {
      documentId: document.id,
      documentTitle: document.title,
      category: document.category,
      preview, // First 100 chars for tooltip
      summary: document.summary,
      snippet: document.summary.substring(0, 200),
      metadata: {
        states: document.metadata.states,
        success_rate: document.metadata.success_rate,
        code_citations: document.metadata.code_citations,
        confidence_level: document.metadata.confidence_level,
        scenarios: document.metadata.scenarios,
      },
      fullContent: document.content,
      keywords: document.keywords,
    }

    return NextResponse.json({
      success: true,
      citation,
    })
  } catch (error) {
    console.error('[Citations API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

/**
 * POST endpoint to get multiple citations at once
 * Batch fetch for efficiency when loading multiple citations
 */
export async function POST(req: NextRequest) {
  try {
    const { documentIds } = await req.json()

    if (!Array.isArray(documentIds)) {
      return NextResponse.json(
        { error: 'documentIds must be an array', success: false },
        { status: 400 }
      )
    }

    const citations = documentIds
      .map(id => {
        const document = INSURANCE_KB_DOCUMENTS.find(doc => doc.id === id)
        if (!document) return null

        // Create preview (first 100 characters)
        const previewText = document.content.substring(0, 100).trim()
        const preview = previewText.length === 100 ? previewText + '...' : previewText

        return {
          documentId: document.id,
          documentTitle: document.title,
          category: document.category,
          preview,
          summary: document.summary,
          snippet: document.summary.substring(0, 200),
          metadata: {
            states: document.metadata.states,
            success_rate: document.metadata.success_rate,
            code_citations: document.metadata.code_citations,
            confidence_level: document.metadata.confidence_level,
            scenarios: document.metadata.scenarios,
          },
          keywords: document.keywords,
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      citations,
      count: citations.length,
    })
  } catch (error) {
    console.error('[Citations API] Error in batch fetch:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
