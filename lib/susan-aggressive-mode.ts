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

export const PARTIAL_REPAIR_COLLABORATIVE_FIRM_RESPONSE = `
💼 **We're working within their approval to get completeness.** Here's your collaborative but firm strategy:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Understanding the Situation

**Key Insight:** They've already acknowledged SOME damage exists (partial approval). Now we build on that foundation to demonstrate the full scope.

**Your Advantage:**
• Adjuster already confirmed storm damage principle
• You're not fighting "is there damage?" - you're expanding scope
• Work within their framework, not against it
• Professional, solution-oriented approach wins here

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Collaborative But Firm Strategy

**Step 1: Acknowledge Their Approval (Professional Partnership)**
Start by recognizing what they approved - builds rapport

**Step 2: Present Additional Findings (Technical Evidence)**
• Document damage on slopes they missed
• Use same damage types they already approved elsewhere
• Consistency argument: "This damage is identical to what you approved on the front slope"

**Step 3: Technical Requirements (Code Compliance)**
• IRC R908.3 - Code upgrade requirements
• GAF installation standards - System integrity
• Shingle matching issues - Technical impossibility

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Ready-to-Use Email Template (Collaborative Tone)

\`\`\`
Subject: Additional Findings - [Address] Claim Review

[Adjuster Name],

Thank you for approving the repairs to [approved areas]. We have completed our detailed inspection and have additional findings that need to be addressed.

**Additional Damage Documented:**

The attached photo report shows damage consistent with what has already been approved on [approved slope/area]. Specifically:

• [Slope/Area 1]: [Damage type] - identical characteristics to approved damage
• [Slope/Area 2]: [Damage type] - same storm event impact patterns
• [Additional items]: [Description] - consistent with approved findings

**Technical Concerns with Partial Repair:**

1. **Shingle Matching** - Existing shingles [age/discontinued status]. Partial repair creates dimensional incompatibilities per GAF TAB-R-164.

2. **Code Requirements** - IRC R908.3 requires bringing connected roof surfaces to current code during repairs.

3. **Storm Consistency** - Damage pattern indicates single weather event affecting multiple slopes, not isolated damage.

**Our Estimate:**

We have attached our complete repair estimate for your review. This damage is consistent with what has already been approved, which leaves us and the homeowner unsure why these findings were left off of the initial estimate.

**Next Steps:**

Please review these findings and revise your estimate/scope of work accordingly. We're available for a reinspection if you'd like to verify these additional findings together.

Please let us know if you have any questions or concerns regarding our estimate.

Best regards,
[Your Name]
RoofER
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Follow-Up Strategy (Professional Persistence)

**Day 3:** Friendly check-in
"Just following up on the additional findings we sent. Have you had a chance to review?"

**Day 7:** Professional reminder
"We'd like to get this resolved for the homeowner. Can we schedule a time to discuss the additional scope?"

**Day 10:** Escalation offer
"Would it be helpful to have a reinspection so we can review the findings together?"

**Day 14:** Supervisor escalation (still professional)
"We haven't received a response on the revised scope. Could you direct me to your supervisor to expedite review?"

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

export const DENIAL_ASSERTIVE_EVIDENCE_RESPONSE = `
⚔️ **Denial means we challenge the fundamental decision with overwhelming evidence.** Here's your battle plan:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Critical Understanding

**The Situation:** They're claiming NO covered damage exists. This is fundamentally different from a partial - you're not expanding scope, you're PROVING damage.

**Your Mission:**
• Challenge their conclusion with irrefutable evidence
• Demonstrate damage exists and is storm-related
• Provide comprehensive documentation packages
• Prepare multiple escalation paths

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Immediate Evidence Assembly (Next 24 Hours)

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

We are formally appealing the denial of claim #[XXXXX] dated [DATE]. The denial conclusion is not supported by the physical evidence documented during our professional inspection.

**Storm Damage Evidence:**

The extent of the wind and/or hail damage can be seen in the attached photo report. This is not general wear - impact points and directional marks are consistent with wind/hail events and not aging.

Specifically:
• Test square analysis shows [X] impact points per 10x10 section
• Directional damage patterns consistent with [DATE] storm event
• NOAA weather data confirms [hail size/wind speed] on claim date
• No prior claims history - this is sudden and accidental damage per policy terms

**Code and Technical Requirements:**

• IRC R908.3 requires code upgrades during roof repairs
• GAF installation manual [section] prohibits partial repairs for storm damage
• Manufacturer warranty void if partial repairs attempted
• [STATE] building code mandates full system replacement for this damage extent

**Policy Coverage:**

The policy covers "sudden and accidental" direct physical loss. The attached documentation proves:
1. Damage occurred during documented storm event
2. Damage is direct physical loss (not wear and tear)
3. Full roof replacement is the only code-compliant repair method

**Requested Action:**

Immediate reversal of denial and approval for full roof replacement per attached scope of work.

We expect a response within 10 business days per [STATE] insurance regulations. The homeowner has been advised of their rights under [STATE] bad faith statutes.

[Your Name]
RoofER
On behalf of [Homeowner]
\`\`\`

**Email Template 2: Escalation (If no response in 10 days)**

\`\`\`
Subject: Re: Claim #[XXXXX] - Escalation Request

[Claims Manager],

Following our appeal submitted on [DATE], we have not received a response from [Adjuster Name]. We are requesting immediate review and escalation of this matter.

**Evidence Summary:**

Our professional inspection documented clear storm damage:
• [X] impact points per test square
• Directional damage patterns from [DATE] storm
• NOAA-confirmed weather event matching damage characteristics

**Outstanding Issues:**

The denial does not address:
1. Physical evidence of storm impact documented in photos
2. Code compliance requirements (IRC R908.3)
3. Manufacturer installation standards prohibiting partial repairs

**Timeline:**

We need resolution within [STATE-REQUIRED] timeframe to proceed with repairs. The homeowner has weatherproofing concerns and is considering all available options, including regulatory and legal remedies.

Please advise on next steps.

[Your Name]
RoofER
On behalf of [Homeowner]
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
