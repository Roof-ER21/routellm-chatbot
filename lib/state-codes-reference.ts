/**
 * State-Specific Building Codes and Requirements - VERSION 2.0
 * Focus: Virginia (VA), Maryland (MD), Pennsylvania (PA)
 *
 * CRITICAL: This file contains FACTUALLY CORRECT information based on:
 * - 2021 IRC adoption dates and effective dates
 * - Actual insurance regulations (MIA Bulletin 18-23 for MD)
 * - Correct argument-to-code mappings
 *
 * This reference corrects previous errors where IRC codes were cited
 * for arguments they don't apply to (e.g., R908.3 for repairability).
 */

export interface StateCode {
  code: string;
  title: string;
  description: string;
  reference: string;
  whenToUse: string;  // NEW: Explains when this code applies
  doNotUseFor: string[];  // NEW: Common misuses to avoid
  successRate?: number;
}

export interface Argument {
  name: string;
  description: string;
  correctCitations: string[];
  incorrectCitations: string[];  // NEW: Citations to NEVER use
  exampleLanguage: string;
  successRate: number;
}

export interface StateRequirement {
  requirement: string;
  details: string;
  source: string;
}

export interface StateInfo {
  abbreviation: string;
  name: string;
  ircVersion: string;
  ircEffectiveDate: string;
  buildingCodes: StateCode[];
  arguments: Argument[];  // NEW: Argument strategies with correct citations
  specialRequirements: StateRequirement[];  // Kept for backward compatibility with UI
  insuranceRegulations: string[];
  notes: string[];
}

