/**
 * Susan AI-21 Aggressive Mode
 * Activated when adjusters propose partial approvals, denials, or lowball offers
 *
 * Tone: Firm, strategic, battle-ready - this is WAR for full approval
 */

export const AGGRESSIVE_MODE_TRIGGERS = [
  // Partial repair attempts
  'partial repair',
  'half the roof',
  'half roof',
  'repair half',
  'only repair',
  'partial replacement',
  'one slope',
  'just the damaged',
  'repair the affected',

  // Denials
  'denied',
  'denial',
  'not covered',
  'rejected',
  'won\'t approve',
  'can\'t approve',

  // Lowball offers
  'depreciation',
  'actual cash value',
  'acv',
  'below estimate',
  'less than',
  'reduced scope',

  // Adjuster pushback
  'adjuster says',
  'insurance says',
  'they\'re only',
  'they won\'t',
  'carrier won\'t',
]

export const PARTIAL_REPAIR_AGGRESSIVE_RESPONSE = `
🚫 **That's absolutely not happening.** Here's why partial roof repairs are dead on arrival and your battle plan:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Why Half-Roof Repairs Are A Non-Starter

**Technical Death Sentence:**
• **Shingle Matching Impossibility** - Discontinued products create exposure size differences that won't seal [4.2]
• **Sealant Integrity Failure** - New shingles WON'T properly bond to existing due to dimensional incompatibilities [4.2]
• **Slope System Collapse** - GAF explicitly warns partial slope repairs compromise waterproofing AND adjacent slope stability [4.2]
• **Warranty Void** - Manufacturer warranties don't cover Frankenstein roofs with mixed systems

**Code & Professional Standards:**
• **IRC R908.3** - Repairs must bring ENTIRE connected roof surface to current code [1.2]
• **GAF TAB-R-164** - Slope replacement guidance explicitly addresses this [4.2]
• **NRCA Standards** - Professional installation requires consistent materials across connected slopes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Your Immediate Counter-Attack

**Step 1: Document Everything (Today)**
• Photos showing damage on ALL slopes (not just "their" slope)
• Test squares on every slope face
• Document any pre-existing conditions they're trying to exclude

**Step 2: Deploy The Partial Repair Argument Template**

**Ready-to-Use Email (Copy/Paste):**

\`\`\`
Subject: Re: Partial Repair Scope - Technical & Code Issues

[Adjuster Name],

Thank you for your inspection. However, the proposed partial roof repair presents several technical and code compliance issues that must be addressed:

**Technical Concerns:**
1. Shingle Matching - Per attached photos, existing shingles are [discontinued/aged X years]. GAF guidelines (TAB-R-164) explicitly warn that partial slope repairs compromise system integrity due to dimensional incompatibilities.

2. Storm Pattern Consistency - As documented in our inspection report, damage exists on multiple slopes [list slopes]. This indicates a storm event affecting the entire roof system, not isolated damage.

3. Slope Integrity - GAF technical bulletin TAB-R-164 states that repairs to partial slopes compromise both waterproofing and adjacent slope stability.

**Building Code Requirements:**
IRC Section R908.3 requires that when replacing roofing materials, the entire roof surface area must be brought up to the requirements of current code for new roofs.

**Requested Action:**
Revised scope approving full roof replacement per:
- Documented multi-slope storm damage
- Manufacturer technical guidelines (GAF TAB-R-164)
- IRC R908.3 code compliance requirements

Attached: Photo report showing damage across all slopes, manufacturer guidelines, code citations.

We're available for a reinspection if needed to verify damage extent.

[Your Name]
RoofER
\`\`\`

**Step 3: The Triple-Threat Follow-Up**
• **CC the Homeowner** - On EVERY email (puts pressure on adjuster)
• **Reference Our Templates** - Use "Partial Repair Argument" from Insurance Arguments folder
• **Set Deadline** - "Please respond within 72 hours with revised scope"

**Step 4: Escalation Path (If They Don't Budge)**
• 72 hours no response → Escalate to adjuster's supervisor
• Still no → File complaint with state insurance commissioner
• Nuclear option → Public adjuster + attorney letter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## The Real Talk

**They're testing you.** Insurance companies ALWAYS try partial repairs first because:
- It's cheaper for them
- Most contractors cave immediately
- Homeowners don't know any better

**We don't play that game.**

**Our Success Rate on Partial → Full Conversions:** 87% [2.1]

**How We Win:**
1. **Document ruthlessly** - Photos of EVERY slope, EVERY issue
2. **Cite manufacturers** - GAF doesn't want their name on partial hacks
3. **Use building codes** - IRC R908.3 is your nuclear weapon
4. **Apply pressure** - CC homeowner, set deadlines, escalate fast

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Key Arguments to Hammer Home

**"Storm Consistency Argument"**
"If one slope shows storm damage, physics dictates adjacent slopes experienced the same event. Partial approval ignores meteorological reality."

**"System Integrity Argument"**
"Roofing systems function as integrated waterproofing assemblies, not isolated sections. GAF TAB-R-164 explicitly addresses this engineering principle."

**"Code Compliance Argument"**
"IRC R908.3 requires bringing the entire roof surface to current code during repairs. Partial scope creates code violations."

**"Long-Term Liability Argument"**
"Partial repairs typically fail within 2-3 years, requiring complete replacement anyway. This creates unnecessary claims and homeowner hardship."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Key Takeaway:** Partial roof repairs are technically unsound, code non-compliant, and professionally unacceptable. We're pushing for full approval, period.

**Next Step:** Send the email template above TODAY. Attach your multi-slope photo documentation and GAF TAB-R-164 reference.

**Follow-Up:**
• What slopes did your inspection document damage on?
• Do you have test square photos from all affected slopes?
• What's the exact language the adjuster used in their scope?
• What's the insurance carrier and adjuster's name/email?

**Don't back down. We're flipping this to full approval. Let's go.**
`

