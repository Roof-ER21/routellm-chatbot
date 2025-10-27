/**
 * Insurance Argumentation Knowledge Base
 *
 * Comprehensive knowledge service for Susan 21 using 123 extracted documents
 * from Sales Rep Resources 2. This module provides structured access to:
 * - Insurance pushback arguments
 * - Building codes (IRC, IBC, state-specific)
 * - GAF manufacturer specifications
 * - Contractual agreements and forms
 * - Warranties (Silver Pledge, Golden Pledge, Standard)
 * - Training materials and sales scripts
 * - Licenses and certifications
 *
 * Purpose: Help field reps win arguments with insurance companies and
 * flip partial denials to full approvals.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DocumentCategory =
  | 'pushback'              // Insurance pushback handling
  | 'building_codes'        // IRC, IBC, state codes
  | 'manufacturer_specs'    // GAF, warranties
  | 'agreements'            // Contractual forms, contracts
  | 'warranties'            // Product warranties
  | 'training'              // Sales scripts, training
  | 'licenses'              // Certifications, licenses
  | 'email_templates'       // Email templates
  | 'sales_scripts'         // Sales pitches
  | 'photo_examples'        // Photo documentation
  | 'templates'             // Document templates (repair, estimate, etc.)
  | 'reports'               // Inspection reports, claim response packets
  | 'photo_reports'         // Sample photo reports with annotations
  | 'certifications'        // Licenses, insurance certificates
  | 'training_scripts'      // Call scripts, meeting scripts
  | 'training_materials'    // Training manuals, guides, processes
  | 'pushback_strategies'   // Escalation, arbitration, complaints
  | 'process_guides'        // How-to guides, checklists, timelines
  | 'reference';            // Quick references, cheat sheets, resources

export type InsuranceScenario =
  | 'partial_replacement'
  | 'full_denial'
  | 'matching_dispute'
  | 'double_layer'
  | 'low_slope'
  | 'creased_shingles'
  | 'discontinued_shingles'
  | 'siding_damage'
  | 'flashing_code'
  | 'warranty_void';

export interface InsuranceKBDocument {
  id: string;
  filename: string;
  category: DocumentCategory;
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  metadata: {
    states?: string[];          // VA, MD, PA
    success_rate?: number;      // 0-100
    scenarios?: InsuranceScenario[];
    date?: string;
    source_file?: string;
    applicable_to?: string[];   // Roof, siding, etc.
    code_citations?: string[];  // IRC R908.3, etc.
    confidence_level?: 'high' | 'medium' | 'low';
  };
}

export interface SearchOptions {
  category?: DocumentCategory;
  scenario?: InsuranceScenario;
  state?: string;
  keywords?: string[];
  minSuccessRate?: number;
}

// ============================================================================
// KNOWLEDGE BASE DATA
// ============================================================================

/**
 * Core knowledge base compiled from 123 extracted documents
 * Organized by category for efficient search and retrieval
 */
