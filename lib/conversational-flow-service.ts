/**
 * Conversational Flow Service - Intelligent question gathering before email generation
 * Susan AI NEVER generates an email immediately - she gathers intelligence first
 */

export interface ConversationContext {
  emailType: string;
  recipientName: string;
  claimNumber?: string;
  initialDetails?: string;
  uploadedDocuments?: string;
  documentAnalysis?: any;
}

export interface GatheredIntelligence {
  situation: string;
  evidence: string[];
  specificIssues: string[];
  jurisdiction?: string;
  manufacturerInfo?: string;
  timeline?: string;
  previousCommunication?: string;
  homeownerConcerns?: string;
  [key: string]: any;
}

export interface ConversationStep {
  question: string;
  reasoning: string;
  expectedInfo: string[];
  followUpQuestions?: (response: string) => string[];
}

/**
 * Generate initial questions based on email type
 */
export function getInitialQuestions(context: ConversationContext): ConversationStep[] {
  const isAdjusterEmail = context.emailType.toLowerCase().includes('adjuster') ||
                          context.emailType.toLowerCase().includes('denial') ||
                          context.emailType.toLowerCase().includes('reinspection') ||
                          context.emailType.toLowerCase().includes('supplement');

  const isHomeownerEmail = context.emailType.toLowerCase().includes('homeowner');

  if (isAdjusterEmail) {
    return getAdjusterEmailQuestions(context);
  } else if (isHomeownerEmail) {
    return getHomeownerEmailQuestions(context);
  } else {
    return getGeneralQuestions(context);
  }
}

/**
 * Adjuster email questions - focus on EVIDENCE and FACTS
 */
function getAdjusterEmailQuestions(context: ConversationContext): ConversationStep[] {
  const questions: ConversationStep[] = [
    {
      question: `I'll help you craft a winning argument for ${context.recipientName}. First, let me understand the situation:\n\n1. What did the adjuster approve or deny? (e.g., "front slope only", "partial payment for 15 squares", "full denial - cosmetic damage")\n2. What's the main issue you need to address? (matching shingles, code violations, storm damage verification, depreciation, etc.)\n3. Do you have documentation ready? (photos, estimates, weather reports, iTel data)`,
      reasoning: "Need to understand what we're fighting for and what evidence exists",
      expectedInfo: [
        "Adjuster's decision (approved/denied/partial)",
        "Core issue to address",
        "Available documentation"
      ]
    }
  ];

  return questions;
}

/**
 * Homeowner email questions - focus on CONCERNS and STATUS
 */
function getHomeownerEmailQuestions(context: ConversationContext): ConversationStep[] {
  const questions: ConversationStep[] = [
    {
      question: `I'll create a reassuring update for ${context.recipientName}. Let me understand the situation:\n\n1. What is the homeowner worried about? (claim delay, partial approval, confusing insurance jargon, payment timing)\n2. Where are we in the claim process? (waiting for adjuster, appealing denial, approved and scheduling work)\n3. Communication preference: Do they want technical details about codes and regulations, or simple reassurance that we're handling it?`,
      reasoning: "Need to understand homeowner's emotional state and information needs",
      expectedInfo: [
        "Homeowner's primary concern",
        "Claim status",
        "Communication style preference"
      ]
    }
  ];

  return questions;
}

/**
 * General questions for other email types
 */
function getGeneralQuestions(context: ConversationContext): ConversationStep[] {
  return [
    {
      question: `I'll help you with this ${context.emailType}. To create the most effective email:\n\n1. What's the main purpose of this email?\n2. What action do you want ${context.recipientName} to take?\n3. What background information should they know?`,
      reasoning: "Need to understand purpose and desired outcome",
      expectedInfo: [
        "Email purpose",
        "Desired action",
        "Background context"
      ]
    }
  ];
}

/**
 * Generate follow-up questions based on initial responses
 */
