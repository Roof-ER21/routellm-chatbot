/**
 * Estimate Parser Library
 *
 * Parses roofing estimate documents to identify:
 * - Line items (materials, labor, equipment)
 * - Quantities and measurements
 * - Scope of work
 * - Total amounts
 * - Missing code-required items
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EstimateItem {
  id: string;
  description: string;
  category: 'material' | 'labor' | 'equipment' | 'permit' | 'disposal' | 'other';
  quantity?: number;
  unit?: string; // 'SQ', 'LF', 'EA', 'HR', etc.
  unitPrice?: number;
  totalPrice?: number;
  lineNumber?: number;
  notes?: string;
}

export interface EstimateAnalysis {
  items: EstimateItem[];
  scopeOfWork: string[];
  missingCodeItems: string[];
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  confidence: number; // 0-1 score for parsing accuracy
  metadata: {
    hasLineItems: boolean;
    hasQuantities: boolean;
    hasPricing: boolean;
    hasScope: boolean;
    estimateType?: 'detailed' | 'summary' | 'unknown';
    companyName?: string;
    estimateDate?: string;
    estimateNumber?: string;
  };
  warnings: string[];
}

export interface CodeRequirement {
  item: string;
  category: string;
  required: boolean;
  description: string;
  typicalQuantityFormula?: string;
}

// ============================================================================
// CODE REQUIREMENTS DATABASE
// ============================================================================

/**
 * Florida roofing code requirements (based on Oct 2025 regulations)
 */
export const FLORIDA_ROOFING_CODE_REQUIREMENTS: CodeRequirement[] = [
  // Underlayment
  {
    item: 'Synthetic Underlayment',
    category: 'material',
    required: true,
    description: 'Required per Florida Building Code for all roofing installations',
    typicalQuantityFormula: 'roof_area * 1.15' // 15% waste factor
  },
  {
    item: 'Ice and Water Shield',
    category: 'material',
    required: true,
    description: 'Required at valleys, eaves, and penetrations',
    typicalQuantityFormula: 'valleys + eaves + penetrations'
  },

  // Fasteners
  {
    item: 'Roofing Nails',
    category: 'material',
    required: true,
    description: 'Ring shank nails required per manufacturer specs',
    typicalQuantityFormula: 'shingles * 6' // 6 nails per shingle minimum
  },
  {
    item: 'Starter Shingles',
    category: 'material',
    required: true,
    description: 'Required at eaves and rakes',
    typicalQuantityFormula: 'eaves_lf + rakes_lf'
  },

  // Ventilation
  {
    item: 'Ridge Vent',
    category: 'material',
    required: true,
    description: 'Adequate ventilation required per code',
    typicalQuantityFormula: 'ridge_lf'
  },
  {
    item: 'Soffit Vents',
    category: 'material',
    required: false,
    description: 'Intake ventilation to balance ridge vent',
    typicalQuantityFormula: 'soffit_area / 150' // 1 sq ft vent per 150 sq ft attic
  },

  // Drip Edge
  {
    item: 'Drip Edge',
    category: 'material',
    required: true,
    description: 'Required at eaves and rakes per FBC',
    typicalQuantityFormula: 'eaves_lf + rakes_lf'
  },

  // Flashing
  {
    item: 'Step Flashing',
    category: 'material',
    required: true,
    description: 'Required at wall/roof intersections',
    typicalQuantityFormula: 'wall_intersection_lf'
  },
  {
    item: 'Chimney Flashing',
    category: 'material',
    required: false,
    description: 'Required if chimney present',
    typicalQuantityFormula: 'chimney_perimeter'
  },
  {
    item: 'Pipe Boot Flashing',
    category: 'material',
    required: true,
    description: 'Required for all roof penetrations',
    typicalQuantityFormula: 'pipe_count'
  },

  // Shingles
  {
    item: 'Impact Resistant Shingles',
    category: 'material',
    required: false,
    description: 'Class 4 IR shingles may be required by insurance or provide discount',
    typicalQuantityFormula: 'roof_area'
  },

  // Decking
  {
    item: 'Roof Decking Replacement',
    category: 'material',
    required: false,
    description: 'Required if existing decking is damaged',
    typicalQuantityFormula: 'damaged_area'
  },

  // Labor
  {
    item: 'Tear-off Labor',
    category: 'labor',
    required: true,
    description: 'Removal of existing roofing materials',
    typicalQuantityFormula: 'roof_area'
  },
  {
    item: 'Installation Labor',
    category: 'labor',
    required: true,
    description: 'Installation of new roofing system',
    typicalQuantityFormula: 'roof_area'
  },

  // Permits
  {
    item: 'Building Permit',
    category: 'permit',
    required: true,
    description: 'Required for all roofing work in Florida',
    typicalQuantityFormula: '1'
  },

  // Disposal
  {
    item: 'Debris Removal',
    category: 'disposal',
    required: true,
    description: 'Removal and disposal of old roofing materials',
    typicalQuantityFormula: 'roof_area'
  },
  {
    item: 'Dumpster Rental',
    category: 'disposal',
    required: false,
    description: 'Container for debris disposal',
    typicalQuantityFormula: 'roof_area / 30' // 1 dumpster per 30 squares approx
  }
];

