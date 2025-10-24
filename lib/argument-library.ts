/**
 * Argument Library - Centralized repository of all claims arguments
 * with success rates, usage patterns, and effectiveness metrics
 */

export interface Argument {
  id: string;
  category: ArgumentCategory;
  title: string;
  description: string;
  fullText: string;
  successRate: number;
  usageCount: number;
  applicableScenarios: string[];
  supportingEvidence: string[];
  counterarguments?: string[];
  bestPractices: string[];
  relatedQA?: number[]; // References to Q&A knowledge base
  stateSpecific?: string[]; // VA, MD, PA, etc.
}

export type ArgumentCategory =
  | 'building_code'
  | 'manufacturer_spec'
  | 'insurance_regulation'
  | 'industry_standard'
  | 'warranty_protection'
  | 'property_value'
  | 'safety_liability';

// Comprehensive argument library
export const ARGUMENTS: Argument[] = [
  // Building Code Arguments
  {
    id: 'IRC_R908_3',
    category: 'building_code',
    title: 'IRC R908.3 - Matching Shingle Requirement',
    description: 'International Residential Code requires matching color, size, and quality for roof repairs',
    fullText: 'Per IRC Section R908.3, when re-roofing or repairing an existing roof, replacement materials must match the existing roof in color, size, and quality. This is not a suggestion—it is a mandatory building code requirement adopted by most jurisdictions.',
    successRate: 92,
    usageCount: 1247,
    applicableScenarios: [
      'Partial roof replacement',
      'Storm damage repairs',
      'Insurance claim disputes',
      'Contractor scope disagreements'
    ],
    supportingEvidence: [
      'IRC Section R908.3 text',
      'Local building department interpretation',
      'Building permit requirements',
      'Code enforcement letters'
    ],
    counterarguments: [
      'Some insurers claim matching not required if repair is small',
      'Alternative interpretation: "substantial match" is sufficient'
    ],
    bestPractices: [
      'Always cite specific IRC section number',
      'Include local jurisdiction adoption date',
      'Attach code text as reference',
      'Mention building permit would require compliance'
    ],
    relatedQA: [156, 203, 187],
    stateSpecific: ['VA', 'MD', 'PA', 'All IRC jurisdictions']
  },
  {
    id: 'VA_R908_3',
    category: 'building_code',
    title: 'Virginia Building Code R908.3',
    description: 'Virginia-specific matching requirement with state enforcement',
    fullText: 'The Virginia Residential Code, Section R908.3, mandates that roof repairs must use materials matching the existing roof in color, size, and quality. Virginia building officials strictly enforce this requirement, and permits will not be issued for non-matching repairs.',
    successRate: 95,
    usageCount: 423,
    applicableScenarios: ['Virginia properties only'],
    supportingEvidence: [
      'Virginia Residential Code Section R908.3',
      'DHCD interpretations',
      'Local building official statements'
    ],
    bestPractices: [
      'Reference Virginia DHCD website',
      'Cite specific local jurisdiction',
      'Mention permit requirement',
      'Include building official contact info if available'
    ],
    relatedQA: [156, 211],
    stateSpecific: ['VA']
  },
  {
    id: 'MD_R908_3',
    category: 'building_code',
    title: 'Maryland Building Code R908.3',
    description: 'Maryland adoption of IRC matching requirements',
    fullText: 'Maryland has adopted the International Residential Code Section R908.3, requiring roof repairs to match existing materials in color, size, and quality. The Maryland Department of Labor enforces this through local building inspectors.',
    successRate: 93,
    usageCount: 312,
    applicableScenarios: ['Maryland properties only'],
    supportingEvidence: [
      'Maryland IRC adoption statute',
      'MD Dept of Labor guidance',
      'Local jurisdiction requirements'
    ],
    bestPractices: [
      'Reference Maryland-specific adoption',
      'Cite local county building code',
      'Include permit necessity'
    ],
    relatedQA: [156, 212],
    stateSpecific: ['MD']
  },
  {
    id: 'PA_UCC_3404_5',
    category: 'building_code',
    title: 'Pennsylvania UCC Section 3404.5',
    description: 'Pennsylvania Uniform Construction Code roofing material requirements',
    fullText: 'Under the Pennsylvania Uniform Construction Code (UCC) Section 3404.5, roofing materials used in repairs must be compatible with and match existing roof materials. This ensures structural integrity and uniform appearance.',
    successRate: 90,
    usageCount: 278,
    applicableScenarios: ['Pennsylvania properties only'],
    supportingEvidence: [
      'PA UCC Section 3404.5',
      'PA Department of Labor & Industry guidance',
      'Municipal building code enforcement'
    ],
    bestPractices: [
      'Cite PA UCC specifically',
      'Reference local municipality adoption',
      'Mention uniform construction code authority'
    ],
    relatedQA: [156, 213],
    stateSpecific: ['PA']
  },

  // Manufacturer Specification Arguments
  {
    id: 'GAF_MATCHING_REQ',
    category: 'manufacturer_spec',
    title: 'GAF Matching Requirement',
    description: 'GAF requires matching materials for warranty validity',
    fullText: 'According to GAF\'s installation manual and warranty terms, repairs must use matching shingles from the same product line. Using non-matching materials voids the manufacturer warranty and may create installation defects.',
    successRate: 88,
    usageCount: 634,
    applicableScenarios: [
      'GAF shingles installed',
      'Warranty claims',
      'Proper installation arguments'
    ],
    supportingEvidence: [
      'GAF Installation Standards Manual',
      'GAF Warranty Terms',
      'GAF Technical Support statements',
      'GAF Product Line specifications'
    ],
    bestPractices: [
      'Identify specific GAF product line',
      'Reference warranty void clause',
      'Attach GAF installation manual excerpt',
      'Mention manufacturer support availability'
    ],
    relatedQA: [198, 201, 215]
  },
  {
    id: 'OC_MATCHING_REQ',
    category: 'manufacturer_spec',
    title: 'Owens Corning Matching Requirement',
    description: 'Owens Corning warranty requires same product line',
    fullText: 'Owens Corning\'s Limited Warranty specifically requires that replacement shingles come from the same product line as the original installation. Mixed products void warranty coverage and may cause performance issues.',
    successRate: 86,
    usageCount: 412,
    applicableScenarios: [
      'Owens Corning shingles',
      'Warranty preservation',
      'Installation standards'
    ],
    supportingEvidence: [
      'Owens Corning Limited Warranty',
      'Professional Standards guide',
      'Product line compatibility charts'
    ],
    bestPractices: [
      'Cite specific warranty language',
      'Reference product line requirements',
      'Include warranty void consequences'
    ],
    relatedQA: [198, 202, 216]
  },

  // Insurance Regulation Arguments
  {
    id: 'STATE_MATCHING_REGS',
    category: 'insurance_regulation',
    title: 'State Insurance Regulations - Matching Coverage',
    description: 'State regulations requiring insurers to cover matching materials',
    fullText: 'State insurance regulations in many jurisdictions require carriers to provide coverage for matching materials when repairs cannot reasonably match existing materials. Depreciation should not apply to building code-required matching.',
    successRate: 78,
    usageCount: 892,
    applicableScenarios: [
      'Insurance claim disputes',
      'Depreciation arguments',
      'Matching coverage denial'
    ],
    supportingEvidence: [
      'State insurance code citations',
      'Insurance commissioner opinions',
      'Case law precedents',
      'Policy interpretation guidelines'
    ],
    counterarguments: [
      'Some states have limited matching statutes',
      'Policy language may restrict coverage'
    ],
    bestPractices: [
      'Research state-specific regulations',
      'Cite insurance commissioner opinions',
      'Reference similar case outcomes',
      'Include policy language analysis'
    ],
    relatedQA: [145, 167, 189, 234]
  },
  {
    id: 'DEPRECIATION_LIMITATION',
    category: 'insurance_regulation',
    title: 'Depreciation Not Applicable to Code Requirements',
    description: 'Argument that depreciation should not apply to mandatory code compliance',
    fullText: 'When matching is required by building code, it is not a matter of choice but legal necessity. Depreciation should not be applied to code-mandated matching materials, as the insured has no option but to comply with building regulations.',
    successRate: 72,
    usageCount: 567,
    applicableScenarios: [
      'RCV vs ACV disputes',
      'Depreciation challenges',
      'Code compliance arguments'
    ],
    supportingEvidence: [
      'Building code requirements',
      'Legal necessity argument',
      'Insurance bad faith precedents',
      'State regulatory guidance'
    ],
    bestPractices: [
      'Link depreciation to code requirement',
      'Emphasize "no choice" element',
      'Cite bad faith concerns',
      'Reference policyholder rights'
    ],
    relatedQA: [178, 192, 227]
  },

  // Industry Standard Arguments
  {
    id: 'NRCA_STANDARDS',
    category: 'industry_standard',
    title: 'NRCA Roofing Standards - Matching Best Practice',
    description: 'National Roofing Contractors Association standards for repair matching',
    fullText: 'The National Roofing Contractors Association (NRCA) recommends that roof repairs use materials matching the existing roof to ensure proper performance, weatherproofing, and aesthetic consistency. This is recognized industry best practice.',
    successRate: 82,
    usageCount: 445,
    applicableScenarios: [
      'Professional standards arguments',
      'Contractor qualification',
      'Best practice citations'
    ],
    supportingEvidence: [
      'NRCA Roofing Manual',
      'Industry best practice guides',
      'Professional association standards',
      'Contractor licensing requirements'
    ],
    bestPractices: [
      'Reference NRCA as authoritative source',
      'Cite specific manual sections',
      'Link to professional standards',
      'Emphasize industry consensus'
    ],
    relatedQA: [218, 229]
  },
  {
    id: 'VISIBLE_MISMATCH',
    category: 'industry_standard',
    title: 'Visible Mismatch Standard',
    description: 'Industry standard that visible mismatches are unacceptable',
    fullText: 'Industry standards universally recognize that visibly mismatched roofing materials are unacceptable workmanship. Even if materials are technically similar, visible color or texture differences constitute substandard work that no reputable contractor would perform.',
    successRate: 85,
    usageCount: 621,
    applicableScenarios: [
      'Aesthetic mismatch arguments',
      'Workmanship standards',
      'Property appearance concerns'
    ],
    supportingEvidence: [
      'Contractor standards of care',
      'Workmanship warranty language',
      'Industry best practices',
      'Customer satisfaction standards'
    ],
    bestPractices: [
      'Use photos showing mismatch examples',
      'Reference professional pride',
      'Cite customer expectations',
      'Link to property value impact'
    ],
    relatedQA: [241, 253]
  },

  // Warranty Protection Arguments
  {
    id: 'WARRANTY_VOID_RISK',
    category: 'warranty_protection',
    title: 'Non-Matching Materials Void Warranty',
    description: 'Using non-matching materials voids manufacturer and contractor warranties',
    fullText: 'Installing non-matching roofing materials will void both the manufacturer\'s product warranty and the contractor\'s workmanship warranty. This exposes the homeowner to significant financial risk if future issues arise with the roof.',
    successRate: 87,
    usageCount: 789,
    applicableScenarios: [
      'Warranty preservation',
      'Risk mitigation',
      'Long-term protection arguments'
    ],
    supportingEvidence: [
      'Manufacturer warranty terms',
      'Contractor warranty exclusions',
      'Warranty void clauses',
      'Industry warranty standards'
    ],
    bestPractices: [
      'Quote specific warranty language',
      'Quantify financial risk',
      'Compare warranty value vs mismatch cost',
      'Emphasize homeowner protection'
    ],
    relatedQA: [198, 201, 215, 262]
  },

  // Property Value Arguments
  {
    id: 'PROPERTY_VALUE_IMPACT',
    category: 'property_value',
    title: 'Mismatched Roof Reduces Property Value',
    description: 'Visible roof mismatches negatively impact home resale value and marketability',
    fullText: 'Real estate professionals consistently report that visible roof mismatches reduce property values and make homes harder to sell. Home inspectors flag mismatched roofs as potential concerns, which can derail sales or reduce offers.',
    successRate: 76,
    usageCount: 534,
    applicableScenarios: [
      'Property value arguments',
      'Resale concerns',
      'Home inspection issues'
    ],
    supportingEvidence: [
      'Realtor assessments',
      'Home inspection reports',
      'Appraisal impact studies',
      'Market analysis data'
    ],
    bestPractices: [
      'Cite real estate professional opinions',
      'Reference home inspection standards',
      'Quantify potential value loss',
      'Include market comparables'
    ],
    relatedQA: [273, 284]
  },
  {
    id: 'CURB_APPEAL',
    category: 'property_value',
    title: 'Curb Appeal and Aesthetic Impact',
    description: 'Roof appearance significantly affects overall home curb appeal',
    fullText: 'The roof represents approximately 40% of a home\'s visible exterior. A mismatched roof dramatically reduces curb appeal and creates an impression of poor maintenance, affecting both property value and neighborhood aesthetics.',
    successRate: 74,
    usageCount: 412,
    applicableScenarios: [
      'Aesthetic arguments',
      'Neighborhood standards',
      'HOA concerns'
    ],
    supportingEvidence: [
      'Curb appeal studies',
      'Real estate marketing data',
      'HOA architectural standards',
      'Property presentation guidelines'
    ],
    bestPractices: [
      'Use visual examples',
      'Reference neighborhood standards',
      'Cite HOA requirements if applicable',
      'Emphasize homeowner pride'
    ],
    relatedQA: [295, 302]
  },

  // Safety & Liability Arguments
  {
    id: 'BUILDING_PERMIT_REQUIRED',
    category: 'safety_liability',
    title: 'Building Permit Requires Code Compliance',
    description: 'Local building permits mandate IRC compliance including matching requirements',
    fullText: 'Any roof repair or replacement requires a building permit in most jurisdictions. Building inspectors will not approve permits for non-matching repairs that violate IRC R908.3. Proceeding without proper permits exposes the homeowner to legal and liability risks.',
    successRate: 91,
    usageCount: 723,
    applicableScenarios: [
      'Permit requirements',
      'Code enforcement',
      'Legal compliance'
    ],
    supportingEvidence: [
      'Local building department requirements',
      'Permit application requirements',
      'Code enforcement policies',
      'Inspection failure examples'
    ],
    bestPractices: [
      'Reference local building department',
      'Cite permit denial risk',
      'Mention inspection failure consequences',
      'Include enforcement penalties'
    ],
    relatedQA: [156, 203, 312]
  },
  {
    id: 'LIABILITY_EXPOSURE',
    category: 'safety_liability',
    title: 'Contractor Liability for Non-Compliant Work',
    description: 'Contractors face liability for installing non-code-compliant repairs',
    fullText: 'Licensed contractors who knowingly install non-code-compliant repairs (including mismatched materials) face professional liability, potential license sanctions, and legal exposure. No reputable contractor should agree to non-compliant work.',
    successRate: 83,
    usageCount: 389,
    applicableScenarios: [
      'Contractor responsibility',
      'Professional standards',
      'License protection'
    ],
    supportingEvidence: [
      'Contractor licensing requirements',
      'Professional liability standards',
      'Board sanctions for violations',
      'Legal precedents'
    ],
    bestPractices: [
      'Reference contractor licensing board',
      'Cite professional standards',
      'Mention liability insurance implications',
      'Emphasize contractor reputation risk'
    ],
    relatedQA: [325, 338]
  },
  {
    id: 'IBC_1510_3',
    category: 'building_code',
    title: 'IBC 1510.3 - Re-roofing Requirements',
    description: 'International Building Code requirements for re-roofing and material compatibility',
    fullText: 'Per IBC Section 1510.3, re-roofing applications must comply with material compatibility requirements and proper installation methods. This section addresses roof replacement standards for commercial and multi-family residential buildings, ensuring structural integrity and code compliance.',
    successRate: 88,
    usageCount: 567,
    applicableScenarios: [
      'Commercial building claims',
      'Multi-family residential',
      'Re-roofing projects',
      'Material compatibility disputes'
    ],
    supportingEvidence: [
      'IBC Section 1510.3 text',
      'Commercial building standards',
      'Material compatibility charts',
      'Engineering requirements'
    ],
    bestPractices: [
      'Cite IBC specifically for commercial properties',
      'Reference local jurisdiction adoption',
      'Include material compatibility requirements',
      'Mention structural engineering considerations'
    ],
    relatedQA: [156, 203, 245],
    stateSpecific: ['All IBC jurisdictions', 'Commercial properties']
  },
  {
    id: 'INSTALLATION_DEFECTS',
    category: 'industry_standard',
    title: 'Installation Defect Prevention Standards',
    description: 'Industry standards preventing installation defects from mismatched repairs',
    fullText: 'Industry best practices and professional standards recognize that mismatched roof repairs create installation defects including improper sealant adhesion, thermal expansion mismatches, and compromised weatherproofing. These defects lead to premature failure, water intrusion, and voided warranties. Professional installers follow NRCA and manufacturer standards requiring proper material matching to prevent these defects.',
    successRate: 84,
    usageCount: 723,
    applicableScenarios: [
      'Workmanship standards',
      'Installation quality arguments',
      'Defect prevention',
      'Professional liability'
    ],
    supportingEvidence: [
      'NRCA installation standards',
      'Manufacturer technical bulletins',
      'Professional certification requirements',
      'Warranty compliance standards'
    ],
    bestPractices: [
      'Reference specific installation defects',
      'Cite manufacturer technical bulletins',
      'Mention warranty void consequences',
      'Include professional certification standards'
    ],
    relatedQA: [218, 229, 267]
  }
];

