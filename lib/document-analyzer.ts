/**
 * Document Analyzer - Intelligent PDF analysis for claims documents
 * Extracts structured information and identifies key issues
 */

export interface DocumentAnalysisResult {
  documentType: string;
  confidence: number;
  extractedData: {
    claimNumber?: string;
    policyNumber?: string;
    propertyAddress?: string;
    estimateAmount?: number;
    dateOfLoss?: string;
    roofingMaterial?: string;
    measurements?: {
      squares?: number;
      pitchSlope?: string;
    };
  };
  identifiedIssues: DocumentIssue[];
  codeReferences: CodeReference[];
  recommendations: string[];
  summary: string;
}

export interface DocumentIssue {
  type: 'matching_shingle' | 'depreciation' | 'scope_accuracy' | 'measurement' | 'code_violation' | 'manufacturer_spec' | 'other';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedItems: string[];
  suggestedArguments: string[];
  codeReferences?: string[];
}

export interface CodeReference {
  code: string;
  section: string;
  description: string;
  applicability: string;
  successRate?: number;
}

// Known building codes
const BUILDING_CODES: CodeReference[] = [
  {
    code: 'IRC',
    section: 'R908.3',
    description: 'Matching shingle requirement - existing shingles must match in color, size, quality',
    applicability: 'All jurisdictions adopting IRC',
    successRate: 92
  },
  {
    code: 'IBC',
    section: '1510.3',
    description: 'Re-roofing requirements and material compatibility',
    applicability: 'Commercial buildings',
    successRate: 88
  },
  {
    code: 'VA Building Code',
    section: 'R908.3',
    description: 'Virginia-specific matching requirements',
    applicability: 'Virginia properties only',
    successRate: 95
  },
  {
    code: 'MD Building Code',
    section: 'R908.3',
    description: 'Maryland-specific matching requirements',
    applicability: 'Maryland properties only',
    successRate: 93
  },
  {
    code: 'PA UCC',
    section: '3404.5',
    description: 'Pennsylvania Uniform Construction Code - roofing materials',
    applicability: 'Pennsylvania properties only',
    successRate: 90
  }
];

// Manufacturer specifications
const MANUFACTURER_SPECS = {
  'GAF': {
    matchingRequirement: 'Shingles must match in color, style, and quality for warranty validity',
    warrantyImpact: 'Mismatched repairs void manufacturer warranty',
    installationManual: 'GAF Installation Standards require matching materials'
  },
  'Owens Corning': {
    matchingRequirement: 'Replacement shingles must be from same product line',
    warrantyImpact: 'Non-matching repairs may void limited warranty',
    installationManual: 'Owens Corning Professional Standards'
  },
  'CertainTeed': {
    matchingRequirement: 'Color and quality matching required for warranty coverage',
    warrantyImpact: 'Warranty excludes mismatched repairs',
    installationManual: 'CertainTeed Installation Guidelines'
  }
};

class DocumentAnalyzer {
  /**
   * Analyze uploaded document
   */
  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    const text = await this.extractText(file);
    const documentType = this.identifyDocumentType(text);
    const extractedData = this.extractStructuredData(text, documentType);
    const issues = this.identifyIssues(text, extractedData);
    const codeRefs = this.findApplicableCodes(extractedData, issues);
    const recommendations = this.generateRecommendations(issues, codeRefs);

