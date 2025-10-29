/**
 * Manufacturer Specifications and Guidelines Reference
 * Focus: GAF and CertainTeed (Primary manufacturers for VA/MD/PA)
 *
 * CRITICAL: These are the CORRECT citations for repair/replacement arguments
 * Use these instead of building codes when arguing repairability
 */

export interface ManufacturerSpec {
  manufacturer: string;
  specification: string;
  code: string;
  description: string;
  whenToUse: string;
  source: string;
  successRate: number;
}

export interface ManufacturerGuideline {
  manufacturer: string;
  guideline: string;
  summary: string;
  keyProvisions: string[];
  whenToUse: string;
  doNotConfuseWith: string[];
  exampleLanguage: string;
  successRate: number;
}

/**
 * GAF Manufacturer Specifications
 */
export const GAF_SPECS: ManufacturerSpec[] = [
  {
    manufacturer: 'GAF',
    specification: 'ASTM D3462',
    code: 'ASTM D3462',
    description: 'Asphalt Shingle Tear Strength Standard',
    whenToUse: 'When arguing shingles lack structural integrity for repair',
    source: 'ASTM International',
    successRate: 88
  },
  {
    manufacturer: 'GAF',
    specification: 'ASTM D3161',
    code: 'ASTM D3161 Class F',
    description: 'Wind Resistance - Class F wind rating up to 110 mph',
    whenToUse: 'When discussing wind damage or wind rating requirements',
    source: 'ASTM International / GAF Product Standards',
    successRate: 90
  },
  {
    manufacturer: 'GAF',
    specification: 'ASTM D7158',
    code: 'ASTM D7158',
    description: 'Hail Resistance Standard',
    whenToUse: 'For hail damage assessment arguments',
    source: 'ASTM International',
    successRate: 87
  },
  {
    manufacturer: 'GAF',
    specification: 'UL 790',
    code: 'UL 790 Class A',
    description: 'Class A Fire Resistance (highest rating)',
    whenToUse: 'When fire resistance is concern or code requirement',
    source: 'Underwriters Laboratories',
    successRate: 85
  },
  {
    manufacturer: 'GAF',
    specification: 'UL 2218',
    code: 'UL 2218 Class 4',
    description: 'Class 4 Impact Resistance (highest hail rating)',
    whenToUse: 'For hail damage claims and impact resistance arguments',
    source: 'Underwriters Laboratories',
    successRate: 91
  }
];

/**
 * GAF Technical Guidelines and Bulletins
 */
export const GAF_GUIDELINES: ManufacturerGuideline[] = [
  {
    manufacturer: 'GAF',
    guideline: 'Storm Damage Recommendations',
    summary: 'GAF guidance on assessing and responding to storm-damaged roofing',
    keyProvisions: [
      'Do not repair more than 2-3 shingles per plane',
      'Granule loss, cracks, and exposed mat indicate storm damage requiring replacement',
      'Patch repairs are not reliable when multiple shingles are compromised',
      'Latent hail/wind damage leads to roof failure',
      'Repair attempts void manufacturer warranty'
    ],
    whenToUse: 'When arguing for full replacement vs partial repair - THIS IS YOUR PRIMARY REPAIRABILITY CITATION',
    doNotConfuseWith: ['IRC R908.3 (that\'s a building code, not a repair guideline)', 'Building codes'],
    exampleLanguage: 'Per GAF Storm Damage Recommendations, GAF advises against repairing more than 2-3 shingles per plane. The presence of granule loss, exposed mat, and cracked shingles across multiple planes indicates storm damage requiring full replacement. Patch repairs are not reliable when multiple shingles are compromised.',
    successRate: 91
  },
  {
    manufacturer: 'GAF',
    guideline: 'Slope Replacement Guidelines',
    summary: 'Requirements when replacing one slope of a multi-plane roof',
    keyProvisions: [
      'Disturbing adjacent slopes requires full replacement of adjoining sections',
      'Underlayment must extend properly across slope boundaries',
      'Ridge and hip requirements for single-plane replacement',
      'Cannot mix old and new materials at slope boundaries'
    ],
    whenToUse: 'When insurance approves only one slope but work affects adjacent areas',
    doNotConfuseWith: ['IRC slope requirements (R905.2.2)', 'Building codes'],
    exampleLanguage: 'Per GAF Slope Replacement Guidelines, when replacing one slope of a multi-plane roof, the underlayment must extend properly across boundaries and disturbing adjacent slopes requires full replacement of adjoining sections. Old and new materials cannot be mixed at slope boundaries.',
    successRate: 88
  },
  {
    manufacturer: 'GAF',
    guideline: 'Installation Warranty Requirements',
    summary: 'Proper installation methods required to maintain warranty',
    keyProvisions: [
      'Repairs void manufacturer warranty',
      'Mixing metric and English dimension shingles voids warranty',
      'Improper sealant strip alignment voids warranty',
      'All manufacturer installation instructions must be followed'
    ],
    whenToUse: 'When arguing that repairs or improper mixing voids warranty coverage',
    doNotConfuseWith: ['Insurance policy warranties', 'Building codes'],
    exampleLanguage: 'Per GAF warranty requirements, repair attempts void the manufacturer warranty. Additionally, mixing metric-dimension shingles with existing English-dimension shingles violates installation standards due to improper sealant strip alignment.',
    successRate: 89
  },
  {
    manufacturer: 'GAF',
    guideline: 'Discontinued Product List',
    summary: 'Official list of discontinued GAF shingle products',
    keyProvisions: [
      'Products no longer manufactured',
      'No equivalent replacements available',
      'Metric vs English dimension incompatibility',
      'Supports full replacement arguments'
    ],
    whenToUse: 'When shingles are discontinued and iTel confirms unavailability',
    doNotConfuseWith: ['Building codes', 'IRC requirements'],
    exampleLanguage: 'Per GAF\'s discontinued product list and the attached iTel report, the existing shingles are no longer manufactured. The new metric-dimension shingles have different exposure sizes and cannot be blended with existing English-dimension products.',
    successRate: 90
  }
];

