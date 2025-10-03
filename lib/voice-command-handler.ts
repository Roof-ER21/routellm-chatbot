/**
 * Voice Command Handler for Susan AI v2.0
 * Hands-free voice command system for roofing reps in the field
 *
 * Core Commands:
 * - DOCUMENT - Document damage/findings
 * - CITE - Get code citations
 * - DRAFT - Generate emails/letters
 * - ANALYZE - Analyze situation/damage
 * - HELP - General assistance
 * - EMERGENCY - Urgent support
 * - QUERY - Answer questions
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum CommandType {
  DOCUMENT = 'DOCUMENT',
  CITE = 'CITE',
  DRAFT = 'DRAFT',
  ANALYZE = 'ANALYZE',
  HELP = 'HELP',
  EMERGENCY = 'EMERGENCY',
  QUERY = 'QUERY',
  UNKNOWN = 'UNKNOWN',
}

export interface ParsedCommand {
  type: CommandType
  originalText: string
  confidence: number
  parameters: Record<string, any>
  matchedPattern?: string
}

export interface VoiceContext {
  userId?: string
  repName?: string
  sessionId?: string
  location?: {
    latitude?: number
    longitude?: number
    address?: string
  }
  propertyAddress?: string
  photoData?: string
}

export interface VoiceResult {
  success: boolean
  action: string
  voiceResponse: string
  [key: string]: any
}

export interface CommandResult {
  success: boolean
  command?: ParsedCommand
  result?: VoiceResult
  error?: string
  transcript: string
  timestamp: string
}

interface EmergencyContacts {
  dispatch: string
  supervisor: string
  support: string
}

interface VoiceResponseOptions {
  addNaturalPauses?: boolean
  removeMarkdown?: boolean
  conversational?: boolean
  stepByStep?: boolean
  emphasizeCodeSections?: boolean
  urgent?: boolean
  clear?: boolean
  closing?: string
}

// ============================================================================
// VoiceCommandParser - Natural language intent detection
// ============================================================================

export class VoiceCommandParser {
  private patterns: Record<string, RegExp[]>
  private wakeWords: string[]

  constructor() {
    // Command patterns for intent detection
    this.patterns = {
      DOCUMENT: [
        /(?:susan,?\s+)?document\s+(.+)/i,
        /(?:susan,?\s+)?record\s+(.+)/i,
        /(?:susan,?\s+)?note\s+(.+)/i,
        /(?:susan,?\s+)?log\s+(.+)/i,
        /(?:susan,?\s+)?take\s+note\s+of\s+(.+)/i,
        /(?:susan,?\s+)?write\s+down\s+(.+)/i,
      ],
      CITE: [
        /(?:susan,?\s+)?cite\s+(.+)/i,
        /(?:susan,?\s+)?(?:building\s+)?code\s+(?:for\s+)?(.+)/i,
        /(?:susan,?\s+)?(?:what'?s\s+the\s+)?(?:code|regulation)\s+(?:for|on|about)\s+(.+)/i,
        /(?:susan,?\s+)?(?:irc|ibc|nfpa)\s+(.+)/i,
        /(?:susan,?\s+)?reference\s+(.+)/i,
      ],
      DRAFT: [
        /(?:susan,?\s+)?draft\s+(.+)/i,
        /(?:susan,?\s+)?(?:create|generate|write)\s+(?:a\s+)?(.+?)\s*(?:letter|email|template)/i,
        /(?:susan,?\s+)?compose\s+(.+)/i,
        /(?:susan,?\s+)?(?:make|prepare)\s+(?:a\s+)?(.+)/i,
      ],
      ANALYZE: [
        /(?:susan,?\s+)?analyze\s+(?:the\s+)?(?:photo|picture|image|damage|situation)/i,
        /(?:susan,?\s+)?(?:check|look\s+at|examine)\s+(?:the\s+)?(?:photo|picture|image|damage)/i,
        /(?:susan,?\s+)?what'?s\s+in\s+(?:the\s+)?(?:photo|picture|image)/i,
        /(?:susan,?\s+)?(?:assess|evaluate)\s+(?:the\s+)?damage/i,
      ],
      HELP: [
        /(?:susan,?\s+)?help\s+(?:me\s+)?(?:with\s+)?(.+)/i,
        /(?:susan,?\s+)?how\s+(?:do\s+)?(?:i\s+)?(.+)/i,
        /(?:susan,?\s+)?(?:what|tell\s+me)\s+(?:about|is)\s+(.+)/i,
        /(?:susan,?\s+)?guide\s+(?:me\s+)?(?:through\s+)?(.+)/i,
      ],
      EMERGENCY: [
        /(?:susan,?\s+)?emergency/i,
        /(?:susan,?\s+)?(?:need\s+)?help\s+now/i,
        /(?:susan,?\s+)?urgent/i,
        /(?:susan,?\s+)?call\s+(?:for\s+)?help/i,
        /(?:susan,?\s+)?(?:safety\s+)?(?:issue|concern)/i,
      ],
    }

    // Wake words
    this.wakeWords = ['susan', 'hey susan', 'ok susan', 'susan ai']
  }

  /**
   * Parse command from transcript
   */
  parseCommand(transcript: string): ParsedCommand {
    if (!transcript || typeof transcript !== 'string') {
      return {
        type: CommandType.UNKNOWN,
        originalText: transcript || '',
        confidence: 0,
        parameters: {},
      }
    }

    const normalizedText = transcript.trim().toLowerCase()

    // Check for each command type
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern)
        if (match) {
          return {
            type: CommandType[type as keyof typeof CommandType],
            originalText: transcript,
            confidence: this.calculateConfidence(match, normalizedText),
            parameters: this.extractParameters(type, match, transcript),
            matchedPattern: pattern.toString(),
          }
        }
      }
    }

    // If no specific command matched, treat as general query
    return {
      type: CommandType.QUERY,
      originalText: transcript,
      confidence: 0.8,
      parameters: {
        query: transcript,
      },
    }
  }

  /**
   * Calculate confidence score for command match
   */
  private calculateConfidence(match: RegExpMatchArray, text: string): number {
    let confidence = 0.7 // Base confidence

    // Check if wake word is present
    const hasWakeWord = this.wakeWords.some((word) => text.includes(word))
    if (hasWakeWord) {
      confidence += 0.2
    }

    // Check match quality
    if (match && match[1] && match[1].trim().length > 0) {
      confidence += 0.1
    }

    return Math.min(confidence, 1.0)
  }

  /**
   * Extract parameters from command
   */
  private extractParameters(
    type: string,
    match: RegExpMatchArray,
    originalText: string
  ): Record<string, any> {
    const parameters: Record<string, any> = {}

    switch (type) {
      case 'DOCUMENT':
        parameters.damageType = match[1] ? match[1].trim() : ''
        parameters.timestamp = new Date().toISOString()
        parameters.mode = 'voice'
        break

      case 'CITE':
        parameters.topic = match[1] ? match[1].trim() : ''
        parameters.codeType = this.detectCodeType(match[1] || '')
        break

      case 'DRAFT':
        parameters.templateType = match[1] ? match[1].trim() : ''
        parameters.insuranceCarrier = this.detectInsuranceCarrier(originalText)
        break

      case 'ANALYZE':
        parameters.analysisType = 'photo'
        parameters.requestPhoto = true
        break

      case 'HELP':
        parameters.topic = match[1] ? match[1].trim() : ''
        break

      case 'EMERGENCY':
        parameters.priority = 'high'
        parameters.timestamp = new Date().toISOString()
        break

      default:
        parameters.query = originalText
    }

    return parameters
  }

  /**
   * Detect building code type from text
   */
  private detectCodeType(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('irc') || lowerText.includes('residential')) {
      return 'IRC'
    }
    if (lowerText.includes('ibc') || lowerText.includes('commercial')) {
      return 'IBC'
    }
    if (lowerText.includes('nfpa') || lowerText.includes('fire')) {
      return 'NFPA'
    }
    if (lowerText.includes('osha') || lowerText.includes('safety')) {
      return 'OSHA'
    }

    return 'IRC' // Default to IRC
  }

  /**
   * Detect insurance carrier from text
   */
  private detectInsuranceCarrier(text: string): string | null {
    const carriers = [
      'state farm',
      'allstate',
      'farmers',
      'usaa',
      'liberty mutual',
      'progressive',
      'nationwide',
      'travelers',
      'geico',
      'american family',
    ]

    const lowerText = text.toLowerCase()
    for (const carrier of carriers) {
      if (lowerText.includes(carrier)) {
        return carrier
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }
    }

    return null
  }
}