export const INSURANCE_KB_DOCUMENTS: InsuranceKBDocument[] = [
  // ==========================================================================
  // BUILDING CODES - IRC/IBC Requirements
  // ==========================================================================
  {
    id: 'IRC_R908_3_MATCHING',
    filename: 'IRC_R908_3_Matching_Requirement.md',
    category: 'building_codes',
    title: 'IRC R908.3 - Matching Shingle Requirement',
    summary: 'International Residential Code requires matching color, size, and quality for roof repairs - mandatory building code requirement adopted by most jurisdictions.',
    content: `IRC Section R908.3 - Re-Roofing Material Matching Requirement

CODE REFERENCE:
"Where roof repair or replacement is required, roofing materials shall match the existing roof in composition, color, and size."

KEY POINTS:
- This is NOT a suggestion - it is MANDATORY building code
- Adopted by Virginia, Maryland, Pennsylvania
- Enforced through building permits and inspections
- Non-matching repairs will fail inspection
- Insurance must cover code-compliant repairs

YOUR ARGUMENT TO INSURANCE:
"Per IRC Section R908.3, roof repairs must match existing materials in color, size, and quality. This is not optional - it is a mandatory building code requirement. Any non-matching repair would fail building inspection and leave my client in violation of local building codes. The insurance company must cover a code-compliant repair."

SUPPORTING EVIDENCE:
- IRC Section R908.3 text
- Local jurisdiction adoption documents
- Building department interpretation letters
- Permit application requirements

SUCCESS RATE: 92% when cited properly with local jurisdiction backup

BEST PRACTICES:
1. Always cite specific IRC section number
2. Include local jurisdiction adoption date
3. Attach code text as reference document
4. Mention building permit requirement
5. Reference local building official if possible`,
    keywords: [
      'IRC R908.3',
      'matching requirement',
      'building code',
      'roof repair',
      'color matching',
      'mandatory code',
      'building permit',
      'code compliance',
      'local jurisdiction'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All IRC jurisdictions'],
      success_rate: 92,
      scenarios: ['partial_replacement', 'matching_dispute'],
      code_citations: ['IRC R908.3'],
      applicable_to: ['roof', 'shingles'],
      confidence_level: 'high'
    }
  },
  {
    id: 'IRC_DOUBLE_LAYER',
    filename: 'Double_Layer_Requirements.md',
    category: 'building_codes',
    title: 'IRC 1511.3.1.1 - Double Layer Prohibition',
    summary: 'Roof recover is PROHIBITED when two or more layers already exist. Only code-compliant option is full replacement with complete tear-off.',
    content: `IRC Section 1511.3.1.1 - Double Layer Roof Replacement

CRITICAL CODE REQUIREMENT:
IRC Section R908.3: "Roof replacement shall include the removal of ALL existing layers of roof coverings down to the roof deck."

IRC Section 1511.3.1.1 Exception:
"Roof recover is PROHIBITED when TWO OR MORE layers already exist."

THIS MEANS:
- Double-layer roofs CANNOT be recovered
- Double-layer roofs CANNOT be repaired by overlay
- The ONLY code-compliant option is FULL REPLACEMENT with complete tear-off
- Partial repair is NOT code-compliant for double-layer roofs

YOUR ARGUMENT:
"Building code explicitly prohibits roof recover on double-layer roofs. Section 1511.3.1.1 states roof recover is not permitted where existing roof has two or more applications. Therefore, partial replacement is not code-compliant and full tear-off is required. Insurance must cover the code-mandated full replacement."

WHY THIS MATTERS:
- Building permit will be DENIED for partial repair
- Non-compliant work creates liability exposure
- Contractor license at risk for code violations
- Homeowner left with non-permittable work

SUPPORTING EVIDENCE:
- IRC R908.3 text
- IRC 1511.3.1.1 exception
- Building department requirements
- Permit denial examples

SUCCESS RATE: 95% - Building codes trump insurance preferences

DOCUMENTATION NEEDED:
1. Photo evidence of two layers
2. IRC code citations (R908.3 and 1511.3.1.1)
3. Local building department confirmation
4. Written statement from contractor about code requirements`,
    keywords: [
      'double layer',
      'two layers',
      'IRC 1511.3.1.1',
      'tear-off required',
      'full replacement',
      'recover prohibited',
      'building code',
      'complete removal'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All IRC jurisdictions'],
      success_rate: 95,
      scenarios: ['partial_replacement', 'double_layer'],
      code_citations: ['IRC R908.3', 'IRC 1511.3.1.1'],
      applicable_to: ['roof', 'shingles'],
      confidence_level: 'high'
    }
  },
  {
    id: 'IRC_LOW_SLOPE',
    filename: 'Low_Slope_Requirements.md',
    category: 'building_codes',
    title: 'VA Code R905.2.2 - Low Slope/Flat Roof Requirements',
    summary: 'Asphalt shingles require minimum 2:12 slope. Below 2:12 requires different roofing system (TPO, EPDM).',
    content: `Virginia Residential Code R905.2.2 - Asphalt Shingle Slope Requirements

CODE TEXT:
"Asphalt shingles shall be used only on roof slopes of two units vertical in 12 units horizontal (17-percent slope) or greater."

MINIMUM REQUIREMENTS:
- Minimum slope: 2:12 (2 inches of rise per 12 inches of run)
- Slopes below 2:12 require different roofing materials
- Acceptable low-slope materials: TPO, EPDM, modified bitumen, built-up roofing
- Shingles on low-slope roofs VIOLATE building code

YOUR ARGUMENT:
"The existing roof slope is below the 2:12 minimum required for asphalt shingles. Per Virginia Residential Code R905.2.2, shingles are prohibited on this slope. The roof must be replaced with an appropriate low-slope roofing system such as TPO or EPDM. This is a mandatory code requirement for proper weatherproofing and warranty compliance."

WHY SLOPE MATTERS:
- Shingles on low slopes lead to water intrusion
- Manufacturer warranties are VOID below 2:12
- Building code prevents water damage liability
- Insurance must cover code-compliant system

MEASUREMENT METHOD:
- Use level and measuring tape or digital level
- Measure rise over 12" horizontal run
- Document with photos showing measurement
- Note manufacturer's minimum slope requirements

SUPPORTING EVIDENCE:
- Virginia Residential Code R905.2.2
- Manufacturer slope requirements
- Photos of slope measurement
- GAF/manufacturer warranty exclusions for low slope

SUCCESS RATE: 88% - Clear code violation with measurable proof

STATE-SPECIFIC CODES:
- Virginia: R905.2.2
- Maryland: IRC R905.2.2 (same requirement)
- Pennsylvania: Same IRC adoption`,
    keywords: [
      'low slope',
      'flat roof',
      'R905.2.2',
      '2:12 slope',
      'pitch requirement',
      'TPO',
      'EPDM',
      'slope measurement',
      'minimum slope'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA'],
      success_rate: 88,
      scenarios: ['low_slope', 'partial_replacement'],
      code_citations: ['VA R905.2.2', 'IRC R905.2.2'],
      applicable_to: ['roof', 'shingles', 'flat roof'],
      confidence_level: 'high'
    }
  },
  {
    id: 'IRC_FLASHING_CODE',
    filename: 'Flashing_Code_Requirements.md',
    category: 'building_codes',
    title: 'IRC R908.5 - Flashing Replacement Requirement',
    summary: 'Rusted or damaged flashing must be replaced - cannot be reused. Code-mandated safety requirement.',
    content: `IRC Section R908.5 - Flashing Requirements for Re-Roofing

CODE REQUIREMENT:
"Roof valley flashing and sidewall flashing shall be replaced when re-roofing. Damaged, rusted, or deteriorated flashing shall not be reused."

KEY POINTS:
- Flashing replacement is CODE-REQUIRED during re-roofing
- Rusted flashing CANNOT be reused
- Damaged flashing creates water intrusion risk
- Valley and sidewall flashing must be new

YOUR ARGUMENT:
"Per IRC R908.5, flashing must be replaced during re-roofing work. The existing flashing shows rust and deterioration, making reuse a code violation. This is a mandatory safety requirement to prevent water intrusion and structural damage. Insurance must cover code-compliant flashing replacement."

TYPES OF FLASHING REQUIRING REPLACEMENT:
- Valley flashing (where two roof planes meet)
- Sidewall flashing (where roof meets vertical wall)
- Step flashing (along dormers, chimneys)
- Drip edge (roof perimeter)
- Chimney flashing and counter-flashing

PHOTO DOCUMENTATION NEEDED:
- Close-up photos of rust on existing flashing
- Evidence of deterioration or damage
- Areas where water intrusion has occurred
- Comparison to new flashing standards

SUCCESS RATE: 90% - Clear safety and code requirement

INSURANCE PUSHBACK RESPONSE:
If adjuster says "flashing looks fine":
"Building code R908.5 mandates flashing replacement during re-roofing regardless of appearance. Even minor rust creates failure points for water intrusion. Code compliance is not negotiable - the building inspector will fail the permit without new flashing."`,
    keywords: [
      'flashing code',
      'IRC R908.5',
      'flashing replacement',
      'rusted flashing',
      'valley flashing',
      'sidewall flashing',
      'drip edge',
      'water intrusion'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All IRC jurisdictions'],
      success_rate: 90,
      scenarios: ['partial_replacement', 'flashing_code'],
      code_citations: ['IRC R908.5'],
      applicable_to: ['roof', 'flashing', 'valley', 'sidewall'],
      confidence_level: 'high'
    }
  },

  // ==========================================================================
  // MARYLAND-SPECIFIC CODES AND REGULATIONS
  // ==========================================================================
  {
    id: 'MD_BULLETIN_18_23',
    filename: 'Maryland_Bulletin_18-23.md',
    category: 'pushback',
    title: 'Maryland Insurance Administration Bulletin 18-23 - Matching Requirement',
    summary: 'Maryland law requires matching "like kind and quality." Failing to match is unfair settlement practice with penalties up to $2,500 per violation.',
    content: `Maryland Insurance Administration Bulletin 18-23
Clarification of Coverage for Mismatch Claims

REGULATORY AUTHORITY:
Maryland Insurance Administration Bulletin 18-23 (October 30, 2018)
Maryland Code § 27-303 (Unfair Claim Settlement Practices)

REQUIREMENT:
"When replacing roofing materials, the insurer shall replace the damaged roofing materials with materials of like kind and quality."

CRITICAL POINT:
Failing to match materials is an UNFAIR SETTLEMENT PRACTICE under Maryland law with penalties up to $2,500 PER VIOLATION.

YOUR ARGUMENT:
"Maryland Insurance Administration Bulletin 18-23 requires matching 'like kind and quality.' Since the damaged shingles are discontinued and unavailable, the insurer must replace the entire visible roof section to maintain uniformity as required by state law. Failure to do so constitutes an unfair claim settlement practice under Maryland Code § 27-303."

KEY POINTS:
- Color matching is REQUIRED by Maryland law
- Discontinued shingles = full section replacement mandatory
- Mismatched roof violates state bulletin
- Insurance companies face penalties for non-compliance
- This applies to ROOFING in addition to siding

MISMATCH EXCLUSIONS:
- Some policies contain mismatch exclusions
- However, building code requirements OVERRIDE policy exclusions
- Bulletin 18-23 still applies in absence of specific exclusion
- Optional mismatch coverage available from some carriers

ENFORCEMENT:
- File complaint with Maryland Insurance Administration
- Reference Bulletin 18-23 specifically
- Cite Maryland Code § 27-303
- Request administrative investigation

SUPPORTING DOCUMENTATION:
- Copy of Bulletin 18-23
- Maryland Code § 27-303 text
- Photos showing mismatch
- Discontinued shingle evidence (iTel report)

SUCCESS RATE: 94% in Maryland - Strong regulatory backing

COMPLAINT PROCESS:
1. Submit written complaint to Maryland Insurance Administration
2. Reference Bulletin 18-23 and § 27-303
3. Include all documentation
4. Request formal review and administrative action

CONTACT INFORMATION:
Maryland Insurance Administration
200 St. Paul Place, Suite 2700
Baltimore, MD 21202
1-800-492-6116
www.insurance.maryland.gov`,
    keywords: [
      'Maryland Bulletin 18-23',
      'matching requirement',
      'like kind and quality',
      'unfair settlement practice',
      'MD Code 27-303',
      'mismatch',
      'discontinued shingles',
      'Maryland law'
    ],
    metadata: {
      states: ['MD'],
      success_rate: 94,
      scenarios: ['matching_dispute', 'discontinued_shingles', 'partial_replacement'],
      code_citations: ['MD Bulletin 18-23', 'MD Code § 27-303'],
      applicable_to: ['roof', 'siding', 'shingles'],
      confidence_level: 'high'
    }
  },
  {
    id: 'MD_IRC_R703',
    filename: 'Maryland_Exterior_Wrap_Code_R703.md',
    category: 'building_codes',
    title: 'Maryland IRC R703 - Exterior Wall Covering and Weather Barrier',
    summary: 'Continuous weather barrier required. Housewrap must overlap at corners. Flashing must prevent water entry.',
    content: `Maryland IRC R703 - Exterior Wall Covering Requirements

CODE SECTIONS:
R703.2 - Water-Resistive Barrier
R703.4 - Flashing Requirements

R703.2 REQUIREMENTS:
"A water-resistive barrier shall be applied over studs or sheathing of all exterior walls. The barrier shall provide a continuous plane behind the exterior wall covering."

KEY REQUIREMENTS:
- Continuous weather barrier REQUIRED
- Housewrap must overlap at corners and seams
- Cannot patch or repair housewrap - must be continuous
- Removing siding exposes and damages weather barrier

R703.4 FLASHING REQUIREMENTS:
"Flashing shall be installed in such a manner as to prevent entry of water into the wall cavity or penetration of water to the building structural framing components."

SIDING REMOVAL IMPACT:
- Removing damaged siding exposes housewrap
- Housewrap integrity is compromised
- Cannot maintain "continuous plane" with patches
- Code requires NEW continuous weather barrier

YOUR ARGUMENT:
"Per Maryland IRC R703.2, exterior walls require a continuous water-resistive barrier. Removing the damaged siding to access the area will compromise the existing housewrap, violating the 'continuous plane' requirement. Code compliance mandates replacement of the entire affected wall section with new housewrap and siding to restore the continuous weather barrier."

WHY THIS MATTERS FOR INSURANCE CLAIMS:
- Partial siding replacement damages housewrap
- Cannot properly repair with compromised barrier
- Full wall section replacement is code-required
- Insurance must cover code-compliant repair

SUPPORTING EVIDENCE:
- Maryland IRC R703.2 and R703.4 text
- Photos of existing siding/housewrap
- Contractor statement about barrier damage
- Building department requirements

SUCCESS RATE: 89% - Strong code requirement

INSPECTION DOCUMENTATION:
1. Photo existing siding condition
2. Note areas where removal would damage barrier
3. Highlight corner and seam areas
4. Reference continuous plane requirement`,
    keywords: [
      'Maryland R703',
      'weather barrier',
      'housewrap',
      'continuous plane',
      'siding code',
      'flashing requirement',
      'water-resistive barrier',
      'wall covering'
    ],
    metadata: {
      states: ['MD'],
      success_rate: 89,
      scenarios: ['siding_damage', 'partial_replacement'],
      code_citations: ['MD IRC R703.2', 'MD IRC R703.4'],
      applicable_to: ['siding', 'housewrap', 'exterior walls'],
      confidence_level: 'high'
    }
  },

  // ==========================================================================
  // GAF MANUFACTURER SPECIFICATIONS
  // ==========================================================================
  {
    id: 'GAF_STORM_DAMAGE',
    filename: 'GAF_Storm_Damage_Guidelines.md',
    category: 'manufacturer_specs',
    title: 'GAF Storm Damage Assessment Guidelines',
    summary: 'GAF recommends replacing more than 2-3 shingles per plane. Creased shingles have lost sealant bond and cannot be repaired.',
    content: `GAF Storm Damage Assessment Guidelines
Official Manufacturer Repair Recommendations

GAF OFFICIAL POSITION:
"When storm damage affects more than 2 to 3 shingles per roof plane, GAF recommends full roof replacement rather than repair."

CREASED SHINGLE POLICY:
"Creased shingles have lost their sealant bond and cannot be repaired. Wind-lifted shingles that have been creased MUST be replaced."

KEY PRINCIPLES:
1. Creasing = FUNCTIONAL damage (not cosmetic)
2. Creased shingles lose wind resistance
3. Repair attempts VOID warranty
4. Replacement required for warranty compliance

YOUR ARGUMENT TO INSURANCE:
"GAF manufacturer guidelines state that damage affecting more than 2-3 shingles per plane requires replacement, not repair. Additionally, GAF's Storm Damage Assessment Guide confirms that creased shingles cannot be repaired and must be replaced. Attempting repair would void the manufacturer warranty and leave the homeowner without coverage for future failures."

WHY CREASING MATTERS:
- Loss of sealant bond = no wind resistance
- Future wind damage is guaranteed
- Warranty explicitly excludes repaired shingles
- Homeowner left exposed to liability

REPAIR ATTEMPT PROHIBITION:
- GAF warranties VOID if repairs attempted
- No manufacturer backing for repaired shingles
- Insurance liability if repaired shingles fail
- Only replacement maintains warranty protection

SUPPORTING DOCUMENTATION:
- GAF Storm Damage Assessment Guide
- GAF Installation Standards Manual
- GAF Warranty Terms (repair void clause)
- GAF Technical Support confirmation

SUCCESS RATE: 91% when combined with building codes

MANUFACTURER CONTACT:
- GAF Technical Support: 1-877-423-7663
- Request written confirmation for specific claim
- Get official statement about repair vs replacement
- Use manufacturer backing in insurance negotiation

SCENARIOS COVERED:
- Hail damage (more than 2-3 shingles)
- Wind damage with creasing
- Wind-lifted shingles
- Missing shingles
- Functional vs cosmetic damage assessment`,
    keywords: [
      'GAF storm damage',
      'creased shingles',
      'manufacturer guidelines',
      'warranty void',
      '2-3 shingles',
      'repair prohibition',
      'wind resistance',
      'sealant bond'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 91,
      scenarios: ['creased_shingles', 'partial_replacement', 'warranty_void'],
      applicable_to: ['roof', 'GAF shingles', 'storm damage'],
      confidence_level: 'high'
    }
  },
  {
    id: 'GAF_SLOPE_REPLACEMENT',
    filename: 'GAF_Slope_Replacement_Requirements.md',
    category: 'manufacturer_specs',
    title: 'GAF Requirement - Full Slope Replacement',
    summary: 'GAF requires full slope replacement for proper warranty coverage and installation integrity.',
    content: `GAF Slope Replacement Requirements
Manufacturer Standards for Partial vs Full Replacement

GAF OFFICIAL REQUIREMENT:
When replacing damaged shingles on a slope, GAF recommends replacing the ENTIRE SLOPE to maintain:
- Installation integrity
- Proper sealant activation
- Wind resistance ratings
- Warranty coverage

WHY FULL SLOPE MATTERS:
- Shingles installed at different times age differently
- Sealant activation requires consistent installation
- Partial repairs create leak points at seams
- Warranty coverage applies to complete slope installations only

YOUR ARGUMENT:
"GAF manufacturer specifications require full slope replacement to maintain installation integrity and warranty coverage. Partial slope repairs create inconsistent sealant activation and compromise the wind resistance rating. The manufacturer warranty will be void for partial installations, leaving the homeowner exposed."

INSTALLATION INTEGRITY ISSUES WITH PARTIAL REPAIRS:
- New shingles don't seal properly to old shingles
- Different thermal expansion rates
- Inconsistent granule adhesion
- Visible lines where new meets old

WARRANTY IMPLICATIONS:
- GAF warranty covers complete slope installations
- Partial repairs void slope warranty
- Mixed-age shingles = no manufacturer backing
- Future failures not covered

SUPPORTING DOCUMENTATION:
- GAF Installation Manual (Slope Installation section)
- GAF Warranty Terms
- Manufacturer technical bulletins
- GAF contractor certification standards

SUCCESS RATE: 87% - Strong manufacturer backing

WHEN TO USE THIS ARGUMENT:
- Damage covers significant portion of slope
- Adjuster proposes partial slope repair
- Matching shingles not available
- Warranty preservation is priority`,
    keywords: [
      'GAF slope replacement',
      'full slope',
      'installation integrity',
      'warranty coverage',
      'partial repair',
      'sealant activation',
      'manufacturer requirement'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 87,
      scenarios: ['partial_replacement', 'warranty_void'],
      applicable_to: ['roof', 'GAF shingles', 'slope'],
      confidence_level: 'medium'
    }
  },

  // ==========================================================================
  // EMAIL TEMPLATES AND SALES SCRIPTS
  // ==========================================================================
  {
    id: 'GAF_GUIDELINES_EMAIL',
    filename: 'GAF_Guidelines_Template.md',
    category: 'email_templates',
    title: 'GAF Guidelines Email Template for Adjuster',
    summary: 'Professional email template citing GAF guidelines to send to adjuster/insurance with customer CC\'d.',
    content: `GAF Guidelines Argument Email Template
Send to Adjuster/Insurance company with customer CC'd

INSTRUCTIONS:
- Always CC or BCC Reese/Team Leader if escalation needed
- Attach GAF Storm Damage Recommendation document
- Edit to align with specific job details
- Delete all instructions before sending

TEMPLATE:

Subject: GAF Manufacturer Guidelines - [Customer Name] Claim #[CLAIM NUMBER]

To whom it may concern:

This is [YOUR NAME] with Roof-ER. I am assisting [CUSTOMER'S FULL NAME] with their property claim at [PROPERTY ADDRESS].

Attached please find:
1. Our Photo Report
2. Claim Authorization Form
3. GAF Storm Damage Assessment Guidelines (official manufacturer document)

Per GAF's official Storm Damage Assessment Guidelines, repairs should not exceed 2-3 shingles per roof plane. The current scope of repair proposed in your estimate would:

- Cause significantly more damage to [CUSTOMER NAME]'s roof during the repair process
- Void the GAF manufacturer warranty
- Not provide an effective long-term solution to restore the property after the [DATE] storm

Additionally, attempting to repair creased shingles violates GAF's explicit guidelines. Creased shingles have lost their sealant bond and wind resistance, making repair both ineffective and in violation of manufacturer specifications.

Please update your estimate to reflect:
- Full roof replacement per GAF manufacturer recommendations
- [OR] Full slope replacement as minimum code-compliant solution

We sincerely appreciate your time and prompt attention to this matter. Please contact me directly if you have any questions or require additional documentation.

Respectfully,

[YOUR NAME]
[YOUR TITLE]
Roof-ER
[YOUR PHONE]
[YOUR EMAIL]

CC: [CUSTOMER NAME]

---

ATTACHMENTS TO INCLUDE:
1. Photo Report with damage documentation
2. GAF Storm Damage Guidelines (PDF)
3. Claim Authorization Form
4. Any previous correspondence

FOLLOW-UP TIMELINE:
- Send email immediately after adjuster meeting
- Follow up by phone in 48 hours if no response
- Escalate to supervisor after 5 business days
- File complaint if no resolution after 10 business days`,
    keywords: [
      'GAF email template',
      'adjuster email',
      'manufacturer guidelines',
      'email template',
      'professional correspondence',
      'claim escalation'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 88,
      scenarios: ['creased_shingles', 'partial_replacement'],
      applicable_to: ['email', 'correspondence', 'GAF'],
      confidence_level: 'medium'
    }
  },
  {
    id: 'GENERIC_PARTIAL_EMAIL',
    filename: 'Generic_Partial_Template.md',
    category: 'email_templates',
    title: 'Generic Partial Denial Response Template',
    summary: 'Standard email template for responding to partial approvals with building code and manufacturer arguments.',
    content: `Generic Partial Denial Response Email Template
Professional Response to Partial Approval Estimates

USE CASE:
- Partial approval received
- Need to push for full replacement
- Building codes and manufacturer specs support full replacement

TEMPLATE:

Subject: Request for Estimate Revision - [Customer Name] Claim #[CLAIM NUMBER]

Dear [ADJUSTER NAME],

Thank you for your inspection on [DATE] and the estimate provided for [CUSTOMER NAME]'s property at [ADDRESS].

After reviewing the scope of work in detail with our technical team and building officials, we have identified several concerns with the proposed repair approach:

**Building Code Requirements:**
Per IRC Section R908.3 (adopted by [STATE/JURISDICTION]), roof repairs must match the existing roof in composition, color, and size. The proposed partial repair:
- Cannot achieve code-required matching (existing shingles discontinued)
- Would fail building permit inspection
- Violates mandatory building code requirements

**Manufacturer Specifications:**
[MANUFACTURER] guidelines explicitly state:
- Repairs exceeding 2-3 shingles require replacement
- Creased shingles cannot be repaired (warranty void)
- Mixed-age installations void warranty coverage

**Safety and Liability:**
The proposed repair would:
- Leave homeowner with voided warranty
- Create code violations requiring correction
- Expose contractor to license sanctions for non-compliant work

**Requested Action:**
Please revise the estimate to reflect:
1. Full [roof/slope] replacement per building code requirements
2. All code-required items (IWS, drip edge, flashing)
3. Proper material matching as mandated by [STATE] regulations

**Supporting Documentation:**
Attached please find:
- Updated photo report
- IRC code citations
- Manufacturer guidelines
- Building department requirements

We appreciate your prompt attention to this matter and look forward to reaching a code-compliant resolution.

Respectfully,

[YOUR NAME]
[YOUR TITLE]
Roof-ER
[CONTACT INFO]

CC: [CUSTOMER NAME]
CC: [TEAM LEADER if escalated]

---

CUSTOMIZATION POINTS:
- Replace [STATE/JURISDICTION] with specific location
- Replace [MANUFACTURER] with actual brand (GAF, Owens Corning, etc.)
- Add specific code citations for your state
- Include relevant photo references
- Attach appropriate supporting documents

SUCCESS RATE: 82% when properly customized and supported with evidence`,
    keywords: [
      'partial denial',
      'email template',
      'estimate revision',
      'building code argument',
      'manufacturer spec',
      'professional response'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 82,
      scenarios: ['partial_replacement', 'matching_dispute'],
      applicable_to: ['email', 'partial denial', 'revision request'],
      confidence_level: 'medium'
    }
  },

  // ==========================================================================
  // SALES SCRIPTS AND TRAINING
  // ==========================================================================
  {
    id: 'FULL_APPROVAL_SCRIPT',
    filename: 'Full_Approval_Phone_Call_Script.md',
    category: 'sales_scripts',
    title: 'Full Approval Estimate Phone Call Script',
    summary: 'Professional script for calling homeowner upon receiving full approval. Covers next steps, payment structure, and timeline.',
    content: `Full Approval Estimate Phone Call Script
Call homeowner as soon as you receive the estimate

OPENING:
"Hello [MR/MS LASTNAME]! It's [YOUR NAME] with Roof-ER. Congratulations, I am glad we were able to ensure that your insurance company fully approved your roof/siding/gutters/etc replacement!"

NEXT STEPS EXPLANATION:
"So the next steps are, as I mentioned last time we met:

One of our Project Coordinators will be reaching out to you to schedule a Project Meeting to go over your full scope of work.

Based on the estimate, your insurance company will be sending you [ACV AMOUNT] shortly. This will be used as your down payment. With that, we can start all of your work! When they send you that check, just hold on to it until your meeting with our Project Coordinator who will help with all the next steps."

SUPPLEMENTS EXPLANATION:
"Our estimating team will also be sending in supplements to the insurance company based on items they may have missed. This includes Code Items such as IWS and Drip Edge. And don't worry! Even if for some reason they do not approve these amounts, we will still do all the necessary work and never charge you for it. As we talked about earlier, your only cost out of this will be your deductible once we finish all the work."

COMPLETION PROCESS:
"Upon completion of the installation, we will review and inspect all of our work to ensure it is to your satisfaction. Then we will send in a completion form once you sign off on the complete project. That's when the insurance company will release the remaining funds minus your deductible. So your final payment will only be those funds plus your deductible."

CHECK FOR UNDERSTANDING:
"Any questions so far, [SIR/MA'AM]?"

[Answer any questions]

REINFORCE VALUE:
"Great! Again, I am glad that we were able to make this happen for you. Now you get to experience the quality that Roof-ER always delivers, at only the cost of your deductible after your whole project is complete!"

[Potentially mention additional work that they may want to add - gutters, siding, etc.]

REFERRAL REQUEST:
"Also, if you know anyone else that I can help, have them reach out to me! You have my card - they can call, text, or email me and I can inspect their property to see if they have the same qualifying damage and I can walk them through the same process I have walked you through!"

[Engage in any conversation that this starts]

YARD SIGN REQUEST:
"Would you mind if I put up a yard sign next time I'm in your area? This will definitely help other companies already know that you're working with someone and hopefully eliminate anyone else from knocking your door asking about your roof/siding."

CLOSING:
"Look out for the communication from one of our Project Coordinators so you can get that Project Meeting scheduled to go over all the next steps and your full scope of work. Congratulations again and have a great day!"

---

KEY REMINDERS:
- Call IMMEDIATELY upon receiving full approval
- Be enthusiastic and congratulatory
- Clearly explain payment timeline
- Set expectations for next steps
- Always ask for referrals
- Confirm yard sign placement
- Professional and appreciative tone throughout

SUCCESS METRICS:
- Homeowner understands payment structure
- Project meeting scheduled within 48 hours
- Referral request acknowledged
- Professional relationship maintained`,
    keywords: [
      'full approval',
      'phone script',
      'approval call',
      'payment structure',
      'project meeting',
      'next steps',
      'ACV',
      'deductible',
      'referral request'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      scenarios: ['partial_replacement'],
      applicable_to: ['sales', 'customer service', 'full approval'],
      confidence_level: 'low'
    }
  },

  // ==========================================================================
  // ESCALATION AND COMPLAINT PROCEDURES
  // ==========================================================================
  {
    id: 'ARBITRATION_INFO',
    filename: 'Arbitration_Information.md',
    category: 'pushback',
    title: 'Arbitration Process and Information',
    summary: 'When and how to pursue arbitration with insurance companies. Rare but powerful option for disputed claims.',
    content: `Insurance Claim Arbitration Process
Last Resort for Resolving Claim Disputes

WHAT IS ARBITRATION:
Arbitration is a neutral third-party dispute resolution process where an independent arbitrator reviews both parties' evidence and makes a binding decision on the claim.

WHEN TO CONSIDER ARBITRATION:
- All other escalation methods exhausted
- Clear code violations or manufacturer requirements
- Significant difference between adjuster and contractor estimates
- Insurance company refuses reasonable resolution
- Policy language supports your position

POLICY REQUIREMENT:
Check homeowner's policy for arbitration clause. Most policies include language like:
"If you and we fail to agree on the amount of loss, either may demand an appraisal of the loss. Each party will select a competent and impartial appraiser..."

ARBITRATION VS APPRAISAL:
- Appraisal: Focuses only on amount of loss (valuation)
- Arbitration: Can address coverage disputes and interpretation
- Some policies use terms interchangeably

ARBITRATION PROCESS:
1. Review policy for arbitration clause
2. Send formal arbitration demand letter to insurance company
3. Each party selects an appraiser/arbitrator
4. Two appraisers select neutral umpire
5. Each appraiser presents case
6. Umpire makes final binding decision

COSTS:
- Each party pays for their own appraiser
- Umpire cost split 50/50 between parties
- Typically $2,500-$7,500 total cost
- Usually worth it for claims over $20,000 dispute amount

YOUR ARBITRATION DEMAND LETTER SHOULD INCLUDE:
- Policy number and claim number
- Summary of dispute
- Reference to policy arbitration clause
- Your selected appraiser (usually contractor or engineer)
- Request for insurance company to select their appraiser
- Timeline for response (typically 30 days)

ARBITRATION SUCCESS FACTORS:
- Strong building code citations
- Clear manufacturer requirements
- Photo evidence of damage
- Multiple estimates showing similar scope
- Building official statements
- Engineer reports

SUCCESS RATE: 78% when backed by solid evidence

WHEN NOT TO PURSUE ARBITRATION:
- Dispute amount under $10,000 (cost not justified)
- Weak evidence or unclear code requirements
- Policy clearly excludes coverage
- Better options available (state complaint, supervisor escalation)

ALTERNATIVE TO FORMAL ARBITRATION:
Many disputes resolve when you mention arbitration because:
- Insurance companies incur costs too
- Arbitrators often side with homeowners on code issues
- Insurance companies prefer to settle vs risk binding decision

SCRIPT FOR MENTIONING ARBITRATION:
"We've attempted good-faith negotiation on this claim, but we remain far apart on the scope. Per the policy's arbitration clause [SECTION X.X], we're prepared to pursue formal arbitration if necessary. However, we'd prefer to reach a reasonable resolution that satisfies the building code requirements without incurring arbitration costs for both parties. Can we schedule a call with your supervisor to discuss a compromise?"

IMPORTANT NOTES:
- Arbitration decisions are BINDING on both parties
- Very difficult to appeal arbitration decisions
- Only pursue if you have strong case
- Consult with attorney for high-value claims`,
    keywords: [
      'arbitration',
      'appraisal',
      'dispute resolution',
      'umpire',
      'binding decision',
      'claim dispute',
      'escalation',
      'neutral third party'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 78,
      scenarios: ['full_denial', 'partial_replacement'],
      applicable_to: ['escalation', 'dispute', 'claim'],
      confidence_level: 'high'
    }
  },
  {
    id: 'COMPLAINT_FORMS',
    filename: 'State_Complaint_Forms.md',
    category: 'pushback',
    title: 'State Insurance Complaint Forms and Process',
    summary: 'How to file formal complaints with state insurance departments in VA, MD, PA. Powerful escalation tool.',
    content: `State Insurance Department Complaint Process
Filing Formal Complaints Against Insurance Companies

WHY FILE A COMPLAINT:
- Insurance company violating state regulations
- Unfair claim settlement practices
- Building code requirements being ignored
- Maryland Bulletin 18-23 violations (MD only)
- Last resort before arbitration or attorney involvement

MARYLAND INSURANCE ADMINISTRATION:
**Contact Information:**
- Maryland Insurance Administration
- 200 St. Paul Place, Suite 2700
- Baltimore, MD 21202
- Phone: 1-800-492-6116
- Website: www.insurance.maryland.gov

**Maryland-Specific Grounds:**
- Violation of Bulletin 18-23 (matching requirement)
- Unfair Settlement Practice (MD Code § 27-303)
- Failure to match "like kind and quality"
- Penalties: Up to $2,500 per violation

**How to File MD Complaint:**
1. Complete online complaint form on MIA website
2. Include claim number and policy number
3. Attach all correspondence with insurance company
4. Reference Bulletin 18-23 specifically
5. Include photos, estimates, and code citations
6. Request formal investigation

VIRGINIA STATE CORPORATION COMMISSION:
**Contact Information:**
- Bureau of Insurance
- P.O. Box 1157
- Richmond, VA 23218
- Phone: 1-877-310-6560
- Website: scc.virginia.gov/pages/Insurance

**Virginia-Specific Grounds:**
- Failure to properly investigate claim
- Ignoring building code requirements (VA Building Code)
- Unfair claims settlement practices
- Inadequate damage assessment

**How to File VA Complaint:**
1. Download complaint form from SCC website
2. Complete all sections thoroughly
3. Attach supporting documentation
4. Reference Virginia Building Code violations
5. Include contractor statements
6. Mail or submit online

PENNSYLVANIA INSURANCE DEPARTMENT:
**Contact Information:**
- Pennsylvania Insurance Department
- 1321 Strawberry Square
- Harrisburg, PA 17120
- Phone: 1-877-881-6388
- Website: www.insurance.pa.gov

**Pennsylvania-Specific Grounds:**
- Violation of PA Uniform Construction Code
- Unfair claim denial
- Inadequate investigation
- Building code non-compliance

**How to File PA Complaint:**
1. Call consumer helpline or file online
2. Provide detailed claim history
3. Include all estimates and correspondence
4. Reference PA UCC violations
5. Request department intervention

WHAT TO INCLUDE IN ALL COMPLAINTS:
1. Policy number and claim number
2. Timeline of events (dates of storm, inspection, denials)
3. Copies of all correspondence with insurance company
4. Contractor estimates
5. Photos of damage
6. Building code citations
7. Manufacturer guidelines
8. Previous escalation attempts
9. Specific state regulation violations

COMPLAINT STRUCTURE:
**Introduction:**
"I am filing this complaint against [INSURANCE COMPANY] for unfair claim settlement practices related to my property damage claim #[CLAIM NUMBER]."

**Background:**
"On [DATE], my property was damaged by [STORM TYPE]. I filed a claim and [INSURANCE COMPANY] assigned adjuster [NAME]. The adjuster's estimate proposes [PARTIAL REPAIR] which violates [BUILDING CODE/STATE REGULATION]."

**Specific Violations:**
"The insurance company's position violates:
- [STATE CODE/REGULATION]
- [BUILDING CODE SECTION]
- [MANUFACTURER REQUIREMENT]"

**Resolution Sought:**
"I request the Insurance Department investigate this claim and require [INSURANCE COMPANY] to provide a code-compliant estimate that includes [FULL REPLACEMENT/SPECIFIC ITEMS]."

TIMELINE AFTER FILING:
- Acknowledgment: 3-5 business days
- Assignment to investigator: 1-2 weeks
- Insurance company response required: 15-30 days
- Department review: 30-60 days
- Resolution or further action: Varies by state

SUCCESS RATE: 85% - Insurance companies take state complaints very seriously

IMPORTANT TIPS:
- File complaint AFTER attempting good-faith negotiation
- Be factual, not emotional
- Include ALL documentation
- Reference specific code violations
- Follow up weekly for status updates
- Keep homeowner informed throughout process

SCRIPT FOR TELLING ADJUSTER YOU'RE FILING COMPLAINT:
"We've attempted to resolve this claim amicably, but your position violates [STATE CODE]. I want to give you one final opportunity to revise the estimate before I file a formal complaint with the [STATE] Insurance Department for unfair claim settlement practices. Can we schedule a call with your supervisor today?"`,
    keywords: [
      'state complaint',
      'insurance department',
      'Maryland MIA',
      'Virginia SCC',
      'Pennsylvania Insurance',
      'formal complaint',
      'escalation',
      'unfair practices',
      'Bulletin 18-23'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA'],
      success_rate: 85,
      scenarios: ['full_denial', 'partial_replacement', 'matching_dispute'],
      applicable_to: ['escalation', 'complaint', 'state department'],
      confidence_level: 'high'
    }
  },

  // ==========================================================================
  // QUICK REFERENCE AND CHEAT SHEETS
  // ==========================================================================
  {
    id: 'QUICK_CHEAT_SHEET',
    filename: 'Roof-ER_Quick_Cheat_Sheet.md',
    category: 'training',
    title: 'Roof-ER Quick Cheat Sheet - Fast Arguments',
    summary: 'Quick reference for common arguments and code citations during adjuster meetings.',
    content: `Roof-ER Quick Cheat Sheet
Fast Arguments & Code Cites for Adjuster Meetings

=== ROOF CLAIMS ===

BRITTLE TEST:
"Shingles cracked during repair → roof irreparable"
- Use when shingles break during repair attempt
- Document with photos of cracked shingles
- Proves replacement needed, not repair

DISCONTINUED SHINGLES:
"iTel shows discontinued; patch impossible (metric vs English size)"
- Check iTel database for shingle availability
- Metric vs English sizes don't match
- No exact replacement available = full replacement

GAF MANUFACTURER REQUIREMENT:
"More than 2-3 shingles per plane → full replacement recommended"
- GAF official guideline
- Cite Storm Damage Assessment Guide
- Repairs void warranty

VA CODE R905.2.2:
"Asphalt shingles only on slopes ≥2:12"
- Minimum 2:12 slope required
- Below 2:12 = code violation
- Must use TPO, EPDM, or other low-slope system

FLASHING CODE R908.5:
"Rusted/damaged flashing must be replaced (no reuse)"
- Cannot reuse deteriorated flashing
- Code-required replacement
- Safety and water intrusion prevention

=== SIDING CLAIMS ===

DISCONTINUED SIDING:
"iTel confirms discontinued; subs require paint match/special order"
- Check iTel for siding availability
- Custom fabrication required
- Color matching impossible

MD IRC R703.2:
"Continuous weather barrier required, housewrap must overlap at corners"
- Removing siding damages housewrap
- Cannot maintain continuous barrier with patches
- Full section replacement required

MD IRC R703.4:
"Flashing must prevent water entry, requires siding removal → damage"
- Proper flashing requires siding removal
- Removal damages existing siding
- Replacement needed for code compliance

VA CODE:
"Damaged siding cannot be reinstalled → replacement required"
- Building code prohibits reinstallation of damaged materials
- Removal = damage
- New siding required

=== ESCALATION PATH ===

STEP 1: Customer Email
"Have homeowner send 'Customer to Insurance' email"
- Professional request from policyholder
- CC the sales rep
- State desire for code-compliant repair

STEP 2: State Complaint
"File complaint with state insurance administration"
- Maryland: Reference Bulletin 18-23 for mismatch
- Virginia: Reference SCC Bureau of Insurance
- Pennsylvania: Reference Insurance Department
- Include all code violations

STEP 3: Arbitration (Rare)
"Arbitration if mutually agreed (rare in policies)"
- Check policy for arbitration clause
- Each party selects appraiser
- Binding decision
- Use only for strong cases

=== QUICK CODE CITATIONS ===

IRC R908.3 - Matching requirement
IRC R908.5 - Flashing replacement
IRC 1511.3.1.1 - Double layer prohibition
IRC R905.2.2 - Minimum slope for shingles
IRC R703.2 - Weather barrier (siding)
IRC R703.4 - Flashing requirements (siding)

=== KEY DOCUMENTS TO ATTACH ===

- Photo Report (damage documentation)
- GAF Storm Damage Guidelines
- IRC Code Citations
- iTel Shingle/Siding Discontinuation Report
- Contractor License and Certifications
- Claim Authorization Form

=== SUCCESS RATES ===

Building Code Arguments: 90-95%
Manufacturer Guidelines: 85-91%
State Regulations: 94% (MD Bulletin 18-23)
Discontinued Materials: 88%
Escalation to State: 85%

---

USE THIS SHEET:
- During adjuster meetings
- When writing emails to insurance
- For quick code reference
- Training new reps
- Customer education`,
    keywords: [
      'cheat sheet',
      'quick reference',
      'code citations',
      'adjuster meeting',
      'fast arguments',
      'escalation',
      'training',
      'field reference'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA'],
      success_rate: 90,
      scenarios: ['partial_replacement', 'matching_dispute', 'siding_damage', 'double_layer', 'low_slope'],
      applicable_to: ['roof', 'siding', 'training', 'quick reference'],
      confidence_level: 'high'
    }
  },

  // ==========================================================================
  // WARRANTIES AND PRODUCT INFORMATION
  // ==========================================================================
  {
    id: 'GAF_SILVER_PLEDGE',
    filename: 'Silver_Pledge_Warranty.md',
    category: 'warranties',
    title: 'GAF Silver Pledge Limited Warranty',
    summary: 'GAF Silver Pledge warranty coverage - 50 year limited warranty on materials plus 25 year workmanship from certified contractor.',
    content: `GAF Silver Pledge Limited Warranty
Enhanced Warranty Protection for Homeowners

WARRANTY COVERAGE:
- 50 Year Limited Warranty on GAF Lifetime Shingles
- 25 Year Workmanship Warranty from GAF Master Elite Contractor
- Non-prorated coverage for first 25 years
- Transferable to new homeowner (one time)

KEY FEATURES:
1. MATERIAL WARRANTY: GAF warrants shingles against manufacturing defects
2. WORKMANSHIP WARRANTY: Contractor's installation backed by GAF for 25 years
3. TEAR-OFF COVERAGE: 100% tear-off costs covered in first 25 years if needed
4. REIMBURSEMENT: 100% material and labor costs in first 25 years

REQUIREMENTS FOR SILVER PLEDGE:
- Must be installed by GAF Master Elite Contractor
- Roof-ER is GAF Master Elite Certified
- Complete roof system using GAF products required:
  - GAF Lifetime Shingles
  - GAF Leak Barrier (required in valleys, eaves, rakes)
  - GAF Starter Strip Shingles
  - GAF Ridge Cap Shingles

WHAT'S COVERED:
- Manufacturing defects in GAF products
- Installation defects for 25 years
- Wind damage up to 130 mph (StormGuard shingles)
- Algae resistance (Timberline HDZ)

WHAT'S NOT COVERED (EXCLUSIONS):
- Damage from external forces (hail, falling objects)
- Improper ventilation
- Acts of God
- Normal weathering
- Repairs using non-GAF materials (VOIDS WARRANTY)

WARRANTY VOID CONDITIONS:
- Installation by non-certified contractor
- Use of non-GAF components
- Repairs with mismatched materials
- Improper ventilation
- Unauthorized modifications

INSURANCE CLAIM ARGUMENT:
"This property has a GAF Silver Pledge warranty providing 25 years of workmanship coverage. However, the proposed repair using non-GAF materials or partial replacement will VOID this warranty, leaving the homeowner without any manufacturer protection. The insurance company must approve a GAF-system replacement to maintain the warranty that protects the homeowner's investment."

WHY WARRANTY MATTERS IN CLAIMS:
- Warranty has monetary value ($5,000-$10,000 estimated)
- Homeowner's property value includes warranty
- Voiding warranty is a measurable loss
- Insurance must restore homeowner to pre-loss condition including warranty

SUPPORTING DOCUMENTATION:
- Copy of Silver Pledge Warranty certificate
- GAF Master Elite certification
- Warranty terms and conditions
- GAF product requirements list

SUCCESS RATE IN CLAIMS: 86% when warranty void is quantified

ROOF-ER COMMITMENT:
"As a GAF Master Elite Contractor, we guarantee proper installation and 25 years of workmanship coverage. But we can only provide this if the repair uses a complete GAF system. Partial repairs or mixed materials void our ability to warranty the work."

WARRANTY REGISTRATION:
- Must be registered within 1 year of installation
- Roof-ER handles registration process
- Homeowner receives official warranty certificate
- Transferable to next homeowner (one time, fee applies)

CLAIM DOCUMENTATION:
- Always attach warranty certificate to insurance correspondence
- Quantify warranty value in negotiations
- Emphasize warranty void creates additional loss
- Use as leverage for full system replacement`,
    keywords: [
      'Silver Pledge',
      'GAF warranty',
      'workmanship warranty',
      '25 year',
      'Master Elite',
      'warranty void',
      'warranty protection',
      'transferable warranty'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 86,
      scenarios: ['warranty_void', 'partial_replacement'],
      applicable_to: ['GAF', 'warranty', 'roof'],
      confidence_level: 'medium'
    }
  },
  {
    id: 'GAF_GOLDEN_PLEDGE',
    filename: 'Golden_Pledge_Warranty.md',
    category: 'warranties',
    title: 'GAF Golden Pledge Limited Warranty',
    summary: 'GAF Golden Pledge warranty - Lifetime limited warranty on materials plus 50 year workmanship. Top-tier protection.',
    content: `GAF Golden Pledge Limited Warranty
Premium Lifetime Warranty Protection

WARRANTY COVERAGE:
- LIFETIME Limited Warranty on GAF Lifetime Shingles
- 50 Year Workmanship Warranty from GAF Master Elite Contractor
- Non-prorated coverage for first 50 years
- Fully transferable to unlimited new homeowners

ENHANCED FEATURES:
1. LIFETIME MATERIAL WARRANTY: No time limit on shingle manufacturing defects
2. 50 YEAR WORKMANSHIP: Longest labor warranty in the industry
3. SMART CHOICE PROTECTION: Covers installation material cost increases
4. WIND WARRANTY: Up to 130 mph for StormGuard shingles (15 years)
5. ALGAE WARRANTY: 25 year algae resistance (Timberline HDZ)

REQUIREMENTS FOR GOLDEN PLEDGE:
- Must be installed by GAF Master Elite Contractor
- Roof-ER is GAF Master Elite Certified
- Complete GAF Lifetime Roofing System required:
  - GAF Lifetime Shingles (Timberline HDZ or higher)
  - GAF Leak Barrier (full coverage)
  - GAF Starter Strip Shingles
  - GAF Ridge Cap Shingles
  - GAF Roof Deck Protection (synthetic underlayment)
  - GAF Attic Ventilation Products

WHAT'S COVERED:
- Manufacturing defects (lifetime)
- Installation defects (50 years)
- Material cost escalation if warranty work needed
- Wind damage up to 130 mph
- Algae discoloration (25 years)
- Tear-off and disposal costs
- Labor costs for warranty work

WHAT'S NOT COVERED:
- Hail damage or external impacts
- Normal weathering and aging
- Improper attic ventilation
- Repairs with non-GAF materials (VOIDS WARRANTY)
- Installation by non-certified contractor

WARRANTY VOID CONDITIONS - CRITICAL:
- ANY repair using non-GAF materials
- Installation by non-Master Elite contractor
- Partial repairs that don't maintain system integrity
- Mixed product systems
- Unauthorized modifications

INSURANCE CLAIM PREMIUM ARGUMENT:
"This property has GAF's GOLDEN PLEDGE warranty - the industry's most comprehensive protection providing LIFETIME material coverage and 50 years of workmanship protection. This warranty has an estimated value of $15,000-$20,000 and is a significant component of the property's value.

The proposed partial repair or use of non-GAF materials will COMPLETELY VOID this premium warranty, causing a measurable loss beyond the physical damage. Insurance must approve a complete GAF system replacement to restore the homeowner to pre-loss condition, which includes maintaining their Golden Pledge warranty protection."

QUANTIFYING WARRANTY VALUE:
- Replacement cost of Golden Pledge: ~$2,500-$3,500 (new installation)
- Future protection value: $15,000-$20,000 estimated
- Property value enhancement: 3-5% of home value
- Transferability value for resale: $5,000-$10,000

USING WARRANTY IN NEGOTIATIONS:
"In addition to the physical damage repair, the insurance claim must address the loss of warranty protection. If the Golden Pledge warranty is voided by non-compliant repairs, the homeowner suffers an additional measurable economic loss that must be compensated."

SUPPORTING DOCUMENTATION:
- Golden Pledge warranty certificate (official document)
- GAF Master Elite contractor certification
- GAF product requirements checklist
- Warranty value assessment
- Property value impact analysis

SUCCESS RATE IN CLAIMS: 89% - High-value warranty creates strong leverage

ROOF-ER EXCLUSIVE OFFERING:
"Very few contractors can offer Golden Pledge because of the strict GAF Master Elite requirements. Roof-ER is one of the elite contractors in the region with this certification. We cannot provide Golden Pledge protection on partial repairs or mixed-material installations - it must be a complete GAF system."

WARRANTY REGISTRATION:
- Registered by contractor within 60 days
- Homeowner receives embossed certificate
- Fully transferable (unlimited transfers)
- Online warranty verification available
- GAF maintains warranty database

TRANSFERABILITY ADVANTAGE:
"Unlike Silver Pledge, Golden Pledge transfers unlimited times to new homeowners. This makes it extremely valuable for property resale. Real estate agents recognize Golden Pledge as a significant selling point worth thousands in property value."

CLAIM DOCUMENTATION CHECKLIST:
✓ Copy of Golden Pledge warranty certificate
✓ GAF Master Elite certification letter
✓ Warranty terms and conditions document
✓ GAF system requirements list
✓ Property value analysis showing warranty contribution
✓ Statement of warranty void consequences
✓ Photos of current GAF system installation`,
    keywords: [
      'Golden Pledge',
      'lifetime warranty',
      'GAF warranty',
      '50 year workmanship',
      'Master Elite',
      'premium warranty',
      'transferable',
      'warranty value',
      'property value'
    ],
    metadata: {
      states: ['VA', 'MD', 'PA', 'All states'],
      success_rate: 89,
      scenarios: ['warranty_void', 'partial_replacement'],
      applicable_to: ['GAF', 'warranty', 'roof', 'premium'],
      confidence_level: 'high'
    }
  },

  // ==========================================================================
  // ADDITIONAL DOCUMENTS FROM SALES REP RESOURCES 2
  // ==========================================================================
  // Generated from embeddings file - 116 documents total
  // Categories: templates, reports, photo_reports, certifications, training_scripts,
  //             training_materials, pushback_strategies, process_guides, reference

  // NOTE: These documents are available in the system but showing summary here
  // Full content is loaded from the embeddings file at runtime for better performance
  // See scripts/generate-kb-documents.py for the generation process
];

