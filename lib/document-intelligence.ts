/**
 * Document Intelligence Library
 *
 * Smart prompts and analysis functions for:
 * - Denial letters
 * - Estimate comparisons
 * - Email analysis
 * - Claims packages
 */

export interface DenialAnalysisResult {
  deniedItems: Array<{
    item: string;
    amount: string;
    reason: string;
    supplementPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  approvedItems: Array<{
    item: string;
    amount: string;
  }>;
  totalDenied: string;
  totalApproved: string;
  actionItems: string[];
  strategy: string;
  nextSteps: string[];
}

export interface EstimateComparisonResult {
  missingItems: Array<{
    item: string;
    estimatedValue: string;
  }>;
  priceDifferences: Array<{
    item: string;
    adjusterPrice: string;
    contractorPrice: string;
    difference: string;
  }>;
  scopeGaps: string[];
  totalShortfall: string;
  recommendations: string[];
}

export interface EmailAnalysisResult {
  sender: string;
  subject: string;
  actionItems: Array<{
    task: string;
    deadline: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  keyContacts: Array<{
    name: string;
    role: string;
    phone?: string;
    email?: string;
  }>;
  sentiment: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  responseTemplate: string;
}

export interface ClaimsPackageResult {
  claimOverview: {
    claimNumber?: string;
    policyNumber?: string;
    propertyAddress?: string;
    dateOfLoss?: string;
    totalEstimate?: string;
    approved?: string;
    denied?: string;
  };
  timeline: Array<{
    date: string;
    event: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  strategy: string[];
  nextSteps: string[];
}

/**
 * Generate prompts for Abacus AI based on analysis type
 */
export class DocumentIntelligence {

  /**
   * Denial Letter Analysis Prompt
   */
  static getDenialLetterPrompt(extractedText: string): string {
    return `You are an expert insurance claim analyst reviewing a DENIAL LETTER. Analyze this document and provide a structured response.

DOCUMENT TEXT:
${extractedText}

Please analyze this denial letter and provide the following information in a clear, structured format:

## DENIED ITEMS
For each denied item, provide:
- Item description
- Dollar amount
- Specific denial reason
- Supplement potential (HIGH/MEDIUM/LOW) with brief justification

## APPROVED ITEMS
For each approved item, provide:
- Item description
- Dollar amount

## TOTALS
- Total Denied: $X,XXX
- Total Approved: $X,XXX

## ACTION ITEMS
List specific actions the contractor should take to overcome these denials (numbered list)

## SUPPLEMENT POTENTIAL ASSESSMENT
For each HIGH or MEDIUM potential item, explain:
- Why there's potential to recover
- What evidence/documentation is needed
- Strategy to challenge the denial

## RECOMMENDED STRATEGY
Provide a 2-3 sentence strategy for how to approach this denial

## NEXT STEPS
Numbered list of immediate next steps (prioritized)

Please be specific with dollar amounts and denial reasons. Focus on actionable insights.`;
  }

  /**
   * Estimate Comparison Prompt
   */
  static getEstimateComparisonPrompt(extractedTexts: string[]): string {
    const [adjusterText, contractorText] = extractedTexts;

    return `You are an expert insurance claim analyst comparing two estimates. Analyze these documents to find discrepancies and missing items.

ADJUSTER ESTIMATE:
${adjusterText}

CONTRACTOR ESTIMATE:
${contractorText || 'Not provided - analyze what might be missing from adjuster estimate'}

Please provide a comprehensive comparison in this format:

## MISSING ITEMS FROM ADJUSTER ESTIMATE
List items that appear in contractor estimate but NOT in adjuster estimate:
- Item name | Estimated value: $XXX
(If only one estimate provided, identify likely missing items based on industry standards)

## PRICE DIFFERENCES
For items in both estimates, identify significant price gaps:
- Item | Adjuster: $XXX | Contractor: $XXX | Difference: $XXX

## SCOPE GAPS
Identify differences in:
- Square footage measurements
- Quality of materials specified
- Scope of work covered
- Any exclusions or limitations

## TOTAL POTENTIAL RECOVERY
Calculate total shortfall: $X,XXX

Breakdown:
- Missing items: $X,XXX
- Price differences: $X,XXX
- Scope adjustments: $X,XXX

## RECOMMENDATIONS FOR SUPPLEMENT
Provide specific recommendations:
1. Priority items to include in supplement request
2. Documentation needed to support each item
3. Market rate justifications needed
4. Re-measurement requirements

Be specific with dollar amounts and item descriptions.`;
  }