// ============================================================================
// VoiceResponseGenerator - Speech-optimized text generation
// ============================================================================

export class VoiceResponseGenerator {
  private defaultOptions: VoiceResponseOptions

  constructor(options: VoiceResponseOptions = {}) {
    this.defaultOptions = {
      addNaturalPauses: true,
      removeMarkdown: true,
      conversational: true,
      ...options,
    }
  }

  /**
   * Generate voice-optimized response
   */
  generateResponse(text: string, options: VoiceResponseOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options }

    let response = text

    // Remove markdown formatting
    if (opts.removeMarkdown) {
      response = this.removeMarkdown(response)
    }

    // Add natural pauses
    if (opts.addNaturalPauses) {
      response = this.addNaturalPauses(response)
    }

    // Make conversational
    if (opts.conversational) {
      response = this.makeConversational(response)
    }

    // Format for step-by-step
    if (opts.stepByStep) {
      response = this.formatStepByStep(response)
    }

    // Add closing
    if (opts.closing) {
      response += ` ${opts.closing}`
    }

    // Clean up
    response = this.cleanup(response)

    return response
  }

  /**
   * Remove markdown formatting
   */
  private removeMarkdown(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
      .replace(/\*(.+?)\*/g, '$1') // Italic
      .replace(/`(.+?)`/g, '$1') // Code
      .replace(/^#+\s+/gm, '') // Headers
      .replace(/^\s*[-*]\s+/gm, '') // Lists
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Links
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines
  }

  /**
   * Add natural pauses for speech
   */
  private addNaturalPauses(text: string): string {
    return text
      .replace(/\.\s+/g, '. ... ') // Pause after sentences
      .replace(/,\s+/g, ', .. ') // Short pause after commas
      .replace(/:\s+/g, ': ... ') // Pause after colons
      .replace(/;\s+/g, '; ... ') // Pause after semicolons
      .replace(/\?\s+/g, '? ... ') // Pause after questions
      .replace(/!\s+/g, '! ... ') // Pause after exclamations
  }

  /**
   * Make text more conversational
   */
  private makeConversational(text: string): string {
    const starters = [
      { pattern: /^Here is/, replacement: "Okay, here's" },
      { pattern: /^The following/, replacement: "Here's what I found:" },
      { pattern: /^In accordance with/, replacement: 'According to' },
    ]

    let result = text
    for (const { pattern, replacement } of starters) {
      result = result.replace(pattern, replacement)
    }

    return result
  }

  /**
   * Format text for step-by-step instructions
   */
  private formatStepByStep(text: string): string {
    const steps = ['First', 'Next', 'Then', 'After that', 'Finally']

    let stepIndex = 0
    return text.replace(/^\d+\.\s+/gm, () => {
      const step = steps[Math.min(stepIndex, steps.length - 1)]
      stepIndex++
      return `${step}, `
    })
  }

  /**
   * Clean up text
   */
  private cleanup(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces
      .replace(/\s+([.,;:!?])/g, '$1') // Spaces before punctuation
      .replace(/\.{4,}/g, '...') // Too many dots (pauses)
      .trim()
  }

  /**
   * Generate error response
   */
  generateErrorResponse(error: Error | string): string {
    const errorMessage = typeof error === 'string' ? error : error.message
    return this.generateResponse(
      `Sorry, I encountered an error: ${errorMessage}. Please try again or rephrase your request.`,
      {
        addNaturalPauses: true,
        conversational: true,
      }
    )
  }
}