// Utility functions
export function getArgumentById(id: string): Argument | undefined {
  return ARGUMENTS.find(arg => arg.id === id);
}

export function getArgumentsByCategory(category: ArgumentCategory): Argument[] {
  return ARGUMENTS.filter(arg => arg.category === category);
}

export function getArgumentsByScenario(scenario: string): Argument[] {
  return ARGUMENTS.filter(arg =>
    arg.applicableScenarios.some(s =>
      s.toLowerCase().includes(scenario.toLowerCase())
    )
  );
}

export function getArgumentsByState(state: string): Argument[] {
  return ARGUMENTS.filter(arg =>
    arg.stateSpecific?.includes(state.toUpperCase()) ||
    arg.stateSpecific?.includes('All IRC jurisdictions')
  );
}

export function getTopPerformingArguments(limit: number = 10): Argument[] {
  return [...ARGUMENTS]
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, limit);
}

export function getMostUsedArguments(limit: number = 10): Argument[] {
  return [...ARGUMENTS]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit);
}

export function searchArguments(query: string): Argument[] {
  const lowerQuery = query.toLowerCase();
  return ARGUMENTS.filter(arg =>
    arg.title.toLowerCase().includes(lowerQuery) ||
    arg.description.toLowerCase().includes(lowerQuery) ||
    arg.fullText.toLowerCase().includes(lowerQuery) ||
    arg.applicableScenarios.some(s => s.toLowerCase().includes(lowerQuery))
  );
}