export const STATE_CODES: Record<string, StateInfo> = {
  VA: {
    abbreviation: 'VA',
    name: 'Virginia',
    ircVersion: '2021 IRC',
    ircEffectiveDate: 'January 18, 2024',
    buildingCodes: [
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'When existing roof covering is removed for reroofing, underlying components (ice & water shield, underlayment) must be brought to current code',
        reference: 'Virginia USBC, effective 1/18/2024',
        whenToUse: 'ONLY when reroofing is already approved - to argue that the scope must include code-compliant underlayment and ice & water shield',
        doNotUseFor: ['Repairability arguments', 'Discontinued shingle arguments', 'Matching arguments', 'Storm damage assessment'],
        successRate: 90
      },
      {
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application (less than 4:12) requires two layers of underlayment',
        reference: 'Virginia USBC',
        whenToUse: 'For roofs with slopes below 4:12 requiring special underlayment treatment',
        doNotUseFor: ['Repairability arguments', 'Discontinued products', 'Matching'],
        successRate: 93
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Ice barrier required in areas with average daily temperature ≤ 25°F or where there is a possibility of ice forming along the eaves',
        reference: 'Virginia USBC (formerly R903.2.1 in 2018 IRC)',
        whenToUse: 'To argue for ice & water shield installation in climate zones prone to ice damming',
        doNotUseFor: ['Repairability', 'Product availability', 'Storm damage'],
        successRate: 88
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer and under roofing',
        reference: 'Virginia USBC',
        whenToUse: 'For siding replacement requiring housewrap installation',
        doNotUseFor: ['Roof repairability', 'Matching arguments'],
        successRate: 85
      },
      {
        code: '2021 IRC R703.4',
        title: 'Flashing',
        description: 'Flashing required at wall and roof intersections, must overlap properly',
        reference: 'Virginia USBC',
        whenToUse: 'When arguing for proper flashing installation during approved work',
        doNotUseFor: ['Repairability', 'Product discontinuation'],
        successRate: 87
      }
    ],
    arguments: [
      {
        name: 'Repairability (Primary Strategy for VA)',
        description: 'Argue that shingles cannot be repaired due to age, brittleness, or failed repair attempt',
        correctCitations: [
          'GAF Storm Damage Guidelines - Recommends against repairing more than 2-3 shingles per plane',
          'Brittle Test Documentation - Physical evidence of failed repair attempt',
          'Manufacturer Warranty - Repairs void warranty',
          'Age and Condition - Shingles too old/brittle to manipulate'
        ],
        incorrectCitations: ['IRC R908.3', 'Any building code', 'Matching requirements'],
        exampleLanguage: 'Based on the brittle test we conducted [attach photos], the existing shingles cannot be repaired without causing additional damage. GAF guidelines recommend full replacement when shingles fail manipulation. This is a repairability issue due to the age and condition of the materials.',
        successRate: 92
      },
      {
        name: 'Differing Dimensions',
        description: 'Argue that metric vs English dimension differences prevent proper repair',
        correctCitations: [
          'iTel Report - Confirms discontinued product',
          'Dimensional Analysis - Metric vs English exposure differences',
          'Manufacturer Installation Standards - Sealant strip misalignment'
        ],
        incorrectCitations: ['IRC R908.3', 'Building codes', 'Matching laws (VA has none)'],
        exampleLanguage: 'The existing English-dimension shingles cannot be mixed with new metric-dimension shingles. The exposure size difference causes sealant strip misalignment, violating manufacturer installation standards and creating leak points.',
        successRate: 88
      },
      {
        name: 'Missed Storm Damage',
        description: 'Argue for scope expansion based on additional damage found',
        correctCitations: [
          'Photo Report - Documentation of additional damage',
          'Consistency Argument - Pattern matches approved areas',
          'GAF Storm Damage Guidelines - For damage assessment'
        ],
        incorrectCitations: ['IRC codes', 'Matching requirements'],
        exampleLanguage: 'Our photo report shows storm damage on the north and west slopes consistent with the east slope damage already approved. The damage pattern indicates the same storm event affected all slopes.',
        successRate: 87
      },
      {
        name: 'Code Compliance (When Work Approved)',
        description: 'Argue that approved work must meet current code',
        correctCitations: [
          'IRC R908.3 - Reroofing code compliance',
          'IRC R905.1.2 - Ice barrier requirements',
          'IRC R905.2.2 - Slope/underlayment requirements'
        ],
        incorrectCitations: [],
        exampleLanguage: 'Per IRC R908.3, when the existing roof covering is removed for the approved replacement, the underlayment and ice & water shield must meet current 2021 IRC standards adopted by Virginia on January 18, 2024.',
        successRate: 90
      }
    ],
    specialRequirements: [
      {
        requirement: 'Repairability Arguments (No Matching Requirement)',
        details: 'Virginia does not require insurance companies to account for matching unless policy includes matching endorsement. Focus on: Repairability using Brittle Test or Repair Attempt, differing dimensions preventing proper repair, missed storm damage to unapproved areas, code compliance for ice & water shield and underlayment when work is approved',
        source: 'Virginia insurance practices and GAF Storm Damage Guidelines'
      },
      {
        requirement: 'Virginia Building Code Compliance',
        details: 'All roofing work must comply with the Virginia USBC, which adopted the 2021 IRC effective January 18, 2024. Use IRC codes ONLY when arguing that approved work must meet code requirements.',
        source: 'Virginia Department of Housing and Community Development (DHCD)'
      }
    ],
    insuranceRegulations: [
      'Virginia Bureau of Insurance regulates claim handling',
      'Insurers must respond to claims within reasonable time',
      'Policyholders have right to independent appraisal',
      'Unfair claim settlement practices prohibited under VA Code § 38.2-510',
      'NO STATE-MANDATED MATCHING REQUIREMENT - Matching only applies if policy includes matching endorsement'
    ],
    notes: [
      'Virginia adopted 2021 IRC effective January 18, 2024',
      'Transition period: Jan 18, 2024 - Jan 17, 2025 (applicants may choose 2018 or 2021 USBC)',
      'Previous R903.2.1 is now R905.1.2 in 2021 IRC',
      'Virginia has NO insurance matching requirement - use repairability arguments instead',
      'Primary strategies: Repairability, Differing Dimensions, Missed Damage, Code Compliance'
    ]
  },

  MD: {
    abbreviation: 'MD',
    name: 'Maryland',
    ircVersion: '2021 IRC',
    ircEffectiveDate: 'May 29, 2023 (State) / May 29, 2024 (Local Implementation)',
    buildingCodes: [
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'When existing roof covering is removed for reroofing, underlying components must be brought to current code',
        reference: 'Maryland Building Code',
        whenToUse: 'ONLY when reroofing is already approved - to argue scope must include code-compliant materials',
        doNotUseFor: ['Repairability arguments', 'Matching arguments', 'Discontinued products'],
        successRate: 91
      },
      {
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application requires two layers of underlayment',
        reference: 'Maryland Building Code',
        whenToUse: 'For low-slope roofs requiring special treatment',
        doNotUseFor: ['Repairability', 'Matching'],
        successRate: 89
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Ice barrier required in areas prone to ice damming',
        reference: 'Maryland Building Code',
        whenToUse: 'For ice & water shield installation arguments',
        doNotUseFor: ['Repairability', 'Matching', 'Storm damage assessment'],
        successRate: 86
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer - continuous weather barrier',
        reference: 'Maryland Building Code',
        whenToUse: 'For siding replacement requiring housewrap',
        doNotUseFor: ['Roof repairability', 'Matching'],
        successRate: 88
      },
      {
        code: '2021 IRC R703.4',
        title: 'Flashing',
        description: 'Flashing must prevent water entry, requires proper overlap',
        reference: 'Maryland Building Code',
        whenToUse: 'For flashing installation during approved work',
        doNotUseFor: ['Repairability arguments'],
        successRate: 85
      }
    ],
    arguments: [
      {
        name: 'Matching (PRIMARY STRATEGY FOR MD)',
        description: 'Argue that Maryland law requires addressing mismatch in color, shade, texture, or dimension',
        correctCitations: [
          'MIA Bulletin 18-23 (October 30, 2018) - Requires insurers to address mismatches',
          'Settlement options: Replace damaged+undamaged on one or more sides, full replacement, or monetary allowance',
          'Bulletin 97-1 - Original aluminum siding guidance',
          'Administrative action possible for insurers who fail to account for major differences'
        ],
        incorrectCitations: ['IRC codes (not applicable to insurance matching)', 'Building codes'],
        exampleLanguage: 'Under Maryland MIA Bulletin 18-23, insurance companies must address mismatches in color shade, texture, or dimension when replacing damaged materials. Since the product is discontinued and will create a visible mismatch, the insurer must either replace all affected elevations or provide a monetary allowance for diminution in value.',
        successRate: 93
      },
      {
        name: 'Repairability (Secondary for MD)',
        description: 'Argue materials cannot be repaired',
        correctCitations: [
          'GAF Guidelines',
          'Brittle Test',
          'Manufacturer Warranty'
        ],
        incorrectCitations: ['IRC R908.3', 'Building codes'],
        exampleLanguage: 'The brittle test shows shingles cannot be manipulated without additional damage. GAF recommends full replacement when repair attempts fail.',
        successRate: 89
      },
      {
        name: 'Code Compliance (When Work Approved)',
        description: 'Argue approved work must meet current code',
        correctCitations: [
          'IRC R908.3',
          'IRC R703.2 (housewrap for siding)',
          'IRC R703.4 (flashing)'
        ],
        incorrectCitations: [],
        exampleLanguage: 'Per IRC R703.2, continuous weather barrier (housewrap) is required when siding is removed or replaced, mandating removal of adjacent panels and causing consequential damage.',
        successRate: 88
      }
    ],
    specialRequirements: [
      {
        requirement: 'Maryland MIA Bulletin 18-23 (PRIMARY STRATEGY)',
        details: 'Maryland REQUIRES insurers to address mismatches in color shade, texture, or dimension. Settlement options include replacing damaged and undamaged siding/roofing on one or more sides, full replacement, or monetary allowance for diminution in value.',
        source: 'Maryland Insurance Administration Bulletin 18-23 (October 30, 2018)'
      },
      {
        requirement: 'Maryland Building Code Compliance',
        details: 'All roofing work must comply with Maryland Building Code, which adopted the 2021 IRC effective May 29, 2023. Use IRC codes ONLY when arguing that approved work must meet code requirements.',
        source: 'Maryland Department of Labor & Industry'
      }
    ],
    insuranceRegulations: [
      'MIA Bulletin 18-23 (October 2018) - MATCHING REQUIREMENT for property insurance',
      'Bulletin 97-1 (1997) - Original aluminum siding matching guidance',
      'Settlement options: Replace affected elevations, full replacement, or monetary allowance',
      'Administrative action possible against insurers who ignore major mismatches',
      'Policyholders have right to dispute claim decisions',
      'Depreciation should not apply when matching is required'
    ],
    notes: [
      'Maryland adopted 2021 IRC effective May 29, 2023 (State) / May 29, 2024 (Local)',
      'MIA Bulletin 18-23 is THE KEY REGULATION for matching - always cite for MD claims',
      'Maryland is ONLY state in VA/MD/PA with insurance matching requirement',
      'Primary strategy: Matching via Bulletin 18-23',
      'Secondary strategies: Repairability, Code Compliance',
      'Baltimore City and some counties may have additional local requirements'
    ]
  },

  PA: {
    abbreviation: 'PA',
    name: 'Pennsylvania',
    ircVersion: '2021 IRC (with modifications)',
    ircEffectiveDate: 'January 1, 2026 (municipalities)',
    buildingCodes: [
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'When existing roof covering is removed, underlying components must be brought to current code',
        reference: 'Pennsylvania UCC',
        whenToUse: 'ONLY when reroofing is already approved - to argue scope must include code-compliant materials',
        doNotUseFor: ['Repairability', 'Matching arguments', 'Discontinued products', 'Storm damage'],
        successRate: 90
      },
      {
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application requires two layers of underlayment',
        reference: 'Pennsylvania UCC',
        whenToUse: 'For low-slope roofs',
        doNotUseFor: ['Repairability', 'Matching'],
        successRate: 87
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Ice barrier required - Pennsylvania climate has significant ice dam risk',
        reference: 'Pennsylvania UCC',
        whenToUse: 'For ice & water shield arguments',
        doNotUseFor: ['Repairability', 'Matching'],
        successRate: 91
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer',
        reference: 'Pennsylvania UCC',
        whenToUse: 'For siding replacement',
        doNotUseFor: ['Repairability'],
        successRate: 84
      },
      {
        code: '2021 IRC R806.2',
        title: 'Minimum Vent Area',
        description: 'Minimum net free ventilating area of 1/150 of the area',
        reference: 'Pennsylvania UCC (unchanged from 2015 IRC)',
        whenToUse: 'For ventilation arguments',
        doNotUseFor: ['Repairability', 'Matching'],
        successRate: 82
      }
    ],
    arguments: [
      {
        name: 'Repairability (PRIMARY STRATEGY FOR PA)',
        description: 'Argue materials cannot be repaired due to age, brittleness, or condition',
        correctCitations: [
          'GAF Storm Damage Guidelines',
          'Brittle Test Documentation',
          'Manufacturer Warranty',
          'Age and Condition'
        ],
        incorrectCitations: ['IRC R908.3', 'Building codes', 'Matching requirements (PA has none)'],
        exampleLanguage: 'The brittle test shows the existing shingles cannot be manipulated without cracking. GAF guidelines recommend full replacement when shingles fail repair attempts. The age and condition of these materials make repair impossible.',
        successRate: 90
      },
      {
        name: 'Differing Dimensions',
        description: 'Argue dimensional incompatibility prevents proper repair',
        correctCitations: [
          'iTel Report',
          'Metric vs English dimension analysis',
          'Manufacturer Installation Standards'
        ],
        incorrectCitations: ['IRC codes', 'Matching laws'],
        exampleLanguage: 'The existing English-dimension shingles have different exposure size than new metric shingles, causing sealant strip misalignment and violating manufacturer installation standards.',
        successRate: 88
      },
      {
        name: 'Missed Storm Damage',
        description: 'Argue for scope expansion',
        correctCitations: [
          'Photo Report',
          'GAF Storm Damage Guidelines',
          'Consistency argument'
        ],
        incorrectCitations: ['IRC codes'],
        exampleLanguage: 'Photo documentation shows storm damage on unapproved slopes consistent with approved areas. The damage pattern indicates the same storm event.',
        successRate: 85
      },
      {
        name: 'Code Compliance (When Work Approved)',
        description: 'Argue approved work must meet current code',
        correctCitations: [
          'IRC R908.3 - Reroofing requirements',
          'IRC R905.1.2 - Ice barrier (critical for PA climate)',
          'IRC R806.2 - Ventilation'
        ],
        incorrectCitations: [],
        exampleLanguage: 'Per IRC R908.3, when existing roof covering is removed, ice & water shield and underlayment must meet current Pennsylvania UCC standards. Pennsylvania\'s climate makes ice barrier installation (R905.1.2) particularly critical.',
        successRate: 89
      }
    ],
    specialRequirements: [
      {
        requirement: 'Repairability Arguments (No Matching Requirement)',
        details: 'Pennsylvania does not require insurance companies to account for matching unless policy includes matching endorsement. Focus on: Repairability using Brittle Test or Repair Attempt, differing dimensions preventing proper repair, missed storm damage to unapproved areas, code compliance for ice & water shield and underlayment when work is approved',
        source: 'Pennsylvania insurance practices and GAF Storm Damage Guidelines'
      },
      {
        requirement: 'Pennsylvania UCC Compliance',
        details: 'All roofing work must comply with Pennsylvania UCC, which will adopt the 2021 IRC effective January 1, 2026. Verify requirements with local municipality due to decentralized enforcement. Use IRC codes ONLY when arguing that approved work must meet code requirements.',
        source: 'Pennsylvania Department of Labor & Industry'
      }
    ],
    insuranceRegulations: [
      'Pennsylvania Insurance Department regulates claim practices',
      'PA Unfair Insurance Practices Act prohibits unfair claim denials',
      'Policyholders entitled to fair claim investigation',
      'Bad faith insurance claims are actionable under PA law',
      'NO STATE-MANDATED MATCHING REQUIREMENT - Matching only applies if policy includes matching endorsement'
    ],
    notes: [
      'Pennsylvania 2021 IRC effective January 1, 2026 for municipalities',
      'Phase-in period: Design/construction contracts signed before Jan 1, 2026 may use previous code if permit applied for by July 1, 2026',
      'Decentralized enforcement: Over 90% of 2,562 municipalities enforce locally',
      'Pennsylvania has NO insurance matching requirement - use repairability arguments',
      'Ice damming is major concern - R905.1.2 ice barrier critical',
      'Snow load requirements may impact structural considerations',
      'Primary strategies: Repairability, Differing Dimensions, Code Compliance',
      'Verify requirements with local municipality due to decentralized enforcement'
    ]
  }
};

