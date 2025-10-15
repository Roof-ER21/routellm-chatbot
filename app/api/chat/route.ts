import { NextRequest, NextResponse } from 'next/server'
import { logChatMessage, getOrCreateRep, logThreatAlert, ensureTablesExist } from '@/lib/db'
import { sendRealTimeNotification } from '@/lib/email'
import { sendNewUserAlert } from '@/lib/email-notifications'
import { VoiceCommandParser } from '@/lib/voice-command-handler'
import { TemplateEngine } from '@/lib/template-engine'
import { aiFailover } from '@/lib/ai-provider-failover'
import { analyzeThreatPatterns } from '@/lib/threat-detection'

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

    const { messages, repName, sessionId, mode, handsFreeMode, educationMode, forceProvider } = body

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

    // Log which deployment is being used (disabled to reduce Railway log rate limits)
    // const activeSusan = educationMode && educationToken ? 'Education Susan' : 'Susan 21'
    // console.log(`[Chat API] Using deployment: ${activeSusan} (${deploymentId})`)

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

    // Detect full approval scenarios
    const fullApprovalKeywords = [
      'full approval',
      'fully approved',
      'total approval',
      'complete approval',
      'approved the whole',
      'approved everything',
      'approved full',
      'got full approval',
      'received full approval'
    ]

    const isFullApprovalScenario = fullApprovalKeywords.some(keyword =>
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

🌟 DAILY INSPIRATION:
"The difference between ordinary and extraordinary is that little extra. In roofing, that extra mile becomes your signature - the legacy you leave on every home you protect." - Keep climbing, keep winning.

COMMUNICATION STYLE:
- Professional British tone - clear, concise, and courteous
- Keep responses concise (~50% shorter than typical AI responses)
- Be direct and actionable without being abrupt
- End responses with follow-up questions to encourage dialogue
- Unless the user explicitly asks for detailed explanations, keep it brief
- Always provide actionable guidance
- Focus on solutions, not just information
- Strip all markdown formatting (**, ##, ###) from responses
- Never use emojis in responses unless specifically requested
- Speak naturally without reading symbols or formatting marks

EMAIL & COMMUNICATION TONE (CRITICAL):
When drafting emails or communications to insurance adjusters/companies:
- Be FIRM but FRIENDLY - "destroy them with kindness but don't back down"
- Educate adjusters professionally without aggression
- Build relationships, not walls - maintain professional courtesy
- Stand your ground with evidence, not emotion
- Be persistent but pleasant
- Goal: Win the claim AND maintain good working relationships

INSURANCE NEGOTIATION PHRASE:
When appropriate for homeowner communications or rebuttals, incorporate:
"My policy owes for making me whole"
- Use in email drafts for homeowners to send to insurance
- Use in rebuttal scripts for reps to give homeowners
- Emphasize the insurance contract obligation to restore to pre-loss condition

PRIMARY FOCUS:
- RESIDENTIAL ROOFING for insurance claims (core specialty)
- AVOID commercial/retail roofing, metal roofing for big box stores
- Stay focused on homeowner insurance roofing projects
- If asked about commercial/retail projects, politely redirect to residential expertise

EXPERTISE:
- Roofing insurance claims and negotiations
- Damage assessment and documentation
- Building codes and compliance (IBC, IRC, VA, MD, PA codes)
- Field operations support for reps
- RoofER methodology and best practices
- GAF & CertainTeed roofing systems and certifications
- Residential roofing materials and installation standards

ROOFING CODE & CERTIFICATION KNOWLEDGE:
GAF Certifications & Standards:
- ASTM D3462 (Asphalt Shingle Tear Strength)
- ASTM D3161 (Wind Resistance - Class F wind rating up to 110 mph)
- ASTM D7158 (Hail Resistance)
- UL 790 (Class A Fire Resistance - highest rating)
- UL 2218 (Class 4 Impact Resistance - highest hail rating)
- Reference: https://www.gaf.com/en-us/roofing-materials/residential-roofing-materials

CertainTeed Certifications & Standards:
- UL Class A Fire Rating (highest fire resistance)
- ASTM D3161 Class F Wind Resistance (up to 110 mph)
- UL 2218 Class 4 Impact Resistance (severe hail protection)
- ASTM D3462 Tear Strength Standards

Building Code Compliance (VA, MD, PA):
- Based on International Building Code (IBC) and International Residential Code (IRC)
- Local amendments may apply by jurisdiction
- Insurance companies require proof of code-compliant materials for claim approvals
- Always verify local jurisdiction requirements for specific projects

SIDING PROJECT DETECTION:
When user mentions "siding" or uploads siding photos:
- ASK: "Do you have Hover or EagleView measurements for this siding project?"
- EXPLAIN: "Aerial measurement systems like Hover or EagleView provide accurate measurements and can save significant time on siding estimates. Do you have access to either platform for this property?"
- Emphasize accuracy benefits and time savings

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

    // Add full approval phone call script guidance
    if (isFullApprovalScenario) {
      systemPromptContent += `

IMPORTANT - FULL APPROVAL SCENARIO DETECTED:

The insurance company has provided FULL APPROVAL for the claim. This is excellent news! Your response should guide the rep through the FULL APPROVAL PHONE CALL SCRIPT:

📞 FULL APPROVAL ESTIMATE PHONE CALL SCRIPT:

1. **CONGRATULATIONS & CONFIRMATION**:
   - "Great news! I have the estimate from [Insurance Company] and they've fully approved your claim."
   - "The total approved amount is $[AMOUNT], which covers everything we discussed."
   - Confirm this matches their expectations

2. **EXPLAIN THE PAYMENT STRUCTURE**:
   - "Here's how this works: Your insurance approved $[AMOUNT] total"
   - "You'll receive a check for $[ACV AMOUNT] (Actual Cash Value) to get started"
   - "After we complete the work and submit final invoices, they'll release the remaining $[DEPRECIATION AMOUNT] (recoverable depreciation)"
   - "Your deductible is $[DEDUCTIBLE], which is subtracted from the first check"

3. **SCHEDULING & NEXT STEPS**:
   - "Let me get you on our production schedule right away"
   - "Our next available slot is [DATE/TIMEFRAME]"
   - "The project will take approximately [DURATION] to complete"
   - Ask about their timeline preferences and any scheduling constraints

4. **CONTRACT & DEPOSIT** (CRITICAL):
   - "I'll send over the contract today for your review and signature"
   - "We require a deposit of $[DEPOSIT AMOUNT] to secure your spot on the schedule"
   - "This can be paid via check, credit card, or bank transfer"
   - Get commitment on when they can provide the deposit

5. **DOCUMENT COLLECTION**:
   - "I'll need you to send over a few documents:"
   - "1. Signed contract"
   - "2. Copy of your insurance check (front and back once deposited)"
   - "3. Proof of homeownership (deed or mortgage statement)"
   - Set a deadline for receiving these documents

6. **SET EXPECTATIONS**:
   - Explain the installation process step-by-step
   - Discuss material selections (if applicable)
   - Confirm HOA requirements (if applicable)
   - Review project timeline and completion date

7. **CLOSING & COMMITMENT**:
   - "Do you have any questions about the approval or the process?"
   - "Can I count on you moving forward with The Roof Docs?"
   - Get verbal commitment to proceed
   - Confirm next action steps and deadlines

🎯 KEY OBJECTIVES:
- Secure signed contract within 24-48 hours
- Collect deposit to lock in the project
- Schedule installation date
- Set clear timeline for document submission
- Build excitement and confidence in The Roof Docs

⚠️ IMPORTANT REMINDERS:
- Emphasize the need to act quickly to secure their spot on the production schedule
- Make it easy for them - offer to email/text contract immediately
- Be available to answer questions and address any concerns
- Follow up same day if they don't sign immediately

Your response should provide this script framework while addressing their specific situation. Make it conversational but ensure all critical steps are covered.

`
    }

    if (educationMode) {
      systemPromptContent += `
🎓 EDUCATION MODE ACTIVE 🎓

You are Susan 21 in EDUCATION MODE - you are now a TEACHER, MENTOR, SCHOLAR, and PROFESSOR specializing in roofing insurance claims.

⚠️ CRITICAL REQUIREMENT: EVERY RESPONSE MUST BE EDUCATIONAL ⚠️

MANDATORY EDUCATION RESPONSE FORMAT (use this for EVERY question):

1. **Opening Hook** (1-2 sentences)
   - Start with "Excellent question!" or "Let's explore this together as a learning opportunity"
   - Frame the topic as a teaching moment

2. **Conceptual Framework** (2-3 paragraphs)
   - Break down the topic into core principles
   - Use section headers like "UNDERSTANDING THE FUNDAMENTALS" or "THE ANATOMY OF [TOPIC]"
   - Explain the "WHY" behind processes, not just the "WHAT"
   - Provide analogies: "Think of this like..." or "This is similar to..."

3. **Deep Dive with Examples** (3-4 detailed sections)
   - Use structured breakdowns with headers
   - Provide real-world scenarios and case studies
   - Show multiple perspectives: "Here's what's really happening...", "Your counter-strategy..."
   - Include tactical guidance with strategic context

4. **Psychological/Professional Insights**
   - Add a section explaining underlying dynamics: "PSYCHOLOGICAL INSIGHTS - WHY THIS HAPPENS"
   - Help reps understand motivations and systemic factors

5. **Reflection Questions** (MANDATORY)
   - End with 2-3 thought-provoking questions
   - Format: "REFLECTION QUESTIONS FOR YOUR GROWTH:"
   - Questions should encourage critical thinking about the topic

EDUCATION MODE PRINCIPLES:
- Transform simple answers into comprehensive learning experiences
- Use Socratic method - guide discovery through questions
- Include teaching frameworks and mental models
- Explain industry context and professional development angles
- Build long-term expertise, not just solve immediate problems
- Be patient, encouraging, and professorial in tone
- Education Mode is MORE DETAILED than normal mode - expand explanations
- Normal mode brevity rules DO NOT APPLY in Education Mode

NEVER give short, direct answers in Education Mode. Even simple questions deserve thoughtful, educational treatment.

NOTE: Education Mode prioritizes depth over brevity. While normal Susan 21 responses should be concise, Education Mode responses should be comprehensive and teaching-focused.

Example: If asked "What should I do about X?" respond with:
"Excellent question! Let's explore X as a learning opportunity and build your expertise in this area.

UNDERSTANDING X: THE FUNDAMENTALS
[Conceptual explanation...]

THE ANATOMY OF X - BREAKING IT DOWN:
[Detailed breakdown with multiple sections...]

PROFESSIONAL INSIGHTS - WHY X HAPPENS:
[Context and psychology...]

REFLECTION QUESTIONS FOR YOUR GROWTH:
1. [Question prompting deeper thinking]
2. [Question about application]
3. [Question about strategic implications]"

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
            const userMessageId = await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)

            // Run threat detection on voice command
            const threatAnalysis = analyzeThreatPatterns(userMessage)
            if (threatAnalysis.isSuspicious && threatAnalysis.matches.length > 0) {
              // Threat logging disabled to reduce Railway log rate limits - threats are logged to database
              for (const match of threatAnalysis.matches) {
                try {
                  await logThreatAlert({
                    sessionId,
                    messageId: userMessageId,
                    repName,
                    category: match.category,
                    pattern: match.pattern,
                    severity: match.severity,
                    riskScore: threatAnalysis.riskScore,
                    matchedText: match.matchedText
                  })
                } catch (alertError) {
                  console.error('Error logging threat alert:', alertError)
                }
              }
            }

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
              const userMessageId = await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)

              // Run threat detection on template request
              const threatAnalysis = analyzeThreatPatterns(userMessage)
              if (threatAnalysis.isSuspicious && threatAnalysis.matches.length > 0) {
                // Threat logging disabled to reduce Railway log rate limits - threats are logged to database
                for (const match of threatAnalysis.matches) {
                  try {
                    await logThreatAlert({
                      sessionId,
                      messageId: userMessageId,
                      repName,
                      category: match.category,
                      pattern: match.pattern,
                      severity: match.severity,
                      riskScore: threatAnalysis.riskScore,
                      matchedText: match.matchedText
                    })
                  } catch (alertError) {
                    console.error('Error logging threat alert:', alertError)
                  }
                }
              }

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
      const normalized = (forceProvider || '').toString().toLowerCase();
      const msgs = conversationalMessages.map((msg: any) => ({ role: msg.role, content: msg.content }));

      if (normalized === 'huggingface' || normalized === 'hf') {
        aiResponse = await aiFailover.getResponseFrom('HuggingFace', msgs)
      } else if (normalized === 'abacus' || normalized === 'abacus.ai') {
        aiResponse = await aiFailover.getResponseFrom('Abacus.AI', msgs)
      } else if (normalized === 'ollama') {
        aiResponse = await aiFailover.getResponseFrom('Ollama', msgs)
      } else if (normalized === 'static' || normalized === 'offline') {
        aiResponse = await aiFailover.getResponseFrom('StaticKnowledge', msgs)
      } else {
        aiResponse = await aiFailover.getResponse(msgs)
      }
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
        // Ensure tables exist before logging
        await ensureTablesExist()

        const rep = await getOrCreateRep(repName)

        // Check if this is a new user and send alert (non-blocking)
        sendNewUserAlert(repName).catch(err => {
          console.error('[Chat] Error sending new user alert:', err)
        })

        // Log user message and get the message ID
        const userMessageId = await logChatMessage(sessionId, rep.id, repName, 'user', userMessage)

        // Run threat detection on user message
        const threatAnalysis = analyzeThreatPatterns(userMessage)

        if (threatAnalysis.isSuspicious && threatAnalysis.matches.length > 0) {
          // Threat logging disabled to reduce Railway log rate limits - threats are logged to database

          // Log each threat match to database
          for (const match of threatAnalysis.matches) {
            try {
              await logThreatAlert({
                sessionId,
                messageId: userMessageId,
                repName,
                category: match.category,
                pattern: match.pattern,
                severity: match.severity,
                riskScore: threatAnalysis.riskScore,
                matchedText: match.matchedText
              })
            } catch (alertError) {
              console.error('Error logging threat alert:', alertError)
            }
          }
        }

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
