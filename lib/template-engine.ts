/**
 * Auto-Complete Templates System - TypeScript Port for Next.js
 *
 * Intelligent template system that generates complete, ready-to-send documents
 * from minimal input. Integrates with Abacus AI for professional enhancement.
 *
 * Features:
 * - 10 core insurance document templates
 * - AI-powered template selection
 * - Automatic data extraction from context
 * - Professional enhancement layer via Abacus AI
 * - Format validation
 * - Quick input and conversational modes
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Template {
  name: string
  description: string
  keywords: string[]
  variables: string[]
  requiredData: string[]
  priority: number
  template: string
}

export interface TemplateInfo {
  key: string
  name: string
  description: string
  priority: number
}

export interface ValidationResults {
  isValid: boolean
  score: number
  issues: string[]
  warnings: string[]
  suggestions: string[]
  readyToSend?: boolean
}

export interface GenerationResult {
  success: boolean
  document: string | null
  template: string
  templateKey: string
  variables: Record<string, string>
  missingVariables: string[]
  validation: ValidationResults
  readyToSend: boolean
  suggestedEdits: string[]
  error?: string
}

export interface TemplateContext {
  property?: {
    address?: string
  }
  claim?: {
    number?: string
    adjusterName?: string
    denialDate?: string
  }
  user?: {
    phone?: string
    email?: string
    name?: string
  }
  conversationHistory?: Array<{ role: string; content: string }>
  photos?: string[]
  previousTemplate?: string
}

// ============================================================================
// TEMPLATE LIBRARY
// ============================================================================

export class TemplateLibrary {
  templates: Record<string, Template>

  constructor() {
    this.templates = {
      partial_denial_appeal: {
        name: 'Partial Denial Appeal',
        description: 'Appeal when insurance company partially denies a claim',
        keywords: ['partial', 'denial', 'appeal', 'denied', 'not approved'],
        variables: [
          'property_address',
          'denial_date',
          'adjuster_name',
          'denial_reason',
          'damage_type',
          'evidence_list',
          'code_citation',
          'code_explanation',
          'violation_explanation',
          'manufacturer',
          'spec_reference',
          'manufacturer_requirement',
          'recommended_solution',
          'requested_scope',
          'contact_info',
          'signature',
          'photo_count'
        ],
        requiredData: ['photos', 'estimate', 'code_citations'],
        priority: 1,
        template: `Subject: Appeal of Partial Denial - {{property_address}}

{{adjuster_name}},

I am writing to formally appeal the partial denial issued on {{denial_date}} for the insurance claim at {{property_address}}.

## Basis for Appeal

The denial states that {{denial_reason}}. However, this determination contradicts the following evidence and building code requirements:

### Documented Evidence
{{evidence_list}}

### Building Code Requirements
Per IRC {{code_citation}}, {{code_explanation}}. The current damage violates this code section because {{violation_explanation}}.

### Manufacturer Specifications
{{manufacturer}} states in their installation guidelines ({{spec_reference}}) that {{manufacturer_requirement}}. This supports the necessity for {{recommended_solution}}.

## Requested Action

Based on the evidence and code requirements outlined above, I respectfully request that you:
1. Approve coverage for {{requested_scope}}
2. Schedule a reinspection with a qualified inspector
3. Provide written justification if this appeal is denied

I am available at {{contact_info}} to discuss this matter further.

Professionally,
{{signature}}

Attachments:
- Detailed photo documentation ({{photo_count}} images)
- Building code citations
- Manufacturer specifications
- Original estimate with line-item breakdown`
      },

      full_denial_appeal: {
        name: 'Full Denial Appeal',
        description: 'Appeal when insurance company fully denies a claim',
        keywords: ['full denial', 'denied', 'rejected', 'not covered', 'complete denial'],
        variables: [
          'property_address',
          'claim_number',
          'denial_date',
          'adjuster_name',
          'denial_reason',
          'policy_number',
          'storm_date',
          'damage_description',
          'code_violations',
          'expert_opinion',
          'comparable_claims',
          'policy_coverage',
          'contact_info',
          'signature',
          'attachment_count'
        ],
        requiredData: ['photos', 'policy', 'expert_report'],
        priority: 1,
        template: `Subject: Formal Appeal of Full Claim Denial - Claim #{{claim_number}}

{{adjuster_name}},

I am formally appealing the full denial of claim #{{claim_number}} for the property located at {{property_address}}, as communicated on {{denial_date}}.

## Policy Coverage Analysis

Policy #{{policy_number}} explicitly covers storm damage from the {{storm_date}} event. The denial reason stating "{{denial_reason}}" does not align with the following facts:

### Damage Documentation
{{damage_description}}

All damage documented is a direct result of the covered storm event and was not pre-existing.

### Building Code Violations
{{code_violations}}

### Expert Assessment
{{expert_opinion}}

### Comparable Claims
Similar claims in this area from the same storm event have been approved, including:
{{comparable_claims}}

## Policy Language

Section {{policy_coverage}} of my policy specifically covers this type of damage. The denial contradicts the explicit coverage outlined in my policy.

## Required Action

I request:
1. Immediate reversal of this denial decision
2. Full approval of the claim as submitted
3. Assignment of a qualified inspector for reinspection
4. Written explanation if this appeal is denied, citing specific policy exclusions

I am prepared to escalate this matter to the Insurance Commissioner if necessary. Please contact me at {{contact_info}} within 10 business days.

Professionally,
{{signature}}

Enclosures ({{attachment_count}}):
- Complete photo documentation
- Independent expert report
- Policy coverage sections
- Storm verification data
- Comparable approved claims`
      },

      supplemental_claim: {
        name: 'Supplemental Claim Request',
        description: 'Request additional coverage for items missed in original estimate',
        keywords: ['supplemental', 'additional', 'missed', 'not included', 'supplement'],
        variables: [
          'property_address',
          'claim_number',
          'adjuster_name',
          'original_estimate_date',
          'missed_items',
          'discovery_explanation',
          'code_requirements',
          'additional_cost',
          'contractor_name',
          'timeline_impact',
          'contact_info',
          'signature'
        ],
        requiredData: ['photos', 'original_estimate', 'supplemental_estimate'],
        priority: 2,
        template: `Subject: Supplemental Claim Request - {{property_address}}

{{adjuster_name}},

This letter serves as a formal request for supplemental coverage on claim #{{claim_number}} for {{property_address}}.

## Original Estimate Limitations

The original estimate completed on {{original_estimate_date}} did not include the following necessary items:

{{missed_items}}

## Explanation of Discovery

These items were discovered during the repair process:
{{discovery_explanation}}

## Code Compliance Requirements

{{code_requirements}}

These items are not optional upgrades but required code compliance measures necessary to complete the covered repairs.

## Financial Impact

Additional cost: {{additional_cost}}

This represents actual costs for covered damage and code-required items, not betterment or upgrades.

## Contractor Verification

{{contractor_name}} has provided detailed documentation of these items with supporting photographs and code citations.

## Project Timeline

{{timeline_impact}}

I request approval of this supplement within 5 business days to prevent project delays. Please contact me at {{contact_info}} to discuss.

Professionally,
{{signature}}

Attachments:
- Supplemental estimate with line items
- Discovery photos
- Code requirement documentation
- Contractor verification`
      },

      reinspection_request: {
        name: 'Reinspection Request',
        description: 'Request a second inspection with qualified inspector',
        keywords: ['reinspection', 'second inspection', 'qualified inspector', 'review'],
        variables: [
          'property_address',
          'claim_number',
          'adjuster_name',
          'original_inspection_date',
          'inspector_name',
          'missed_damage',
          'technical_concerns',
          'code_violations',
          'expert_findings',
          'requested_inspector_qualifications',
          'contact_info',
          'signature'
        ],
        requiredData: ['photos', 'inspection_report', 'expert_report'],
        priority: 2,
        template: `Subject: Request for Reinspection - Claim #{{claim_number}}

{{adjuster_name}},

I am formally requesting a reinspection of the property at {{property_address}} for claim #{{claim_number}}.

## Original Inspection Concerns

The inspection conducted by {{inspector_name}} on {{original_inspection_date}} failed to identify significant covered damage:

{{missed_damage}}

## Technical Concerns

{{technical_concerns}}

## Code Violations Identified

{{code_violations}}

These violations require repair and were caused by the covered loss event.

## Independent Expert Findings

{{expert_findings}}

## Requested Inspector Qualifications

Due to the technical nature of this claim, I request a reinspection by an inspector with:
{{requested_inspector_qualifications}}

## Timeline

Please schedule this reinspection within 7 business days. I am available at {{contact_info}} to coordinate.

Professionally,
{{signature}}

Attachments:
- Documented missed damage (photos)
- Independent expert report
- Code violation documentation
- Original inspection report with annotations`
      },

      adjuster_escalation: {
        name: 'Adjuster Escalation Letter',
        description: 'Escalate claim to adjuster supervisor or manager',
        keywords: ['escalate', 'supervisor', 'manager', 'complaint', 'unresponsive'],
        variables: [
          'property_address',
          'claim_number',
          'adjuster_name',
          'supervisor_name',
          'escalation_reasons',
          'timeline_issues',
          'communication_issues',
          'technical_issues',
          'desired_resolution',
          'deadline',
          'contact_info',
          'signature'
        ],
        requiredData: ['claim_history', 'communication_log'],
        priority: 3,
        template: `Subject: Escalation Request - Claim #{{claim_number}}

{{supervisor_name}},

I am escalating claim #{{claim_number}} for {{property_address}} due to unresolved issues with adjuster {{adjuster_name}}.

## Reasons for Escalation

{{escalation_reasons}}

## Timeline Issues

{{timeline_issues}}

This delay is causing significant hardship and potential additional damage to the property.

## Communication Issues

{{communication_issues}}

## Technical Issues

{{technical_issues}}

## Desired Resolution

{{desired_resolution}}

## Required Action

I request your direct involvement to resolve this claim. Please contact me at {{contact_info}} by {{deadline}} with a clear path forward.

If this matter is not resolved promptly, I will escalate to:
- Your regional manager
- State Insurance Commissioner
- Legal counsel

I prefer to resolve this cooperatively and professionally.

Professionally,
{{signature}}

Documentation:
- Complete claim file
- Communication log
- Timeline of delays
- Supporting technical documentation`
      },

      storm_damage_documentation: {
        name: 'Storm Damage Documentation',
        description: 'Comprehensive storm damage documentation letter',
        keywords: ['storm', 'hurricane', 'wind', 'hail', 'tornado', 'damage documentation'],
        variables: [
          'property_address',
          'storm_date',
          'storm_type',
          'adjuster_name',
          'damage_summary',
          'roof_damage',
          'siding_damage',
          'window_damage',
          'interior_damage',
          'code_violations',
          'weather_verification',
          'neighbor_damage',
          'estimated_cost',
          'contact_info',
          'signature'
        ],
        requiredData: ['photos', 'weather_report', 'estimate'],
        priority: 2,
        template: `Subject: Storm Damage Documentation - {{property_address}}

{{adjuster_name}},

This letter provides comprehensive documentation of storm damage to {{property_address}} from the {{storm_type}} event on {{storm_date}}.

## Damage Summary

{{damage_summary}}

## Detailed Component Damage

### Roofing System
{{roof_damage}}

### Exterior Siding
{{siding_damage}}

### Windows and Openings
{{window_damage}}

### Interior Damage
{{interior_damage}}

## Code Violations Created by Storm

{{code_violations}}

## Storm Verification

{{weather_verification}}

## Neighboring Properties

{{neighbor_damage}}

This confirms the storm event affected the entire area, establishing causation.

## Estimated Repair Cost

{{estimated_cost}}

All costs represent actual necessary repairs to restore the property to pre-loss condition and meet current building codes.

## Next Steps

Please review this documentation and schedule your inspection promptly. Contact me at {{contact_info}} to coordinate.

Professionally,
{{signature}}

Documentation Package:
- Exterior photos (all elevations)
- Interior damage photos
- Weather service verification
- Contractor estimate with line items
- Code requirement documentation`
      },

      code_violation_notice: {
        name: 'Code Violation Notice',
        description: 'Document code violations requiring repair',
        keywords: ['code violation', 'building code', 'IRC', 'IBC', 'not to code'],
        variables: [
          'property_address',
          'adjuster_name',
          'violation_summary',
          'code_sections',
          'safety_concerns',
          'repair_requirements',
          'inspector_notes',
          'timeline_urgency',
          'liability_concerns',
          'contact_info',
          'signature'
        ],
        requiredData: ['photos', 'code_citations', 'inspector_report'],
        priority: 2,
        template: `Subject: Code Violation Documentation - {{property_address}}

{{adjuster_name}},

This letter documents building code violations at {{property_address}} that require immediate attention under the current claim.

## Violation Summary

{{violation_summary}}

## Specific Code Sections

{{code_sections}}

## Safety Concerns

{{safety_concerns}}

These violations create immediate safety hazards and must be corrected as part of the storm damage repair.

## Required Repairs

{{repair_requirements}}

## Building Inspector Notes

{{inspector_notes}}

## Timeline and Urgency

{{timeline_urgency}}

## Liability Concerns

{{liability_concerns}}

Failure to address these code violations could result in liability for both the insurance company and the property owner.

## Required Action

These code violations must be included in the claim settlement. Please confirm coverage for these necessary repairs by contacting me at {{contact_info}} within 3 business days.

Professionally,
{{signature}}

Attachments:
- Code violation photos
- IRC/IBC citations
- Building inspector documentation
- Safety hazard documentation`
      },

      settlement_negotiation: {
        name: 'Settlement Negotiation',
        description: 'Negotiate claim settlement amount',
        keywords: ['settlement', 'negotiate', 'offer', 'counteroffer', 'payment'],
        variables: [
          'property_address',
          'claim_number',
          'adjuster_name',
          'insurance_offer',
          'actual_cost',
          'cost_difference',
          'justification',
          'line_item_comparison',
          'depreciation_dispute',
          'rcv_argument',
          'contractor_quotes',
          'counter_offer',
          'deadline',
          'contact_info',
          'signature'
        ],
        requiredData: ['insurance_estimate', 'contractor_estimate', 'photos'],
        priority: 3,
        template: `Subject: Settlement Negotiation - Claim #{{claim_number}}

{{adjuster_name}},

I am writing to negotiate the settlement for claim #{{claim_number}} at {{property_address}}.

## Current Settlement Offer

Your offer: {{insurance_offer}}
Actual repair cost: {{actual_cost}}
Shortfall: {{cost_difference}}

## Justification for Additional Coverage

{{justification}}

## Line-Item Comparison

{{line_item_comparison}}

## Depreciation Dispute

{{depreciation_dispute}}

## Replacement Cost Value Argument

{{rcv_argument}}

The policy provides for replacement cost value, which requires payment of actual costs to restore the property.

## Contractor Verification

{{contractor_quotes}}

Multiple qualified contractors confirm the actual costs significantly exceed your offer.

## Counter Offer

Based on documented actual costs, I propose a settlement of {{counter_offer}}.

This represents fair market value for the necessary repairs using standard materials and practices.

## Timeline

Please respond to this counter offer by {{deadline}}. I am willing to discuss this further at {{contact_info}}.

If we cannot reach agreement, I will pursue:
- Independent appraisal per policy provisions
- State Insurance Commissioner complaint
- Legal action if necessary

I prefer an amicable resolution based on actual documented costs.

Professionally,
{{signature}}

Supporting Documentation:
- Line-item cost comparison
- Multiple contractor quotes
- Material cost documentation
- Labor rate verification`
      },

      manufacturer_warranty: {
        name: 'Manufacturer Warranty Claim',
        description: 'File claim under manufacturer warranty for defective materials',
        keywords: ['warranty', 'manufacturer', 'defect', 'failure', 'product liability'],
        variables: [
          'property_address',
          'manufacturer_name',
          'product_name',
          'installation_date',
          'warranty_period',
          'defect_description',
          'failure_date',
          'damage_caused',
          'installation_verification',
          'expert_analysis',
          'requested_remedy',
          'contact_info',
          'signature'
        ],
        requiredData: ['photos', 'warranty_document', 'installation_records'],
        priority: 3,
        template: `Subject: Warranty Claim - Product Defect at {{property_address}}

{{manufacturer_name}} Warranty Department,

I am filing a warranty claim for defective {{product_name}} installed at {{property_address}}.

## Installation Information

Installation date: {{installation_date}}
Warranty period: {{warranty_period}}
Product is within warranty period

## Defect Description

{{defect_description}}

## Failure Timeline

{{failure_date}}

The product failed prematurely despite proper installation and maintenance.

## Damage Caused

{{damage_caused}}

## Installation Verification

{{installation_verification}}

The product was installed according to manufacturer specifications by a qualified contractor.

## Expert Analysis

{{expert_analysis}}

## Requested Remedy

{{requested_remedy}}

Under your warranty terms, I request:
1. Full product replacement
2. Coverage of installation costs
3. Repair of consequential damage
4. Reimbursement of related expenses

Please respond within 15 business days to {{contact_info}} with your claim decision and next steps.

Professionally,
{{signature}}

Documentation:
- Product photos showing defect
- Installation records
- Warranty documentation
- Expert analysis report
- Damage documentation`
      },

      building_inspector_request: {
        name: 'Building Inspector Request',
        description: 'Request building department inspection and documentation',
        keywords: ['building inspector', 'code inspection', 'permit', 'inspection request'],
        variables: [
          'property_address',
          'inspector_name',
          'inspection_type',
          'claim_context',
          'specific_concerns',
          'code_sections',
          'requested_documentation',
          'insurance_requirement',
          'timeline',
          'contact_info',
          'signature'
        ],
        requiredData: ['permit_info', 'photos'],
        priority: 3,
        template: `Subject: Inspection Request - {{property_address}}

{{inspector_name}},

I am requesting a {{inspection_type}} inspection for the property at {{property_address}}.

## Context

{{claim_context}}

## Specific Concerns

{{specific_concerns}}

## Relevant Code Sections

{{code_sections}}

## Requested Documentation

Please provide written documentation addressing:
{{requested_documentation}}

## Insurance Requirement

{{insurance_requirement}}

This documentation is required for insurance claim processing.

## Timeline

Please schedule this inspection within 7 business days if possible. The insurance claim timeline requires prompt attention.

## Coordination

I am available at {{contact_info}} to coordinate access and provide any needed information.

Thank you for your assistance with this matter.

Professionally,
{{signature}}

Reference Materials:
- Property photos
- Contractor concerns
- Insurance claim information
- Relevant code sections`
      }
    }
  }

  selectTemplate(input: string, context: TemplateContext = {}): string {
    const inputLower = input.toLowerCase()
    let bestMatch: string | null = null
    let highestScore = 0

    for (const [key, template] of Object.entries(this.templates)) {
      let score = 0

      // Check keyword matches
      template.keywords.forEach(keyword => {
        if (inputLower.includes(keyword.toLowerCase())) {
          score += 10
        }
      })

      // Priority boost
      score += (4 - template.priority) * 2

      // Context-based scoring
      if (context.previousTemplate === key) {
        score += 3 // Slight preference for consistency
      }

      if (score > highestScore) {
        highestScore = score
        bestMatch = key
      }
    }

    return bestMatch || 'partial_denial_appeal' // Default fallback
  }

  getTemplate(templateKey: string): Template | null {
    return this.templates[templateKey] || null
  }

  listTemplates(): TemplateInfo[] {
    return Object.entries(this.templates).map(([key, template]) => ({
      key,
      name: template.name,
      description: template.description,
      priority: template.priority
    }))
  }
}

// ============================================================================
// VARIABLE EXTRACTOR
// ============================================================================

export class VariableExtractor {
  extractionPatterns: Record<string, RegExp[]>

  constructor() {
    this.extractionPatterns = {
      property_address: [
        /(?:address|property|location):\s*([^\n]+)/i,
        /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Circle|Cir)/i,
        /(?:at|on)\s+(\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
      ],
      adjuster_name: [
        /adjuster:\s*([^\n,]+)/i,
        /(?:from|with)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+from|\s+at|\s+with)/i
      ],
      claim_number: [
        /claim\s*#?\s*:?\s*([A-Z0-9-]+)/i,
        /claim\s+number:\s*([A-Z0-9-]+)/i
      ],
      denial_date: [
        /denied\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /denial\s+date:\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i
      ],
      storm_date: [
        /storm\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
        /(?:hurricane|hail|wind)\s+on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i
      ]
    }
  }

  extractFromInput(input: string, variables: string[]): Record<string, string> {
    const extracted: Record<string, string> = {}

    variables.forEach(variable => {
      const patterns = this.extractionPatterns[variable]
      if (patterns) {
        for (const pattern of patterns) {
          const match = input.match(pattern)
          if (match && match[1]) {
            extracted[variable] = match[1].trim()
            break
          }
        }
      }
    })

    return extracted
  }

  extractFromHistory(conversationHistory: Array<{ role: string; content: string }>, variables: string[]): Record<string, string> {
    const extracted: Record<string, string> = {}

    if (!conversationHistory || conversationHistory.length === 0) {
      return extracted
    }

    // Combine recent conversation messages
    const recentMessages = conversationHistory
      .slice(-10)
      .map(msg => msg.content || '')
      .join('\n')

    // Extract using patterns
    variables.forEach(variable => {
      if (!extracted[variable]) {
        const patterns = this.extractionPatterns[variable]
        if (patterns) {
          for (const pattern of patterns) {
            const match = recentMessages.match(pattern)
            if (match && match[1]) {
              extracted[variable] = match[1].trim()
              break
            }
          }
        }
      }
    })

    return extracted
  }

  extractFromContext(context: TemplateContext, variables: string[]): Record<string, string> {
    const extracted: Record<string, string> = {}

    if (context.property?.address) {
      extracted.property_address = context.property.address
    }

    if (context.claim) {
      if (context.claim.number) extracted.claim_number = context.claim.number
      if (context.claim.adjusterName) extracted.adjuster_name = context.claim.adjusterName
      if (context.claim.denialDate) extracted.denial_date = context.claim.denialDate
    }

    if (context.user) {
      extracted.contact_info = context.user.phone || context.user.email || ''
      if (context.user.name) extracted.signature = context.user.name
    }

    return extracted
  }

  async extract(input: string, template: Template, context: TemplateContext = {}): Promise<Record<string, string>> {
    const variables = template.variables
    let extracted: Record<string, string> = {}

    // 1. Extract from input
    const fromInput = this.extractFromInput(input, variables)
    extracted = { ...extracted, ...fromInput }

    // 2. Extract from conversation history
    if (context.conversationHistory) {
      const fromHistory = this.extractFromHistory(context.conversationHistory, variables)
      extracted = { ...extracted, ...fromHistory }
    }

    // 3. Extract from context data
    const fromContext = this.extractFromContext(context, variables)
    extracted = { ...extracted, ...fromContext }

    // 4. Add defaults for common fields
    extracted.contact_info = extracted.contact_info || 'my contact information'
    extracted.signature = extracted.signature || '[Your Name]'

    // Add current date if needed
    const today = new Date().toLocaleDateString('en-US')
    extracted.denial_date = extracted.denial_date || today

    return extracted
  }

  getMissingVariables(extracted: Record<string, string>, requiredVariables: string[]): string[] {
    return requiredVariables.filter(variable => !extracted[variable])
  }
}

// ============================================================================
// AI ENHANCEMENT LAYER (Using Abacus AI)
// ============================================================================

export class TemplateEnhancer {
  async enhance(baseTemplate: Template, variables: Record<string, string>, context: TemplateContext = {}): Promise<string> {
    try {
      // Build enhancement prompt
      const prompt = this.buildEnhancementPrompt(baseTemplate, variables, context)

      // Call Abacus AI for enhancement
      const deploymentToken = process.env.DEPLOYMENT_TOKEN
      const deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38'

      if (!deploymentToken) {
        console.warn('DEPLOYMENT_TOKEN not found, falling back to simple template fill')
        return this.fillTemplate(baseTemplate, variables)
      }

      const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deploymentToken: deploymentToken,
          deploymentId: deploymentId,
          messages: [
            {
              is_user: true,
              text: prompt
            }
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        console.warn('Abacus AI enhancement failed, falling back to simple template fill')
        return this.fillTemplate(baseTemplate, variables)
      }

      const data = await response.json()

      // Extract response from Abacus AI format
      let enhancedText = ''
      if (data.result?.messages && Array.isArray(data.result.messages)) {
        const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user)
        if (assistantMessages.length > 0) {
          enhancedText = assistantMessages[assistantMessages.length - 1].text
        }
      }

      return enhancedText || this.fillTemplate(baseTemplate, variables)

    } catch (error) {
      console.error('Template enhancement error:', error)
      // Fallback to basic template if AI enhancement fails
      return this.fillTemplate(baseTemplate, variables)
    }
  }

  buildEnhancementPrompt(template: Template, variables: Record<string, string>, context: TemplateContext): string {
    let prompt = `Generate a professional insurance document based on this template and information:\n\n`
    prompt += `Template Type: ${template.name}\n\n`
    prompt += `Available Information:\n`

    Object.entries(variables).forEach(([key, value]) => {
      if (value && value !== '[Your Name]' && value !== 'my contact information') {
        prompt += `- ${key}: ${value}\n`
      }
    })

    if (context.photos && context.photos.length > 0) {
      prompt += `\n- Available photos: ${context.photos.length} images documenting damage\n`
    }

    prompt += `\n\nTemplate:\n${template.template}\n\n`

    prompt += `Instructions:\n`
    prompt += `1. Fill in all variables with professional, specific content\n`
    prompt += `2. For technical fields like code citations, use realistic IRC/IBC codes\n`
    prompt += `3. For evidence and damage descriptions, be specific and compelling\n`
    prompt += `4. Maintain professional tone throughout\n`
    prompt += `5. Ensure logical flow and strong argumentation\n`
    prompt += `6. Use insurance industry terminology\n`
    prompt += `7. Make the document ready to send without editing\n\n`

    prompt += `Generate the complete document now:`

    return prompt
  }

  fillTemplate(template: Template, variables: Record<string, string>): string {
    let filled = template.template

    // Replace all variables
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      filled = filled.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || `[${key}]`)
    })

    return filled
  }
}

// ============================================================================
// TEMPLATE VALIDATOR
// ============================================================================

export class TemplateValidator {
  validate(document: string, template: Template): ValidationResults {
    const results: ValidationResults = {
      isValid: true,
      score: 100,
      issues: [],
      warnings: [],
      suggestions: []
    }

    // Check for unfilled placeholders
    const placeholderPattern = /\{\{([^}]+)\}\}/g
    const unfilled = document.match(placeholderPattern)
    if (unfilled) {
      results.isValid = false
      results.score -= 30
      results.issues.push(`Unfilled placeholders: ${unfilled.join(', ')}`)
    }

    // Check for bracket placeholders
    const bracketPattern = /\[([^\]]+)\]/g
    const bracketPlaceholders = document.match(bracketPattern)
    if (bracketPlaceholders && bracketPlaceholders.length > 3) {
      results.score -= 20
      results.warnings.push(`Multiple placeholder brackets found: ${bracketPlaceholders.length}`)
    }

    // Check minimum length
    if (document.length < 500) {
      results.score -= 25
      results.warnings.push('Document seems too short for professional correspondence')
    }

    // Check for professional elements
    if (!document.includes('Subject:')) {
      results.score -= 10
      results.warnings.push('Missing subject line')
    }

    if (!document.includes('Professionally,') && !document.includes('Sincerely,')) {
      results.score -= 10
      results.warnings.push('Missing professional closing')
    }

    // Check for required sections based on template
    if (template.name.includes('Appeal') && !document.toLowerCase().includes('appeal')) {
      results.score -= 15
      results.issues.push('Appeal letter missing appeal language')
    }

    // Check for code citations if required
    if (template.requiredData.includes('code_citations')) {
      if (!document.includes('IRC') && !document.includes('IBC')) {
        results.score -= 15
        results.warnings.push('Missing building code citations')
      }
    }

    // Professional tone check (simplified)
    const unprofessionalWords = ['very', 'really', 'totally', 'basically', 'obviously']
    unprofessionalWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi')
      if (regex.test(document)) {
        results.score -= 5
        results.suggestions.push(`Consider removing informal word: "${word}"`)
      }
    })

    // Update validity based on score
    results.isValid = results.score >= 70
    results.readyToSend = results.score >= 85 && results.issues.length === 0

    return results
  }

  formatResults(results: ValidationResults): string {
    let output = `\n=== Document Validation ===\n`
    output += `Score: ${results.score}/100\n`
    output += `Status: ${results.readyToSend ? '✓ Ready to send' : results.isValid ? '⚠ Needs review' : '✗ Needs revision'}\n`

    if (results.issues.length > 0) {
      output += `\n❌ Issues:\n`
      results.issues.forEach(issue => output += `  - ${issue}\n`)
    }

    if (results.warnings.length > 0) {
      output += `\n⚠️  Warnings:\n`
      results.warnings.forEach(warning => output += `  - ${warning}\n`)
    }

    if (results.suggestions.length > 0) {
      output += `\n💡 Suggestions:\n`
      results.suggestions.forEach(suggestion => output += `  - ${suggestion}\n`)
    }

    return output
  }
}

// ============================================================================
// MAIN TEMPLATE ENGINE
// ============================================================================

export class TemplateEngine {
  library: TemplateLibrary
  extractor: VariableExtractor
  enhancer: TemplateEnhancer
  validator: TemplateValidator

  constructor() {
    this.library = new TemplateLibrary()
    this.extractor = new VariableExtractor()
    this.enhancer = new TemplateEnhancer()
    this.validator = new TemplateValidator()
  }

  async generate(input: string, context: TemplateContext = {}): Promise<GenerationResult> {
    try {
      // 1. Select template
      const templateKey = this.library.selectTemplate(input, context)
      const template = this.library.getTemplate(templateKey)

      if (!template) {
        return {
          success: false,
          document: null,
          template: '',
          templateKey: '',
          variables: {},
          missingVariables: [],
          validation: { isValid: false, score: 0, issues: ['Template not found'], warnings: [], suggestions: [] },
          readyToSend: false,
          suggestedEdits: [],
          error: 'Template not found'
        }
      }

      console.log(`Selected template: ${template.name}`)

      // 2. Extract variables
      const variables = await this.extractor.extract(input, template, context)
      const missing = this.extractor.getMissingVariables(variables, template.variables)

      console.log(`Extracted ${Object.keys(variables).length} variables`)
      if (missing.length > 0) {
        console.log(`Missing ${missing.length} variables: ${missing.join(', ')}`)
      }

      // 3. Enhance with AI
      const document = await this.enhancer.enhance(template, variables, context)

      // 4. Validate
      const validation = this.validator.validate(document, template)

      return {
        success: true,
        document,
        template: template.name,
        templateKey,
        variables,
        missingVariables: missing,
        validation,
        readyToSend: validation.readyToSend || false,
        suggestedEdits: validation.suggestions
      }

    } catch (error) {
      console.error('Template generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        document: null,
        template: '',
        templateKey: '',
        variables: {},
        missingVariables: [],
        validation: { isValid: false, score: 0, issues: [], warnings: [], suggestions: [] },
        readyToSend: false,
        suggestedEdits: []
      }
    }
  }

  async quickGenerate(templateType: string, quickData: Record<string, string> = {}): Promise<GenerationResult> {
    const template = this.library.getTemplate(templateType)
    if (!template) {
      return {
        success: false,
        document: null,
        template: '',
        templateKey: '',
        variables: {},
        missingVariables: [],
        validation: { isValid: false, score: 0, issues: ['Template not found'], warnings: [], suggestions: [] },
        readyToSend: false,
        suggestedEdits: [],
        error: `Template not found: ${templateType}`
      }
    }

    const variables = { ...quickData }
    const document = await this.enhancer.enhance(template, variables, {})
    const validation = this.validator.validate(document, template)

    return {
      success: true,
      document,
      template: template.name,
      templateKey: templateType,
      variables,
      missingVariables: [],
      validation,
      readyToSend: validation.readyToSend || false,
      suggestedEdits: validation.suggestions
    }
  }

  listTemplates(): TemplateInfo[] {
    return this.library.listTemplates()
  }

  getTemplateInfo(templateKey: string): any {
    const template = this.library.getTemplate(templateKey)
    if (!template) {
      return null
    }

    return {
      name: template.name,
      description: template.description,
      variables: template.variables,
      requiredData: template.requiredData,
      keywords: template.keywords
    }
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine()