  /**
   * Email Analysis Prompt
   */
  static getEmailAnalysisPrompt(extractedText: string): string {
    return `You are an expert communication analyst reviewing an EMAIL or LETTER. Extract key information and provide actionable insights.

EMAIL/LETTER TEXT:
${extractedText}

Please analyze this communication and provide:

## SENDER INFORMATION
- From: Name
- Role: (e.g., Adjuster, Homeowner, Manager)
- Contact: Phone and/or Email (if available)

## SUBJECT/TOPIC
Brief description of the main subject

## ACTION ITEMS & DEADLINES
For each action item:
- Task description
- Deadline (or "ASAP" if urgent but no date given)
- Priority (HIGH/MEDIUM/LOW)

## KEY CONTACTS
Extract all contact information mentioned:
- Name | Role | Phone | Email

## CLAIM INFORMATION
Extract if present:
- Claim number
- Policy number
- Property address
- Date of loss
- Scheduled dates (inspections, etc.)

## SENTIMENT ANALYSIS
- Overall tone: (Professional/Friendly/Firm/Frustrated/etc.)
- Urgency level: HIGH/MEDIUM/LOW
- Openness to negotiation: (Open/Moderate/Resistant)
- Recommended approach: Brief guidance on how to respond

## RESPONSE TEMPLATE
Provide a professional response template that:
- Addresses all action items
- Maintains appropriate tone
- Includes necessary follow-up items
- Is ready to personalize and send

Be thorough in extracting all actionable information.`;
  }

  /**
   * Claims Package Analysis Prompt
   */
  static getClaimsPackagePrompt(documents: Array<{ fileName: string; text: string }>): string {
    const documentsList = documents.map((doc, i) =>
      `\n=== DOCUMENT ${i + 1}: ${doc.fileName} ===\n${doc.text}`
    ).join('\n\n');

    return `You are an expert insurance claim analyst reviewing a COMPLETE CLAIMS PACKAGE. Analyze all documents together to provide a comprehensive claim assessment.

DOCUMENTS IN PACKAGE:
${documentsList}

Please provide a comprehensive analysis in this format:

## CLAIM OVERVIEW
Extract and summarize:
- Claim Number
- Policy Number
- Property Address
- Date of Loss
- Insurance Company
- Adjuster Name & Contact
- Initial Estimate Amount
- Approved Amount
- Denied Amount

## CLAIM TIMELINE
Create a chronological timeline of events:
- Date | Event description

## DOCUMENT INVENTORY
List what documents are included:
- Denial letters
- Estimates
- Photos
- Correspondence
- Other documents

## CLAIM STRENGTHS
Identify positive aspects:
- Strong documentation
- Clear evidence
- Timely reporting
- Good photo coverage
- Other strengths

## CLAIM WEAKNESSES
Identify gaps or issues:
- Missing documentation
- Incomplete measurements
- Poor photo coverage
- Delayed reporting
- Insufficient evidence
- Other weaknesses

## DENIED ITEMS ANALYSIS
For each denied item:
- Item | Amount | Reason | Supplement Potential (HIGH/MEDIUM/LOW)

## MISSING ITEMS ANALYSIS
Items that should be included but weren't mentioned:
- Item | Estimated value | Why it should be covered

## COMPREHENSIVE STRATEGY
Provide 3-5 strategic recommendations for maximizing this claim

## PRIORITY ACTION ITEMS
Numbered list of immediate next steps (in priority order):
1. Most critical action
2. Second priority
3. etc.

## SUPPLEMENT POTENTIAL SUMMARY
- High Priority Items: $X,XXX
- Medium Priority Items: $X,XXX
- Low Priority Items: $X,XXX
- Total Potential Recovery: $X,XXX

## RECOMMENDED TIMELINE
Suggested timeline for next steps:
- Week 1: Actions
- Week 2: Actions
- etc.

Be comprehensive and provide specific, actionable insights.`;
  }

