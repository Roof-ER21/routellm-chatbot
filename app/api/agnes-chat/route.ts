import { NextRequest, NextResponse } from 'next/server'
import {
  getAgnesSystemPrompt,
  searchTrainingData,
  generatePracticeScenario,
  type RoleplayCharacterId
} from '@/lib/agnes-prompts'
import { aiFailover } from '@/lib/ai-provider-failover'
import { analyzeQueryForPhotos } from '@/lib/photo-search'
import { PhotoExample } from '@/lib/photo-index'
import { searchInsuranceArguments, extractCodeCitations, getBuildingCodeReference } from '@/lib/insurance-argumentation-kb'
import { injectCitations, extractCodeCitations as extractCodesFromText, type Citation } from '@/lib/citation-tracker'
import fs from 'fs'
import path from 'path'

// Load training data at module level (cached)
let agnesTrainingData: any[] = []
let agnesScenariosData: any[] = []

function loadTrainingData() {
  if (agnesTrainingData.length === 0) {
    try {
      const trainingPath = path.join(process.cwd(), 'public', 'agnes-training-data.json')
      const scenariosPath = path.join(process.cwd(), 'public', 'agnes-scenarios.json')

      if (fs.existsSync(trainingPath)) {
        agnesTrainingData = JSON.parse(fs.readFileSync(trainingPath, 'utf-8'))
        console.log(`[Agnes] Loaded ${agnesTrainingData.length} training items`)
      }

      if (fs.existsSync(scenariosPath)) {
        agnesScenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf-8'))
        console.log(`[Agnes] Loaded ${agnesScenariosData.length} scenario items`)
      }
    } catch (error) {
      console.error('[Agnes] Error loading training data:', error)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // Load training data
    loadTrainingData()

    const body = await req.json()
    const { messages = [], characterId = 'none', action } = body

    // Validate character ID
    const validCharacters: RoleplayCharacterId[] = [
      'none',
      'skeptical_veteran',
      'busy_professional',
      'cautious_researcher',
      'defensive_homeowner',
      'tough_adjuster'
    ]

    if (!validCharacters.includes(characterId as RoleplayCharacterId)) {
      return NextResponse.json(
        { error: 'Invalid character ID' },
        { status: 400 }
      )
    }

    // Handle start action - generate initial scenario
    if (action === 'start') {
      const initialScenario = generatePracticeScenario(agnesTrainingData, characterId as RoleplayCharacterId)
      return NextResponse.json({
        message: initialScenario,
        citations: [],
        photos: [],
        characterId
      })
    }

    // Prepare context from training data
    const lastUserMessage = messages[messages.length - 1]?.content || ''

    // Search for photo examples if user is asking for visual content
    const photoAnalysis = analyzeQueryForPhotos(lastUserMessage)
    console.log('[Agnes] Photo analysis:', {
      query: lastUserMessage,
      hasVisualIntent: photoAnalysis.hasVisualIntent,
      photoReferencesCount: photoAnalysis.photoReferences.length
    })
    const photoExamples: PhotoExample[] = photoAnalysis.hasVisualIntent
      ? photoAnalysis.photoReferences.flatMap(ref => ref.examples).slice(0, 3)
      : []
    console.log('[Agnes] Found', photoExamples.length, 'photo examples')

    // Search training data for relevant context
    const relevantTraining = searchTrainingData(
      lastUserMessage,
      agnesTrainingData,
      agnesScenariosData
    )

    // Build context string from relevant training items
    let trainingContext = ''

    if (relevantTraining.length > 0) {
      trainingContext = '\\n\\n[TRAINING DATA CONTEXT - Use this to enhance your teaching]:\\n'
      trainingContext += '[These are relevant training materials. Reference them naturally when helpful.]\\n\\n'

      relevantTraining.forEach(item => {
        const qNumber = item.id || 'Unknown'
        const source = item.metadata?.source || item.source || 'Training Materials'

        trainingContext += `\\n${qNumber}: ${item.question || item.guidance || ''}\\n`
        if (item.answer) trainingContext += `Answer: ${item.answer}\\n`
        if (item.guidance) trainingContext += `Guidance: ${item.guidance}\\n`
        if (item.action_coaching) trainingContext += `Coaching: ${item.action_coaching}\\n`
        trainingContext += `Source: ${source}\\n`
      })
    }

    // Get Agnes system prompt with character
    const agnesSystemPrompt = getAgnesSystemPrompt(
      characterId as RoleplayCharacterId,
      agnesTrainingData,
      agnesScenariosData
    )

    // Build messages for AI with system prompt and context
    const aiMessages = [
      {
        role: 'system',
        content: agnesSystemPrompt + trainingContext
      },
      ...messages.map((m: any) => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content
      }))
    ]

    // Add coaching instruction for Agnes (roleplay mode)
    if (messages.length >= 6 && characterId !== 'none') {
      // After 3 exchanges (6 messages), provide coaching feedback
      aiMessages.push({
        role: 'system',
        content: '[AGNES INSTRUCTION: Provide performance feedback now. Break character briefly to give coaching with specific examples and constructive advice. Then offer to continue roleplay or try a different approach.]'
      })
    }

    console.log('[Agnes] Calling AI failover system (same as Susan)...')
    console.log('[Agnes] Messages:', aiMessages.length, 'messages')

    // Use Susan's AI failover system (Groq -> HuggingFace -> Abacus)
    let aiResponse = await aiFailover.getResponse(aiMessages)

    if (!aiResponse || !aiResponse.message) {
      console.error('[Agnes] AI failover failed')
      return NextResponse.json(
        { error: 'Failed to get AI response' },
        { status: 500 }
      )
    }

    console.log('[Agnes] ✅ AI Response received from:', aiResponse.provider)
    console.log('[Agnes] Response length:', aiResponse.message.length)

    let message = aiResponse.message
    let citations: Citation[] = []

    // Post-process: Inject citations using Susan's citation system
    try {
      // Extract mentioned codes from response
      const mentionedCodes = extractCodesFromText(message)
      console.log('[Agnes] Mentioned codes:', mentionedCodes)

      // Search for relevant KB documents
      const relevantDocs: any[] = []

      // Search by building codes
      for (const code of mentionedCodes) {
        const codeDocs = getBuildingCodeReference(code)
        relevantDocs.push(...codeDocs)
      }

      // Search by training/roofing keywords
      const keywords = [
        'drip edge', 'flashing', 'step flashing', 'chimney', 'valley', 'ridge vent',
        'underlayment', 'ice and water', 'warranty', 'GAF', 'CertainTeed',
        'IRC', 'IBC', 'building code', 'manufacturer', 'Virginia', 'Maryland',
        'insurance', 'claim', 'adjuster', 'approval', 'partial approval'
      ]

      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword.toLowerCase())) {
          const keywordDocs = searchInsuranceArguments(keyword)
          relevantDocs.push(...keywordDocs.slice(0, 2)) // Limit to 2 docs per keyword
        }
      }

      // Deduplicate documents by ID
      const uniqueDocs = Array.from(
        new Map(relevantDocs.map(doc => [doc.id, doc])).values()
      )

      // Inject citations using Susan's system
      if (uniqueDocs.length > 0) {
        const citedResponse = injectCitations(message, uniqueDocs)
        message = citedResponse.text
        citations = citedResponse.citations

        console.log('[Agnes] ✅ Injected', citations.length, 'citations from Roof-ER knowledge base')
      } else {
        console.log('[Agnes] No relevant documents found for citation injection')
      }
    } catch (citationError) {
      console.error('[Agnes] Error injecting citations:', citationError)
      // Don't fail the request if citation injection fails
    }

    console.log('[Agnes] Returning response with', citations.length, 'citations and', photoExamples.length, 'photos')

    return NextResponse.json({
      message,
      citations,
      photos: photoExamples,
      characterId,
      provider: aiResponse.provider
    })
  } catch (error) {
    console.error('[Agnes API Error]:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