// ============================================================================
// ESTIMATE PARSER
// ============================================================================

export class EstimateParser {

  /**
   * Parse estimate text and extract structured data
   */
  parseEstimate(text: string): EstimateAnalysis {
    console.log('[EstimateParser] Starting estimate parsing...');
    console.log('[EstimateParser] Text length:', text.length);

    const startTime = Date.now();
    const warnings: string[] = [];

    // Extract metadata
    const metadata = this.extractMetadata(text);

    // Extract line items
    const items = this.extractLineItems(text);
    console.log('[EstimateParser] Extracted', items.length, 'line items');

    // Extract scope of work
    const scopeOfWork = this.extractScopeOfWork(text);
    console.log('[EstimateParser] Extracted', scopeOfWork.length, 'scope items');

    // Extract totals
    const totals = this.extractTotals(text);
    console.log('[EstimateParser] Totals:', totals);

    // Identify missing code items
    const missingCodeItems = this.identifyMissingCodeItems(items);
    console.log('[EstimateParser] Found', missingCodeItems.length, 'missing code items');

    // Calculate confidence score
    const confidence = this.calculateConfidence(items, metadata, totals);
    console.log('[EstimateParser] Confidence score:', confidence);

    // Add warnings
    if (items.length === 0) {
      warnings.push('No line items found in estimate');
    }
    if (!totals.totalAmount) {
      warnings.push('No total amount found in estimate');
    }
    if (missingCodeItems.length > 5) {
      warnings.push(`${missingCodeItems.length} code-required items appear to be missing`);
    }
    if (confidence < 0.5) {
      warnings.push('Low parsing confidence - estimate may be poorly structured');
    }

    const parseTime = Date.now() - startTime;
    console.log('[EstimateParser] Parsing completed in', parseTime, 'ms');

    return {
      items,
      scopeOfWork,
      missingCodeItems,
      totalAmount: totals.totalAmount,
      subtotal: totals.subtotal,
      tax: totals.tax,
      confidence,
      metadata,
      warnings
    };
  }

  // ============================================================================
  // EXTRACTION METHODS
  // ============================================================================