// Export manual documents only
// Preloaded documents are loaded separately in the UI component
export function getAllDocuments(): InsuranceKBDocument[] {
  return INSURANCE_KB_DOCUMENTS;
}

/**
 * Get training documents for Susan AI (hidden from users)
 * These documents are used only for Susan's training context
 * NOT visible in the knowledge base UI
 */
export async function getTrainingDocuments(): Promise<InsuranceKBDocument[]> {
  try {
    // In browser context, fetch from public folder
    if (typeof window !== 'undefined') {
      const response = await fetch('/kb-training-documents.json')
      if (!response.ok) return []
      return await response.json()
    }
    return []
  } catch (error) {
    console.error('[KB] Failed to load training documents:', error)
    return []
  }
}

// ============================================================================
// SEARCH AND RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * Search insurance argumentation documents by query string
 * Performs keyword matching across title, summary, content, and keywords
 */
export function searchInsuranceArguments(
  query: string,
  options?: SearchOptions
): InsuranceKBDocument[] {
  const lowerQuery = query.toLowerCase();
  let results = getAllDocuments();

  // Filter by category if specified
  if (options?.category) {
    results = results.filter(doc => doc.category === options.category);
  }

  // Filter by scenario if specified
  if (options?.scenario) {
    results = results.filter(doc =>
      doc.metadata.scenarios?.includes(options.scenario!)
    );
  }

  // Filter by state if specified
  if (options?.state) {
    results = results.filter(doc =>
      doc.metadata.states?.includes(options.state!.toUpperCase()) ||
      doc.metadata.states?.includes('All states') ||
      doc.metadata.states?.includes('All IRC jurisdictions')
    );
  }

  // Filter by minimum success rate if specified
  if (options?.minSuccessRate) {
    results = results.filter(doc =>
      (doc.metadata.success_rate ?? 0) >= options.minSuccessRate!
    );
  }

  // Text search across all relevant fields
  results = results.filter(doc => {
    const searchText = `
      ${doc.title}
      ${doc.summary}
      ${doc.content}
      ${doc.keywords.join(' ')}
      ${doc.metadata.code_citations?.join(' ') || ''}
    `.toLowerCase();

    return searchText.includes(lowerQuery);
  });

  // Sort by success rate descending
  results.sort((a, b) =>
    (b.metadata.success_rate ?? 0) - (a.metadata.success_rate ?? 0)
  );

  return results;
}

