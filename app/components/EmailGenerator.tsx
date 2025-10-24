'use client'

import { useState, useEffect } from 'react'
import { extractPDFText, isPDF } from '@/lib/client-pdf-extractor'
import {
  templateService,
  getTemplateRecommendation,
  generateEmail as generateEmailFromTemplate,
  type EmailTemplate,
  type TemplateRecommendation
} from '@/lib/template-service-simple'
import {
  analyzeDocument,
  type DocumentAnalysisResult
} from '@/lib/document-analyzer'
import {
  getArgumentsByScenario,
  getTopPerformingArguments,
  searchArguments,
  type Argument,
  ARGUMENT_CATEGORIES
} from '@/lib/argument-library'
import {
  TemplateRecommendationDisplay,
  DocumentAnalysisDisplay,
  ArgumentSelector,
  TemplateSelectorModal,
  AnalyzingIndicator
} from './EmailGenerator/IntelligenceDisplay'

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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [extractedText, setExtractedText] = useState('')
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)

  // New intelligence state
  const [recommendedTemplate, setRecommendedTemplate] = useState<TemplateRecommendation | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [availableTemplates, setAvailableTemplates] = useState<EmailTemplate[]>([])
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysisResult | null>(null)
  const [analyzingDocument, setAnalyzingDocument] = useState(false)
  const [suggestedArguments, setSuggestedArguments] = useState<Argument[]>([])
  const [selectedArguments, setSelectedArguments] = useState<string[]>([])
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showArgumentSelector, setShowArgumentSelector] = useState(false)

  // Load templates on mount
  useEffect(() => {
    const templates = templateService.getAllTemplates()
    setAvailableTemplates(templates)
    console.log('[EmailGen] Loaded', templates.length, 'email templates')
  }, [])

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
        setUploadedFiles([])
        setExtractedText('')
      }, 300)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newFiles = Array.from(files)
    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsProcessingFiles(true)
    setAnalyzingDocument(true)

    // Extract text from uploaded files
    for (const file of newFiles) {
      try {
        let extractedContent = ''

        // Handle PDF files
        if (isPDF(file)) {
          console.log(`[EmailGen] Extracting text from PDF: ${file.name}`)
          const pdfResult = await extractPDFText(file)
          if (pdfResult.success && pdfResult.text) {
            extractedContent = pdfResult.text
            console.log(`[EmailGen] Extracted ${extractedContent.length} characters from PDF (${pdfResult.pageCount} pages)`)

            // INTELLIGENT DOCUMENT ANALYSIS
            console.log('[EmailGen] Analyzing document with intelligence service...')
            try {
              const analysis = await analyzeDocument(file)
              setDocumentAnalysis(analysis)
              console.log('[EmailGen] Document analysis complete:', analysis.summary)

              // Get template recommendation based on analysis
              const detectedRecipient = emailType.toLowerCase().includes('adjuster') ? 'insurance adjuster' :
                                       emailType.toLowerCase().includes('homeowner') ? 'homeowner' :
                                       'insurance company'

              const recommendation = getTemplateRecommendation({
                recipient: detectedRecipient,
                claimType: emailType || 'roof damage',
                issues: analysis.identifiedIssues.map(i => i.description)
              })

              setRecommendedTemplate(recommendation)
              setSelectedTemplate(recommendation.template)
              console.log('[EmailGen] Template recommended:', recommendation.template.template_name, `(${recommendation.confidence}% confidence)`)

              // Get suggested arguments based on the scenario
              const args = getArgumentsByScenario(emailType || 'insurance claim')
              const topArgs = args.length > 0 ? args : getTopPerformingArguments(8)
              setSuggestedArguments(topArgs)

              // Auto-select high-success arguments (>85% success rate)
              const autoSelectedArgs = topArgs
                .filter(arg => arg.successRate >= 85)
                .map(arg => arg.id)
              setSelectedArguments(autoSelectedArgs)
              console.log('[EmailGen] Auto-selected', autoSelectedArgs.length, 'high-success arguments')

            } catch (analysisError) {
              console.error('[EmailGen] Document analysis failed:', analysisError)
              // Continue with basic text extraction
            }
          } else {
            extractedContent = `[PDF extraction failed: ${pdfResult.error || 'Unknown error'}]`
          }
        }
        // Handle text files
        else if (file.type.includes('text') || file.name.endsWith('.txt')) {
          extractedContent = await file.text()
        }
        // For images and other files, just note them
        else {
          extractedContent = `[${file.type || 'Unknown type'} file - content not extracted]`
        }

        if (extractedContent.trim()) {
          setExtractedText(prev => prev + '\n\n--- From ' + file.name + ' ---\n' + extractedContent)
        }
      } catch (error) {
        console.error(`[EmailGen] Error extracting text from ${file.name}:`, error)
        setExtractedText(prev => prev + '\n\n--- From ' + file.name + ' ---\n[Error extracting content]')
      }
    }
    setIsProcessingFiles(false)
    setAnalyzingDocument(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Handler for using template-based email generation
  const handleUseTemplate = () => {
    if (!selectedTemplate) return

    try {
      // Get selected arguments full text
      const selectedArgs = selectedArguments
        .map(id => {
          const arg = suggestedArguments.find(a => a.id === id)
          return arg ? arg.fullText : null
        })
        .filter(Boolean) as string[]

      console.log('[EmailGen] Generating email from template:', selectedTemplate.template_name)
      console.log('[EmailGen] With', selectedArgs.length, 'arguments')

      // Generate email from template
      const emailContent = generateEmailFromTemplate(selectedTemplate.template_name, {
        repName: repName,
        repTitle: 'Claims Advocate',
        customerName: recipientName || 'the homeowner',
        recipientName: recipientName || 'Adjuster',
        claimNumber: claimNumber || undefined,
        propertyAddress: documentAnalysis?.extractedData?.propertyAddress || undefined,
        selectedArguments: selectedArgs
      })

      setGeneratedEmail({
        subject: `Claim ${claimNumber || '#[X]'} - ${selectedTemplate.template_name}`,
        body: emailContent,
        explanation: `Generated using the "${selectedTemplate.template_name}" template (${recommendedTemplate?.confidence || 85}% confidence match). This template has been proven effective for ${selectedTemplate.audience} with ${selectedTemplate.tone} tone.`
      })

      console.log('[EmailGen] Template-based email generated successfully')
    } catch (error) {
      console.error('[EmailGen] Template generation error:', error)
      setError('Failed to generate email from template. Please try again.')
    }
  }

  // Handler for toggling argument selection
  const handleToggleArgument = (id: string) => {
    setSelectedArguments(prev =>
      prev.includes(id)
        ? prev.filter(argId => argId !== id)
        : [...prev, id]
    )
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
    // Claim number is now optional - not required

    setIsGenerating(true)

    try {
      console.log('[EmailGen] Starting email generation...')
      console.log('[EmailGen] Email type:', emailType)
      console.log('[EmailGen] Recipient:', recipientName)
      console.log('[EmailGen] Claim number:', claimNumber)

      // ENHANCED: Context-aware email generation with Roof-ER methodology

      // Detect recipient type
      const isAdjusterEmail = emailType.toLowerCase().includes('adjuster') ||
                               emailType.toLowerCase().includes('denial') ||
                               emailType.toLowerCase().includes('reinspection') ||
                               emailType.toLowerCase().includes('follow');

      const isHomeownerEmail = emailType.toLowerCase().includes('homeowner') ||
                                 emailType.toLowerCase().includes('communication') ||
                                 emailType.toLowerCase().includes('update');

      // Detect situation type
      const isPartialSituation = emailType.toLowerCase().includes('partial');
      const isFullDenial = emailType.toLowerCase().includes('full denial');
      const isReinspection = emailType.toLowerCase().includes('reinspection');

      const prompt = `You are Susan AI-21, a roofing insurance claim specialist. Generate a professional ${emailType} email using Roof-ER's proven methodology.

**CRITICAL MISSION:** Reps are evidence builders, not sales people. Emails must WIN ARGUMENTS with facts, NOT schedule meetings or promote services.

**EMAIL DETAILS:**
- Recipient: ${recipientName} ${isAdjusterEmail ? '(ADJUSTER)' : isHomeownerEmail ? '(HOMEOWNER)' : ''}
- Claim Number: ${claimNumber || 'Not specified'}
- From: ${repName} (Roof-ER Representative)
- Email Type: ${emailType}
- Context: ${additionalDetails || 'Standard communication'}
${extractedText ? `\n**UPLOADED DOCUMENT:**\n${extractedText}\n\n⚠️ ANALYZE THIS DOCUMENT: If this is a partial estimate, identify missing code requirements (IRC R908.3, R905.2.7.1, R903, R806) and manufacturer guidelines. List specific missing items in your email.` : ''}

---

## YOUR INSTRUCTIONS:

${isAdjusterEmail ? `
### ADJUSTER EMAIL - EVIDENCE-BASED DEMAND

**TONE:** Firm on facts, warm in delivery ("here's why this doesn't work, let's fix it")

**STRUCTURE TO FOLLOW:**
1. **Opening:** "Thank you for the initial approval. However..." OR "Following up on claim #[X]..."
2. **Problem Statement:** Clearly state the code/manufacturer violation
   - Example: "The current approval does not comply with IRC R908.3..."
3. **Evidence List:**
   • IRC R908.3: [Specific violation]
   • GAF Guidelines: [Specific requirement]
   • [Other evidence]
4. **Analysis:** ${extractedText ? 'Based on the uploaded estimate, the following items are missing:' : 'We have documented:'}
   - [List specific missing code requirements]
5. **Clear Demand:** "**Request:** Please provide a revised estimate reflecting [specific action]"
6. **Supporting Documentation:** List iTel, photos, repair attempt video if available
7. **Professional Close:** "Please let me know if you need any additional information."

**CRITICAL RULES:**
❌ NEVER suggest scheduling calls (EXCEPT for reinspection requests)
❌ NEVER use phrases like "Would you be available for a call?", "Let's discuss", "I'd love to walk you through"
❌ NEVER promote Roof-ER services or expertise
❌ NEVER sound overly friendly or casual - keep professional

✅ ALWAYS cite specific building codes (IRC R908.3, R905.2.7.1, R903)
✅ ALWAYS list evidence clearly
✅ ALWAYS make clear demand: "Request: [specific action]"
✅ ALWAYS start with appreciation when possible
✅ ALWAYS end professionally

${isReinspection ? '✅ FOR REINSPECTION ONLY: You may suggest scheduling dates: "We are available [dates] for the reinspection"' : ''}

**SUBJECT LINE:** "Claim #${claimNumber || '[X]'} - Request for Revised Estimate per IRC R908.3"
` : ''}

${isHomeownerEmail ? `
### HOMEOWNER EMAIL - INFORM AND REASSURE

**TONE:** Warm, confident, supportive ("Don't worry, we've got this")

**STRUCTURE TO FOLLOW:**
1. **Friendly Greeting:** "Hi ${recipientName.split(' ')[0]},"
2. **What Happened:** Explain in simple, non-technical terms
   - "The insurance adjuster approved a partial replacement (just the front slope), but..."
3. **What It Means:** Educate simply
   - "This is actually common. Building code R908.3 requires complete replacement when..."
4. **What We're Doing:** List specific actions
   - "1. I've already prepared a detailed letter citing the codes"
   - "2. We're including iTel report, photos, repair attempt video"
   - "3. They typically have 15 days to respond"
5. **What They Need to Do:** Usually nothing
   - "For now - nothing! I'm handling all communication."
6. **Reassurance:** Build confidence
   - "Roof-ER handles these situations regularly. We know exactly what evidence they need. The facts are on our side."
7. **Availability:** "Call or text me anytime with questions."
8. **Encouraging Close:** "You're in good hands - we've got this!"

**WHEN TO MENTION ROOF-ER:**
✅ When building confidence: "Roof-ER has successfully handled situations like this many times..."
✅ When explaining capability: "This is exactly why you have us in your corner..."
✅ ALWAYS refocus immediately back to the claim: "...and here's what we're doing for YOU..."

**SUBJECT LINE:** "Update on Your Insurance Claim #${claimNumber || '[X]'}"
` : ''}

${!isAdjusterEmail && !isHomeownerEmail ? `
### GENERAL PROFESSIONAL EMAIL

Follow standard business email format:
- Professional but warm tone
- Clear purpose
- Specific request or information
- Professional close
` : ''}

---

## ANALYSIS REQUIREMENTS:

${extractedText && isAdjusterEmail ? `
⚠️ **CRITICAL:** You have an uploaded document. This appears to be ${isPartialSituation ? 'a PARTIAL APPROVAL estimate' : 'insurance documentation'}.

**YOUR ANALYSIS TASKS:**
1. Identify what was approved vs. what was denied/missing
2. Check for these common code violations:
   - IRC R908.3: Complete tear-off required (25% rule)
   - IRC R905.2.7.1: Ice & water shield requirements
   - IRC R903: Flashing replacement
   - IRC R806: Ventilation requirements
3. Check for manufacturer violations:
   - GAF: Cannot mix old/new shingles
   - Shingle color/texture matching
   - Slope requirements
4. List SPECIFIC missing items in your email with code citations
5. Build the demand around these violations

**Example:**
"The current estimate is missing:
• Ice & water shield (IRC R905.2.7.1) - Required in valleys and eaves
• Step flashing replacement (IRC R903.2) - Cannot reuse damaged flashing
• Complete tear-off (IRC R908.3) - Partial replacement exceeds 25% threshold"
` : ''}

---

## FORMATTING:

Return JSON:
{
  "subject": "Clear, specific subject line",
  "body": "Complete email with proper formatting, line breaks, and signature from ${repName}\\n\\nBest regards,\\n${repName}\\nRoof-ER\\n[Phone] | [Email]",
  "explanation": "Brief explanation of why this approach works (2-3 sentences for rep's learning)"
}

**FINAL QUALITY CHECKS:**
- Is tone appropriate for recipient? (Firm+warm for adjusters, warm+confident for homeowners)
- Are codes cited? (If adjuster email)
- Is there a clear demand? (If adjuster email)
- Is it reassuring? (If homeowner email)
- NO scheduling calls (except reinspection)?
- NO Roof-ER promotion to adjusters?
- Strategic Roof-ER mention to homeowners (if applicable)?
- Always refocuses on claim goal?

Generate the email now following ALL instructions above.

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
              subject: emailData.subject || `${emailType}${claimNumber ? ` - Claim ${claimNumber}` : ''}`,
              body: emailData.body || aiResponse,
              explanation: emailData.explanation || 'This email follows professional insurance communication standards with clear, concise language and proper formatting.'
            })
          } else {
            console.log('[EmailGen] No JSON found, using raw response as fallback')
            // Fallback if JSON parsing fails
            setGeneratedEmail({
              subject: `${emailType}${claimNumber ? ` - Claim ${claimNumber}` : ''}`,
              body: aiResponse,
              explanation: 'This email follows professional insurance communication standards with clear, concise language and proper formatting.'
            })
          }
        } catch (parseError) {
          console.error('[EmailGen] JSON parsing failed:', parseError)
          // Fallback if JSON parsing fails
          setGeneratedEmail({
            subject: `${emailType}${claimNumber ? ` - Claim ${claimNumber}` : ''}`,
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
                    {/* Intelligence Displays */}
                    {analyzingDocument && <AnalyzingIndicator />}

                    {recommendedTemplate && !analyzingDocument && (
                      <TemplateRecommendationDisplay
                        recommendation={recommendedTemplate}
                        onUseTemplate={handleUseTemplate}
                        onChangeTemplate={() => setShowTemplateSelector(true)}
                      />
                    )}

                    {documentAnalysis && !analyzingDocument && (
                      <DocumentAnalysisDisplay analysis={documentAnalysis} />
                    )}

                    {suggestedArguments.length > 0 && !analyzingDocument && (
                      <ArgumentSelector
                        arguments={suggestedArguments}
                        selectedIds={selectedArguments}
                        onToggleArgument={handleToggleArgument}
                      />
                    )}

                    {/* Template Selector Modal */}
                    {showTemplateSelector && (
                      <TemplateSelectorModal
                        templates={availableTemplates}
                        currentTemplate={selectedTemplate}
                        onSelect={(template) => {
                          setSelectedTemplate(template)
                          setRecommendedTemplate({
                            template,
                            confidence: 100,
                            reasoning: 'Manually selected by user',
                            suggestedArguments: []
                          })
                        }}
                        onClose={() => setShowTemplateSelector(false)}
                      />
                    )}

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
                        Claim Number <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={claimNumber}
                        onChange={(e) => setClaimNumber(e.target.value)}
                        placeholder="e.g., CLM-2024-12345 (optional - leave blank if not applicable)"
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

                    {/* Document Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Upload Documents <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <div className="space-y-3">
                        <label className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-800 border-2 border-gray-600 border-dashed rounded-lg appearance-none cursor-pointer hover:border-purple-500 focus:outline-none">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PDF, DOCX, TXT, Images (Max 10MB each)</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                            onChange={handleFileUpload}
                            disabled={isGenerating}
                          />
                        </label>

                        {/* Processing indicator */}
                        {isProcessingFiles && (
                          <div className="flex items-center gap-2 text-sm text-purple-400">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing files...</span>
                          </div>
                        )}

                        {/* Display uploaded files */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            {uploadedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">📄</span>
                                  <span className="text-sm text-gray-200 truncate max-w-xs">{file.name}</span>
                                  <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                  onClick={() => removeFile(index)}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                  disabled={isGenerating}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Upload denial letters, estimates, or other documents to help generate a more relevant email
                      </p>
                    </div>

                    {/* Generate Button */}
                    <button
                      onClick={handleGenerateEmail}
                      disabled={isGenerating || !emailType || !recipientName.trim()}
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