export function generateFollowUpQuestions(
  context: ConversationContext,
  intelligence: Partial<GatheredIntelligence>
): ConversationStep[] {
  const isAdjusterEmail = context.emailType.toLowerCase().includes('adjuster') ||
                          context.emailType.toLowerCase().includes('denial');

  if (!isAdjusterEmail) {
    // For homeowner emails, we usually have enough after first round
    return [];
  }

  const followUps: ConversationStep[] = [];

  // If partial approval mentioned, ask for specifics
  if (intelligence.situation?.toLowerCase().includes('partial') ||
      intelligence.situation?.toLowerCase().includes('slope')) {
    followUps.push({
      question: `Got it - partial approval situation. A few more details:\n\n1. What slope(s) or areas were approved vs denied?\n2. What jurisdiction is this property in? (State/county - needed for building code citations)\n3. Are there manufacturer matching requirements for this shingle brand?`,
      reasoning: "Need specific scope and jurisdiction for code citations",
      expectedInfo: [
        "Approved vs denied areas",
        "Jurisdiction for codes",
        "Manufacturer requirements"
      ]
    });
  }

  // If denial mentioned, ask about reason
  if (intelligence.situation?.toLowerCase().includes('denial') ||
      intelligence.situation?.toLowerCase().includes('denied')) {
    followUps.push({
      question: `Denial situation - let me get the specifics:\n\n1. What reason did they give for the denial? (cosmetic damage, wear and tear, pre-existing, etc.)\n2. Do you have evidence contradicting their reason? (photos showing functional damage, iTel hail data, etc.)\n3. What building codes apply in this jurisdiction?`,
      reasoning: "Need to understand denial reasoning to build counter-argument",
      expectedInfo: [
        "Denial reason",
        "Counter-evidence",
        "Applicable codes"
      ]
    });
  }

  // If storm damage mentioned, ask for verification
  if (intelligence.situation?.toLowerCase().includes('storm') ||
      intelligence.situation?.toLowerCase().includes('hail') ||
      intelligence.situation?.toLowerCase().includes('wind')) {
    followUps.push({
      question: `Storm damage claim - verification details:\n\n1. Do you have iTel weather verification? (date and hail size)\n2. How many impact points are documented? (specific count strengthens the argument)\n3. Did you document any test squares or repair attempts?`,
      reasoning: "Storm claims need strong verification evidence",
      expectedInfo: [
        "iTel data",
        "Impact documentation",
        "Test square evidence"
      ]
    });
  }

  // If they mentioned "cosmetic", that's a red flag - ask about functional damage
  if (intelligence.situation?.toLowerCase().includes('cosmetic')) {
    followUps.push({
      question: `"Cosmetic" is insurance-speak for denial. Let's build the functional damage argument:\n\n1. Do you have photos showing granule loss, mat exposure, or seal damage?\n2. Are there any leaks or water intrusion documented?\n3. Can you document compromised waterproofing integrity? (broken seals, missing granules in specific areas)`,
      reasoning: "Need to convert 'cosmetic' to 'functional damage' with evidence",
      expectedInfo: [
        "Functional damage photos",
        "Leak documentation",
        "Waterproofing compromise"
      ]
    });
  }

  return followUps;
}

/**
 * Determine if we have enough intelligence to generate email
 */
export function hasEnoughIntelligence(intelligence: Partial<GatheredIntelligence>): boolean {
  // Must have at least situation and some evidence/issues
  return !!(
    intelligence.situation &&
    (intelligence.evidence?.length || intelligence.specificIssues?.length)
  );
}

/**
 * Build comprehensive prompt for email generation with gathered intelligence
 */