/**
 * Get state-specific information
 */
export function getStateInfo(stateAbbreviation: string): StateInfo | null {
  return STATE_CODES[stateAbbreviation.toUpperCase()] || null;
}

/**
 * Get all building codes for a specific state
 */
export function getStateCodesForState(stateAbbreviation: string): StateCode[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.buildingCodes : [];
}

/**
 * Get argument strategies for a state
 */
export function getStateArguments(stateAbbreviation: string): Argument[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.arguments : [];
}

/**
 * Get insurance regulations for a state
 */
export function getStateInsuranceRegs(stateAbbreviation: string): string[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.insuranceRegulations : [];
}

/**
 * Format state-specific context for AI prompts - VERSION 2
 * This version emphasizes CORRECT code usage and argument strategies
 */
export function formatStateContext(stateAbbreviation: string): string {
  const stateInfo = getStateInfo(stateAbbreviation);

  if (!stateInfo) {
    return '';
  }

  let context = `\n## ${stateInfo.name} (${stateInfo.abbreviation}) - State-Specific Information\n\n`;

  context += `**Building Code Version:** ${stateInfo.ircVersion}\n`;
  context += `**Effective Date:** ${stateInfo.ircEffectiveDate}\n\n`;

  context += `### 🎯 PRIMARY ARGUMENT STRATEGIES FOR ${stateInfo.abbreviation}:\n\n`;
  stateInfo.arguments.forEach((arg, index) => {
    context += `#### ${index + 1}. ${arg.name}\n`;
    context += `${arg.description}\n\n`;
    context += `**Use These Citations:**\n`;
    arg.correctCitations.forEach(cite => {
      context += `- ✅ ${cite}\n`;
    });
    if (arg.incorrectCitations.length > 0) {
      context += `\n**NEVER Use:**\n`;
      arg.incorrectCitations.forEach(cite => {
        context += `- ❌ ${cite}\n`;
      });
    }
    context += `\n**Example Language:** "${arg.exampleLanguage}"\n`;
    context += `**Success Rate:** ${arg.successRate}%\n\n`;
  });

  context += `### 📋 Building Codes (Use ONLY When Work is Approved):\n\n`;
  stateInfo.buildingCodes.forEach(code => {
    context += `#### ${code.code} - ${code.title}\n`;
    context += `**Description:** ${code.description}\n`;
    context += `**When to Use:** ${code.whenToUse}\n`;
    if (code.doNotUseFor.length > 0) {
      context += `**Do NOT Use For:** ${code.doNotUseFor.join(', ')}\n`;
    }
    context += `**Success Rate:** ${code.successRate}%\n\n`;
  });

  context += `### 📜 Insurance Regulations:\n`;
  stateInfo.insuranceRegulations.forEach(reg => {
    context += `- ${reg}\n`;
  });

  context += `\n### ⚠️ Important Notes:\n`;
  stateInfo.notes.forEach(note => {
    context += `- ${note}\n`;
  });

  return context;
}

