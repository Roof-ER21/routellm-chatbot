import { NextRequest, NextResponse } from 'next/server'

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

    const { messages } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const deploymentToken = process.env.DEPLOYMENT_TOKEN
    const deploymentId = process.env.DEPLOYMENT_ID || '6a1d18f38' // Susan AI-21 by default

    if (!deploymentToken) {
      return NextResponse.json(
        { error: 'Deployment token not configured' },
        { status: 500 }
      )
    }

    // Convert OpenAI format to Abacus.AI format
    const abacusMessages = messages.map((msg: any) => ({
      is_user: msg.role === 'user',
      text: msg.content
    }))

    // Call Abacus.AI getChatResponse endpoint
    const response = await fetch(`https://api.abacus.ai/api/v0/getChatResponse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deploymentToken: deploymentToken,
        deploymentId: deploymentId,
        messages: abacusMessages,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Abacus.AI API Error:', errorData)
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Handle Abacus.AI getChatResponse format
    // Extract the last assistant message from the messages array
    let message = 'No response'

    if (data.result && data.result.messages && Array.isArray(data.result.messages)) {
      // Find the last message where is_user is false (assistant response)
      const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user)
      if (assistantMessages.length > 0) {
        message = assistantMessages[assistantMessages.length - 1].text
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