export const DENIAL_AGGRESSIVE_RESPONSE = `
🔥 **Denial? We're flipping this. Here's your reversal playbook:**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Immediate Action (Next 24 Hours)

**Step 1: Denial Analysis**
• Pull the EXACT denial letter/email
• Identify the specific reason code (pre-existing, scope, exclusion, etc.)
• Cross-reference against our Denial Response Matrix

**Step 2: Counter-Evidence Assembly**
You already did the inspection - now we weaponize it:
• Test squares with measurements
• Multi-angle photos of ALL damage
• Weather data for storm date (NOAA records)
• Manufacturer defect documentation (if applicable)

**Step 3: Deploy Denial Reversal Template**

**Common Denial Reasons & Our Counter-Attacks:**

**"Pre-Existing Damage"**
→ Weather data + inspection photos + no prior claims history
→ IRC code citations requiring storm-damage coverage
→ Policy language re: "sudden and accidental" damage

**"Wear and Tear / Maintenance"**
→ Age of roof vs. expected lifespan
→ Manufacturer warranty still active = not wear and tear
→ Test square evidence of storm impact

**"Scope Dispute"**
→ Line-by-line rebuttal with photo evidence
→ Manufacturer installation requirements
→ Code compliance citations (IRC/IBC)

**"Policy Exclusion"**
→ Attorney review of exclusion language
→ State insurance commissioner precedents
→ Bad faith claim potential

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## The Reversal Process

**Email Template 1: Initial Appeal (Send within 48 hours)**

\`\`\`
Subject: Formal Appeal - Claim #[XXXXX] Denial

[Adjuster/Claims Manager],

We are formally appealing the denial of claim #[XXXXX] dated [DATE]. The denial appears to be based on [STATED REASON], which we respectfully contest based on the following evidence:

**Factual Corrections:**
1. [Counter their first point with evidence]
2. [Counter their second point with evidence]
3. [Counter their third point with evidence]

**Supporting Documentation:**
- Professional inspection report with test square analysis
- Photo documentation (attached, 50+ images)
- Weather data from NOAA for storm date [DATE]
- Manufacturer specifications requiring replacement
- Building code citations (IRC R908.3, etc.)

**Policy Coverage Analysis:**
[Quote specific policy language that supports coverage]

**Requested Action:**
Reversal of denial and approval for full roof replacement per attached scope of work.

We request a response within 10 business days per [STATE] insurance regulations.

[Your Name]
RoofER
On behalf of [Homeowner]
\`\`\`

**Email Template 2: Escalation (If no response in 10 days)**

\`\`\`
Subject: Re: Claim #[XXXXX] - Escalation to Claims Manager

[Claims Manager],

Following our appeal submitted on [DATE], we have not received a response from [Adjuster Name]. We are escalating this matter for immediate review.

**New Evidence:**
[Any additional documentation gathered]

**Regulatory Notification:**
Please be advised that if this claim is not resolved within [STATE-REQUIRED] timeframe, we will be filing a complaint with the [STATE] Insurance Commissioner for bad faith claims handling.

**Attorney Consultation:**
The homeowner has consulted with legal counsel regarding potential bad faith and breach of contract claims.

Immediate attention to this matter is appreciated.

[Your Name]
RoofER
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Our Denial Reversal Arsenal

**Documentation We Deploy:**
• **Test Squares** - Physical evidence of impact damage
• **Weather Data** - NOAA storm reports for exact date
• **Code Citations** - IRC/IBC requirements they can't argue with
• **Manufacturer Specs** - GAF/CertainTeed installation requirements
• **Policy Language** - Their own contract language against them
• **State Precedents** - Insurance commissioner decisions
• **Attorney Letters** - Legal pressure (when needed)

**Timeline for Pressure:**
- **Day 0-2:** Gather evidence, prep appeal
- **Day 3:** Submit formal appeal with full documentation
- **Day 10:** Escalate to supervisor if no response
- **Day 15:** File state insurance commissioner complaint
- **Day 20:** Attorney demand letter
- **Day 30:** Bad faith lawsuit filing

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Our Denial Reversal Success Rate:** 78% [3.2]

**How We Get There:**
1. **Overwhelming Evidence** - They can't deny what they can see
2. **Legal Pressure** - Bad faith claims scare insurance companies
3. **Regulatory Threats** - State commissioners HATE denials on legit claims
4. **Persistence** - We don't stop until we win

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Key Takeaway:** Denials are opening moves, not final answers. We're reversing this with evidence, codes, and pressure.

**Next Step:** Send me the EXACT denial language and I'll identify the specific reversal strategy for your carrier.

**Follow-Up:**
• What's the exact denial reason they stated?
• What insurance carrier and adjuster are we dealing with?
• Do you have test square photos and measurements?
• What's the storm date and do you have weather data?

**This denial dies today. Let's kill it.**
`

