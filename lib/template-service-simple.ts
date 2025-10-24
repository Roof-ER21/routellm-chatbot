/**
 * Simplified Template Service - Works without JSON imports
 * Has embedded templates for immediate functionality
 */

// Types
export interface EmailTemplate {
  template_name: string;
  audience: string;
  tone: string;
  purpose: string;
  sender?: 'rep' | 'customer'; // Who sends this email - 'customer' means homeowner sends (not rep)
  structure: {
    greeting?: string;
    introduction?: string;
    evidence_statement?: string;
    argument_modules?: string[];
    request?: string;
    closing?: string;
  };
  key_phrases: string[];
  arguments_used: string[];
  success_indicators?: {
    usage_count?: number;
    approval_rate?: number;
    avg_response_time?: string;
  };
}

export interface TemplateRecommendation {
  template: EmailTemplate;
  confidence: number;
  reasoning: string;
  suggestedArguments: string[];
}

// Embedded templates - Complete Library of 10 Templates
const TEMPLATES: EmailTemplate[] = [
  {
    template_name: "Insurance Company - Code Violation Argument",
    audience: "Insurance Adjuster",
    tone: "Firm on facts, warm in delivery",
    purpose: "Challenge partial approval using building codes",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "This is [REP_NAME] with Roof-ER assisting [CUSTOMER_NAME] regarding claim [CLAIM_NUMBER].",
      evidence_statement: "Attached are our documentation including photos and code citations.",
      argument_modules: [
        "IRC R908.3 requires complete matching of shingles",
        "State building code mandates compliance",
        "Manufacturer specifications require matching"
      ],
      request: "Please provide a revised estimate reflecting full replacement.",
      closing: "Thank you for your prompt attention."
    },
    key_phrases: ["IRC R908.3", "matching", "code"],
    arguments_used: ["IRC R908.3"],
    success_indicators: { usage_count: 1247, approval_rate: 92, avg_response_time: "7-15 days" }
  },
  {
    template_name: "Homeowner - Advocacy & Reassurance",
    audience: "Homeowner",
    tone: "Warm, supportive",
    purpose: "Update and reassure homeowner",
    structure: {
      greeting: "Hi [CUSTOMER_NAME],",
      introduction: "I wanted to update you on your claim.",
      evidence_statement: "We're working with the insurance company to get full coverage.",
      argument_modules: ["Building code requires complete replacement", "We're handling everything"],
      request: "You don't need to do anything - I'll handle the insurance company.",
      closing: "Don't worry, we've got this!"
    },
    key_phrases: ["don't worry", "we've got this"],
    arguments_used: ["Building Code"],
    success_indicators: { usage_count: 892, approval_rate: 90, avg_response_time: "Immediate" }
  },
  {
    template_name: "Insurance Company - Multi-Argument Comprehensive",
    audience: "Insurance Adjuster",
    tone: "Professional, evidence-based",
    purpose: "Present multiple code violations and manufacturer specifications",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am writing on behalf of [CUSTOMER_NAME] regarding claim [CLAIM_NUMBER] for property damage.",
      evidence_statement: "We have identified multiple issues with the current estimate that require revision:",
      argument_modules: [
        "IRC R908.3 - Matching requirement",
        "Manufacturer warranty specifications",
        "State-specific building code compliance",
        "NRCA industry standards",
        "Property value impact"
      ],
      request: "We request a revised estimate addressing all code requirements and manufacturer specifications.",
      closing: "We appreciate your attention to these important compliance matters."
    },
    key_phrases: ["multiple issues", "code compliance", "manufacturer warranty"],
    arguments_used: ["IRC R908.3", "GAF Matching", "NRCA Standards"],
    success_indicators: { usage_count: 823, approval_rate: 89, avg_response_time: "10-20 days" }
  },
  {
    template_name: "Insurance Company - Partial Denial Appeal",
    audience: "Insurance Adjuster/Claims Manager",
    tone: "Firm, factual, professional",
    purpose: "Appeal partial denial with strong evidence",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "This letter is a formal appeal of the partial denial on claim [CLAIM_NUMBER] for [CUSTOMER_NAME].",
      evidence_statement: "The denial is inconsistent with both policy language and applicable building codes:",
      argument_modules: [
        "Policy coverage interpretation",
        "IRC R908.3 code requirement",
        "State insurance regulations",
        "Depreciation limitations on code-required work"
      ],
      request: "We respectfully request immediate reconsideration and approval of the full scope of necessary repairs.",
      closing: "Please provide your response within 15 business days as required by state regulations."
    },
    key_phrases: ["formal appeal", "policy coverage", "state regulations"],
    arguments_used: ["State Matching Regulations", "Depreciation Limitation"],
    success_indicators: { usage_count: 567, approval_rate: 78, avg_response_time: "15-30 days" }
  },
  {
    template_name: "Insurance Company - Reinspection Request",
    audience: "Insurance Adjuster",
    tone: "Collaborative, professional",
    purpose: "Request reinspection with new evidence",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am requesting a reinspection for claim [CLAIM_NUMBER] based on new findings.",
      evidence_statement: "Since the initial inspection, we have documented additional damage and code violations:",
      argument_modules: [
        "New damage documentation (photos, measurements)",
        "Code violations not initially identified",
        "Manufacturer specifications requiring attention",
        "iTel report findings"
      ],
      request: "Please schedule a reinspection at your earliest convenience. We are available [DATES].",
      closing: "Thank you for coordinating this reinspection. Please confirm the appointment."
    },
    key_phrases: ["reinspection", "new findings", "additional damage"],
    arguments_used: ["Building Permit Required"],
    success_indicators: { usage_count: 445, approval_rate: 91, avg_response_time: "5-10 days" }
  },
  {
    template_name: "Insurance Company - Supplement Request",
    audience: "Insurance Adjuster",
    tone: "Professional, detailed",
    purpose: "Request supplemental payment for additional scope",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am submitting a supplement request for claim [CLAIM_NUMBER].",
      evidence_statement: "During the course of repairs, we discovered additional damage and code-required work:",
      argument_modules: [
        "Hidden damage discovered during tear-off",
        "Code-required upgrades (flashing, ventilation)",
        "Manufacturer-required materials",
        "Accurate measurements vs original estimate"
      ],
      request: "Please review the attached supplement estimate and approve these necessary additions.",
      closing: "We await your prompt approval to proceed with code-compliant repairs."
    },
    key_phrases: ["supplement", "additional scope", "hidden damage"],
    arguments_used: ["IRC R908.3", "Liability Exposure"],
    success_indicators: { usage_count: 734, approval_rate: 85, avg_response_time: "10-15 days" }
  },
  {
    template_name: "Homeowner - Status Update (Partial Approval)",
    audience: "Homeowner",
    tone: "Reassuring, informative",
    purpose: "Update homeowner on partial approval and next steps",
    structure: {
      greeting: "Hi [CUSTOMER_NAME],",
      introduction: "I wanted to update you on your insurance claim status.",
      evidence_statement: "The insurance company approved a partial payment, but we're working to get full coverage:",
      argument_modules: [
        "What was approved vs what's needed",
        "Why full replacement is required (building code)",
        "Our strategy to get full approval",
        "Timeline expectations"
      ],
      request: "No action needed from you - I'm handling all communication with the insurance company.",
      closing: "Don't worry, this is common and we've successfully handled this situation many times. You're in good hands!"
    },
    key_phrases: ["partial approval", "we're handling it", "common situation"],
    arguments_used: ["Building Code", "Property Value Impact"],
    success_indicators: { usage_count: 1089, approval_rate: 95, avg_response_time: "Same day" }
  },
  {
    template_name: "Homeowner - Claim Victory Notification",
    audience: "Homeowner",
    tone: "Celebratory, warm",
    purpose: "Inform homeowner of successful claim approval",
    structure: {
      greeting: "Hi [CUSTOMER_NAME],",
      introduction: "Great news! The insurance company has approved your full claim!",
      evidence_statement: "After presenting the code requirements and evidence, they agreed to cover:",
      argument_modules: [
        "Full scope of approved work",
        "Total approved amount",
        "Next steps for starting work",
        "Timeline to completion"
      ],
      request: "I'll be in touch to schedule the work. Please review the approval documents I'm sending.",
      closing: "Congratulations! This is exactly the outcome we were working toward. Your patience paid off!"
    },
    key_phrases: ["great news", "full approval", "congratulations"],
    arguments_used: [],
    success_indicators: { usage_count: 623, approval_rate: 100, avg_response_time: "Same day" }
  },
  {
    template_name: "Insurance Company - Documentation Package Cover Letter",
    audience: "Insurance Adjuster/Claims Manager",
    tone: "Professional, organized",
    purpose: "Accompany comprehensive documentation package",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "Enclosed is comprehensive documentation for claim [CLAIM_NUMBER].",
      evidence_statement: "This package includes all evidence supporting full claim approval:",
      argument_modules: [
        "Building code citations and interpretations",
        "Manufacturer specifications and warranty requirements",
        "Professional photographs documenting damage",
        "iTel weather verification report",
        "Detailed measurements and estimates"
      ],
      request: "Please review this comprehensive package and approve the full scope of necessary repairs.",
      closing: "All documentation supports code-compliant, manufacturer-approved repairs. We await your approval."
    },
    key_phrases: ["comprehensive documentation", "evidence package", "code citations"],
    arguments_used: ["IRC R908.3", "GAF Matching", "State Matching Regs"],
    success_indicators: { usage_count: 389, approval_rate: 88, avg_response_time: "20-30 days" }
  },
  {
    template_name: "Insurance Company - Payment Status Inquiry",
    audience: "Insurance Adjuster/Payment Department",
    tone: "Professional, direct",
    purpose: "Follow up on delayed payment",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am following up on payment for approved claim [CLAIM_NUMBER].",
      evidence_statement: "The claim was approved on [DATE], but payment has not been received:",
      argument_modules: [
        "Approval date and amount",
        "Days since approval",
        "Impact on project timeline",
        "Homeowner concerns"
      ],
      request: "Please expedite payment processing and provide an expected payment date.",
      closing: "Prompt payment will allow us to proceed with the approved repairs. Thank you for your attention."
    },
    key_phrases: ["payment follow-up", "approved claim", "expedite payment"],
    arguments_used: [],
    success_indicators: { usage_count: 312, approval_rate: 94, avg_response_time: "3-7 days" }
  },
  {
    template_name: "Appraisal Request (Customer Sends)",
    audience: "Insurance Adjuster",
    tone: "Firm, professional",
    purpose: "Homeowner requests appraisal process (sent BY homeowner)",
    sender: "customer",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am writing regarding my insurance claim [CLAIM_NUMBER].",
      evidence_statement: "I strongly disagree with the current estimate and am formally requesting the appraisal process under my policy.",
      argument_modules: [
        "Specific disagreements with estimate",
        "Reference to policy's appraisal clause",
        "Request for appraisal umpire selection process",
        "Timeline expectations per policy"
      ],
      request: "Please initiate the appraisal process immediately and provide details on selecting appraisers.",
      closing: "I expect a response within 10 business days as required by my policy."
    },
    key_phrases: ["appraisal process", "policy clause", "formal request"],
    arguments_used: ["Policy Rights"],
    success_indicators: { usage_count: 89, approval_rate: 75, avg_response_time: "10-15 days" }
  },
  {
    template_name: "Customer to Insurance Escalation (Customer Sends)",
    audience: "Insurance Claims Manager",
    tone: "Firm, assertive",
    purpose: "Homeowner escalates dispute to management (sent BY homeowner)",
    sender: "customer",
    structure: {
      greeting: "Dear [RECIPIENT_NAME],",
      introduction: "I am writing to escalate my insurance claim [CLAIM_NUMBER] which has not been resolved satisfactorily.",
      evidence_statement: "Despite multiple communications with the adjuster, my claim remains improperly denied/undervalued:",
      argument_modules: [
        "Timeline of communications",
        "Specific issues with adjuster's decision",
        "Building code violations in current estimate",
        "My contractor's documentation of required work"
      ],
      request: "I request immediate management review of this claim and a revised estimate that complies with building codes.",
      closing: "If this is not resolved within 15 business days, I will file a complaint with the state insurance commissioner."
    },
    key_phrases: ["escalation", "management review", "state commissioner"],
    arguments_used: ["Building Code", "State Insurance Regulations"],
    success_indicators: { usage_count: 67, approval_rate: 60, avg_response_time: "15-20 days" }
  }
];