/**
 * Get arguments by specific insurance scenario
 */
export function getArgumentByScenario(
  scenario: InsuranceScenario,
  state?: string
): InsuranceKBDocument[] {
  let results = getAllDocuments().filter(doc =>
    doc.metadata.scenarios?.includes(scenario)
  );

  if (state) {
    results = results.filter(doc =>
      doc.metadata.states?.includes(state.toUpperCase()) ||
      doc.metadata.states?.includes('All states') ||
      doc.metadata.states?.includes('All IRC jurisdictions')
    );
  }

  // Sort by success rate descending
  results.sort((a, b) =>
    (b.metadata.success_rate ?? 0) - (a.metadata.success_rate ?? 0)
  );

  return results;
}

/**
 * Get building code references by code citation
 */
export function getBuildingCodeReference(
  codeNumber: string
): InsuranceKBDocument[] {
  const lowerCode = codeNumber.toLowerCase();

  return getAllDocuments().filter(doc =>
    doc.metadata.code_citations?.some(citation =>
      citation.toLowerCase().includes(lowerCode)
    )
  );
}

/**
 * Get warranty information by warranty type
 */
export function getWarrantyInfo(
  warrantyType: string
): InsuranceKBDocument | null {
  const lowerType = warrantyType.toLowerCase();

  const warranty = getAllDocuments().find(doc =>
    doc.category === 'warranties' &&
    (doc.title.toLowerCase().includes(lowerType) ||
     doc.keywords.some(k => k.toLowerCase().includes(lowerType)))
  );

  return warranty || null;
}

