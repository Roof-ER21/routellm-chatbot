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

// Embedded templates
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
    const { repName = "Rep", customerName = "Customer", recipientName = "Sir/Madam", claimNumber = "N/A" } = context;
    let email = template.structure.greeting?.replace('[RECIPIENT_NAME]', recipientName) || `Dear ${recipientName},`;
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

    email += `Best regards,\n\n${repName}\nRoof-ER Claims Advocacy\n`;
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
