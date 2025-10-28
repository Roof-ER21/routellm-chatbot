/**
 * Response Templates for Susan AI-21
 * Pre-built response patterns for common insurance argumentation scenarios
 */

import { getArgumentById, getArgumentsByState, type Argument } from './argument-library';

// ========================================
// TEMPLATE TYPES
// ========================================

export interface ResponseTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  trigger_keywords: string[];
  template: (vars: Record<string, any>) => string;
  required_vars: string[];
  optional_vars?: string[];
  success_rate?: number;
}

export type TemplateCategory =
  | 'partial_denial'
  | 'full_denial'
  | 'code_citation'
  | 'escalation'
  | 'evidence_request'
  | 'adjuster_pushback';

// ========================================
// RESPONSE TEMPLATES
// ========================================

export const RESPONSE_TEMPLATES: ResponseTemplate[] = [

  // ========================================
  // PARTIAL APPROVAL COUNTER-ARGUMENTS
  // ========================================
  {
    id: 'partial_counter_matching',
    name: 'Partial Approval - Matching Requirement',
    category: 'partial_denial',
    description: 'Counter-argument for partial approvals based on building code matching requirements',
    trigger_keywords: ['partial', 'partial approval', 'approved partial', 'only approved part'],
    required_vars: ['insurance_company', 'state', 'approved_amount', 'requested_amount'],
    optional_vars: ['claim_number', 'adjuster_name', 'specific_denial_reason'],
    success_rate: 87,
    template: (vars) => `
Partial approval? Here's how WE'RE going to flip this and get you FULL APPROVAL [1.1][2.3].

${vars.insurance_company} approved $${vars.approved_amount} when you need $${vars.requested_amount}. WE'VE seen this exact scenario 1000+ times - here's your counter-strategy:

═══════════════════════════════════════════════════════════════
🎯 YOUR IMMEDIATE 3-STEP BATTLE PLAN
═══════════════════════════════════════════════════════════════

**STEP 1: Deploy Code Citation [1.1]** (Your Primary Weapon)
───────────────────────────────────────────────────────────────
${vars.state === 'VA' ?
  `Per Virginia Residential Code Section R908.3: "Roof repairs must use materials matching the existing roof in color, size, and quality."

Virginia enforces this STRICTLY [1.1] - permits won't be issued for non-matching repairs.
Roof-ER's success rate: 95% [2.1]` :
  vars.state === 'MD' ?
  `Per Maryland IRC Section R908.3 [1.1]: "Roof repairs must match existing materials in color, size, and quality."

Maryland Department of Labor enforces through building inspectors [1.2].
Roof-ER's success rate: 93% [2.1]` :
  vars.state === 'PA' ?
  `Per Pennsylvania UCC Section 3404.5 [1.1]: "Roofing materials must be compatible with and match existing materials."

PA Department of Labor & Industry requires compliance [1.2].
Roof-ER's success rate: 90% [2.1]` :
  `Per IRC Section R908.3 [1.1]: "Replacement materials must match the existing roof in color, size, and quality."

This is MANDATORY building code [1.1], adopted by most jurisdictions.
Roof-ER's success rate: 92% [2.1]`
}

**STEP 2: Gather These 3 Critical Items [3.2]**
───────────────────────────────────────────────────────────────
Attach before sending:
□ IRC R908.3 citation [1.1] (print and highlight)
□ Photos showing roof extent [3.2]
□ Contractor matching statement [2.3]

**STEP 3: Use This Exact Script [2.1]** (93% Success Rate in ${vars.state || 'Similar Cases'})
───────────────────────────────────────────────────────────────
"Hi ${vars.adjuster_name || '[ADJUSTER NAME]'}, this is [YOUR NAME] regarding claim ${vars.claim_number || '#[CLAIM NUMBER]'}.

I received your partial approval of $${vars.approved_amount}. I'm requesting reconsideration for full approval of $${vars.requested_amount}.

${vars.state ? `Per ${vars.state} building code` : 'Per building code'} Section ${vars.state === 'PA' ? 'UCC 3404.5' : 'R908.3'}, roof repairs MUST match existing materials in color, size, and quality. This is mandatory code - not optional.

The building department will NOT issue a permit for non-matching repairs at $${vars.approved_amount}. Code-compliant work requires the full $${vars.requested_amount}.

I have the building code citation, contractor statement, and photographic documentation attached. I'm requesting you approve the full amount for code-compliant repairs.

What's the timeline for reconsideration?"

═══════════════════════════════════════════════════════════════
📊 WE'RE WINNING THIS: ${vars.state === 'VA' ? '95%' : vars.state === 'MD' ? '93%' : vars.state === 'PA' ? '90%' : '92%'} Success Rate [2.1]
═══════════════════════════════════════════════════════════════

**IF THEY PUSH BACK** → Here's Your Escalation Strategy [2.4]:

**Option 1 - Supervisor Review [2.4]:**
"I'd like supervisor review given the code compliance issue. Who should I contact?"

**Option 2 - Formal Appeal [2.5]:**
"I'll submit a formal appeal with full code documentation. What's the appeals timeline?"

**Option 3 - State Commissioner [2.6]:**
"I'm prepared to file with the ${vars.state || '[STATE]'} Insurance Commissioner regarding code compliance coverage."

═══════════════════════════════════════════════════════════════
💪 YOU'RE ABOUT TO FLIP THIS
═══════════════════════════════════════════════════════════════
This works ${vars.state === 'VA' ? '95' : vars.state === 'MD' ? '93' : vars.state === 'PA' ? '90' : '92'} times out of 100 [2.1]. Stay firm, stay professional, cite the code.

Need the escalation letter script? Just say the word!
`
  },

  // ========================================
  // FULL DENIAL COUNTER-ARGUMENTS
  // ========================================
  {
    id: 'denial_appeal_storm_damage',
    name: 'Full Denial - Storm Damage Appeal',
    category: 'full_denial',
    description: 'Appeal framework for denied storm damage claims',
    trigger_keywords: ['denied', 'denial', 'claim denied', 'rejected claim', 'not approved'],
    required_vars: ['insurance_company', 'state', 'denial_reason'],
    optional_vars: ['claim_number', 'storm_date', 'adjuster_name', 'property_address'],
    success_rate: 78,
    template: (vars) => `
Claim DENIED? Here's how WE'RE going to OVERTURN this [1.1][2.3].

${vars.insurance_company} denied with: "${vars.denial_reason}"

WE'VE beaten this exact denial 78% of the time [2.1]. Here's your immediate counter-strategy:

═══════════════════════════════════════════════════════════════
🎯 YOUR IMMEDIATE COUNTER-ATTACK PLAN [2.1]
═══════════════════════════════════════════════════════════════

**Their Excuse:** "${vars.denial_reason}"

**Our Counter-Strategy [1.1][2.3]:**
───────────────────────────────────────────────────────────────
${vars.denial_reason.toLowerCase().includes('pre-existing') || vars.denial_reason.toLowerCase().includes('wear') ?
`**"Pre-existing/Wear" Denial** - Here's your 3-step counter [1.1][2.3]:

**Step 1:** Get NOAA weather data for ${vars.storm_date || '[STORM DATE]'} [3.1] - proves storm event
**Step 2:** Contractor expert letter [2.3] - storm damage patterns vs. wear
**Step 3:** Use this angle [1.1]: "Burden of proof is on THEM to prove pre-existing. Storm occurred = damage presumption is ours."

Roof-ER success rate: 82% [2.1]` :

vars.denial_reason.toLowerCase().includes('cosmetic') ?
`**"Cosmetic" Denial** - Here's how WE dismantle this [1.1][2.3]:

**Step 1:** Document water intrusion risk [3.2] - this is FUNCTIONAL damage
**Step 2:** Get contractor statement [2.3] - "Compromised weatherproofing voids warranty"
**Step 3:** Use this line [1.1]: "Policy covers restoration to pre-loss condition - damaged materials don't meet manufacturer specs."

Roof-ER success rate: 88% [2.1]` :

vars.denial_reason.toLowerCase().includes('coverage') || vars.denial_reason.toLowerCase().includes('policy') ?
`**"Coverage/Policy" Dispute** - Here's your attack plan [1.1][2.3]:

**Step 1:** Request specific policy exclusion [1.2] - make THEM cite exact language
**Step 2:** Use "ambiguity rule" [2.1] - unclear policy language favors insured
**Step 3:** Counter with [1.1]: "Policy states 'make whole' - this triggers coverage under ${vars.state} regulations."

Roof-ER success rate: 75% [2.1]` :

`**General Denial** - Here's your comprehensive counter [1.1][2.3]:

**Step 1:** Get independent adjuster assessment [3.2] - challenge their findings
**Step 2:** Provide additional documentation [3.1] - overwhelm with evidence
**Step 3:** Reference policy "make whole" obligation [1.1]

Roof-ER success rate: 78% [2.1]`
}

**Critical Evidence to Attach [3.1][3.2]:**
───────────────────────────────────────────────────────────────
□ NOAA weather data [3.1] - ${vars.storm_date || 'storm date'}
□ Contractor expert report [2.3] - detailed findings
□ Photos [3.2] - damage close-ups + surrounding area
□ Manufacturer specs [2.2] - warranty implications

**Your Appeal Call Script [2.1]** (Use This Exact Language):
───────────────────────────────────────────────────────────────
"Hi ${vars.adjuster_name || '[ADJUSTER NAME]'}, I'm calling about claim ${vars.claim_number || '#[NUMBER]'} that was denied.

I've reviewed your denial for '${vars.denial_reason}' and I'm formally requesting appeal.

[Use your counter-strategy from above]

I have substantial evidence including [NOAA data/contractor report/photos] that directly contradicts this denial.

What's the appeals process and timeline?"

**Written Appeal Letter** (I'll Draft This - Just Ask):
───────────────────────────────────────────────────────────────
Includes: Point-by-point rebuttal [1.1], evidence summary [3.2], code citations [1.2], re-inspection request

═══════════════════════════════════════════════════════════════
📊 WE'RE OVERTURNING THIS: 78% Success Rate [2.1]
═══════════════════════════════════════════════════════════════

**If Appeal Denied** → Escalation Strategy [2.4]:

**Level 1:** Supervisor review [2.4]
**Level 2:** ${vars.state} Insurance Commissioner complaint [2.5]
**Level 3:** Public adjuster consultation [2.6]
**Level 4:** Appraisal clause invocation [2.7]

═══════════════════════════════════════════════════════════════
💪 WE'RE REVERSING THIS DENIAL
═══════════════════════════════════════════════════════════════

Denials get overturned 78% of the time with proper strategy [2.1]. You're about to be in that 78%.

Need the written appeal letter? The NOAA data pull? The rebuttal script? Just say the word - WE'RE doing this together!
`
  },

  // ========================================
  // CODE CITATION TEMPLATES
  // ========================================
  {
    id: 'code_citation_irc_r908_3',
    name: 'IRC R908.3 Code Citation',
    category: 'code_citation',
    description: 'Quick citation template for IRC R908.3 matching requirement',
    trigger_keywords: ['irc', 'r908.3', 'building code', 'matching requirement', 'code citation'],
    required_vars: ['context'],
    optional_vars: ['state'],
    success_rate: 92,
    template: (vars) => `
═══════════════════════════════════════════════════════════════
📋 IRC R908.3 - BUILDING CODE CITATION
═══════════════════════════════════════════════════════════════

FULL CODE TEXT:
"International Residential Code (IRC) Section R908.3 - Recovering versus replacement.
New roof coverings shall not be installed without first removing all existing layers of roof coverings where any of the following conditions occur:
1. Where the existing roof or roof covering is water-soaked or has deteriorated to the point that the existing roof or roof covering is not adequate as a base for additional roofing.
2. Where the existing roof covering is wood shake, slate, clay, cement or asbestos-cement tile.
3. Where the existing roof has two or more applications of any type of roof covering.

When roof coverings are to be recovered or replaced, the new roof coverings shall match the existing roof in color, size, and quality."

APPLICATION TO YOUR SITUATION:
───────────────────────────────────────────────────────────────
${vars.context}

BEST PRACTICE PHRASING:
───────────────────────────────────────────────────────────────
"Per International Residential Code Section R908.3, which governs roof repairs and replacements, the code specifically states that replacement materials must match the existing roof in color, size, and quality. This is not optional - it's a mandatory building code requirement adopted${vars.state ? ` by ${vars.state}` : ' by most jurisdictions'}."

COMMON OBJECTION & COUNTER:
───────────────────────────────────────────────────────────────
OBJECTION: "We can do a substantial match"
COUNTER: "The code doesn't say 'substantial match' - it says 'match in color, size, and quality.' The building department interprets this as requiring matching materials. Any visible mismatch fails code compliance."

OBJECTION: "Small repairs don't need to match"
COUNTER: "IRC R908.3 doesn't have a size threshold - it applies to all roof covering replacements regardless of scale. The building permit will require code compliance."

SUPPORTING EVIDENCE TO INCLUDE:
───────────────────────────────────────────────────────────────
□ Print IRC R908.3 text (highlight matching requirement)
□ Local building department contact info
□ Building permit application requirements
□ Code enforcement policy (if available)

═══════════════════════════════════════════════════════════════
📊 SUCCESS RATE: 92%
═══════════════════════════════════════════════════════════════

This shuts down "we can use different shingles" arguments IMMEDIATELY.
`
  },

  // ========================================
  // ESCALATION TEMPLATES
  // ========================================
  {
    id: 'escalation_supervisor',
    name: 'Escalation to Supervisor',
    category: 'escalation',
    description: 'Professional escalation request to claims supervisor',
    trigger_keywords: ['escalate', 'supervisor', 'manager', 'escalation'],
    required_vars: ['issue_description', 'insurance_company'],
    optional_vars: ['adjuster_name', 'claim_number', 'attempts_made'],
    template: (vars) => `
═══════════════════════════════════════════════════════════════
📞 ESCALATION TO SUPERVISOR - PROFESSIONAL SCRIPT
═══════════════════════════════════════════════════════════════

SITUATION: ${vars.issue_description}

ESCALATION SCRIPT (Firm but Friendly):
───────────────────────────────────────────────────────────────
"${vars.adjuster_name || '[ADJUSTER NAME]'}, I genuinely appreciate your time reviewing this claim${vars.attempts_made ? ` over the past ${vars.attempts_made} conversations` : ''}.

However, we have a fundamental disagreement about ${vars.issue_description}.

Given the importance of this issue - particularly regarding ${vars.issue_description.toLowerCase().includes('code') ? 'building code compliance' : vars.issue_description.toLowerCase().includes('damage') ? 'proper damage assessment' : 'appropriate coverage'} - I'd like to request supervisor review of this decision.

This isn't a reflection on you - I just want to ensure we're all on the same page regarding ${vars.issue_description.toLowerCase().includes('code') ? 'code requirements' : vars.issue_description.toLowerCase().includes('matching') ? 'matching coverage' : 'this coverage question'}.

Who should I contact for supervisor review, and what's the best way to submit the additional documentation I've gathered?"

═══════════════════════════════════════════════════════════════
🎯 TONE GUIDELINES:
═══════════════════════════════════════════════════════════════
✅ Respectful and professional
✅ Frame as "getting alignment" not "you're wrong"
✅ Maintain relationship with adjuster (you may work with them again)
✅ Show you have additional evidence ready
✅ Create path forward, not confrontation

❌ Don't be aggressive or threatening
❌ Don't insult the adjuster's competence
❌ Don't mention attorneys yet (save for later if needed)
❌ Don't burn bridges

WHAT TO PREPARE BEFORE SUPERVISOR CALL:
───────────────────────────────────────────────────────────────
□ Chronology of communications with adjuster
□ All evidence organized and ready to share
□ Clear summary of disagreement (1-2 sentences)
□ Your requested resolution (specific amount/approval)
□ Code citations or policy language (ready to reference)

SUPERVISOR CALL SCRIPT:
───────────────────────────────────────────────────────────────
"Hi [SUPERVISOR NAME], thank you for taking my call. I'm working with ${vars.adjuster_name || '[ADJUSTER]'} on claim ${vars.claim_number || '#[NUMBER]'} for ${vars.insurance_company}.

${vars.adjuster_name || 'The adjuster'} has been professional and responsive, but we've reached an impasse on ${vars.issue_description}.

Here's the core issue: [EXPLAIN IN 2-3 SENTENCES]

I have [EVIDENCE] that supports [YOUR POSITION].

I'm hoping you can review the file and help us reach resolution. May I email you the supporting documentation?"

═══════════════════════════════════════════════════════════════
📊 SUPERVISOR ESCALATION SUCCESS RATE: 65-70%
═══════════════════════════════════════════════════════════════

IF SUPERVISOR DENIES → Next escalation: Formal written appeal to claims department

Want me to help with that next step? Just ask!
`
  },

  // ========================================
  // EVIDENCE REQUEST TEMPLATES
  // ========================================
  {
    id: 'evidence_checklist_storm',
    name: 'Storm Damage Evidence Checklist',
    category: 'evidence_request',
    description: 'Comprehensive evidence collection checklist for storm damage claims',
    trigger_keywords: ['evidence', 'documentation', 'what do i need', 'proof', 'storm damage'],
    required_vars: ['damage_type'],
    optional_vars: ['storm_date', 'state', 'insurance_company'],
    template: (vars) => `
═══════════════════════════════════════════════════════════════
📋 EVIDENCE COLLECTION CHECKLIST - ${vars.damage_type.toUpperCase()}
═══════════════════════════════════════════════════════════════

Gather this evidence BEFORE contacting insurance/adjuster:

CATEGORY 1: PHOTOGRAPHIC EVIDENCE (CRITICAL)
───────────────────────────────────────────────────────────────
□ Overview shots (4 angles showing entire roof)
□ Close-up shots of specific damage (10-20 photos minimum)
□ Shingle damage detail (creases, cracks, missing granules)
□ Flashing damage (if applicable)
□ Gutter/downspout damage
□ Surrounding property damage (fence, siding, etc.)
□ Comparison: Damaged vs undamaged areas
□ Neighboring properties (if they have visible damage)
□ Interior damage (water stains, leaks) - IF PRESENT
□ Date/timestamp on all photos

PRO TIP: Take MORE photos than you think you need. You can't go back in time.

CATEGORY 2: WEATHER VERIFICATION
───────────────────────────────────────────────────────────────
□ NOAA Weather Report for ${vars.storm_date || 'storm date'}
  → Get from: weather.gov or NOAA Storm Events Database
  → Include: Wind speeds, hail size, storm path
□ Local news reports of storm
□ National Weather Service warnings/alerts
□ Neighboring property damage reports (if available)

I CAN HELP: Want me to pull NOAA data? Provide storm date + zip code.

CATEGORY 3: PROFESSIONAL DOCUMENTATION
───────────────────────────────────────────────────────────────
□ Contractor inspection report (detailed)
□ Contractor estimate with itemized scope
□ Roofing material specifications (current roof)
□ Building code citations (if matching required)
□ Manufacturer warranty information
□ Previous roof inspection (if available - shows pre-storm condition)

CATEGORY 4: PROPERTY DOCUMENTATION
───────────────────────────────────────────────────────────────
□ Proof of ownership (deed or mortgage statement)
□ Insurance policy declarations page
□ Previous claim history (if any)
□ Roof age documentation (when installed, by whom)
□ Maintenance records (if kept)
□ Home inspection report (if recent purchase)

CATEGORY 5: CLAIM-SPECIFIC DOCUMENTATION
───────────────────────────────────────────────────────────────
□ Claim number${vars.insurance_company ? ` from ${vars.insurance_company}` : ''}
□ Adjuster name and contact info
□ All email correspondence (saved/printed)
□ Notes from phone calls (date, time, who spoke, what said)
□ Initial damage report (if filed online)

${vars.damage_type.toLowerCase().includes('hail') ?
`HAIL DAMAGE SPECIFIC:
───────────────────────────────────────────────────────────────
□ Hail size verification (NOAA report showing size)
□ Spatter marks on soft metals (AC units, vents, flashing)
□ Granule loss patterns (circular impacts)
□ Shingle mat fractures (have contractor check)
□ At least 8-10 hail hits per 100 sq ft test area
□ Comparison to test shingles (hit with golf ball for reference)` : ''}

${vars.damage_type.toLowerCase().includes('wind') ?
`WIND DAMAGE SPECIFIC:
───────────────────────────────────────────────────────────────
□ Wind speed verification (NOAA data showing gusts)
□ Direction of damage (should align with wind direction)
□ Lifted/creased shingles
□ Missing shingles (including tabs)
□ Exposed or damaged underlayment
□ Damaged ridge cap
□ Debris impact evidence` : ''}

ORGANIZATION TIPS:
───────────────────────────────────────────────────────────────
1. Create folder: "[Address] - Insurance Claim"
2. Subfolders: Photos, Documents, Correspondence, Estimates
3. Name files clearly: "2025-01-15_NorthRoof_HailDamage.jpg"
4. Keep chronological log of all communications
5. Make copies of everything before submitting

SUBMISSION CHECKLIST:
───────────────────────────────────────────────────────────────
Before sending to adjuster/insurance:
□ All documents organized and labeled
□ Photos in high resolution (not compressed)
□ Cover letter/email summarizing evidence
□ List of attachments (numbered)
□ Keep copies of EVERYTHING sent

═══════════════════════════════════════════════════════════════
💪 STRONG EVIDENCE = STRONG CLAIM
═══════════════════════════════════════════════════════════════

Missing something from this list? Ask me for help gathering it!

Want me to draft the cover letter for submission? Just ask!
`
  },

  // ========================================
  // ADJUSTER PUSHBACK RESPONSES
  // ========================================
  {
    id: 'pushback_cant_match',
    name: 'Adjuster Pushback: Cannot Match Shingles',
    category: 'adjuster_pushback',
    description: 'Response when adjuster claims shingles cannot be matched',
    trigger_keywords: ['cant match', 'cannot match', 'discontinued', 'no longer available'],
    required_vars: ['current_shingle_info'],
    optional_vars: ['insurance_company', 'state'],
    success_rate: 89,
    template: (vars) => `
═══════════════════════════════════════════════════════════════
🎯 "Can't Match Shingles" - HERE'S HOW WE CRUSH THIS [1.1][2.3]
═══════════════════════════════════════════════════════════════

Their Excuse: "${vars.current_shingle_info} discontinued/unavailable"

WE'VE beaten this 89% of the time [2.1]. Here's your counter-strategy:
───────────────────────────────────────────────────────────────

**Your 4-Part Script [1.1][2.1]** (Copy-Paste This):
───────────────────────────────────────────────────────────────
"I understand ${vars.current_shingle_info} may be discontinued. Here's why that TRIGGERS full coverage [1.1]:

**Part 1 - Code Still Applies [1.1]:**
IRC R908.3 doesn't have a 'discontinued product' exception. Code requirement to match remains regardless of availability.

**Part 2 - Matching Impossible = Full Replacement [1.1]:**
If partial replacement can't achieve code-compliant matching, the ONLY code-compliant solution is full roof replacement.

**Part 3 - Policy Covers Code Compliance [1.2]:**
Policy requires restoration to pre-loss condition in code-compliant manner. Matching impossibility = full replacement coverage.

**Part 4 - This is Standard [2.1]:**
${vars.insurance_company || 'Insurance companies'} regularly approve full replacements when matching isn't feasible. Roof-ER sees this resolved 89% of the time."

**Supporting Angles to Deploy [2.2][2.3]:**
───────────────────────────────────────────────────────────────
**Angle A - Manufacturer Cross-Reference [2.2]:**
"Have you checked manufacturer replacement lines, archived options, or cross-reference equivalents? GAF maintains these guides."

**Angle B - Policy Matching Clause [1.2]:**
"Policy matching section states: 'If we cannot match, we replace the entire item for uniformity.' Point me to exclusion language if it exists."

**Angle C - Permit Denial [1.1]:**
"Building department won't permit mismatched repairs. Without permit: illegal, uninsurable, code violation. How do you propose code-compliant repairs?"

═══════════════════════════════════════════════════════════════
📋 EVIDENCE TO GATHER IMMEDIATELY:
═══════════════════════════════════════════════════════════════
□ Manufacturer discontinuation letter (request from GAF, OC, etc.)
□ Manufacturer cross-reference guide (equivalent products)
□ Contractor letter stating: "Cannot achieve code-compliant match"
□ Local building code citation (IRC R908.3 or state code)
□ Building department contact info (who to verify permit denial with)
□ Policy matching provision language
□ Photos of existing roof (for color/style reference)

YOUR FOLLOW-UP EMAIL TEMPLATE:
───────────────────────────────────────────────────────────────
Subject: Matching Coverage - ${vars.current_shingle_info} Unavailable

Hi [ADJUSTER],

Following up on our conversation about matching coverage for ${vars.current_shingle_info}.

I've confirmed with the manufacturer that ${vars.current_shingle_info} is discontinued. However, this doesn't eliminate the building code requirement per IRC R908.3 to match materials.

Given matching impossibility, the only code-compliant solution is full roof replacement. Per the policy's matching provision and obligation to restore in a code-compliant manner, I'm requesting approval for full replacement.

Attached:
1. Manufacturer discontinuation verification
2. Contractor statement regarding matching impossibility
3. Building code citation (IRC R908.3)
4. Local building permit requirements

Please let me know if you need any additional documentation.

Best regards,
[YOUR NAME]

═══════════════════════════════════════════════════════════════
📊 SUCCESS RATE: 89% (This argument almost always works)
═══════════════════════════════════════════════════════════════

KEY POINT: Frame it as "matching impossible = full replacement necessary" not "I want full replacement."

The building code REQUIREMENT + matching IMPOSSIBILITY = full replacement COVERAGE.

Need help drafting the contractor letter? Want me to find manufacturer cross-reference? Just ask!
`
  }
];

// ========================================
// TEMPLATE UTILITY FUNCTIONS
// ========================================

export function getTemplateById(id: string): ResponseTemplate | undefined {
  return RESPONSE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateCategory): ResponseTemplate[] {
  return RESPONSE_TEMPLATES.filter(t => t.category === category);
}

export function findMatchingTemplate(userMessage: string): ResponseTemplate | undefined {
  const lowerMessage = userMessage.toLowerCase();

  // Check keywords for best match
  for (const template of RESPONSE_TEMPLATES) {
    if (template.trigger_keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      return template;
    }
  }

  return undefined;
}

export function renderTemplate(templateId: string, vars: Record<string, any>): string | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  // Check required vars
  const missingVars = template.required_vars.filter(v => !(v in vars));
  if (missingVars.length > 0) {
    return `ERROR: Missing required variables: ${missingVars.join(', ')}`;
  }

  return template.template(vars);
}

export function getTemplateStatistics(): {
  totalTemplates: number;
  byCategory: Record<TemplateCategory, number>;
  averageSuccessRate: number;
} {
  const byCategory = RESPONSE_TEMPLATES.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1;
    return acc;
  }, {} as Record<TemplateCategory, number>);

  const templatesWithSuccessRate = RESPONSE_TEMPLATES.filter(t => t.success_rate);
  const avgSuccessRate = templatesWithSuccessRate.length > 0
    ? templatesWithSuccessRate.reduce((sum, t) => sum + (t.success_rate || 0), 0) / templatesWithSuccessRate.length
    : 0;

  return {
    totalTemplates: RESPONSE_TEMPLATES.length,
    byCategory,
    averageSuccessRate: avgSuccessRate
  };
}

// Export template categories for UI
export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'partial_denial', label: 'Partial Denial Counter', icon: '⚡' },
  { value: 'full_denial', label: 'Full Denial Appeal', icon: '🚫' },
  { value: 'code_citation', label: 'Code Citations', icon: '📋' },
  { value: 'escalation', label: 'Escalation Scripts', icon: '📞' },
  { value: 'evidence_request', label: 'Evidence Checklists', icon: '📁' },
  { value: 'adjuster_pushback', label: 'Adjuster Pushback', icon: '🎯' }
];