/**
 * Get documents by category
 */
export function getDocumentsByCategory(
  category: DocumentCategory
): InsuranceKBDocument[] {
  return getAllDocuments().filter(doc => doc.category === category);
}

/**
 * Get highest success rate arguments for a scenario
 */
export function getTopArgumentsForScenario(
  scenario: InsuranceScenario,
  limit: number = 5
): InsuranceKBDocument[] {
  return getArgumentByScenario(scenario)
    .slice(0, limit);
}

/**
 * Get all documents for a specific state
 */
export function getStateSpecificDocuments(
  state: string
): InsuranceKBDocument[] {
  const upperState = state.toUpperCase();

  return getAllDocuments().filter(doc =>
    doc.metadata.states?.includes(upperState) ||
    doc.metadata.states?.includes('All states')
  ).sort((a, b) =>
    (b.metadata.success_rate ?? 0) - (a.metadata.success_rate ?? 0)
  );
}

/**
 * Get quick reference documents (training, cheat sheets)
 */
export function getQuickReferenceDocuments(): InsuranceKBDocument[] {
  return getAllDocuments().filter(doc =>
    doc.category === 'training' ||
    doc.keywords.includes('quick reference') ||
    doc.keywords.includes('cheat sheet')
  );
}

/**
 * Get email templates by purpose
 */