export function getRelatedArguments(argumentId: string): Argument[] {
  const argument = getArgumentById(argumentId);
  if (!argument) return [];

  // Find arguments in same category or with overlapping scenarios
  return ARGUMENTS.filter(arg =>
    arg.id !== argumentId &&
    (arg.category === argument.category ||
     arg.applicableScenarios.some(s =>
       argument.applicableScenarios.includes(s)
     ))
  );
}

export function getArgumentStatistics(): {
  totalArguments: number;
  byCategory: Record<ArgumentCategory, number>;
  averageSuccessRate: number;
  totalUsage: number;
} {
  const byCategory = ARGUMENTS.reduce((acc, arg) => {
    acc[arg.category] = (acc[arg.category] || 0) + 1;
    return acc;
  }, {} as Record<ArgumentCategory, number>);

  const totalSuccessRate = ARGUMENTS.reduce((sum, arg) => sum + arg.successRate, 0);
  const totalUsage = ARGUMENTS.reduce((sum, arg) => sum + arg.usageCount, 0);

  return {
    totalArguments: ARGUMENTS.length,
    byCategory,
    averageSuccessRate: totalSuccessRate / ARGUMENTS.length,
    totalUsage
  };
}

// Export categories for UI selection
export const ARGUMENT_CATEGORIES: { value: ArgumentCategory; label: string }[] = [
  { value: 'building_code', label: 'Building Codes' },
  { value: 'manufacturer_spec', label: 'Manufacturer Specifications' },
  { value: 'insurance_regulation', label: 'Insurance Regulations' },
  { value: 'industry_standard', label: 'Industry Standards' },
  { value: 'warranty_protection', label: 'Warranty Protection' },
  { value: 'property_value', label: 'Property Value' },
  { value: 'safety_liability', label: 'Safety & Liability' }
];
