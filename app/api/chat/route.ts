import { NextRequest, NextResponse } from 'next/server'
import { logChatMessage, getOrCreateRep } from '@/lib/db'
import { sendRealTimeNotification } from '@/lib/email'
import { VoiceCommandParser } from '@/lib/voice-command-handler'
import { TemplateEngine } from '@/lib/template-engine'

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

    const { messages, repName, sessionId, mode } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const deploymentToken = process.env.DEPLOYMENT_TOKEN
    const deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38'

    if (!deploymentToken) {
      console.error('Missing DEPLOYMENT_TOKEN environment variable')
      return NextResponse.json(
        { error: 'Deployment token not configured' },
        { status: 500 }
      )
    }

    const userMessage = messages[messages.length - 1]?.content || ''

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

    // Enhanced context with training data reference
    const enhancedMessages = [
      {
        is_user: false,
        text: `You are Susan AI-21, an expert roofing insurance claim assistant. You have access to comprehensive knowledge including:
- 1000+ Q&A scenarios for insurance claims
- Building codes for VA, MD, PA
- GAF manufacturer guidelines
- Professional email templates
- Sales scripts and legal arguments

Always provide accurate, professional responses with specific code citations when relevant. For building codes, always specify the state (Virginia, Maryland, or Pennsylvania) and exact code section (e.g., "Per Virginia Building Code R908.3...").`
      },
      ...messages.map((msg: any) => ({
        is_user: msg.role === 'user',
        text: msg.content
      }))
    ]

    // Call Abacus.AI getChatResponse endpoint with enhanced context
    const response = await fetch(`https://api.abacus.ai/api/v0/getChatResponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deploymentToken: deploymentToken,
        deploymentId: deploymentId,
        messages: enhancedMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Abacus.AI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return NextResponse.json(
        { error: 'Failed to get response from AI', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract the last assistant message
    let message = 'No response'

    if (data.result && data.result.messages && Array.isArray(data.result.messages)) {
      const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user)
      if (assistantMessages.length > 0) {
        message = assistantMessages[assistantMessages.length - 1].text
      }
    }

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
      model: 'Susan AI-21',
      usage: data.usage,
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