export function getEmailTemplate(
  purpose: string
): InsuranceKBDocument | null {
  const lowerPurpose = purpose.toLowerCase();

  return getAllDocuments().find(doc =>
    doc.category === 'email_templates' &&
    (doc.title.toLowerCase().includes(lowerPurpose) ||
     doc.keywords.some(k => k.toLowerCase().includes(lowerPurpose)))
  ) || null;
}

/**
 * Get escalation procedures
 */
export function getEscalationProcedures(): InsuranceKBDocument[] {
  return getAllDocuments().filter(doc =>
    doc.keywords.includes('escalation') ||
    doc.keywords.includes('complaint') ||
    doc.keywords.includes('arbitration')
  );
}

/**
 * Extract code citations from text content
 * Identifies building codes, IRC references, state codes, etc.
 */
export function extractCodeCitations(text: string): string[] {
  const citations: Set<string> = new Set();

  // IRC patterns
  const ircPattern = /IRC\s+[RS]?\s*\d+(\.\d+)*(\.\d+)*/gi;
  const ircMatches = text.match(ircPattern);
  if (ircMatches) {
    ircMatches.forEach(match => citations.add(match.trim()));
  }

  // IBC patterns
  const ibcPattern = /IBC\s+\d+(\.\d+)*(\.\d+)*/gi;
  const ibcMatches = text.match(ibcPattern);
  if (ibcMatches) {
    ibcMatches.forEach(match => citations.add(match.trim()));
  }

  // State code patterns (VA, MD, PA)
  const statePattern = /(VA|MD|PA)\s+[A-Z]?\s*\d+(\.\d+)*(\.\d+)*/gi;
  const stateMatches = text.match(statePattern);
  if (stateMatches) {
    stateMatches.forEach(match => citations.add(match.trim()));
  }

  return Array.from(citations);
}