    return {
      documentType,
      confidence: this.calculateConfidence(documentType, extractedData),
      extractedData,
      identifiedIssues: issues,
      codeReferences: codeRefs,
      recommendations,
      summary: this.generateSummary(documentType, issues)
    };
  }

  /**
   * Extract text from PDF (simplified - in production use pdf-parse)
   */
  private async extractText(file: File): Promise<string> {
    // In production, use pdf-parse or similar library
    // For now, return placeholder that would work with your existing extraction
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.readAsText(file);
    });
  }

  /**
   * Identify document type from content
   */
  private identifyDocumentType(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes('estimate') && (lower.includes('roofing') || lower.includes('roof'))) {
      return 'Roofing Estimate';
    }
    if (lower.includes('claim') && lower.includes('denial')) {
      return 'Claim Denial Letter';
    }
    if (lower.includes('inspection report') || lower.includes('adjuster')) {
      return 'Insurance Inspection Report';
    }
    if (lower.includes('policy') && lower.includes('coverage')) {
      return 'Insurance Policy Document';
    }
    if (lower.includes('invoice') || lower.includes('payment')) {
      return 'Invoice/Payment Document';
    }

    return 'Unknown Document Type';
  }

  /**
   * Extract structured data using patterns
   */
  private extractStructuredData(text: string, docType: string): DocumentAnalysisResult['extractedData'] {
    const data: DocumentAnalysisResult['extractedData'] = {};

    // Extract claim number
    const claimMatch = text.match(/claim\s*#?\s*:?\s*(\d+[-\d]*)/i);
    if (claimMatch) data.claimNumber = claimMatch[1];

    // Extract policy number
    const policyMatch = text.match(/policy\s*#?\s*:?\s*([A-Z0-9-]+)/i);
    if (policyMatch) data.policyNumber = policyMatch[1];

    // Extract property address
    const addressMatch = text.match(/(?:property|address|location)\s*:?\s*([^\n]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)[^\n]*)/i);
    if (addressMatch) data.propertyAddress = addressMatch[1].trim();

    // Extract estimate amount
    const amountMatch = text.match(/(?:total|estimate|amount)\s*:?\s*\$\s*([\d,]+\.?\d*)/i);
    if (amountMatch) data.estimateAmount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Extract date of loss
    const dateMatch = text.match(/(?:date of loss|loss date|incident date)\s*:?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (dateMatch) data.dateOfLoss = dateMatch[1];

    // Extract roofing material
    const materialMatch = text.match(/(?:shingle|material|roofing)\s*:?\s*([\w\s]+?)(?:\n|,|$)/i);
    if (materialMatch) data.roofingMaterial = materialMatch[1].trim();

    // Extract measurements
    const squaresMatch = text.match(/(\d+\.?\d*)\s*(?:squares|sq)/i);
    if (squaresMatch) {
      data.measurements = data.measurements || {};
      data.measurements.squares = parseFloat(squaresMatch[1]);
    }

    const pitchMatch = text.match(/(?:pitch|slope)\s*:?\s*(\d+:\d+|\d+\/\d+)/i);
    if (pitchMatch) {
      data.measurements = data.measurements || {};
      data.measurements.pitchSlope = pitchMatch[1];
    }

    return data;
  }

  /**
   * Identify issues in the document
   */
  private identifyIssues(text: string, data: DocumentAnalysisResult['extractedData']): DocumentIssue[] {
    const issues: DocumentIssue[] = [];
    const lower = text.toLowerCase();

    // Check for matching shingle issue
    if (lower.includes('patch') || lower.includes('repair') ||
        (lower.includes('replace') && !lower.includes('full replacement'))) {
      if (!lower.includes('match') && !lower.includes('matching')) {
        issues.push({
          type: 'matching_shingle',
          severity: 'critical',
          description: 'Estimate lacks matching shingle requirement per IRC R908.3',
          affectedItems: ['Shingle replacement scope'],
          suggestedArguments: [
            'IRC R908.3 requires matching color, size, and quality',
            'Manufacturer warranty requires matching materials',
            'State building code compliance mandate'
          ],
          codeReferences: ['IRC R908.3', 'VA Building Code R908.3']
        });
      }
    }

    // Check for depreciation issues
    if (lower.includes('depreciation') || lower.includes('rcv') || lower.includes('acv')) {
      const depMatch = text.match(/depreciation\s*:?\s*\$\s*([\d,]+)/i);
      if (depMatch) {
        const depAmount = parseFloat(depMatch[1].replace(/,/g, ''));
        if (depAmount > 1000) {
          issues.push({
            type: 'depreciation',
            severity: 'high',
            description: `Excessive depreciation applied: $${depAmount.toLocaleString()}`,
            affectedItems: ['Total claim payment'],
            suggestedArguments: [
              'State regulations may limit depreciation on matching materials',
              'Depreciation should not apply to code-required matching',
              'Insurance policy interpretation'
            ],
            codeReferences: ['State Insurance Regulations']
          });
        }
      }
    }

    // Check for scope accuracy
    if (data.measurements?.squares && data.measurements.squares < 15) {
      issues.push({
        type: 'scope_accuracy',
        severity: 'medium',
        description: 'Small repair scope may trigger matching requirement for entire slope',
        affectedItems: ['Repair scope', 'Material quantities'],
        suggestedArguments: [
          'IRC R908.3 applies regardless of repair size',
          'Visible mismatch affects property value',
          'Industry standard: match entire visible slope'
        ],
        codeReferences: ['IRC R908.3']
      });
    }

    // Check for manufacturer specifications
    const manufacturers = ['GAF', 'Owens Corning', 'CertainTeed', 'Tamko', 'Atlas'];
    manufacturers.forEach(mfr => {
      if (text.includes(mfr)) {
        issues.push({
          type: 'manufacturer_spec',
          severity: 'medium',
          description: `${mfr} manufacturer specifications require matching materials`,
          affectedItems: ['Material specifications'],
          suggestedArguments: [
            `${mfr} installation manual requires matching`,
            'Warranty void if non-matching materials used',
            'Manufacturer technical support confirms requirement'
          ],
          codeReferences: [`${mfr} Installation Standards`]
        });
      }
    });

    return issues;
  }

  /**
   * Find applicable building codes
   */
  private findApplicableCodes(
    data: DocumentAnalysisResult['extractedData'],
    issues: DocumentIssue[]
  ): CodeReference[] {
    const codes: CodeReference[] = [];

    // Always include IRC R908.3 for matching issues
    if (issues.some(i => i.type === 'matching_shingle')) {
      const ircCode = BUILDING_CODES.find(c => c.code === 'IRC' && c.section === 'R908.3');
      if (ircCode) codes.push(ircCode);
    }

    // Add state-specific codes based on address
    const address = data.propertyAddress?.toLowerCase() || '';
    if (address.includes('va') || address.includes('virginia')) {
      const vaCode = BUILDING_CODES.find(c => c.code === 'VA Building Code');
      if (vaCode) codes.push(vaCode);
    }
    if (address.includes('md') || address.includes('maryland')) {
      const mdCode = BUILDING_CODES.find(c => c.code === 'MD Building Code');
      if (mdCode) codes.push(mdCode);
    }
    if (address.includes('pa') || address.includes('pennsylvania')) {
      const paCode = BUILDING_CODES.find(c => c.code === 'PA UCC');
      if (paCode) codes.push(paCode);
    }

    return codes;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    issues: DocumentIssue[],
    codes: CodeReference[]
  ): string[] {
    const recommendations: string[] = [];

    if (issues.length === 0) {
      recommendations.push('Document appears compliant - no major issues identified');
      return recommendations;
    }

    // Sort issues by severity
    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');

    if (critical.length > 0) {
      recommendations.push(`Address ${critical.length} critical issue(s) immediately:`);
      critical.forEach(issue => {
        recommendations.push(`  • ${issue.description}`);
      });
    }

    if (high.length > 0) {
      recommendations.push(`Review ${high.length} high-priority issue(s):`);
      high.forEach(issue => {
        recommendations.push(`  • ${issue.description}`);
      });
    }

    // Add code-specific recommendations
    if (codes.length > 0) {
      recommendations.push('Cite the following building codes in your response:');
      codes.forEach(code => {
        recommendations.push(`  • ${code.code} ${code.section} (${code.successRate}% success rate)`);
      });
    }

    // Template recommendation
    if (issues.some(i => i.type === 'matching_shingle')) {
      recommendations.push('Recommended template: "Insurance Company - Code Violation Argument"');
    } else if (issues.some(i => i.type === 'depreciation')) {
      recommendations.push('Recommended template: "Insurance Company - Multi-Argument Comprehensive"');
    }

    return recommendations;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    docType: string,
    data: DocumentAnalysisResult['extractedData']
  ): number {
    let confidence = 50; // Base confidence

    if (docType !== 'Unknown Document Type') confidence += 20;
    if (data.claimNumber) confidence += 10;
    if (data.propertyAddress) confidence += 10;
    if (data.estimateAmount) confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * Generate summary
   */
  private generateSummary(docType: string, issues: DocumentIssue[]): string {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;

    if (criticalCount > 0) {
      return `${docType} analyzed: ${criticalCount} critical and ${highCount} high-priority issues found. Immediate action required.`;
    } else if (highCount > 0) {
      return `${docType} analyzed: ${highCount} high-priority issues identified. Review recommended.`;
    } else if (issues.length > 0) {
      return `${docType} analyzed: ${issues.length} minor issues noted. Consider addressing in communication.`;
    } else {
      return `${docType} analyzed: No significant issues detected.`;
    }
  }
}

// Export singleton
export const documentAnalyzer = new DocumentAnalyzer();

// Export utility functions
export async function analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
  return documentAnalyzer.analyzeDocument(file);
}

export function getApplicableCodesForState(state: string): CodeReference[] {
  return BUILDING_CODES.filter(code =>
    code.applicability.toLowerCase().includes(state.toLowerCase()) ||
    code.applicability.toLowerCase().includes('all jurisdictions')
  );
}

export function getManufacturerSpecs(manufacturer: string): typeof MANUFACTURER_SPECS[keyof typeof MANUFACTURER_SPECS] | null {
  return MANUFACTURER_SPECS[manufacturer as keyof typeof MANUFACTURER_SPECS] || null;
}

export function getAllBuildingCodes(): CodeReference[] {
  return BUILDING_CODES;
}