// ============================================================================
// AbacusAIClient - Handles Abacus AI API calls
// ============================================================================

export class AbacusAIClient {
  private deploymentToken: string
  private deploymentId: string

  constructor() {
    this.deploymentToken = process.env.DEPLOYMENT_TOKEN || ''
    this.deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38'

    if (!this.deploymentToken) {
      console.error('Warning: DEPLOYMENT_TOKEN not set')
    }
  }

  /**
   * Query Abacus AI with a prompt
   */
  async query(prompt: string, context?: VoiceContext): Promise<string> {
    try {
      const messages = [
        {
          is_user: true,
          text: prompt,
        },
      ]

      const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentToken: this.deploymentToken,
          deploymentId: this.deploymentId,
          messages,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Abacus AI API error: ${errorData}`)
      }

      const data = await response.json()

      // Extract the last assistant message
      if (data.result?.messages && Array.isArray(data.result.messages)) {
        const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user)
        if (assistantMessages.length > 0) {
          return assistantMessages[assistantMessages.length - 1].text
        }
      }

      return 'No response from AI'
    } catch (error) {
      console.error('Abacus AI query error:', error)
      throw error
    }
  }
}

// ============================================================================
// VoiceActionRouter - Routes commands to appropriate handlers
// ============================================================================

export class VoiceActionRouter {
  private abacusClient: AbacusAIClient
  private responseGenerator: VoiceResponseGenerator
  private emergencyContacts: EmergencyContacts

  constructor() {
    this.abacusClient = new AbacusAIClient()
    this.responseGenerator = new VoiceResponseGenerator()
    this.emergencyContacts = {
      dispatch: process.env.EMERGENCY_DISPATCH || '911',
      supervisor: process.env.SUPERVISOR_PHONE || '',
      support: process.env.SUPPORT_PHONE || '',
    }
  }

  /**
   * Route command to appropriate handler
   */
  async route(command: ParsedCommand, context: VoiceContext = {}): Promise<VoiceResult> {
    console.log(`Voice command: ${command.type}`)
    console.log(`Parameters:`, command.parameters)

    try {
      let result: VoiceResult

      switch (command.type) {
        case CommandType.DOCUMENT:
          result = await this.handleDocumentation(command, context)
          break

        case CommandType.CITE:
          result = await this.handleCodeCitation(command, context)
          break

        case CommandType.DRAFT:
          result = await this.handleTemplate(command, context)
          break

        case CommandType.ANALYZE:
          result = await this.handlePhotoAnalysis(command, context)
          break

        case CommandType.HELP:
          result = await this.handleGuidance(command, context)
          break

        case CommandType.EMERGENCY:
          result = await this.handleEmergency(command, context)
          break

        case CommandType.QUERY:
          result = await this.handleQuery(command, context)
          break

        default:
          result = await this.handleUnknown(command, context)
      }

      return result
    } catch (error) {
      console.error('Voice command routing error:', error)
      return {
        success: false,
        action: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        voiceResponse: this.responseGenerator.generateErrorResponse(
          error instanceof Error ? error : new Error('Unknown error')
        ),
      }
    }
  }

  /**
   * Handle documentation command
   */
  private async handleDocumentation(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    const { damageType, timestamp } = command.parameters

    console.log(`Starting documentation for: ${damageType}`)

    const voiceResponse = this.responseGenerator.generateResponse(
      `Recording. Describe the ${damageType} damage you see.`,
      {
        addNaturalPauses: true,
        conversational: true,
      }
    )

    return {
      success: true,
      action: 'documentation_started',
      damageType,
      timestamp,
      voiceResponse,
      nextStep: 'awaiting_description',
      prompt: `Please describe the ${damageType} damage in detail.`,
    }
  }

  /**
   * Handle code citation command
   */
  private async handleCodeCitation(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    const { topic, codeType } = command.parameters

    console.log(`Looking up ${codeType} code for: ${topic}`)

    // Query Abacus AI for code citation
    const query = `What is the ${codeType} building code requirement for ${topic}? Provide the specific code section and requirements.`
    const citation = await this.abacusClient.query(query, context)

    const voiceResponse = this.responseGenerator.generateResponse(citation, {
      addNaturalPauses: true,
      emphasizeCodeSections: true,
      conversational: true,
      closing: 'Sending full citation to your phone.',
    })

    return {
      success: true,
      action: 'citation_provided',
      topic,
      codeType,
      citation,
      voiceResponse,
      sendToPhone: true,
    }
  }

  /**
   * Handle template/draft command
   */
  private async handleTemplate(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    const { templateType, insuranceCarrier } = command.parameters

    console.log(`Generating template: ${templateType}`)

    // Determine template context
    let templatePrompt = ''
    if (templateType.toLowerCase().includes('appeal')) {
      templatePrompt =
        `Generate a professional insurance claim appeal letter for ${insuranceCarrier || 'the insurance company'}. ` +
        `Include proper formatting, strong language supporting the claim, and relevant building codes.`
    } else if (templateType.toLowerCase().includes('estimate')) {
      templatePrompt = `Generate a roofing estimate template with line items, material costs, and labor breakdown.`
    } else if (templateType.toLowerCase().includes('email')) {
      templatePrompt = `Generate a professional email template for roofing communication.`
    } else {
      templatePrompt = `Generate a ${templateType} template for roofing professionals.`
    }

    // Get property address if available
    if (context.propertyAddress) {
      templatePrompt += ` Property address: ${context.propertyAddress}.`
    }

    // Generate template using Abacus AI
    const template = await this.abacusClient.query(templatePrompt, context)

    const voiceResponse = this.responseGenerator.generateResponse(
      `Generating ${templateType} for ${insuranceCarrier || 'your client'}. ${context.propertyAddress ? `Property at ${context.propertyAddress}.` : ''} Ready in 20 seconds.`,
      {
        addNaturalPauses: true,
        conversational: true,
      }
    )

    return {
      success: true,
      action: 'template_generated',
      templateType,
      insuranceCarrier,
      template,
      voiceResponse,
      requiresConfirmation: templateType.toLowerCase().includes('email'),
    }
  }

  /**
   * Handle photo analysis command
   */
  private async handlePhotoAnalysis(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    console.log('Requesting photo analysis')

    const voiceResponse = this.responseGenerator.generateResponse(
      'Ready for photo. Please take a photo or select from your gallery.',
      {
        addNaturalPauses: true,
        conversational: true,
      }
    )

    return {
      success: true,
      action: 'photo_requested',
      voiceResponse,
      nextStep: 'awaiting_photo',
      triggerPhotoCapture: true,
    }
  }

  /**
   * Handle guidance/help command
   */
  private async handleGuidance(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    const { topic } = command.parameters

    console.log(`Providing guidance on: ${topic}`)

    // Query Abacus AI for guidance
    const guidance = await this.abacusClient.query(
      `Provide step-by-step guidance on ${topic} for a roofing professional. Be concise and practical.`,
      context
    )

    const voiceResponse = this.responseGenerator.generateResponse(guidance, {
      addNaturalPauses: true,
      conversational: true,
      stepByStep: true,
    })

    return {
      success: true,
      action: 'guidance_provided',
      topic,
      guidance,
      voiceResponse,
    }
  }

  /**
   * Handle emergency command
   */
  private async handleEmergency(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    console.log('EMERGENCY COMMAND RECEIVED')

    const voiceResponse = this.responseGenerator.generateResponse(
      `Emergency assistance activated. For immediate help, call ${this.emergencyContacts.dispatch}. ${this.emergencyContacts.supervisor ? `Supervisor contact: ${this.emergencyContacts.supervisor}.` : ''} Your location has been logged.`,
      {
        addNaturalPauses: true,
        urgent: true,
        clear: true,
      }
    )

    return {
      success: true,
      action: 'emergency_activated',
      priority: 'high',
      contacts: this.emergencyContacts,
      location: context.location,
      voiceResponse,
      requiresImmediate: true,
    }
  }

  /**
   * Handle general query command
   */
  private async handleQuery(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    const { query } = command.parameters

    console.log(`Processing query: ${query}`)

    // Query Abacus AI
    const answer = await this.abacusClient.query(query, context)

    const voiceResponse = this.responseGenerator.generateResponse(answer, {
      addNaturalPauses: true,
      conversational: true,
    })

    return {
      success: true,
      action: 'query_answered',
      query,
      answer,
      voiceResponse,
    }
  }

  /**
   * Handle unknown command
   */
  private async handleUnknown(
    command: ParsedCommand,
    context: VoiceContext
  ): Promise<VoiceResult> {
    console.log(`Unknown command: ${command.originalText}`)

    const voiceResponse = this.responseGenerator.generateResponse(
      "I didn't catch that. You can ask me to document damage, cite building codes, draft templates, analyze photos, or ask questions. What would you like to do?",
      {
        addNaturalPauses: true,
        conversational: true,
      }
    )

    return {
      success: false,
      action: 'unknown_command',
      originalText: command.originalText,
      voiceResponse,
      suggestions: [
        'Document hail damage',
        'Cite flashing code',
        'Draft State Farm appeal',
        'Analyze photo',
        'Help with measurements',
      ],
    }
  }
}

// ============================================================================
// VoiceCommandHandler - Main handler class
// ============================================================================

export class VoiceCommandHandler {
  private parser: VoiceCommandParser
  private router: VoiceActionRouter
  private responseGenerator: VoiceResponseGenerator

  constructor() {
    this.parser = new VoiceCommandParser()
    this.router = new VoiceActionRouter()
    this.responseGenerator = new VoiceResponseGenerator()

    console.log('VoiceCommandHandler initialized')
  }

  /**
   * Process voice command end-to-end
   */
  async processCommand(transcript: string, context: VoiceContext = {}): Promise<CommandResult> {
    try {
      // Parse command
      const command = this.parser.parseCommand(transcript)
      console.log('Parsed command:', command.type)

      // Route command
      const result = await this.router.route(command, context)

      return {
        success: true,
        command,
        result,
        transcript,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      console.error('Voice command processing error:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        transcript,
        timestamp: new Date().toISOString(),
      }
    }
  }

  /**
   * Get command suggestions
   */
  getCommandSuggestions(): string[] {
    return [
      'Susan, document hail damage',
      'Susan, cite IRC flashing code',
      'Susan, draft State Farm appeal letter',
      'Susan, analyze photo',
      'Susan, help with roof measurements',
      'Susan, emergency contact',
    ]
  }

  /**
   * Get handler status
   */
  getStatus(): Record<string, any> {
    return {
      status: 'active',
      supportedCommands: Object.values(CommandType),
      parser: 'ready',
      router: 'ready',
      responseGenerator: 'ready',
    }
  }
}

// ============================================================================
// Factory function
// ============================================================================

export function createVoiceCommandHandler(): VoiceCommandHandler {
  return new VoiceCommandHandler()
}