  /**
   * Extract metadata from estimate
   */
  private extractMetadata(text: string): EstimateAnalysis['metadata'] {
    const lowerText = text.toLowerCase();

    // Company name (look for common patterns)
    let companyName: string | undefined;
    const companyPatterns = [
      /company:\s*([^\n]+)/i,
      /contractor:\s*([^\n]+)/i,
      /prepared\s+by:\s*([^\n]+)/i
    ];
    for (const pattern of companyPatterns) {
      const match = text.match(pattern);
      if (match) {
        companyName = match[1].trim();
        break;
      }
    }

    // Estimate date
    let estimateDate: string | undefined;
    const datePatterns = [
      /estimate\s+date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
      /date:\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i
    ];
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        estimateDate = match[1];
        break;
      }
    }

    // Estimate number
    let estimateNumber: string | undefined;
    const numberPatterns = [
      /estimate\s*(?:#|no\.?|number):\s*([A-Z0-9-]+)/i,
      /proposal\s*(?:#|no\.?|number):\s*([A-Z0-9-]+)/i
    ];
    for (const pattern of numberPatterns) {
      const match = text.match(pattern);
      if (match) {
        estimateNumber = match[1];
        break;
      }
    }

    // Determine if estimate has structured line items
    const hasLineItems = lowerText.includes('line') ||
                         lowerText.includes('item') ||
                         /^\d+\s+[A-Z]/m.test(text);

    // Check for quantities
    const hasQuantities = /\d+\s+(sq|lf|ea|sf|hours?|hrs?)/i.test(text);

    // Check for pricing
    const hasPricing = /\$[\d,]+\.?\d*/g.test(text);

    // Check for scope of work section
    const hasScope = lowerText.includes('scope of work') ||
                     lowerText.includes('work to be performed') ||
                     lowerText.includes('description');

    // Determine estimate type
    let estimateType: 'detailed' | 'summary' | 'unknown' = 'unknown';
    if (hasLineItems && hasQuantities && hasPricing) {
      estimateType = 'detailed';
    } else if (hasPricing) {
      estimateType = 'summary';
    }

    return {
      hasLineItems,
      hasQuantities,
      hasPricing,
      hasScope,
      estimateType,
      companyName,
      estimateDate,
      estimateNumber
    };
  }

  /**
   * Extract line items from estimate
   */
  private extractLineItems(text: string): EstimateItem[] {
    const items: EstimateItem[] = [];
    const lines = text.split('\n');

    let lineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and headers
      if (!line || line.length < 5) continue;
      if (this.isHeaderLine(line)) continue;

      // Try to parse as line item
      const item = this.parseLineItem(line, lineNumber);

      if (item) {
        items.push(item);
        lineNumber++;
      }
    }

    return items;
  }

  /**
   * Parse a single line as an estimate item
   */
  private parseLineItem(line: string, lineNumber: number): EstimateItem | null {
    // Pattern: [line#] [description] [quantity] [unit] [unit_price] [total]
    // Example: "1. Synthetic underlayment 25 SQ $15.00 $375.00"
    // Example: "Tear-off existing shingles    20 SQ    $2.50    $50.00"

    // Extract dollar amounts
    const dollarAmounts = this.extractDollarAmounts(line);

    // If no dollar amounts, might still be valid item
    // Extract quantities and units
    const quantityMatch = line.match(/(\d+(?:\.\d+)?)\s*(sq|square|lf|linear\s*f(?:ee)?t|ea|each|sf|square\s*f(?:ee)?t|hr|hour|pc|piece)/i);

    let quantity: number | undefined;
    let unit: string | undefined;

    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
      unit = this.normalizeUnit(quantityMatch[2]);
    }

    // Extract description (everything before quantity or first dollar amount)
    let description = line;

    // Remove line number prefix if present
    description = description.replace(/^\d+[\.)]\s*/, '');

    // Remove quantity info
    if (quantityMatch) {
      const qtyIndex = description.indexOf(quantityMatch[0]);
      if (qtyIndex > 0) {
        description = description.substring(0, qtyIndex);
      }
    }

    // Remove dollar amounts
    description = description.replace(/\$[\d,]+\.?\d*/g, '').trim();

    // If description is too short, probably not a valid item
    if (description.length < 3) return null;

    // Categorize item
    const category = this.categorizeItem(description);

    // Extract pricing
    let unitPrice: number | undefined;
    let totalPrice: number | undefined;

    if (dollarAmounts.length >= 2) {
      // Assume last is total, second-to-last is unit price
      totalPrice = dollarAmounts[dollarAmounts.length - 1];
      unitPrice = dollarAmounts[dollarAmounts.length - 2];
    } else if (dollarAmounts.length === 1) {
      totalPrice = dollarAmounts[0];
    }

    return {
      id: `item-${lineNumber}`,
      description: description.trim(),
      category,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      lineNumber
    };
  }

  /**
   * Check if line is a header/section title
   */
  private isHeaderLine(line: string): boolean {
    const lowerLine = line.toLowerCase();

    const headerKeywords = [
      'estimate',
      'proposal',
      'scope of work',
      'materials',
      'labor',
      'item',
      'description',
      'quantity',
      'unit',
      'price',
      'total',
      'subtotal',
      'tax',
      'grand total'
    ];

    // If line is ALL CAPS, likely a header
    if (line === line.toUpperCase() && line.length > 3) {
      return true;
    }

    // If line contains only header keywords and no numbers/dollars
    const hasOnlyKeywords = headerKeywords.some(kw => lowerLine.includes(kw));
    const hasNumbers = /\d/.test(line);

    if (hasOnlyKeywords && !hasNumbers) {
      return true;
    }

    return false;
  }

  /**
   * Extract scope of work items
   */
  private extractScopeOfWork(text: string): string[] {
    const scopeItems: string[] = [];

    // Look for scope section
    const scopePatterns = [
      /scope\s+of\s+work:?\s*([\s\S]+?)(?=\n\n|materials:|labor:|total:|$)/i,
      /work\s+to\s+be\s+performed:?\s*([\s\S]+?)(?=\n\n|materials:|labor:|total:|$)/i,
      /description:?\s*([\s\S]+?)(?=\n\n|materials:|labor:|total:|$)/i
    ];

    for (const pattern of scopePatterns) {
      const match = text.match(pattern);
      if (match) {
        const scopeText = match[1];

        // Split into individual items (bulleted, numbered, or line-by-line)
        const lines = scopeText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();

          // Extract bulleted/numbered items
          const cleaned = trimmed.replace(/^[\d\.\-\*•]+\s*/, '').trim();

          if (cleaned.length > 10) {
            scopeItems.push(cleaned);
          }
        }

        break;
      }
    }

    // If no scope section found, extract from line items
    if (scopeItems.length === 0) {
      // Use line item descriptions as scope
      const items = this.extractLineItems(text);
      scopeItems.push(...items.map(item => item.description).slice(0, 10));
    }

    return scopeItems;
  }

  /**
   * Extract total amounts from estimate
   */
  private extractTotals(text: string): { subtotal?: number; tax?: number; totalAmount?: number } {
    const result: { subtotal?: number; tax?: number; totalAmount?: number } = {};

    // Subtotal
    const subtotalMatch = text.match(/subtotal:?\s*\$?([\d,]+\.?\d*)/i);
    if (subtotalMatch) {
      result.subtotal = this.parseDollar(subtotalMatch[1]);
    }

    // Tax
    const taxMatch = text.match(/tax:?\s*\$?([\d,]+\.?\d*)/i);
    if (taxMatch) {
      result.tax = this.parseDollar(taxMatch[1]);
    }

    // Total
    const totalPatterns = [
      /(?:grand\s+)?total:?\s*\$?([\d,]+\.?\d*)/i,
      /total\s+amount:?\s*\$?([\d,]+\.?\d*)/i,
      /total\s+cost:?\s*\$?([\d,]+\.?\d*)/i
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        result.totalAmount = this.parseDollar(match[1]);
        break;
      }
    }

    // If no total found, try to sum line items
    if (!result.totalAmount) {
      const items = this.extractLineItems(text);
      const sum = items.reduce((acc, item) => acc + (item.totalPrice || 0), 0);
      if (sum > 0) {
        result.totalAmount = sum;
      }
    }

    return result;
  }

  /**
   * Identify missing code-required items
   */
  private identifyMissingCodeItems(items: EstimateItem[]): string[] {
    const missing: string[] = [];

    // Create searchable text from all items
    const allItemsText = items.map(i => i.description.toLowerCase()).join(' ');

    // Check each code requirement
    for (const requirement of FLORIDA_ROOFING_CODE_REQUIREMENTS) {
      if (!requirement.required) continue;

      // Check if this item or similar is in estimate
      const itemKeywords = requirement.item.toLowerCase().split(' ');
      const hasItem = itemKeywords.some(keyword =>
        allItemsText.includes(keyword) && keyword.length > 3
      );

      if (!hasItem) {
        missing.push(requirement.item);
      }
    }

    return missing;
  }

  /**
   * Calculate parsing confidence score (0-1)
   */
  private calculateConfidence(
    items: EstimateItem[],
    metadata: EstimateAnalysis['metadata'],
    totals: { subtotal?: number; tax?: number; totalAmount?: number }
  ): number {
    let score = 0;

    // Has line items (0.3 points)
    if (items.length > 0) {
      score += 0.3;
    }

    // Has quantities (0.2 points)
    if (metadata.hasQuantities) {
      score += 0.2;
    }

    // Has pricing (0.2 points)
    if (metadata.hasPricing) {
      score += 0.2;
    }

    // Has total amount (0.15 points)
    if (totals.totalAmount) {
      score += 0.15;
    }

    // Has scope (0.15 points)
    if (metadata.hasScope) {
      score += 0.15;
    }

    return Math.min(score, 1.0);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Categorize an item based on description
   */
  private categorizeItem(description: string): EstimateItem['category'] {
    const lowerDesc = description.toLowerCase();

    // Material keywords
    if (lowerDesc.includes('shingle') ||
        lowerDesc.includes('underlayment') ||
        lowerDesc.includes('nail') ||
        lowerDesc.includes('vent') ||
        lowerDesc.includes('flashing') ||
        lowerDesc.includes('drip edge') ||
        lowerDesc.includes('decking')) {
      return 'material';
    }

    // Labor keywords
    if (lowerDesc.includes('labor') ||
        lowerDesc.includes('install') ||
        lowerDesc.includes('tear') ||
        lowerDesc.includes('remove') ||
        lowerDesc.includes('replace')) {
      return 'labor';
    }

    // Equipment keywords
    if (lowerDesc.includes('equipment') ||
        lowerDesc.includes('scaffold') ||
        lowerDesc.includes('crane')) {
      return 'equipment';
    }

    // Permit keywords
    if (lowerDesc.includes('permit') ||
        lowerDesc.includes('inspection') ||
        lowerDesc.includes('fee')) {
      return 'permit';
    }

    // Disposal keywords
    if (lowerDesc.includes('disposal') ||
        lowerDesc.includes('dumpster') ||
        lowerDesc.includes('debris') ||
        lowerDesc.includes('haul')) {
      return 'disposal';
    }

    return 'other';
  }

  /**
   * Normalize unit abbreviations
   */
  private normalizeUnit(unit: string): string {
    const lowerUnit = unit.toLowerCase().replace(/\s+/g, '');

    const unitMap: Record<string, string> = {
      'sq': 'SQ',
      'square': 'SQ',
      'squares': 'SQ',
      'lf': 'LF',
      'linearfeet': 'LF',
      'linearfoot': 'LF',
      'linft': 'LF',
      'ea': 'EA',
      'each': 'EA',
      'sf': 'SF',
      'squarefeet': 'SF',
      'squarefoot': 'SF',
      'sqft': 'SF',
      'hr': 'HR',
      'hour': 'HR',
      'hours': 'HR',
      'hrs': 'HR',
      'pc': 'PC',
      'piece': 'PC',
      'pieces': 'PC'
    };

    return unitMap[lowerUnit] || unit.toUpperCase();
  }

  /**
   * Extract dollar amounts from text
   */
  private extractDollarAmounts(text: string): number[] {
    const matches = text.match(/\$?([\d,]+\.?\d*)/g);
    if (!matches) return [];

    return matches
      .map(m => this.parseDollar(m))
      .filter(n => !isNaN(n) && n > 0);
  }

  /**
   * Parse dollar string to number
   */
  private parseDollar(str: string): number {
    const cleaned = str.replace(/[$,]/g, '');
    return parseFloat(cleaned);
  }

  /**
   * Get code requirement details for a missing item
   */
  getCodeRequirement(itemName: string): CodeRequirement | null {
    return FLORIDA_ROOFING_CODE_REQUIREMENTS.find(
      req => req.item.toLowerCase() === itemName.toLowerCase()
    ) || null;
  }

  /**
   * Get all code requirements by category
   */
  getCodeRequirementsByCategory(category: string): CodeRequirement[] {
    return FLORIDA_ROOFING_CODE_REQUIREMENTS.filter(
      req => req.category === category
    );
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const estimateParser = new EstimateParser();
export default estimateParser;
