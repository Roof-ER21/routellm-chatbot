/**
 * Template Service - Centralized email template management
 * Connects TEMPLATES_STRUCTURED.json to the email generation system
 */

import { EMAIL_TEMPLATES, type EmailTemplate } from './template-data'

// Re-export EmailTemplate type
export type { EmailTemplate }

export interface TemplateRecommendation {
  template: EmailTemplate;
  confidence: number;
  reasoning: string;
  suggestedArguments: string[];
}

// Template Service Class
class TemplateService {
  private templates: EmailTemplate[];

  constructor() {
    // Load all 10 templates from template-data.ts
    this.templates = EMAIL_TEMPLATES;
    console.log('[TemplateService] Loaded', this.templates.length, 'email templates');
  }

  /**
   * Get all available templates
   */
  getAllTemplates(): EmailTemplate[] {
    return this.templates;
  }

  /**
   * Get template by name
   */
  getTemplateByName(name: string): EmailTemplate | undefined {
    return this.templates.find(t =>
      t.template_name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get templates by audience type
   */
  getTemplatesByAudience(audience: string): EmailTemplate[] {
    return this.templates.filter(t =>
      t.audience.toLowerCase().includes(audience.toLowerCase())
    );
  }

  /**
   * Recommend best template based on scenario
   */
  recommendTemplate(scenario: {
    recipient: string;
    claimType: string;
    issues: string[];
    documents?: string[];
  }): TemplateRecommendation {
    const { recipient, claimType, issues, documents = [] } = scenario;

    let bestTemplate: EmailTemplate | undefined;
    let confidence = 0;
    let reasoning = '';
    let suggestedArguments: string[] = [];

    // Match by recipient type
    if (recipient.toLowerCase().includes('homeowner') ||
        recipient.toLowerCase().includes('customer')) {
      bestTemplate = this.getTemplateByName('Homeowner Advocacy & Reassurance');
      confidence = 90;
      reasoning = 'Homeowner audience detected - using advocacy and reassurance template';
      suggestedArguments = [
        'Building code protections',
        'We handle everything for you',
        'Strong evidence on your side'
      ];
    } else if (recipient.toLowerCase().includes('insurance') ||
               recipient.toLowerCase().includes('adjuster')) {

      // Check for specific scenarios
      if (documents.some(doc => doc.toLowerCase().includes('itel')) ||
          issues.some(issue => issue.toLowerCase().includes('discontin'))) {
        bestTemplate = this.getTemplateByName('iTel Discontinued Product Argument');
        confidence = 95;
        reasoning = 'iTel report or discontinued materials detected - using discontinuation template';
        suggestedArguments = [
          'Material discontinuation per iTel',
          'No similar matches available',
          'Manufacturer specifications'
        ];
      } else if (documents.some(doc => doc.toLowerCase().includes('gaf')) ||
                 issues.some(issue => issue.toLowerCase().includes('gaf') || issue.toLowerCase().includes('manufacturer'))) {
        bestTemplate = this.getTemplateByName('GAF Manufacturer Guidelines Argument');
        confidence = 92;
        reasoning = 'GAF guidelines or manufacturer requirements detected';
        suggestedArguments = [
          'GAF 2-3 shingle repair limit',
          'Manufacturer warranty requirements',
          'Installation standards'
        ];
      } else if (documents.some(doc => doc.toLowerCase().includes('repair') || doc.toLowerCase().includes('brittle')) ||
                 claimType.toLowerCase().includes('brittle')) {
        bestTemplate = this.getTemplateByName('Repair Attempt Brittle Test Evidence');
        confidence = 93;
        reasoning = 'Repair attempt or brittle test evidence detected';
        suggestedArguments = [
          'Failed brittle test',
          'Physical evidence of irreparability',
          'Video/photo documentation'
        ];
      } else if (claimType.toLowerCase().includes('siding') ||
                 issues.some(issue => issue.toLowerCase().includes('siding'))) {
        bestTemplate = this.getTemplateByName('Siding Scope Revision Request');
        confidence = 88;
        reasoning = 'Siding claim detected';
        suggestedArguments = [
          'Building code requirements',
          'Material discontinuation',
          'Additional damage documentation'
        ];
      } else if (claimType.toLowerCase().includes('partial') ||
                 issues.some(issue => issue.toLowerCase().includes('partial'))) {
        bestTemplate = this.getTemplateByName('Partial Denial Response');
        confidence = 89;
        reasoning = 'Partial denial scenario detected';
        suggestedArguments = [
          'IRC R908.3 matching requirements',
          'Building code compliance',
          'Manufacturer specifications'
        ];
      } else if (claimType.toLowerCase().includes('estimate') &&
                 claimType.toLowerCase().includes('request')) {
        bestTemplate = this.getTemplateByName('Estimate Request Follow-up');
        confidence = 95;
        reasoning = 'Estimate request scenario detected';
        suggestedArguments = [
          'Follow-up timeline',
          'Claim authorization'
        ];
      } else if (claimType.toLowerCase().includes('appraisal')) {
        bestTemplate = this.getTemplateByName('Appraisal Request (Customer-Sent)');
        confidence = 92;
        reasoning = 'Appraisal invocation scenario';
        suggestedArguments = [
          'Policy appraisal clause',
          'Dispute resolution rights'
        ];
      } else if (claimType.toLowerCase().includes('escalation')) {
        bestTemplate = this.getTemplateByName('Customer Escalation to Insurance');
        confidence = 90;
        reasoning = 'Customer escalation scenario';
        suggestedArguments = [
          'Policyholder rights',
          'State insurance administration',
          'Comprehensive documentation'
        ];
      } else if (claimType.toLowerCase().includes('adjuster') &&
                 claimType.toLowerCase().includes('meeting')) {
        bestTemplate = this.getTemplateByName('Post-Adjuster Meeting Email');
        confidence = 88;
        reasoning = 'Post-adjuster meeting follow-up detected';
        suggestedArguments = [
          'Photo documentation',
          'Claim authorization',
          'Storm damage evidence'
        ];
      } else {
        // Default for insurance/adjuster
        bestTemplate = this.getTemplateByName('Partial Denial Response');
        confidence = 80;
        reasoning = 'Insurance adjuster audience - using general partial denial response template';
        suggestedArguments = [
          'IRC R908.3 code requirement',
          'Building code compliance',
          'Manufacturer specifications'
        ];
      }

      // Boost confidence for matching issues
      if (issues.some(issue => issue.toLowerCase().includes('match'))) {
        confidence = Math.min(confidence + 5, 100);
        if (!suggestedArguments.includes('IRC R908.3 matching requirements')) {
          suggestedArguments.push('IRC R908.3 matching requirements');
        }
      }

      // Boost confidence for depreciation issues
      if (issues.some(issue => issue.toLowerCase().includes('depreciation'))) {
        confidence = Math.min(confidence + 3, 100);
        if (!suggestedArguments.includes('Depreciation concerns')) {
          suggestedArguments.push('Depreciation concerns');
        }
      }
    }

    // Default fallback if no template selected
    if (!bestTemplate) {
      bestTemplate = this.getTemplateByName('Partial Denial Response');
      confidence = 70;
      reasoning = 'Using partial denial response template as safe default';
      suggestedArguments = [
        'IRC R908.3 code requirement',
        'Building code compliance',
        'Manufacturer specifications'
      ];
    }

    return {
      template: bestTemplate!,
      confidence,
      reasoning,
      suggestedArguments
    };
  }

  /**
   * Generate email structure from template
   */
  generateEmailFromTemplate(
    template: EmailTemplate,
    context: {
      repName: string;
      repTitle: string;
      customerName: string;
      recipientName?: string;
      claimNumber?: string;
      propertyAddress?: string;
      selectedArguments?: string[];
    }
  ): string {
    const { structure } = template;
    const {
      repName,
      repTitle,
      customerName,
      recipientName = 'Sir/Madam',
      claimNumber,
      propertyAddress,
      selectedArguments = []
    } = context;

    let email = '';

    // Greeting
    if (structure.greeting) {
      email += `${structure.greeting.replace('[RECIPIENT_NAME]', recipientName)}\n\n`;
    } else {
      email += `Dear ${recipientName},\n\n`;
    }

    // Introduction
    if (structure.introduction) {
      email += structure.introduction
        .replace('[REP_NAME]', repName)
        .replace('[REP_TITLE]', repTitle)
        .replace('[CUSTOMER_NAME]', customerName)
        .replace('[CLAIM_NUMBER]', claimNumber || 'N/A')
        .replace('[PROPERTY_ADDRESS]', propertyAddress || 'the property');
      email += '\n\n';
    }

    // Evidence Statement
    if (structure.evidence_statement) {
      email += `${structure.evidence_statement}\n\n`;
    }

    // Arguments
    if (structure.argument_modules && structure.argument_modules.length > 0) {
      email += '**Key Points:**\n\n';
      structure.argument_modules.forEach((arg, index) => {
        email += `${index + 1}. ${arg}\n`;
      });
      email += '\n';
    }

    // Selected arguments from context
    if (selectedArguments.length > 0) {
      email += '**Supporting Evidence:**\n\n';
      selectedArguments.forEach((arg, index) => {
        email += `- ${arg}\n`;
      });
      email += '\n';
    }

    // Request
    if (structure.request) {
      email += `${structure.request}\n\n`;
    }

    // Closing
    if (structure.closing) {
      email += `${structure.closing}\n\n`;
    } else {
      if (template.tone === 'Formal, Assertive') {
        email += 'Thank you for your prompt attention to this matter.\n\n';
      } else if (template.tone === 'Warm, Encouraging') {
        email += 'Looking forward to a positive resolution for our customer.\n\n';
      } else {
        email += 'Thank you for your attention to this matter.\n\n';
      }
    }

    // Signature
    email += `Best regards,\n\n${repName}\n${repTitle}\nRoof-ER Claims Advocacy\n`;

    return email;
  }

  /**
   * Get template usage statistics
   */
  getTemplateStats(templateName: string): {
    name: string;
    usageCount: number;
    approvalRate: number;
    avgResponseTime: string;
  } | null {
    const template = this.getTemplateByName(templateName);
    if (!template || !template.success_indicators) {
      return null;
    }

    return {
      name: template.template_name,
      usageCount: template.success_indicators.usage_count || 0,
      approvalRate: template.success_indicators.approval_rate || 0,
      avgResponseTime: template.success_indicators.avg_response_time || 'N/A'
    };
  }

  /**
   * Extract key phrases from template
   */
  getKeyPhrases(templateName: string): string[] {
    const template = this.getTemplateByName(templateName);
    return template?.key_phrases || [];
  }

  /**
   * Get all arguments used across templates
   */
  getAllArguments(): string[] {
    const allArgs = new Set<string>();
    this.templates.forEach(template => {
      template.arguments_used.forEach(arg => allArgs.add(arg));
    });
    return Array.from(allArgs);
  }

  /**
   * Search templates by keyword
   */
  searchTemplates(keyword: string): EmailTemplate[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.templates.filter(template =>
      template.template_name.toLowerCase().includes(lowerKeyword) ||
      template.purpose.toLowerCase().includes(lowerKeyword) ||
      template.arguments_used.some(arg => arg.toLowerCase().includes(lowerKeyword)) ||
      template.key_phrases.some(phrase => phrase.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * Get templates sorted by success rate
   */
  getTopPerformingTemplates(limit: number = 5): EmailTemplate[] {
    return [...this.templates]
      .filter(t => t.success_indicators?.approval_rate)
      .sort((a, b) => {
        const rateA = a.success_indicators?.approval_rate || 0;
        const rateB = b.success_indicators?.approval_rate || 0;
        return rateB - rateA;
      })
      .slice(0, limit);
  }
}

// Export singleton instance
export const templateService = new TemplateService();

// Export utility functions
export function getTemplateRecommendation(scenario: {
  recipient: string;
  claimType: string;
  issues: string[];
  documents?: string[];
}): TemplateRecommendation {
  return templateService.recommendTemplate(scenario);
}

export function generateEmail(
  templateName: string,
  context: {
    repName: string;
    repTitle: string;
    customerName: string;
    recipientName?: string;
    claimNumber?: string;
    propertyAddress?: string;
    selectedArguments?: string[];
  }
): string {
  const template = templateService.getTemplateByName(templateName);
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }
  return templateService.generateEmailFromTemplate(template, context);
}

export function getAllTemplates(): EmailTemplate[] {
  return templateService.getAllTemplates();
}

export function searchTemplatesByKeyword(keyword: string): EmailTemplate[] {
  return templateService.searchTemplates(keyword);
}