  /**
   * Smart Analysis (Auto-detect) Prompt
   */
  static getSmartAnalysisPrompt(documents: Array<{ fileName: string; text: string; type: string }>): string {
    const documentsList = documents.map((doc, i) =>
      `\n=== DOCUMENT ${i + 1}: ${doc.fileName} (${doc.type}) ===\n${doc.text}`
    ).join('\n\n');

    return `You are an expert insurance claim analyst. Analyze these documents and automatically detect what type of analysis is most appropriate.

DOCUMENTS:
${documentsList}

INSTRUCTIONS:
1. First, identify the document type(s):
   - Denial letter
   - Insurance estimate
   - Contractor estimate
   - Email/correspondence
   - Photo damage report
   - Claims package (multiple types)
   - Other

2. Then provide the most relevant analysis based on what you found:
   - If denial letter: Extract denied items, amounts, reasons, supplement potential
   - If estimates: Compare and find missing items, price gaps, scope differences
   - If email: Extract action items, deadlines, key contacts, create response template
   - If mixed documents: Provide comprehensive claims package analysis

3. Structure your response with clear sections:
   - Document Type Detected
   - Key Findings (most important insights)
   - Detailed Analysis (specific to document type)
   - Action Items (what the contractor should do next)
   - Recommendations (strategic advice)

4. Always include specific dollar amounts when available.

5. Focus on actionable insights that help the contractor maximize the claim.

Provide a thorough, professional analysis.`;
  }

  /**
   * Format analysis results for chat display
   */
  static formatForChat(analysisType: string, aiResponse: string): string {
    const timestamp = new Date().toLocaleString();

    let header = '';
    switch (analysisType) {
      case 'denial_letter':
        header = '❌ DENIAL LETTER ANALYSIS';
        break;
      case 'estimate_comparison':
        header = '💰 ESTIMATE COMPARISON ANALYSIS';
        break;
      case 'email_analysis':
        header = '📧 EMAIL ANALYSIS';
        break;
      case 'claims_package':
        header = '📦 FULL CLAIMS PACKAGE ANALYSIS';
        break;
      default:
        header = '✨ SMART DOCUMENT ANALYSIS';
    }

    return `${header}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${aiResponse}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Analysis completed: ${timestamp}`;
  }

  /**
   * Detect document type from text content
   */
  static detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();

    // Count keyword matches
    const scores = {
      denial_letter: 0,
      estimate: 0,
      email: 0,
      supplement: 0,
      policy: 0
    };

    // Denial letter keywords
    const denialKeywords = ['denied', 'rejection', 'not covered', 'excluded', 'decline', 'cannot approve'];
    denialKeywords.forEach(kw => {
      if (lowerText.includes(kw)) scores.denial_letter += 2;
    });

    // Estimate keywords
    const estimateKeywords = ['line item', 'quantity', 'unit price', 'total', 'square', 'labor', 'material'];
    estimateKeywords.forEach(kw => {
      if (lowerText.includes(kw)) scores.estimate += 1;
    });

    // Email keywords
    const emailKeywords = ['from:', 'to:', 'subject:', 're:', 'dear', 'sincerely'];
    emailKeywords.forEach(kw => {
      if (lowerText.includes(kw)) scores.email += 2;
    });

    // Supplement keywords
    const supplementKeywords = ['supplement', 'additional', 'missed items', 'revised estimate'];
    supplementKeywords.forEach(kw => {
      if (lowerText.includes(kw)) scores.supplement += 2;
    });

    // Return type with highest score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'unknown';

    const detectedType = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore);
    return detectedType || 'unknown';
  }

  /**
   * Extract dollar amounts from text
   */
  static extractDollarAmounts(text: string): string[] {
    const dollarRegex = /\$[\d,]+\.?\d*/g;
    const matches = text.match(dollarRegex);
    return matches || [];
  }

  /**
   * Extract dates from text
   */
  static extractDates(text: string): string[] {
    const dateRegex = /\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/g;
    const matches = text.match(dateRegex);
    return matches || [];
  }

  /**
   * Extract claim/policy numbers
   */
  static extractClaimNumbers(text: string): { claim?: string; policy?: string } {
    const result: { claim?: string; policy?: string } = {};

    const claimMatch = text.match(/claim\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i);
    if (claimMatch) result.claim = claimMatch[1];

    const policyMatch = text.match(/policy\s*(?:number|#|no\.?)[\s:]*([A-Z0-9-]+)/i);
    if (policyMatch) result.policy = policyMatch[1];

    return result;
  }
}

export default DocumentIntelligence;