export function buildEnhancedEmailPrompt(
  context: ConversationContext,
  intelligence: GatheredIntelligence,
  selectedTemplate?: any,
  selectedArguments?: any[]
): string {
  const isAdjusterEmail = context.emailType.toLowerCase().includes('adjuster') ||
                          context.emailType.toLowerCase().includes('denial');

  let prompt = `You are Susan AI-21, a roofing insurance claims expert. Generate a POWERFUL, PERSUASIVE, FACT-BASED email that WINS arguments.

**CRITICAL MISSION:** Create an evidence-based email using the FACT-VALUE-POLICY structure. This is NOT a generic template - this is a precision-engineered argument designed to WIN.

**EMAIL DETAILS:**
- Type: ${context.emailType}
- Recipient: ${context.recipientName} ${isAdjusterEmail ? '(INSURANCE ADJUSTER)' : '(HOMEOWNER)'}
- Claim: ${context.claimNumber || 'Not specified'}
- Rep: [REP_NAME]

**GATHERED INTELLIGENCE:**
Situation: ${intelligence.situation}

Evidence Available:
${intelligence.evidence?.map(e => `• ${e}`).join('\n') || '• No specific evidence listed'}

Specific Issues:
${intelligence.specificIssues?.map(i => `• ${i}`).join('\n') || '• No specific issues listed'}

${intelligence.jurisdiction ? `Jurisdiction: ${intelligence.jurisdiction}` : ''}
${intelligence.manufacturerInfo ? `Manufacturer: ${intelligence.manufacturerInfo}` : ''}
${intelligence.timeline ? `Timeline: ${intelligence.timeline}` : ''}
${intelligence.previousCommunication ? `Previous Communication: ${intelligence.previousCommunication}` : ''}

`;

  // Add template information if selected
  if (selectedTemplate) {
    prompt += `**TEMPLATE SELECTED:**
Template: "${selectedTemplate.template_name}"
Success Rate: ${selectedTemplate.success_indicators?.approval_rate || 85}%
Usage Count: ${selectedTemplate.success_indicators?.usage_count || 0} successful uses
Tone: ${selectedTemplate.tone}

`;
  }

  // Add argument information if selected
  if (selectedArguments && selectedArguments.length > 0) {
    prompt += `**ARGUMENTS TO INTEGRATE:**
${selectedArguments.map(arg => `
Argument: ${arg.title}
Success Rate: ${arg.successRate}%
Full Text: ${arg.fullText}
Supporting Evidence: ${arg.supportingEvidence?.join(', ')}
`).join('\n')}

`;
  }

  // Add structure instructions for adjuster emails
  if (isAdjusterEmail) {
    prompt += `**REQUIRED STRUCTURE - FACT-VALUE-POLICY:**

1. FACT STATEMENT (Objective Reality):
   - Start with concrete, verifiable facts
   - Example: "The inspection documented 47 hail impacts across 850 sq ft on the north slope, as shown in the attached 24-photo documentation package."
   - Include specific numbers, measurements, dates
   - Reference attached documentation explicitly

2. VALUE STATEMENT (Why Facts Matter):
   - Connect facts to building codes, manufacturer requirements, or industry standards
   - Example: "This level of damage compromises waterproofing integrity per NRCA guidelines and violates IRC R908.3 matching requirements."
   - Cite CODE TEXT VERBATIM with section numbers
   - Explain consequences of non-compliance

3. POLICY REQUEST (What Must Happen):
   - Make a clear, specific demand based on facts and values
   - Example: "I request approval for full roof replacement per the attached estimate totaling $18,500."
   - Professional but firm language: "I respectfully request" not "you must"
   - Reference timeline or next steps

**CITATIONS REQUIRED:**
You MUST include VERBATIM code text, not summaries:
✅ CORRECT: "IRC Section R908.3 states: 'Reroofing shall be permitted when the existing roof has not more than one application of any type of roof covering...Replacement materials must match the existing roof covering in color, size, and quality.'"

❌ WRONG: "IRC R908.3 requires matching materials"

**SUPPORTING DOCUMENTATION:**
List all attachments explicitly:
1. Photo_Documentation.pdf - [Description]
2. IRC_R908.3_Code_Citation.pdf
3. Manufacturer_Specifications.pdf
4. iTel_Weather_Verification.pdf (if storm damage)
5. [Other relevant docs]

**TONE:**
- Firm on facts, warm in delivery
- Professional confidence, not aggression
- "We need" not "we demand"
- "I respectfully request" not "you must comply"
- Destroy with kindness, facts, and evidence

**QUALITY CHECKS:**
❌ NO emotional appeals ("imagine how the homeowner feels")
❌ NO scheduling calls or meetings (EXCEPT reinspection requests)
❌ NO Roof-ER service promotion
✅ MUST cite building codes with section numbers
✅ MUST quote code text verbatim
✅ MUST list supporting documentation
✅ MUST make clear policy request
✅ MUST follow fact-value-policy structure

`;
  } else {
    // Homeowner email structure
    prompt += `**HOMEOWNER EMAIL STRUCTURE:**

1. Warm Greeting: "Hi [First Name],"

2. What Happened: Explain situation in simple, non-technical terms
   - Avoid insurance jargon
   - Focus on what it means for THEM

3. What It Means: Educate without overwhelming
   - Simple code explanation if relevant
   - Why this matters to their home

4. What We're Doing: Specific action items
   - List 2-4 concrete actions you're taking
   - Include timeline expectations

5. What They Need to Do: Usually NOTHING
   - Make this clear if true
   - Or give simple, specific instructions if action needed

6. Reassurance: Build confidence
   - "We've handled this situation many times"
   - "The facts are on our side"
   - Professional expertise without bragging

7. Availability: "Call or text me anytime with questions"

8. Encouraging Close: "You're in good hands - we've got this!"

**TONE:**
- Warm, supportive, confident
- Simple language (8th grade reading level)
- Reassuring without being condescending
- Action-oriented ("here's what I'm doing for you")

`;
  }

  prompt += `
**OUTPUT FORMAT:**
Return ONLY a JSON object (no markdown code blocks, no extra text):

{
  "subject": "Clear, specific subject line",
  "body": "Complete email body with greeting, fact-value-policy structure, and signature",
  "explanation": "2-3 sentences explaining why this approach works, including template success rate and arguments used",
  "templateUsed": "${selectedTemplate?.template_name || 'Custom'}",
  "argumentsUsed": ["Argument 1 name", "Argument 2 name"],
  "successIndicators": {
    "templateSuccessRate": ${selectedTemplate?.success_indicators?.approval_rate || 85},
    "averageResponseTime": "${selectedTemplate?.success_indicators?.avg_response_time || '7-15 days'}"
  }
}

Generate the email now.`;

  return prompt;
}

