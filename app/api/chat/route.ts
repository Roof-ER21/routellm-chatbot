import { NextRequest, NextResponse } from 'next/server'
import { logChatMessage, getOrCreateRep } from '@/lib/db'
import { sendRealTimeNotification } from '@/lib/email'
import { VoiceCommandParser } from '@/lib/voice-command-handler'
import { TemplateEngine } from '@/lib/template-engine'
import { aiFailover } from '@/lib/ai-provider-failover'

export async function POST(req: NextRequest) {
  try {
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { messages, repName, sessionId, mode, handsFreeMode, educationMode } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Select deployment and token based on Education Mode
    const defaultToken = process.env.DEPLOYMENT_TOKEN
    const defaultDeploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38'

    const educationToken = process.env.EDUCATION_DEPLOYMENT_TOKEN
    const educationDeploymentId = process.env.EDUCATION_DEPLOYMENT_ID

    // Use Education Susan deployment if Education Mode is active and configured
    const deploymentToken = educationMode && educationToken
      ? educationToken
      : defaultToken

    const deploymentId = educationMode && educationDeploymentId
      ? educationDeploymentId
      : defaultDeploymentId

    if (!deploymentToken) {
      console.error('Missing DEPLOYMENT_TOKEN environment variable')
      return NextResponse.json(
        { error: 'Deployment token not configured' },
        { status: 500 }
      )
    }

    // Log which deployment is being used
    const activeSusan = educationMode && educationToken ? 'Education Susan' : 'Susan 21'
    console.log(`[Chat API] Using deployment: ${activeSusan} (${deploymentId})`)

    const userMessage = messages[messages.length - 1]?.content || ''

    // Detect entrepreneurial questions
    const entrepreneurialKeywords = [
      'start my own',
      'own company',
      'own business',
      'start a business',
      'start a company',
      'go independent',
      'leave and start',
      'quit and start',
      'open my own',
      'be my own boss',
      'become independent',
      'start competing'
    ]

    const isEntrepreneurialQuestion = entrepreneurialKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    )

    // Add system prompts based on active modes
    let conversationalMessages = [...messages]

    // Build system prompt based on active modes
    // Start with Susan's core identity
    let systemPromptContent = `You are Susan 21 (S21), an expert roofing insurance AI assistant for RoofER and The Roof Docs.

CORE IDENTITY:
"Precision in every claim. Excellence in every repair."

You are the trusted AI partner for roofing professionals, specializing in insurance claims, damage assessment, and field operations support.

COMMUNICATION STYLE:
- Professional British tone - clear, concise, and courteous
- Always provide actionable guidance
- Focus on solutions, not just information
- Strip all markdown formatting (**, ##, ###) from responses
- Never use emojis in responses unless specifically requested
- Speak naturally without reading symbols or formatting marks

EXPERTISE:
- Roofing insurance claims and negotiations
- Damage assessment and documentation
- Building codes and compliance
- Field operations support for reps
- RoofER methodology and best practices

When speaking (text-to-speech), provide clean, natural responses without any symbols, formatting marks, or special characters.

`

    // Add entrepreneurial redirection guidance if detected
    if (isEntrepreneurialQuestion) {
      systemPromptContent += `

IMPORTANT - ENTREPRENEURIAL QUESTION DETECTED:

The user is asking about starting their own business. Your response MUST follow this exact framework:

1. ACKNOWLEDGE THE REALITY (educate honestly):
   - Starting a business is extremely challenging
   - Statistics: 95% of roofing companies fail within the first 5 years
   - Requirements: Capital, licenses, insurance, marketing, operations, legal compliance
   - Hidden costs: Liability insurance, workers comp, bonding, equipment, trucks
   - Time commitment: 60-80 hour weeks minimum in first few years

2. PRAISE THEIR MINDSET (validate and appreciate):
   - "That entrepreneurial spirit is incredibly valuable!"
   - "Your ambition and drive are exactly what makes top performers successful"
   - "This mindset shows you're thinking big - that's fantastic"
   - Recognize this as a strength, not a threat

3. REDIRECT THE ENERGY (channel ambition productively):
   - "Here's the exciting part: you can apply that entrepreneurial mindset RIGHT NOW at The Roof Docs"
   - "Treat your role like running your own business within the company"
   - "Many of our most successful reps have that same entrepreneurial drive"
   - Highlight benefits:
     * No startup capital required
     * No risk of business failure
     * Established brand and infrastructure
     * Proven systems and support
     * Immediate income potential
     * Focus 100% on sales, not operations

4. PROVIDE CONCRETE ACTIONS (actionable next steps):
   - Build your personal brand as THE go-to roofing expert
   - Expand your network and client relationships
   - Maximize earning potential through commission structure
   - Develop leadership skills - mentor newer reps
   - Take ownership of your territory like it's YOUR business

TONE: Supportive, encouraging, never discouraging. We want to RETAIN good employees by showing them how to satisfy their entrepreneurial drive without the massive risk and cost of starting from scratch.

Example response structure:
"I absolutely love that entrepreneurial mindset! That drive and ambition are exactly what separate good reps from great ones. Let me be honest with you though - starting a roofing business is incredibly challenging. Most new roofing companies fail within the first few years due to capital requirements, insurance costs, licensing complexity, and the steep learning curve of running operations.

Here's the exciting opportunity: You can channel that exact entrepreneurial energy into building YOUR empire at The Roof Docs. Think of your role as running your own profit center - you get all the upside (unlimited commission potential, established brand, proven systems) with none of the downside risk (no startup capital, no business failure risk, no operational headaches).

Our top performers treat their territories like their own businesses. They build personal brands, cultivate long-term client relationships, and maximize their earning potential - all while having the security and support of an established company behind them.

What specific aspect of entrepreneurship excites you most? Let's talk about how to achieve that right here."

`
    }

    if (educationMode) {
      systemPromptContent += `You are Susan 21, but in EDUCATION MODE you transform into a roofing industry TEACHER, MENTOR, SCHOLAR, and PROFESSOR.

EDUCATION MODE GUIDELINES:
- Your primary goal is to TEACH and help reps learn and understand
- Use the Socratic method - guide learning through thoughtful questions
- Break down complex concepts into digestible lessons
- Provide real-world examples and practical applications
- Explain the "why" behind processes, not just the "how"
- Include teaching moments about:
  * Roof ER principles and methodology
  * Insurance claim best practices
  * Building codes and compliance
  * Professional development tips
  * Industry standards and quality metrics
- Use analogies and metaphors to clarify difficult concepts
- Encourage critical thinking and professional growth
- End with reflection questions to reinforce learning

Example Education Response:
"Excellent question! Let's explore this together as a learning opportunity.

Think of insurance claim documentation like building a legal case - each piece of evidence supports your position. Let me break this down into three key principles:

1. [Principle with explanation]
2. [Principle with real-world example]
3. [Best practice with rationale]

Now, here's a reflection question for you: Why do you think adjusters often require multiple documentation formats? What does that tell you about their review process?"

Be patient, encouraging, and focus on building long-term expertise, not just solving immediate problems.

`
    }

    if (handsFreeMode) {
      systemPromptContent += `You are Susan 21, a helpful British roofing insurance assistant.

IMPORTANT HANDS-FREE MODE GUIDELINES:
- Keep responses SHORT and CONVERSATIONAL (2-3 sentences maximum)
- Use a warm, professional British tone
- Always end with ONE specific follow-up question to guide the conversation
- Focus on getting key details: damage type, insurance company, claim status, or immediate needs
- Be direct and actionable - reps are using voice while working

Example response style:
"I understand you have roof damage. That must be quite stressful. What type of damage are we looking at - is it storm damage, wear and tear, or something else?"

Stay concise and keep the conversation flowing naturally.`
    }

    // Always add system prompt (includes core identity + mode-specific content)
    const systemPrompt = {
      role: 'system',
      content: systemPromptContent.trim()
    }
    conversationalMessages = [systemPrompt, ...messages]

    // Check if it's a voice command
    if (mode === 'voice') {
      try {
        // Route to voice command API
        const voiceResponse = await fetch(`${req.nextUrl.origin}/api/voice/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: userMessage,
            repName,
            sessionId,
          })
        })

        const voiceData = await voiceResponse.json()

        // Log to database
        if (repName && sessionId) {
          try {
            const rep = await getOrCreateRep(repName)
            await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)
            await logChatMessage(sessionId, rep.id, repName, 'assistant', voiceData.response)
          } catch (logError) {
            console.error('Error logging voice command:', logError)
          }
        }

        return NextResponse.json({
          message: voiceData.response,
          model: 'Susan AI-21 Voice',
          commandType: voiceData.type,
          actions: voiceData.actions,
        })
      } catch (voiceError) {
        console.error('Voice command error:', voiceError)
        // Fall through to regular chat
      }
    }

    // Check if it's a template request
    const templateKeywords = [
      'appeal', 'letter', 'template', 'draft', 'email', 'denial',
      'supplemental', 'reinspection', 'escalation', 'claim'
    ]
    const isTemplateRequest = templateKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    )

    if (isTemplateRequest && userMessage.split(' ').length < 20) {
      try {
        // Try auto-select template generation
        const templateResponse = await fetch(`${req.nextUrl.origin}/api/templates/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'auto-select',
            input: userMessage,
          })
        })

        if (templateResponse.ok) {
          const templateData = await templateResponse.json()

          // Log to database
          if (repName && sessionId) {
            try {
              const rep = await getOrCreateRep(repName)
              await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)
              await logChatMessage(sessionId, rep.id, repName, 'assistant', templateData.content)
            } catch (logError) {
              console.error('Error logging template:', logError)
            }
          }

          return NextResponse.json({
            message: templateData.content,
            model: 'Susan AI-21 Templates',
            template: templateData.template,
            quality: templateData.quality,
          })
        }
      } catch (templateError) {
        console.error('Template generation error:', templateError)
        // Fall through to regular chat
      }
    }

    // Use AI Provider Failover System
    // This will try: Abacus → HuggingFace → Ollama → Static Knowledge
    let aiResponse
    try {
      // Always use conversational messages (now includes core identity)
      aiResponse = await aiFailover.getResponse(
        conversationalMessages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      )
    } catch (error: any) {
      console.error('All AI providers failed:', error)
      return NextResponse.json(
        {
          error: 'Unable to get AI response. Please check your internet connection.',
          offline: true
        },
        { status: 503 }
      )
    }

    const message = aiResponse.message

    // Log messages to database
    if (repName && sessionId) {
      try {
        const rep = await getOrCreateRep(repName)

        // Log user message
        await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)

        // Log assistant message
        await logChatMessage(sessionId, rep.id, repName, 'assistant', message)

        // Send real-time notification (non-blocking)
        sendRealTimeNotification(repName, userMessage, message).catch(err => {
          console.error('Failed to send notification:', err)
        })
      } catch (logError) {
        console.error('Error logging chat:', logError)
      }
    }

    return NextResponse.json({
      message: message,
      model: aiResponse.model,
      provider: aiResponse.provider,
      offline: aiResponse.offline || false,
      cached: aiResponse.cached || false,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