/**
 * CertainTeed Specifications
 */
export const CERTAINTEED_SPECS: ManufacturerSpec[] = [
  {
    manufacturer: 'CertainTeed',
    specification: 'UL Class A Fire Rating',
    code: 'UL Class A',
    description: 'Highest fire resistance rating',
    whenToUse: 'For fire resistance requirements',
    source: 'Underwriters Laboratories',
    successRate: 86
  },
  {
    manufacturer: 'CertainTeed',
    specification: 'ASTM D3161 Class F Wind Resistance',
    code: 'ASTM D3161 Class F',
    description: 'Wind resistance up to 110 mph',
    whenToUse: 'For wind damage and wind rating discussions',
    source: 'ASTM International',
    successRate: 88
  },
  {
    manufacturer: 'CertainTeed',
    specification: 'UL 2218 Class 4 Impact Resistance',
    code: 'UL 2218 Class 4',
    description: 'Severe hail protection (highest rating)',
    whenToUse: 'For hail damage claims',
    source: 'Underwriters Laboratories',
    successRate: 89
  },
  {
    manufacturer: 'CertainTeed',
    specification: 'ASTM D3462 Tear Strength',
    code: 'ASTM D3462',
    description: 'Tear strength standards for asphalt shingles',
    whenToUse: 'When arguing structural integrity for repairs',
    source: 'ASTM International',
    successRate: 85
  }
];

/**
 * CertainTeed Guidelines
 */
export const CERTAINTEED_GUIDELINES: ManufacturerGuideline[] = [
  {
    manufacturer: 'CertainTeed',
    guideline: 'Storm Damage Assessment',
    summary: 'CertainTeed guidance on storm damage evaluation',
    keyProvisions: [
      'Multiple damaged shingles indicate need for replacement',
      'Granule loss compromises shingle integrity',
      'Age of shingles affects repairability',
      'Repairs may void warranty'
    ],
    whenToUse: 'Similar to GAF - for repairability arguments',
    doNotConfuseWith: ['Building codes', 'IRC requirements'],
    exampleLanguage: 'Per CertainTeed storm damage assessment guidelines, multiple damaged shingles indicate the need for replacement rather than repair. The age and condition of the existing shingles compromise their integrity and make repair attempts unreliable.',
    successRate: 87
  },
  {
    manufacturer: 'CertainTeed',
    guideline: 'Installation Standards',
    summary: 'Proper installation requirements',
    keyProvisions: [
      'Follow manufacturer installation instructions',
      'Proper sealant strip alignment required',
      'Cannot mix incompatible shingle types',
      'Improper installation voids warranty'
    ],
    whenToUse: 'When arguing dimensional incompatibility',
    doNotConfuseWith: ['Building codes'],
    exampleLanguage: 'Per CertainTeed installation standards, proper sealant strip alignment is required for warranty coverage. Mixing incompatible shingle dimensions violates these standards and creates leak points.',
    successRate: 86
  }
];

/**
 * Industry Standards (Not manufacturer-specific)
 */
export const INDUSTRY_STANDARDS = [
  {
    standard: 'HAAG Certification',
    description: 'Industry-recognized certification for roof inspectors',
    whenToUse: 'When inspector credentials are questioned',
    successRate: 82
  },
  {
    standard: 'ASTM Standards',
    description: 'American Society for Testing and Materials - Industry standards',
    whenToUse: 'When citing material performance standards',
    successRate: 85
  },
  {
    standard: 'iTel Laboratories',
    description: 'Independent testing lab for discontinued product verification',
    whenToUse: 'For discontinued shingle/siding verification - PRIMARY CITATION for discontinued products',
    successRate: 92
  }
];

/**
 * Helper Functions
 */

export function getGAFSpecs(): ManufacturerSpec[] {
  return GAF_SPECS;
}