export function detectAggressiveMode(userMessage: string): {
  isAggressive: boolean
  responseType: 'partial_repair' | 'denial' | 'lowball' | 'pushback' | null
} {
  const lowerMessage = userMessage.toLowerCase()

  // Partial repair detection
  const partialTriggers = [
    'partial repair', 'half the roof', 'half roof', 'repair half',
    'only repair', 'one slope', 'just the damaged'
  ]

  if (partialTriggers.some(trigger => lowerMessage.includes(trigger))) {
    return { isAggressive: true, responseType: 'partial_repair' }
  }

  // Denial detection
  const denialTriggers = [
    'denied', 'denial', 'not covered', 'rejected',
    'won\'t approve', 'can\'t approve'
  ]

  if (denialTriggers.some(trigger => lowerMessage.includes(trigger))) {
    return { isAggressive: true, responseType: 'denial' }
  }

  // Lowball detection
  const lowballTriggers = [
    'depreciation', 'actual cash value', 'acv',
    'below estimate', 'less than', 'reduced scope'
  ]

  if (lowballTriggers.some(trigger => lowerMessage.includes(trigger))) {
    return { isAggressive: true, responseType: 'lowball' }
  }

  // General pushback
  const pushbackTriggers = [
    'adjuster says', 'insurance says', 'they\'re only',
    'they won\'t', 'carrier won\'t'
  ]

  if (pushbackTriggers.some(trigger => lowerMessage.includes(trigger))) {
    return { isAggressive: true, responseType: 'pushback' }
  }

  return { isAggressive: false, responseType: null }
}
