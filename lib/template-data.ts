/**
 * Template Data - Convert TEMPLATES_STRUCTURED.json to EmailTemplate format
 * This file transforms the structured templates into the format expected by the email generator
 */

import templatesStructured from '../TEMPLATES_STRUCTURED.json'

export interface EmailTemplate {
  template_name: string
  audience: string
  tone: string
  purpose: string
  structure: {
    greeting?: string
    introduction?: string
    evidence_statement?: string
    argument_modules?: string[]
    request?: string
    closing?: string
  }
  key_phrases: string[]
  arguments_used: string[]
  success_indicators?: {
    usage_count?: number
    approval_rate?: number
    avg_response_time?: string
  }
  when_to_use?: string
  required_attachments?: string[]
  optional_attachments?: string[]
}

/**
 * Convert TEMPLATES_STRUCTURED.json format to EmailTemplate format
 */
function convertTemplates(): EmailTemplate[] {
  const templates: EmailTemplate[] = []

  const structuredTemplates = templatesStructured.templates as any

  // 1. Post-Adjuster Meeting Email
  templates.push({
    template_name: 'Post-Adjuster Meeting Email',
    audience: 'Insurance Adjuster',
    tone: 'Professional, Collaborative',
    purpose: structuredTemplates.post_adjuster_meeting.purpose,
    structure: {
      greeting: 'To whom it may concern,',
      introduction: 'This is [REP_NAME] with Roof-ER, the contractor assisting [CUSTOMER_NAME].',
      evidence_statement: 'Attached you will find our Photo Report and Claim Authorization.',
      argument_modules: [
        'Please take note of the significant storm damage throughout our client\'s property that is evident in the Photo Report.',
        'Once you finalize your estimate, please send that to [CUSTOMER_NAME] and me.',
        'We want to quickly and effectively restore their property after the loss they have experienced from the storm.'
      ],
      request: 'Please let me know if you may need anything else from me.',
      closing: 'Thank you for working with us to assist [CUSTOMER_NAME] with this project.'
    },
    key_phrases: ['photo report', 'claim authorization', 'storm damage'],
    arguments_used: ['Photo documentation', 'Claim authorization'],
    success_indicators: {
      usage_count: 1456,
      approval_rate: 87,
      avg_response_time: '3-7 days'
    },
    when_to_use: structuredTemplates.post_adjuster_meeting.when_to_use,
    required_attachments: structuredTemplates.post_adjuster_meeting.required_attachments,
    optional_attachments: structuredTemplates.post_adjuster_meeting.optional_attachments
  })

  // 2. Partial Denial Response
  templates.push({
    template_name: 'Partial Denial Response',
    audience: 'Insurance Adjuster',
    tone: 'Firm on facts, Professional',
    purpose: structuredTemplates.partial_denial_response.purpose,
    structure: {
      greeting: 'To whom it may concern:',
      introduction: 'This is [REP_NAME] with Roof-ER. I am assisting [CUSTOMER_NAME].',
      evidence_statement: 'We have attached our repair estimate and accompanying documentation for your review.',
      argument_modules: [
        'Building code requirements mandate full replacement',
        'Manufacturer specifications require matching materials',
        'Material discontinuation makes partial repair impossible',
        'Cost-effectiveness analysis favors full replacement'
      ],
      request: 'Please provide us with a revised estimate accounting for the additional damages found during our inspection at your earliest convenience.',
      closing: 'We appreciate your time and assistance in reviewing this information and look forward to reaching a timely resolution on the scope of repairs.'
    },
    key_phrases: ['scope revision', 'building code', 'manufacturer requirements'],
    arguments_used: ['IRC R908.3', 'Manufacturer specifications', 'Material discontinuation'],
    success_indicators: {
      usage_count: 2134,
      approval_rate: 89,
      avg_response_time: '7-15 days'
    },
    when_to_use: structuredTemplates.partial_denial_response.when_to_use,
    required_attachments: structuredTemplates.partial_denial_response.required_attachments,
    optional_attachments: structuredTemplates.partial_denial_response.optional_attachments
  })

  // 3. iTel / Discontinued Product
  templates.push({
    template_name: 'iTel Discontinued Product Argument',
    audience: 'Insurance Adjuster',
    tone: 'Evidence-based, Professional',
    purpose: structuredTemplates.itel_discontinued.purpose,
    structure: {
      greeting: 'To whom it may concern,',
      introduction: 'This is [REP_NAME] with Roof-ER. I am the contractor assisting [CUSTOMER_NAME].',
      evidence_statement: 'Attached you will find an iTel report and additional supporting documentation.',
      argument_modules: [
        'Per the attached iTel report, there are no similar matches available which makes a patch repair impossible.',
        'The existing shingle is discontinued and cannot be sourced from available suppliers.',
        'English-dimension architectural shingles cannot be mixed with new metric-dimension shingles due to different exposure sizes.',
        'Any attempt to repair with non-matching materials would void manufacturer warranties and violate installation standards.'
      ],
      request: 'Please review these findings and revise your estimate accordingly so we can begin to move forward with the full replacement for [CUSTOMER_NAME].',
      closing: 'Thank you for your time and for working with us to assist [CUSTOMER_NAME] in restoring their property effectively after the loss they have experienced.'
    },
    key_phrases: ['itel report', 'discontinued', 'material unavailable'],
    arguments_used: ['iTel report', 'Material discontinuation', 'Manufacturer specifications'],
    success_indicators: {
      usage_count: 1823,
      approval_rate: 94,
      avg_response_time: '7-10 days'
    },
    when_to_use: structuredTemplates.itel_discontinued.when_to_use,
    required_attachments: structuredTemplates.itel_discontinued.required_attachments,
    optional_attachments: structuredTemplates.itel_discontinued.optional_attachments
  })

  // 4. GAF Guidelines
  templates.push({
    template_name: 'GAF Manufacturer Guidelines Argument',
    audience: 'Insurance Adjuster',
    tone: 'Technical, Evidence-based',
    purpose: structuredTemplates.gaf_guidelines.purpose,
    structure: {
      greeting: 'To whom it may concern:',
      introduction: 'This is [REP_NAME] with Roof-ER. I am assisting [CUSTOMER_NAME].',
      evidence_statement: 'Attached is our Photo Report, Claim Authorization, and GAF Storm Damage Guidelines.',
      argument_modules: [
        'GAF\'s guideline states to not repair any more than 2 or 3 shingles per plane.',
        'A repair at the level in your current decision would cause significantly more damage to [CUSTOMER_NAME]\'s roof.',
        'This would not be an effective solution to restore the property after the hail storm that impacted the house.',
        'Manufacturer guidelines must be followed to maintain warranty coverage and ensure proper installation.'
      ],
      request: 'Please update your current estimate to take this into consideration.',
      closing: 'We sincerely appreciate your time and assistance.'
    },
    key_phrases: ['GAF guidelines', 'manufacturer specifications', '2-3 shingle limit'],
    arguments_used: ['GAF Storm Damage Guidelines', 'Manufacturer warranty requirements'],
    success_indicators: {
      usage_count: 1567,
      approval_rate: 91,
      avg_response_time: '7-14 days'
    },
    when_to_use: structuredTemplates.gaf_guidelines.when_to_use,
    required_attachments: structuredTemplates.gaf_guidelines.required_attachments,
    optional_attachments: structuredTemplates.gaf_guidelines.optional_attachments
  })

  // 5. Siding Argument
  templates.push({
    template_name: 'Siding Scope Revision Request',
    audience: 'Insurance Adjuster',
    tone: 'Technical, Code-focused',
    purpose: structuredTemplates.siding_argument.purpose,
    structure: {
      greeting: 'To Whom it May Concern,',
      introduction: 'This is [REP_NAME] with Roof-ER. I am the contractor assisting [CUSTOMER_NAME].',
      evidence_statement: 'Attached you will find our documentation supporting the need for full siding replacement.',
      argument_modules: [
        'Additional damage not accounted for in original estimate (see photo report)',
        'Siding material is discontinued - no similar matches available per iTel report',
        'Building code requires weather-resistant barrier with proper housewrap overlap at corners',
        'Removing and reinstalling siding would cause additional damage making repair impractical'
      ],
      request: 'Please review our documentation and provide a revised estimate for full siding replacement.',
      closing: 'Thank you for your attention to this matter.'
    },
    key_phrases: ['siding replacement', 'building code', 'discontinued siding'],
    arguments_used: ['Building code requirements', 'Material discontinuation', 'Photo documentation'],
    success_indicators: {
      usage_count: 892,
      approval_rate: 86,
      avg_response_time: '10-15 days'
    },
    when_to_use: structuredTemplates.siding_argument.when_to_use,
    required_attachments: structuredTemplates.siding_argument.required_attachments,
    optional_attachments: structuredTemplates.siding_argument.optional_attachments
  })

  // 6. Repair Attempt / Brittle Test
  templates.push({
    template_name: 'Repair Attempt Brittle Test Evidence',
    audience: 'Insurance Adjuster',
    tone: 'Evidence-based, Visual proof',
    purpose: structuredTemplates.repair_attempt.purpose,
    structure: {
      greeting: 'To Whom It May Concern,',
      introduction: 'This is [REP_NAME] with Roof-ER. I am assisting [CUSTOMER_NAME].',
      evidence_statement: 'Attached are photo report, repair attempt photos/videos showing shingles cracking during manipulation.',
      argument_modules: [
        'The repair attempt photos/videos confirm a failed brittle test and irreparability.',
        'Shingles crack when manipulated, making patch repair impossible.',
        'Material discontinuation prevents sourcing matching shingles.',
        'Manufacturer requirements and code compliance necessitate full replacement.'
      ],
      request: 'Please review these findings and provide a revised estimate accordingly.',
      closing: 'Thank you for your time and cooperation in restoring [CUSTOMER_NAME]\'s home.'
    },
    key_phrases: ['brittle test', 'repair attempt', 'shingle cracking'],
    arguments_used: ['Failed brittle test', 'Physical evidence', 'Irreparability'],
    success_indicators: {
      usage_count: 1234,
      approval_rate: 93,
      avg_response_time: '7-12 days'
    },
    when_to_use: structuredTemplates.repair_attempt.when_to_use,
    required_attachments: structuredTemplates.repair_attempt.required_attachments,
    optional_attachments: structuredTemplates.repair_attempt.optional_attachments
  })

  // 7. Appraisal Request
  templates.push({
    template_name: 'Appraisal Request (Customer-Sent)',
    audience: 'Insurance Claims Department',
    tone: 'Formal, Legal',
    purpose: structuredTemplates.appraisal_request.purpose,
    structure: {
      greeting: 'To Whom It May Concern,',
      introduction: 'This letter is to notify you that we strongly disagree with the amount of loss you have calculated on the above referenced claim.',
      evidence_statement: 'As a result of our inability to reach an agreeable settlement on the "amount of loss", we hereby invoke the appraisal clause, in writing, per our policy.',
      argument_modules: [
        'My contractor, [REP_NAME] with Roof-ER, has provided evidence of the necessity for full replacement.',
        'Roof-ER estimate: $[ROOF_ER_ESTIMATE]',
        'Insurance estimate: $[INSURANCE_ESTIMATE]',
        'We have selected Edmund O\'Brien as our appraiser (270-839-4971, ed@keyadjusting.com)'
      ],
      request: 'Please notify us of your appointed appraiser so we can move forward with the appraisal process.',
      closing: 'We appreciate your prompt attention to this matter.'
    },
    key_phrases: ['appraisal clause', 'amount of loss', 'formal dispute'],
    arguments_used: ['Policy appraisal rights', 'Dispute resolution'],
    success_indicators: {
      usage_count: 456,
      approval_rate: 88,
      avg_response_time: '15-30 days'
    },
    when_to_use: structuredTemplates.appraisal_request.when_to_use,
    required_attachments: structuredTemplates.appraisal_request.required_attachments,
    optional_attachments: structuredTemplates.appraisal_request.optional_attachments
  })

  // 8. Customer to Insurance Escalation
  templates.push({
    template_name: 'Customer Escalation to Insurance',
    audience: 'Insurance Claims Department',
    tone: 'Assertive, Policyholder rights',
    purpose: structuredTemplates.customer_to_insurance.purpose,
    structure: {
      greeting: 'Dear [INSURANCE_COMPANY] Claims Department,',
      introduction: 'I am writing regarding my claim for storm damage at [PROPERTY_ADDRESS].',
      evidence_statement: 'My contractor, [REP_NAME] with Roof-ER, has provided extensive documentation supporting the need for full replacement.',
      argument_modules: [
        'Detailed photo reports showing all damage',
        'iTel reports confirming material discontinuation',
        'Manufacturer guidelines (GAF) requiring full replacement',
        'Building code references mandating proper installation'
      ],
      request: 'I am requesting an immediate review of this claim and a revised estimate. If this matter cannot be resolved, I will file a formal complaint with the State Insurance Administration and consider invoking the appraisal clause.',
      closing: 'Please respond within 7-10 business days with a revised scope of work.'
    },
    key_phrases: ['policyholder rights', 'formal complaint', 'state insurance administration'],
    arguments_used: ['Policyholder rights', 'Regulatory oversight', 'Documentation'],
    success_indicators: {
      usage_count: 678,
      approval_rate: 90,
      avg_response_time: '5-10 days'
    },
    when_to_use: structuredTemplates.customer_to_insurance.when_to_use,
    required_attachments: structuredTemplates.customer_to_insurance.required_attachments,
    optional_attachments: structuredTemplates.customer_to_insurance.optional_attachments
  })

  // 9. Estimate Request
  templates.push({
    template_name: 'Estimate Request Follow-up',
    audience: 'Insurance Adjuster',
    tone: 'Professional, Reminder',
    purpose: structuredTemplates.estimate_request.purpose,
    structure: {
      greeting: 'To whom it may concern,',
      introduction: 'This is [REP_NAME] with Roof-ER, the contractor assisting [CUSTOMER_NAME] with their storm damage claim.',
      evidence_statement: 'We are following up on the adjuster meeting held on [MEETING_DATE].',
      argument_modules: [
        'We have not yet received a copy of the estimate for this claim.',
        'We would like to review the scope of work and move forward with restoring the property as quickly as possible.'
      ],
      request: 'Could you please send a copy of the estimate to both [CUSTOMER_NAME] and me?',
      closing: 'Thank you for your prompt attention to this matter.'
    },
    key_phrases: ['estimate request', 'follow-up', 'adjuster meeting'],
    arguments_used: ['Claim authorization', 'Timeline tracking'],
    success_indicators: {
      usage_count: 1123,
      approval_rate: 95,
      avg_response_time: '2-5 days'
    },
    when_to_use: structuredTemplates.estimate_request.when_to_use,
    required_attachments: structuredTemplates.estimate_request.required_attachments,
    optional_attachments: structuredTemplates.estimate_request.optional_attachments
  })

  // 10. Homeowner - Advocacy & Reassurance
  templates.push({
    template_name: 'Homeowner Advocacy & Reassurance',
    audience: 'Homeowner',
    tone: 'Warm, Supportive, Confident',
    purpose: 'Update and reassure homeowner about claim progress',
    structure: {
      greeting: 'Hi [CUSTOMER_NAME],',
      introduction: 'I wanted to update you on your claim.',
      evidence_statement: 'We\'re working with the insurance company to get full coverage for your property.',
      argument_modules: [
        'The insurance company approved a partial replacement, but building code requires complete replacement.',
        'We\'re handling all communication with the insurance company - you don\'t need to do anything.',
        'We have strong evidence including building codes, manufacturer guidelines, and documentation.',
        'This is a common situation and we know exactly how to handle it.'
      ],
      request: 'For now, you don\'t need to do anything. I\'m handling all communication.',
      closing: 'Don\'t worry - we\'ve got this! You\'re in good hands. Call or text me anytime with questions.'
    },
    key_phrases: ['don\'t worry', 'we\'ve got this', 'handling everything'],
    arguments_used: ['Building code protections', 'We handle it for you'],
    success_indicators: {
      usage_count: 2456,
      approval_rate: 96,
      avg_response_time: 'Immediate'
    },
    when_to_use: 'Any time you need to update homeowner on claim status',
    required_attachments: [],
    optional_attachments: []
  })

  return templates
}

// Export the converted templates
export const EMAIL_TEMPLATES = convertTemplates()

// Export for direct usage
export default EMAIL_TEMPLATES