export function getCertainTeedSpecs(): ManufacturerSpec[] {
  return CERTAINTEED_SPECS;
}

export function getGAFGuidelines(): ManufacturerGuideline[] {
  return GAF_GUIDELINES;
}

export function getCertainTeedGuidelines(): ManufacturerGuideline[] {
  return CERTAINTEED_GUIDELINES;
}

/**
 * Get the correct citation for a specific argument type
 */
export function getCorrectCitation(argumentType: 'repairability' | 'discontinued' | 'storm_damage' | 'warranty'): string {
  switch (argumentType) {
    case 'repairability':
      return 'GAF Storm Damage Recommendations - Do not repair more than 2-3 shingles per plane';
    case 'discontinued':
      return 'iTel Report + GAF Discontinued Product List';
    case 'storm_damage':
      return 'GAF Storm Damage Recommendations - Granule loss, cracks, exposed mat require replacement';
    case 'warranty':
      return 'GAF Installation Warranty Requirements - Repairs void warranty';
    default:
      return '';
  }
}

/**
 * Format manufacturer context for AI prompts
 */
export function formatManufacturerContext(): string {
  let context = '\n## Manufacturer Specifications & Guidelines\n\n';

  context += '### 🏭 GAF (Primary Manufacturer)\n\n';
  context += '#### GAF Storm Damage Recommendations (PRIMARY REPAIRABILITY CITATION):\n';
  context += '- ✅ Do not repair more than 2-3 shingles per plane\n';
  context += '- ✅ Granule loss, cracks, exposed mat = storm damage requiring replacement\n';
  context += '- ✅ Patch repairs not reliable when multiple shingles compromised\n';
  context += '- ✅ Repair attempts void manufacturer warranty\n';
  context += '- 📊 Success Rate: 91%\n\n';

  context += '#### GAF Slope Replacement Guidelines:\n';
  context += '- Disturbing adjacent slopes requires full replacement of adjoining sections\n';
  context += '- Cannot mix old and new materials at slope boundaries\n';
  context += '- 📊 Success Rate: 88%\n\n';

  context += '#### GAF Discontinued Products:\n';
  context += '- Use with iTel report to prove unavailability\n';
  context += '- Metric vs English dimension incompatibility\n';
  context += '- 📊 Success Rate: 90%\n\n';

  context += '### 🔧 CertainTeed (Secondary Manufacturer)\n\n';
  context += '- Similar storm damage assessment guidelines\n';
  context += '- Installation standards for warranty coverage\n';
  context += '- 📊 Success Rate: 86-87%\n\n';

  context += '### 🔬 iTel Laboratories\n\n';
  context += '- **PRIMARY CITATION for discontinued products**\n';
  context += '- Independent laboratory verification\n';
  context += '- Confirms product availability and alternatives\n';
  context += '- 📊 Success Rate: 92%\n\n';

  context += '### ⚠️ CRITICAL RULES:\n';
  context += '- ❌ NEVER cite IRC codes for repairability - Use GAF guidelines\n';
  context += '- ❌ NEVER cite IRC codes for discontinued products - Use iTel + GAF list\n';
  context += '- ❌ NEVER cite IRC codes for storm damage - Use GAF storm damage recommendations\n';
  context += '- ✅ ONLY cite IRC codes when arguing that APPROVED work must meet code\n\n';

  return context;
}

/**
 * QUICK REFERENCE: What to cite for each argument type
 */
export const CITATION_QUICK_REFERENCE = {
  repairability: {
    correct: ['GAF Storm Damage Recommendations', 'Brittle Test Documentation', 'Manufacturer Warranty'],
    incorrect: ['IRC R908.3', 'Building codes', 'Any IRC code'],
    successRate: 91
  },
  discontinued: {
    correct: ['iTel Report', 'GAF Discontinued Product List', 'Dimensional Analysis'],
    incorrect: ['IRC codes', 'Building codes'],
    successRate: 90
  },
  stormDamage: {
    correct: ['GAF Storm Damage Recommendations', 'Photo Documentation', 'HAAG Assessment'],
    incorrect: ['IRC codes', 'Building codes'],
    successRate: 89
  },
  codeCompliance: {
    correct: ['IRC R908.3', 'IRC R905.1.2', 'IRC R905.2.2'],
    incorrect: [],
    successRate: 90,
    note: 'ONLY use when work is already approved - to argue scope requirements'
  },
  matching_MD: {
    correct: ['MIA Bulletin 18-23', 'MIA Bulletin 97-1'],
    incorrect: ['IRC codes', 'Building codes', 'GAF guidelines'],
    successRate: 93
  },
  matching_VA_PA: {
    correct: ['NONE - Use repairability arguments instead'],
    incorrect: ['IRC codes', 'MIA Bulletin 18-23 (MD only)', 'Any matching law'],
    successRate: 0,
    note: 'VA and PA have NO matching requirements'
  }
};