/**
 * Get available states
 */
export function getAvailableStates(): Array<{ value: string; label: string }> {
  return Object.keys(STATE_CODES).map(key => ({
    value: key,
    label: STATE_CODES[key].name
  }));
}

/**
 * Get state-specific talking points for reps - VERSION 2
 */
export function getStateTalkingPoints(stateAbbreviation: string): string[] {
  const stateInfo = getStateInfo(stateAbbreviation);

  if (!stateInfo) {
    return [];
  }

  const talkingPoints: string[] = [];

  // Add IRC version info
  talkingPoints.push(
    `${stateInfo.name} adopted the ${stateInfo.ircVersion} effective ${stateInfo.ircEffectiveDate}`
  );

  // Add PRIMARY argument strategy
  if (stateInfo.arguments.length > 0) {
    talkingPoints.push(
      `Primary strategy: ${stateInfo.arguments[0].name} (${stateInfo.arguments[0].successRate}% success rate)`
    );
  }

  // Add state-specific highlight
  if (stateAbbreviation === 'MD') {
    talkingPoints.push(
      'Maryland MIA Bulletin 18-23 provides MATCHING REQUIREMENT - always cite for MD claims'
    );
  } else if (stateAbbreviation === 'VA') {
    talkingPoints.push(
      'Virginia has NO matching requirement - focus on REPAIRABILITY arguments'
    );
  } else if (stateAbbreviation === 'PA') {
    talkingPoints.push(
      'Pennsylvania has NO matching requirement - focus on REPAIRABILITY and DIFFERING DIMENSIONS'
    );
  }

  return talkingPoints;
}
