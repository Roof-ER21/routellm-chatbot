/**
 * Susan AI-21 Prompt Integration Helper
 *
 * This module provides helper functions to integrate the new Susan prompt system
 * with the existing chat route while maintaining backward compatibility.
 */

import { buildSystemPrompt } from './susan-prompts';
import { findMatchingTemplate, renderTemplate } from './response-templates';

// ========================================
// DETECTION UTILITIES
// ========================================

/**
 * Detects if user message requires Insurance Argumentation Mode
 */
export function detectInsuranceArgumentation(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const argumentationKeywords = [
    'partial approval',
    'partial approved',
    'only approved',
    'approved partial',
    'denied',
    'denial',
    'claim denied',
    'won\'t approve',
    'won\'t cover',
    'insurance won\'t',
    'adjuster won\'t',
    'adjuster says no',
    'need to fight',
    'counter-argument',
    'appeal',
    'dispute',
    'disagree with adjuster',
    'push back',
    'they\'re only paying',
    'only paying for'
  ];

  return argumentationKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detects if user message is about full approval
 */
export function detectFullApproval(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const fullApprovalKeywords = [
    'full approval',
    'fully approved',
    'total approval',
    'complete approval',
    'approved the whole',
    'approved everything',
    'approved full',
    'got full approval',
    'received full approval',
    'they approved the full',
    'insurance approved',
    'claim was approved'
  ];

  return fullApprovalKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detects if user message is about entrepreneurship/starting business
 */
export function detectEntrepreneurial(message: string): boolean {
  const lowerMessage = message.toLowerCase();

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
  ];

  return entrepreneurialKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Detects state from user message or context
 */
export function detectState(message: string, context?: any): string | undefined {
  const lowerMessage = message.toLowerCase();

  // State patterns
  const statePatterns = [
    { pattern: /(in|from|located|property in)\s+(virginia|va)/i, state: 'VA' },
    { pattern: /(in|from|located|property in)\s+(maryland|md)/i, state: 'MD' },
    { pattern: /(in|from|located|property in)\s+(pennsylvania|pa)/i, state: 'PA' }
  ];

  for (const { pattern, state } of statePatterns) {
    if (pattern.test(message)) {
      return state;
    }
  }

  // Check context if provided
  if (context?.state) {
    return context.state;
  }

  return undefined;
}

/**
 * Detects insurance company from message
 */
export function detectInsuranceCompany(message: string): string | undefined {
  const lowerMessage = message.toLowerCase();

  const companies = [
    'state farm',
    'allstate',
    'usaa',
    'farmers',
    'geico',
    'liberty mutual',
    'nationwide',
    'progressive',
    'travelers',
    'american family',
    'hartford',
    'safeco',
    'chubb'
  ];

  for (const company of companies) {
    if (lowerMessage.includes(company)) {
      // Capitalize properly
      return company.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
  }

  return undefined;
}

// ========================================
// PROMPT BUILDING
// ========================================

export interface PromptBuildOptions {
  userMessage: string;
  educationMode?: boolean;
  handsFreeMode?: boolean;
  voiceMode?: boolean;
  context?: {
    state?: string;
    company?: string;
    previousMessages?: any[];
  };
}

/**
 * Builds the appropriate system prompt based on message content and modes
 */
export function buildSusanPrompt(options: PromptBuildOptions): string {
  const { userMessage, educationMode, handsFreeMode, voiceMode, context } = options;

  // Detect scenarios
  const isArgumentation = detectInsuranceArgumentation(userMessage);
  const isFullApproval = detectFullApproval(userMessage);
  const isEntrepreneurial = detectEntrepreneurial(userMessage);

  // Build prompt with appropriate modes
  const prompt = buildSystemPrompt({
    insuranceArgumentation: isArgumentation,
    isFullApproval: isFullApproval,
    isEntrepreneurial: isEntrepreneurial,
    educationMode: educationMode,
    handsFreeMode: handsFreeMode || voiceMode
  });

  // Add contextual enhancements
  let enhancedPrompt = prompt;

  // Add state context if detected
  const state = detectState(userMessage, context);
  if (state && (isArgumentation || isFullApproval)) {
    enhancedPrompt += `\n\nCONTEXT: User is in ${state}. Prioritize ${state}-specific codes and regulations.`;
  }

  // Add company context if detected
  const company = detectInsuranceCompany(userMessage);
  if (company && (isArgumentation || isFullApproval)) {
    enhancedPrompt += `\n\nCONTEXT: User is working with ${company}. Consider company-specific tactics and procedures.`;
  }

  return enhancedPrompt;
}

// ========================================
// TEMPLATE MATCHING
// ========================================

export interface TemplateMatch {
  hasMatch: boolean;
  templateId?: string;
  category?: string;
  variables?: Record<string, any>;
}

/**
 * Attempts to match user message to a response template
 */
export function matchResponseTemplate(
  userMessage: string,
  context?: any
): TemplateMatch {
  const template = findMatchingTemplate(userMessage);

  if (!template) {
    return { hasMatch: false };
  }

  // Extract variables from message and context
  const variables: Record<string, any> = {};

  // Detect state
  const state = detectState(userMessage, context);
  if (state) variables.state = state;

  // Detect insurance company
  const company = detectInsuranceCompany(userMessage);
  if (company) variables.insurance_company = company;

  // Extract amounts (basic regex - can be enhanced)
  const amountMatches = userMessage.match(/\$(\d+,?\d*)/g);
  if (amountMatches && amountMatches.length >= 1) {
    variables.approved_amount = amountMatches[0].replace('$', '').replace(',', '');
  }
  if (amountMatches && amountMatches.length >= 2) {
    variables.requested_amount = amountMatches[1].replace('$', '').replace(',', '');
  }

  // Extract claim number
  const claimMatch = userMessage.match(/claim\s*#?(\w+)/i);
  if (claimMatch) {
    variables.claim_number = claimMatch[1];
  }

  // Context-based variables
  if (context) {
    Object.assign(variables, context);
  }

  return {
    hasMatch: true,
    templateId: template.id,
    category: template.category,
    variables
  };
}

// ========================================
// RESPONSE ENHANCEMENT
// ========================================

/**
 * Enhances AI response with template-based content if applicable
 */
export function enhanceResponse(
  originalResponse: string,
  templateMatch: TemplateMatch
): string {
  if (!templateMatch.hasMatch || !templateMatch.templateId) {
    return originalResponse;
  }

  // Check if we have all required variables
  const renderedTemplate = renderTemplate(
    templateMatch.templateId,
    templateMatch.variables || {}
  );

  if (renderedTemplate && !renderedTemplate.startsWith('ERROR:')) {
    // Use template response if rendering succeeded
    return renderedTemplate;
  }

  // Fall back to original response if template failed
  return originalResponse;
}

// ========================================
// CHAT ROUTE INTEGRATION HELPER
// ========================================

export interface ChatRouteIntegration {
  systemPrompt: string;
  templateMatch?: TemplateMatch;
  detectedModes: {
    argumentation: boolean;
    fullApproval: boolean;
    entrepreneurial: boolean;
  };
  detectedContext: {
    state?: string;
    company?: string;
  };
}

/**
 * Main integration function for chat route
 *
 * Usage in chat route:
 * ```typescript
 * const integration = integrateSusanPrompt({
 *   userMessage,
 *   educationMode,
 *   handsFreeMode,
 *   context: { state: 'VA', company: 'State Farm' }
 * });
 *
 * const systemPrompt = {
 *   role: 'system',
 *   content: integration.systemPrompt
 * };
 * ```
 */
export function integrateSusanPrompt(options: PromptBuildOptions): ChatRouteIntegration {
  const { userMessage, educationMode, handsFreeMode, voiceMode, context } = options;

  // Build system prompt
  const systemPrompt = buildSusanPrompt(options);

  // Attempt template matching
  const templateMatch = matchResponseTemplate(userMessage, context);

  // Detect modes for logging/analytics
  const detectedModes = {
    argumentation: detectInsuranceArgumentation(userMessage),
    fullApproval: detectFullApproval(userMessage),
    entrepreneurial: detectEntrepreneurial(userMessage)
  };

  // Detect context
  const detectedContext = {
    state: detectState(userMessage, context),
    company: detectInsuranceCompany(userMessage)
  };

  return {
    systemPrompt,
    templateMatch: templateMatch.hasMatch ? templateMatch : undefined,
    detectedModes,
    detectedContext
  };
}

// ========================================
// BACKWARD COMPATIBILITY HELPERS
// ========================================

/**
 * Checks if message matches old entrepreneurial detection
 * (for backward compatibility with existing chat route)
 */
export function isEntrepreneurialQuestion(message: string): boolean {
  return detectEntrepreneurial(message);
}

/**
 * Checks if message matches old full approval detection
 * (for backward compatibility with existing chat route)
 */
export function isFullApprovalScenario(message: string): boolean {
  return detectFullApproval(message);
}

// ========================================
// ANALYTICS & LOGGING
// ========================================

export interface PromptAnalytics {
  timestamp: Date;
  userMessage: string;
  modesDetected: string[];
  templateMatched?: string;
  stateDetected?: string;
  companyDetected?: string;
  educationMode: boolean;
  handsFreeMode: boolean;
}

/**
 * Creates analytics object for logging
 */
export function createPromptAnalytics(
  integration: ChatRouteIntegration,
  options: PromptBuildOptions
): PromptAnalytics {
  const modesDetected: string[] = [];

  if (integration.detectedModes.argumentation) modesDetected.push('argumentation');
  if (integration.detectedModes.fullApproval) modesDetected.push('full_approval');
  if (integration.detectedModes.entrepreneurial) modesDetected.push('entrepreneurial');
  if (options.educationMode) modesDetected.push('education');
  if (options.handsFreeMode || options.voiceMode) modesDetected.push('hands_free');

  return {
    timestamp: new Date(),
    userMessage: options.userMessage,
    modesDetected,
    templateMatched: integration.templateMatch?.templateId,
    stateDetected: integration.detectedContext.state,
    companyDetected: integration.detectedContext.company,
    educationMode: options.educationMode || false,
    handsFreeMode: options.handsFreeMode || options.voiceMode || false
  };
}

// ========================================
// EXAMPLE USAGE
// ========================================

/*
Example usage in chat route:

import { integrateSusanPrompt, enhanceResponse, createPromptAnalytics } from '@/lib/susan-prompt-integration';

// In your POST handler:
export async function POST(req: NextRequest) {
  const { messages, repName, sessionId, mode, handsFreeMode, educationMode } = await req.json();
  const userMessage = messages[messages.length - 1]?.content || '';

  // Integrate Susan prompt system
  const integration = integrateSusanPrompt({
    userMessage,
    educationMode,
    handsFreeMode,
    voiceMode: mode === 'voice',
    context: {
      // Add any context you have
      state: 'VA',
      company: 'State Farm'
    }
  });

  // Log analytics (optional)
  const analytics = createPromptAnalytics(integration, {
    userMessage,
    educationMode,
    handsFreeMode
  });
  console.log('[Susan Analytics]', analytics);

  // Build messages array with new system prompt
  const conversationalMessages = [
    {
      role: 'system',
      content: integration.systemPrompt
    },
    ...messages
  ];

  // Get AI response (your existing logic)
  const aiResponse = await getAIResponse(conversationalMessages);

  // Enhance response with template if matched
  const finalResponse = integration.templateMatch
    ? enhanceResponse(aiResponse.message, integration.templateMatch)
    : aiResponse.message;

  return NextResponse.json({
    message: finalResponse,
    model: aiResponse.model,
    // Include mode info for debugging
    susanMode: integration.detectedModes
  });
}
*/