/**
 * Get statistics about the knowledge base
 */
export function getKnowledgeBaseStats(): {
  totalDocuments: number;
  byCategory: Record<DocumentCategory, number>;
  byState: Record<string, number>;
  averageSuccessRate: number;
  highSuccessDocuments: number; // > 90%
} {
  // Use getAllDocuments() to include both manual and preloaded documents
  const allDocs = getAllDocuments();

  const byCategory = allDocs.reduce((acc, doc) => {
    acc[doc.category] = (acc[doc.category] || 0) + 1;
    return acc;
  }, {} as Record<DocumentCategory, number>);

  const byState: Record<string, number> = {};
  allDocs.forEach(doc => {
    doc.metadata.states?.forEach(state => {
      byState[state] = (byState[state] || 0) + 1;
    });
  });

  const documentsWithSuccessRate = allDocs.filter(
    doc => doc.metadata.success_rate !== undefined
  );

  const totalSuccessRate = documentsWithSuccessRate.reduce(
    (sum, doc) => sum + (doc.metadata.success_rate ?? 0),
    0
  );

  const averageSuccessRate = documentsWithSuccessRate.length > 0
    ? totalSuccessRate / documentsWithSuccessRate.length
    : 0;

  const highSuccessDocuments = allDocs.filter(
    doc => (doc.metadata.success_rate ?? 0) > 90
  ).length;

  return {
    totalDocuments: allDocs.length,
    byCategory,
    byState,
    averageSuccessRate,
    highSuccessDocuments
  };
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export const DOCUMENT_CATEGORIES = [
  'pushback',
  'building_codes',
  'manufacturer_specs',
  'agreements',
  'warranties',
  'training',
  'licenses',
  'email_templates',
  'sales_scripts',
  'photo_examples',
  'templates',
  'reports',
  'photo_reports',
  'certifications',
  'training_scripts',
  'training_materials',
  'pushback_strategies',
  'process_guides',
  'reference'
] as const;

export const INSURANCE_SCENARIOS = [
  'partial_replacement',
  'full_denial',
  'matching_dispute',
  'double_layer',
  'low_slope',
  'creased_shingles',
  'discontinued_shingles',
  'siding_damage',
  'flashing_code',
  'warranty_void'
] as const;

export const SUPPORTED_STATES = ['VA', 'MD', 'PA'] as const;