/**
 * Parse intelligence from user responses
 */
export function parseIntelligenceFromResponse(
  response: string,
  currentIntelligence: Partial<GatheredIntelligence>
): Partial<GatheredIntelligence> {
  const updated = { ...currentIntelligence };

  // Parse situation if not set
  if (!updated.situation) {
    updated.situation = response;
  }

  // Extract evidence mentions
  const evidenceKeywords = ['photo', 'estimate', 'iTel', 'weather', 'report', 'documentation'];
  evidenceKeywords.forEach(keyword => {
    if (response.toLowerCase().includes(keyword) && !updated.evidence?.includes(keyword)) {
      updated.evidence = updated.evidence || [];
      updated.evidence.push(keyword);
    }
  });

  // Extract jurisdiction
  const stateMatch = response.match(/\b(VA|MD|PA|Virginia|Maryland|Pennsylvania)\b/i);
  if (stateMatch && !updated.jurisdiction) {
    updated.jurisdiction = stateMatch[1].toUpperCase();
  }

  // Extract manufacturer mentions
  const manufacturers = ['GAF', 'Owens Corning', 'CertainTeed', 'Tamko', 'Atlas'];
  manufacturers.forEach(mfr => {
    if (response.includes(mfr) && !updated.manufacturerInfo) {
      updated.manufacturerInfo = mfr;
    }
  });

  // Extract specific issues
  const issueKeywords = [
    'matching', 'partial', 'denial', 'cosmetic', 'depreciation',
    'code violation', 'slope', 'hail', 'storm', 'leak'
  ];

  updated.specificIssues = updated.specificIssues || [];
  issueKeywords.forEach(keyword => {
    if (response.toLowerCase().includes(keyword) && !updated.specificIssues?.includes(keyword)) {
      updated.specificIssues?.push(keyword);
    }
  });

  return updated;
}
