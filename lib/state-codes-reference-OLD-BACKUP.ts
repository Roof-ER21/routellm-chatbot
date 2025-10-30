/**
 * State-Specific Building Codes and Requirements
 * Focus: Virginia (VA), Maryland (MD), Pennsylvania (PA)
 *
 * This reference provides state-specific building codes, regulations,
 * and requirements for roofing insurance claims.
 */

export interface StateCode {
  code: string;
  title: string;
  description: string;
  reference: string;
  successRate?: number;
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
  specialRequirements: StateRequirement[];
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
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application requires two layers of underlayment',
        reference: 'Virginia Uniform Statewide Building Code (USBC)',
        successRate: 95
      },
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'When reroofing, existing roof covering must be removed and underlying components (ice & water shield, underlayment) brought to current code',
        reference: 'Virginia USBC, effective 1/18/2024',
        successRate: 92
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer and under roofing',
        reference: 'Virginia USBC',
        successRate: 88
      },
      {
        code: '2021 IRC R703.4',
        title: 'Flashing',
        description: 'Required at wall and roof intersections',
        reference: 'Virginia USBC',
        successRate: 90
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Required in areas with average daily temperature ≤ 25°F',
        reference: 'Virginia USBC (formerly cited as R903.2.1)',
        successRate: 85
      }
    ],
    specialRequirements: [
      {
        requirement: 'Virginia Building Code Compliance',
        details: 'All roofing work must comply with the Virginia USBC, which adopted the 2021 IRC effective January 18, 2024',
        source: 'Virginia Department of Housing and Community Development (DHCD)'
      },
      {
        requirement: 'Repairability Arguments (No Matching Requirement)',
        details: 'Virginia does not require insurance companies to account for matching unless policy includes matching endorsement. Focus on: Repairability using Brittle Test or Repair Attempt, differing dimensions preventing proper repair, missed storm damage to unapproved areas, code compliance for ice & water shield and underlayment',
        source: 'Virginia insurance practices and IRC R908.3'
      },
      {
        requirement: 'Local Building Permits',
        details: 'Most jurisdictions require permits for roof replacement; repairs may be exempt',
        source: 'Local Building Officials'
      },
      {
        requirement: 'Wind Rating Requirements',
        details: 'Shingles must meet wind rating requirements for the specific region',
        source: 'Virginia USBC wind speed maps'
      }
    ],
    insuranceRegulations: [
      'Virginia Bureau of Insurance regulates claim handling',
      'Insurers must respond to claims within reasonable time',
      'Policyholders have right to independent appraisal',
      'Unfair claim settlement practices are prohibited under VA Code § 38.2-510'
    ],
    notes: [
      'Virginia adopted 2021 IRC effective January 18, 2024',
      'Previous IRC R903.2.1 is now R905.1.2 in 2021 IRC',
      'Local amendments may apply - verify with local building department',
      'Coastal areas may have additional wind requirements'
    ]
  },

  MD: {
    abbreviation: 'MD',
    name: 'Maryland',
    ircVersion: '2021 IRC',
    ircEffectiveDate: 'January 1, 2024',
    buildingCodes: [
      {
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application requires two layers of underlayment',
        reference: 'Maryland Building Code',
        successRate: 93
      },
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'Requires matching shingles for proper roof integrity',
        reference: 'Maryland Building Code',
        successRate: 91
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer and under roofing',
        reference: 'Maryland Building Code',
        successRate: 87
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Required in areas prone to ice damming',
        reference: 'Maryland Building Code',
        successRate: 84
      }
    ],
    specialRequirements: [
      {
        requirement: 'Maryland Insurance Administration (MIA) Bulletin 18-23',
        details: 'Provides guidance on matching and betterment in property insurance claims',
        source: 'MIA Bulletin 18-23 (October 2018)'
      },
      {
        requirement: 'Matching Requirement Guidance',
        details: 'MIA Bulletin 18-23 states insurers should cover cost of matching when discontinued products prevent aesthetic match',
        source: 'Maryland Insurance Administration'
      },
      {
        requirement: 'Storm Damage Documentation',
        details: 'Maryland requires proper documentation of storm damage for insurance claims',
        source: 'Maryland Insurance Administration'
      },
      {
        requirement: 'Building Permit Requirements',
        details: 'Roof replacement typically requires permit; check with local jurisdiction',
        source: 'Local Building Departments'
      }
    ],
    insuranceRegulations: [
      'MIA Bulletin 18-23 addresses matching and betterment issues',
      'Insurers must provide clear explanation of coverage determinations',
      'Policyholders have right to dispute claim decisions',
      'Maryland law prohibits unfair claim settlement practices',
      'Depreciation should not apply when matching is required'
    ],
    notes: [
      'MIA Bulletin 18-23 is a key reference for matching arguments',
      'Maryland has specific guidance on aesthetic matching requirements',
      'State adopted 2021 IRC effective January 1, 2024',
      'Baltimore City and some counties may have additional requirements',
      'Coastal areas subject to additional wind/hurricane provisions'
    ]
  },

  PA: {
    abbreviation: 'PA',
    name: 'Pennsylvania',
    ircVersion: '2021 IRC (with modifications)',
    ircEffectiveDate: 'Varies by municipality',
    buildingCodes: [
      {
        code: '2021 IRC R905.2.2',
        title: 'Asphalt Shingle Slope Requirements',
        description: 'Low-slope application requires two layers of underlayment',
        reference: 'Pennsylvania Uniform Construction Code (UCC)',
        successRate: 92
      },
      {
        code: '2021 IRC R908.3',
        title: 'Recovering or Reroofing',
        description: 'When reroofing, existing roof covering must be removed and underlying components (ice & water shield, underlayment) brought to current code',
        reference: 'Pennsylvania UCC',
        successRate: 90
      },
      {
        code: '2021 IRC R703.2',
        title: 'Water-Resistive Barrier',
        description: 'Required behind exterior veneer and under roofing',
        reference: 'Pennsylvania UCC',
        successRate: 86
      },
      {
        code: '2021 IRC R905.1.2',
        title: 'Ice Barrier',
        description: 'Required in Pennsylvania due to climate conditions',
        reference: 'Pennsylvania UCC',
        successRate: 88
      }
    ],
    specialRequirements: [
      {
        requirement: 'Pennsylvania Uniform Construction Code (UCC)',
        details: 'Statewide building code with local enforcement; IRC adoption varies by municipality',
        source: 'PA Department of Labor & Industry'
      },
      {
        requirement: 'Repairability Arguments (No Matching Requirement)',
        details: 'Pennsylvania does not require insurance companies to account for matching unless policy includes matching endorsement. Focus on: Repairability using Brittle Test or Repair Attempt, differing dimensions preventing proper repair, missed storm damage to unapproved areas, code compliance for ice & water shield and underlayment',
        source: 'Pennsylvania insurance practices and IRC R908.3'
      },
      {
        requirement: 'Local Code Enforcement',
        details: 'Pennsylvania has decentralized code enforcement; verify requirements with local municipality',
        source: 'Local Building Code Officials'
      },
      {
        requirement: 'Permit Requirements',
        details: 'Most municipalities require permits for roof replacement; some exempt minor repairs',
        source: 'Local Building Departments'
      },
      {
        requirement: 'Snow Load Requirements',
        details: 'Pennsylvania has specific snow load requirements that may affect roof structure',
        source: 'Pennsylvania UCC snow load maps'
      }
    ],
    insuranceRegulations: [
      'Pennsylvania Insurance Department regulates claim practices',
      'PA Unfair Insurance Practices Act prohibits unfair claim denials',
      'Policyholders entitled to fair claim investigation',
      'Bad faith insurance claims are actionable under PA law',
      'Insurers must act in good faith in claim evaluation'
    ],
    notes: [
      'Pennsylvania has decentralized building code adoption',
      'IRC adoption date varies by municipality - verify locally',
      'Ice damming is common concern in Pennsylvania',
      'Snow load requirements may impact structural considerations',
      'Philadelphia and Pittsburgh may have additional local codes',
      'Rural areas may have different enforcement standards'
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
 * Get all state codes for a specific state
 */
export function getStateCodesForState(stateAbbreviation: string): StateCode[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.buildingCodes : [];
}

/**
 * Get special requirements for a state
 */
export function getStateRequirements(stateAbbreviation: string): StateRequirement[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.specialRequirements : [];
}

/**
 * Get insurance regulations for a state
 */
export function getStateInsuranceRegs(stateAbbreviation: string): string[] {
  const stateInfo = getStateInfo(stateAbbreviation);
  return stateInfo ? stateInfo.insuranceRegulations : [];
}

/**
 * Format state-specific context for AI prompts
 */
export function formatStateContext(stateAbbreviation: string): string {
  const stateInfo = getStateInfo(stateAbbreviation);

  if (!stateInfo) {
    return '';
  }

  let context = `\n## ${stateInfo.name} (${stateInfo.abbreviation}) - State-Specific Information\n\n`;

  context += `**Building Code Version:** ${stateInfo.ircVersion}\n`;
  context += `**Effective Date:** ${stateInfo.ircEffectiveDate}\n\n`;

  context += `### Key Building Codes:\n`;
  stateInfo.buildingCodes.forEach(code => {
    context += `- **${code.code}** - ${code.title}\n`;
    context += `  ${code.description}\n`;
    if (code.successRate) {
      context += `  Success Rate: ${code.successRate}%\n`;
    }
  });

  context += `\n### Special Requirements:\n`;
  stateInfo.specialRequirements.forEach(req => {
    context += `- **${req.requirement}**\n`;
    context += `  ${req.details}\n`;
    context += `  Source: ${req.source}\n`;
  });

  context += `\n### Insurance Regulations:\n`;
  stateInfo.insuranceRegulations.forEach(reg => {
    context += `- ${reg}\n`;
  });

  if (stateInfo.notes.length > 0) {
    context += `\n### Important Notes:\n`;
    stateInfo.notes.forEach(note => {
      context += `- ${note}\n`;
    });
  }

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
 * Get state-specific talking points for reps
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

  // Add top 2 building codes
  if (stateInfo.buildingCodes.length > 0) {
    talkingPoints.push(
      `Key building code: ${stateInfo.buildingCodes[0].code} - ${stateInfo.buildingCodes[0].title}`
    );
  }

  // Add state-specific highlight
  if (stateAbbreviation === 'MD') {
    talkingPoints.push(
      'Maryland MIA Bulletin 18-23 provides specific guidance on matching requirements'
    );
  } else if (stateAbbreviation === 'VA') {
    talkingPoints.push(
      'Virginia USBC requires compliance with 2021 IRC as of January 2024'
    );
  } else if (stateAbbreviation === 'PA') {
    talkingPoints.push(
      'Pennsylvania has decentralized code enforcement - verify with local municipality'
    );
  }

  return talkingPoints;
}
