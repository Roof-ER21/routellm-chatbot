'use client'

import { useState, useEffect } from 'react'

interface EmailGeneratorProps {
  repName: string
  sessionId?: number
  conversationHistory?: Array<{ role: string; content: string }>
  autoOpen?: boolean
  onClose?: () => void
}

interface GeneratedEmail {
  subject: string
  body: string
  explanation: string
}

const EMAIL_TYPES = [
  'Homeowner Communication',
  'Adjuster Follow-up',
  'Partial Denial Appeal',
  'Full Denial Appeal',
  'Reinspection Request',
  'Estimate Follow-up',
  'Initial Claim Submission',
  'Supplement Request',
  'Payment Status Inquiry'
]

export default function EmailGenerator({ repName, sessionId, conversationHistory, autoOpen = false, onClose }: EmailGeneratorProps) {
  const [showModal, setShowModal] = useState(autoOpen)
  const [emailType, setEmailType] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTalking, setIsTalking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null)
  const [copied, setCopied] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([])
  const [userInput, setUserInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Auto-open modal if autoOpen prop is true
  useEffect(() => {
    if (autoOpen) {
      setShowModal(true)
    }
  }, [autoOpen])

  const handleOpenModal = () => {
    setShowModal(true)
    setError(null)
    setGeneratedEmail(null)
  }

  const handleCloseModal = () => {
    if (!isGenerating && !isTalking) {
      setShowModal(false)
      // Notify parent component if onClose callback is provided
      if (onClose) {
        onClose()
      }
      // Reset form after animation
      setTimeout(() => {
        setEmailType('')
        setRecipientName('')
        setClaimNumber('')
        setAdditionalDetails('')
        setGeneratedEmail(null)
        setError(null)
        setCopied(false)
      }, 300)
    }
  }

  const handleGenerateEmail = async () => {
    setError(null)

    // Validation
    if (!emailType) {
      setError('Please select an email type')
      return
    }
    if (!recipientName.trim()) {
      setError('Please enter recipient name')
      return
    }
    if (!claimNumber.trim()) {
      setError('Please enter claim number')
      return
    }

    setIsGenerating(true)

    try {
      console.log('[EmailGen] Starting email generation...')
      console.log('[EmailGen] Email type:', emailType)
      console.log('[EmailGen] Recipient:', recipientName)
      console.log('[EmailGen] Claim number:', claimNumber)

      // Create AI prompt for Abacus AI with personalization
      const prompt = `You are Susan AI, an expert roofing insurance assistant. Generate a personalized, professional ${emailType} email.

**EMAIL DETAILS:**
- Recipient: ${recipientName}
- Claim Number: ${claimNumber}
- From: ${repName} (Roof-ER Representative)
- Additional Context: ${additionalDetails || 'Standard claim follow-up'}

**REQUIREMENTS:**
1. Sign the email from "${repName}" (the sales rep)
2. Use Roof-ER branding and professional tone
3. Reference specific Roof-ER templates and insurance claim strategies
4. Add slight personality while remaining professional
5. Hit key points from Roof-ER training (building codes, manufacturer guidelines, proper documentation)
6. Make it ready to copy/paste into Gmail - no editing needed
7. Include contact signature for ${repName}

**IMPORTANT:** Also provide a brief explanation of WHY this email strategy works.

Format your response as JSON:
{
  "subject": "Email subject line",
  "body": "Complete email body with greeting, body, professional close, and signature from ${repName}",
  "explanation": "Why this email works (mention specific Roof-ER strategies used)"
}`

      // Build messages array in correct format for /api/chat
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ]

      const requestBody = {
        messages: messages,
        repName: repName,
        sessionId: sessionId
      }

      console.log('[EmailGen] Calling /api/chat with payload:', JSON.stringify(requestBody, null, 2))

      // Call the chat API with the correct format
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[EmailGen] API response status:', response.status)
      console.log('[EmailGen] API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[EmailGen] API error response:', errorText)

        let errorMessage = 'Failed to generate email'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorJson.details || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[EmailGen] API response data:', JSON.stringify(data, null, 2))

      // The API returns { message: "...", model: "...", usage: {...} }
      if (data.message) {
        const aiResponse = data.message
        console.log('[EmailGen] AI response received:', aiResponse.substring(0, 100) + '...')

        // Try to parse JSON from response
        try {
          // Extract JSON from the response (it might be wrapped in markdown code blocks)
          const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                           aiResponse.match(/(\{[\s\S]*\})/)

          if (jsonMatch) {
            console.log('[EmailGen] Found JSON in response, parsing...')
            const emailData = JSON.parse(jsonMatch[1])
            console.log('[EmailGen] Parsed email data:', emailData)

            setGeneratedEmail({
              subject: emailData.subject || `${emailType} - Claim ${claimNumber}`,
              body: emailData.body || aiResponse,
              explanation: emailData.explanation || 'This email follows professional insurance communication standards with clear, concise language and proper formatting.'
            })
          } else {
            console.log('[EmailGen] No JSON found, using raw response as fallback')
            // Fallback if JSON parsing fails
            setGeneratedEmail({
              subject: `${emailType} - Claim ${claimNumber}`,
              body: aiResponse,
              explanation: 'This email follows professional insurance communication standards with clear, concise language and proper formatting.'
            })
          }
        } catch (parseError) {
          console.error('[EmailGen] JSON parsing failed:', parseError)
          // Fallback if JSON parsing fails
          setGeneratedEmail({
            subject: `${emailType} - Claim ${claimNumber}`,
            body: aiResponse,
            explanation: 'This email follows professional insurance communication standards with clear, concise language and proper formatting.'
          })
        }

        console.log('[EmailGen] Email generation successful!')
      } else {
        console.error('[EmailGen] No message in response:', data)
        throw new Error(data.error || 'No response from AI')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate email'
      console.error('[EmailGen] Email generation failed:', errorMessage)
      console.error('[EmailGen] Full error:', err)
      setError(`Failed to generate email: ${errorMessage}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLetsTalk = async () => {
    if (!generatedEmail) return

    setIsTalking(true)
    setError(null)

    try {
      console.log('[EmailGen] Starting Susan AI review...')

      // Create prompt for Susan to review the email and ask questions
      const reviewPrompt = `You are Susan AI, reviewing an email that ${repName} just generated for their insurance claim.

**GENERATED EMAIL:**
Subject: ${generatedEmail.subject}

${generatedEmail.body}

**EMAIL CONTEXT:**
- Email Type: ${emailType}
- Recipient: ${recipientName}
- Claim Number: ${claimNumber}
- Additional Details Provided: ${additionalDetails || 'None'}

**YOUR TASK:**
1. Review the email for completeness and effectiveness
2. Identify 2-3 pieces of missing information that could strengthen the case
3. Ask specific questions to gather these details from ${repName}

**REQUIREMENTS:**
- Be brief and conversational (you're coaching ${repName})
- Focus on actionable questions about: damage specifics, building codes, manufacturer guidelines, timelines, photo documentation
- Ask ONE question at a time for ${repName} to answer
- After they provide details, you'll regenerate the email with improvements

Keep it short - just a brief assessment and your first question.`

      const messages = [
        {
          role: 'user',
          content: reviewPrompt
        }
      ]

      const requestBody = {
        messages: messages,
        repName: repName,
        sessionId: sessionId
      }

      console.log('[EmailGen] Calling /api/chat for Susan review...')

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[EmailGen] Susan review error:', errorText)
        throw new Error('Failed to get Susan AI review')
      }

      const data = await response.json()
      console.log('[EmailGen] Susan review received')

      if (data.message) {
        // Add Susan's response to chat
        setChatMessages([{ role: 'assistant', content: data.message }])
        // Show chat interface
        setShowChat(true)
      } else {
        throw new Error('No response from Susan AI')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get Susan AI review'
      console.error('[EmailGen] Let\'s Talk failed:', errorMessage)
      setError(`Failed to get Susan AI review: ${errorMessage}`)
    } finally {
      setIsTalking(false)
    }
  }

  const handleSendChatMessage = async () => {
    if (!userInput.trim()) return

    const userMessage = userInput.trim()
    setUserInput('')
    setIsSending(true)

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      // Build conversation context including the email
      const conversationContext = `You are Susan AI helping ${repName} refine their insurance claim email.

**CURRENT EMAIL:**
Subject: ${generatedEmail?.subject}

${generatedEmail?.body}

**EMAIL CONTEXT:**
- Email Type: ${emailType}
- Recipient: ${recipientName}
- Claim Number: ${claimNumber}

**CONVERSATION SO FAR:**
${chatMessages.map(msg => `${msg.role === 'user' ? repName : 'Susan'}: ${msg.content}`).join('\n')}

**${repName}'s RESPONSE:**
${userMessage}

**YOUR TASK:**
1. If ${repName} has provided useful details, acknowledge them
2. Either ask a follow-up question OR offer to regenerate the email with the new details
3. When ${repName} says they're ready, regenerate the email in the SAME JSON format as before:
{
  "subject": "Updated subject",
  "body": "Updated email body with all new details incorporated",
  "explanation": "Brief note on what was improved"
}

Be conversational and brief.`

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: conversationContext }],
          repName: repName,
          sessionId: sessionId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get Susan response')
      }

      const data = await response.json()

      if (data.message) {
        // Check if Susan provided a regenerated email (JSON format)
        const jsonMatch = data.message.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
                         data.message.match(/(\{[\s\S]*"subject"[\s\S]*"body"[\s\S]*\})/)

        if (jsonMatch) {
          try {
            const updatedEmail = JSON.parse(jsonMatch[1])
            // Update the email with Susan's improvements
            setGeneratedEmail({
              subject: updatedEmail.subject || generatedEmail?.subject || '',
              body: updatedEmail.body || generatedEmail?.body || '',
              explanation: updatedEmail.explanation || 'Email updated with your details'
            })
            // Add message without the JSON
            const cleanMessage = data.message.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/, '✅ Email regenerated with your updates! Check the preview above.')
            setChatMessages(prev => [...prev, { role: 'assistant', content: cleanMessage }])
          } catch (e) {
            // If JSON parsing fails, just add the message
            setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }])
          }
        } else {
          // Regular conversation message
          setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }])
        }
      }
    } catch (err) {
      console.error('[EmailGen] Chat error:', err)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyToClipboard = async () => {
    if (!generatedEmail) return

    const fullEmail = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`

    try {
      await navigator.clipboard.writeText(fullEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Failed to copy to clipboard')
    }
  }

  const handleEditEmail = () => {
    // For now, just allow user to modify in the textarea
    // Could be enhanced with a proper editor
    alert('You can edit the email directly in your email client after copying, or ask Susan to regenerate with different details.')
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-700 hover:via-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
      >
        <span>✉️</span>
        <span>Generate Email</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">AI Email Generator</h2>
                    <p className="text-xs text-white/80">Powered by Susan AI-21</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                  disabled={isGenerating || isTalking}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-500/20 border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl text-white">!</span>
                    </div>
                    <div>
                      <p className="text-red-200 font-semibold">Error</p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {!generatedEmail ? (
                  // Form View
                  <div className="space-y-5">
                    {/* Email Type Dropdown */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Email Type <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={emailType}
                        onChange={(e) => setEmailType(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white"
                        disabled={isGenerating}
                      >
                        <option value="">Select email type...</option>
                        {EMAIL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Recipient Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Recipient Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g., John Smith"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Claim Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Claim Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={claimNumber}
                        onChange={(e) => setClaimNumber(e.target.value)}
                        placeholder="e.g., CLM-2024-12345"
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Additional Details */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Additional Details
                      </label>
                      <textarea
                        value={additionalDetails}
                        onChange={(e) => setAdditionalDetails(e.target.value)}
                        placeholder="Any specific information you want included in the email (e.g., damage details, timeline, specific requests)..."
                        rows={6}
                        className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 focus:border-purple-500 rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-500/20 transition-all text-white placeholder-gray-500 resize-none"
                        disabled={isGenerating}
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Provide context to help Susan generate a more personalized email
                      </p>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerateEmail}
                      disabled={isGenerating || !emailType || !recipientName.trim() || !claimNumber.trim()}
                      className="w-full px-6 py-4 bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 hover:from-red-700 hover:via-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Generating with AI...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Generate Email</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  // Preview View with Optional Chat
                  <div className="space-y-4">
                    {/* Email Preview */}
                    <div className="bg-gray-800 border-2 border-gray-600 rounded-lg p-6">
                      <div className="mb-4 pb-4 border-b-2 border-gray-700">
                        <p className="text-sm text-gray-300 mb-2">
                          <strong className="text-gray-200">Subject:</strong> {generatedEmail.subject}
                        </p>
                      </div>
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-gray-200 font-sans text-sm leading-relaxed">
                          {generatedEmail.body}
                        </div>
                      </div>
                    </div>

                    {/* Chat Interface (shown when Let's Talk is clicked) */}
                    {showChat && (
                      <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
                          <span className="text-lg">💬</span>
                          <h3 className="font-semibold text-purple-300">Chat with Susan AI</h3>
                        </div>

                        {/* Chat Messages */}
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] px-4 py-2 rounded-lg ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-200'
                              }`}>
                                <p className="text-xs font-semibold mb-1 opacity-70">
                                  {msg.role === 'user' ? repName : 'Susan AI'}
                                </p>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                          ))}
                          {isSending && (
                            <div className="flex justify-start">
                              <div className="bg-gray-700 text-gray-200 px-4 py-2 rounded-lg">
                                <p className="text-xs font-semibold mb-1 opacity-70">Susan AI</p>
                                <p className="text-sm">Thinking...</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendChatMessage()}
                            placeholder="Type your answer or ask for changes..."
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                            disabled={isSending}
                          />
                          <button
                            onClick={handleSendChatMessage}
                            disabled={isSending || !userInput.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}

                    {/* AI Explanation */}
                    <div className="bg-blue-500/20 border-2 border-blue-400 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">💡</span>
                        </div>
                        <div>
                          <p className="text-blue-200 font-semibold text-sm mb-1">Why this email works:</p>
                          <p className="text-blue-300 text-sm">{generatedEmail.explanation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Let's Talk with Susan - Only show if chat not active */}
                    {!showChat && (
                      <>
                        <div className="bg-purple-500/20 border-2 border-purple-400 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">🤖</span>
                            </div>
                            <div>
                              <p className="text-purple-200 font-semibold text-sm mb-2">
                                <strong>Want Susan to review this email?</strong>
                              </p>
                              <p className="text-purple-300 text-sm mb-2">
                                Click "Let's Talk" and Susan will:
                              </p>
                              <ul className="text-purple-300 text-xs space-y-1 list-disc list-inside">
                                <li>Review your email for completeness</li>
                                <li>Ask questions to gather missing details</li>
                                <li>Regenerate the email with your updates</li>
                                <li>Help strengthen your case through conversation</li>
                              </ul>
                              <p className="text-purple-200 text-xs mt-2 italic">
                                The conversation happens right here in the modal!
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Let's Talk Button */}
                        <button
                          onClick={handleLetsTalk}
                          disabled={isTalking}
                          className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                        >
                          {isTalking ? (
                            <>
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>Susan is reviewing...</span>
                            </>
                          ) : (
                            <>
                              <span>💬</span>
                              <span>Let's Talk - Get Susan's Review</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={handleCopyToClipboard}
                      className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      {copied ? (
                        <>
                          <span>✓</span>
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <span>📋</span>
                          <span>Copy to Clipboard (Paste in Gmail)</span>
                        </>
                      )}
                    </button>

                    {/* Back Button */}
                    <button
                      onClick={() => setGeneratedEmail(null)}
                      disabled={isTalking}
                      className="w-full px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors font-medium"
                    >
                      ← Generate Different Email
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