class TemplateService {
  private templates: EmailTemplate[] = TEMPLATES;

  getAllTemplates(): EmailTemplate[] {
    return this.templates;
  }

  getTemplateByName(name: string): EmailTemplate | undefined {
    return this.templates.find(t => t.template_name.toLowerCase() === name.toLowerCase());
  }

  recommendTemplate(scenario: { recipient: string; claimType: string; issues: string[] }): TemplateRecommendation {
    const { recipient } = scenario;
    let template = this.templates[0];
    let confidence = 85;
    let reasoning = "Default template selected";

    if (recipient.toLowerCase().includes('homeowner')) {
      template = this.templates[1] || this.templates[0];
      confidence = 90;
      reasoning = "Homeowner audience detected";
    }

    return {
      template,
      confidence,
      reasoning,
      suggestedArguments: template.arguments_used
    };
  }

  generateEmailFromTemplate(template: EmailTemplate, context: any): string {
    const {
      repName = "Rep",
      repEmail = "rep@roofer.com",
      customerName = "Customer",
      recipientName = "Sir/Madam",
      claimNumber = "N/A",
      insuranceEmail = "claims@insurance.com"
    } = context;

    let email = '';

    // CRITICAL: Add instructions header for customer-sent emails
    if (template.sender === 'customer') {
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      email += `INSTRUCTIONS FOR ${customerName.toUpperCase()}:\n\n`;
      email += `This email is drafted for YOU to send directly to the insurance company.\n\n`;
      email += `✅ Copy the email content below (starting from the greeting)\n`;
      email += `✅ Send it from YOUR email address to ${insuranceEmail}\n`;
      email += `✅ CC me (${repName} at ${repEmail}) so I can monitor the response\n\n`;
      email += `DO NOT have ${repName} send this on your behalf - it must come from you\n`;
      email += `for maximum impact with the insurance company.\n`;
      email += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      email += `[EMAIL CONTENT STARTS BELOW - COPY FROM HERE]\n\n`;
    }

    // Generate the actual email content
    email += template.structure.greeting?.replace('[RECIPIENT_NAME]', recipientName) || `Dear ${recipientName},`;
    email += "\n\n";

    if (template.structure.introduction) {
      email += template.structure.introduction
        .replace('[REP_NAME]', repName)
        .replace('[CUSTOMER_NAME]', customerName)
        .replace('[CLAIM_NUMBER]', claimNumber);
      email += "\n\n";
    }

    if (template.structure.evidence_statement) {
      email += template.structure.evidence_statement + "\n\n";
    }

    if (template.structure.argument_modules) {
      template.structure.argument_modules.forEach((arg, i) => {
        email += `${i + 1}. ${arg}\n`;
      });
      email += "\n";
    }

    if (template.structure.request) {
      email += template.structure.request + "\n\n";
    }

    if (template.structure.closing) {
      email += template.structure.closing + "\n\n";
    }

    // Signature: customer name for customer-sent emails, rep name for rep-sent emails
    if (template.sender === 'customer') {
      email += `Sincerely,\n\n${customerName}\n`;
    } else {
      email += `Best regards,\n\n${repName}\nRoof-ER Claims Advocacy\n`;
    }

    return email;
  }
}

export const templateService = new TemplateService();

export function getTemplateRecommendation(scenario: { recipient: string; claimType: string; issues: string[] }): TemplateRecommendation {
  return templateService.recommendTemplate(scenario);
}

export function generateEmail(templateName: string, context: any): string {
  const template = templateService.getTemplateByName(templateName);
  if (!template) throw new Error(`Template not found: ${templateName}`);
  return templateService.generateEmailFromTemplate(template, context);
}

export function getAllTemplates(): EmailTemplate[] {
  return templateService.getAllTemplates();
}
