/**
 * Offline Knowledge Base
 * Provides static answers when no internet connection is available
 */

export interface KnowledgeEntry {
  keywords: string[];
  answer: string;
  category: string;
}

export const offlineKnowledge: KnowledgeEntry[] = [
  {
    keywords: ['double layer', 'two layer', 'double roof', 'two roofs'],
    category: 'Building Codes',
    answer: `DOUBLE LAYER REPLACEMENT REQUIREMENTS:

Per IRC Section R908.3 (VA/MD/PA):
"Roof replacement shall include the removal of ALL existing layers of roof coverings down to the roof deck."

IRC Section 1511.3.1.1 - Critical Exception:
Roof recover is PROHIBITED when TWO OR MORE layers already exist. This means:
- Double-layer roofs CANNOT be recovered
- Double-layer roofs CANNOT be repaired by overlay
- The ONLY legal option is FULL REPLACEMENT with complete tear-off

Your Legal Argument:
"Building code explicitly prohibits roof recover on double-layer roofs. Section 1511.3.1.1 states roof recover is not permitted where existing roof has two or more applications. Therefore, partial replacement is not code-compliant and full tear-off is required."

Cite: IRC R908.3, IRC 1511.3.1.1`
  },
  {
    keywords: ['low slope', 'flat roof', 'slope', '2:12', 'pitch'],
    category: 'Building Codes',
    answer: `LOW SLOPE / FLAT ROOF REQUIREMENTS:

Virginia Residential Code R905.2.2:
"Asphalt shingles shall be used only on roof slopes of two units vertical in 12 units horizontal (17-percent slope) or greater."

This means:
- Minimum slope: 2:12 (2 inches of rise per 12 inches of run)
- Slopes below 2:12 require different roofing materials (TPO, EPDM, etc.)
- Shingles on low-slope roofs violate building code

Your Legal Argument:
"The existing roof slope is below 2:12 minimum required for asphalt shingles. Per R905.2.2, shingles are prohibited on this slope. The roof must be replaced with appropriate low-slope roofing system."

Cite: Virginia Residential Code R905.2.2`
  },
  {
    keywords: ['matching', 'match', 'color match', 'discontinued', 'unavailable'],
    category: 'Maryland Law',
    answer: `MARYLAND MATCHING REQUIREMENTS:

Maryland Insurance Administration Bulletin 18-23:
"When replacing roofing materials, the insurer shall replace the damaged roofing materials with materials of like kind and quality."

Maryland Code § 27-303 (Unfair Claim Settlement Practices):
Failing to match materials is an unfair settlement practice with penalties up to $2,500 per violation.

Your Legal Argument:
"Maryland law requires matching 'like kind and quality.' Since the damaged shingles are discontinued and unavailable, the insurer must replace the entire visible roof section to maintain uniformity as required by Bulletin 18-23."

Key Points:
- Color matching is REQUIRED by MD law
- Discontinued shingles = full section replacement
- Mismatched roof violates state bulletin

Cite: MD Bulletin 18-23, MD Code § 27-303`
  },
  {
    keywords: ['gaf', 'creased', 'warranty', 'manufacturer', 'storm damage'],
    category: 'GAF Guidelines',
    answer: `GAF MANUFACTURER REQUIREMENTS:

GAF Storm Damage Guidelines:
"Creased shingles have lost their sealant bond and cannot be repaired. Wind-lifted shingles that have been creased must be replaced."

Key GAF Principles:
1. Creasing = functional damage (not cosmetic)
2. Creased shingles lose wind resistance
3. Repairs void warranty
4. Replacement required for warranty compliance

Your Legal Argument:
"GAF manufacturer guidelines state creased shingles cannot be repaired and must be replaced. Attempting repair would void the warranty and leave the homeowner without manufacturer coverage."

What This Means:
- Creasing is NOT a cosmetic issue
- Repairs will VOID the warranty
- Only replacement maintains coverage
- Insurance must approve replacement to keep homeowner protected

Cite: GAF Storm Damage Assessment Guide`
  },
  {
    keywords: ['storm date', 'wrong date', 'date verification', 'noaa', 'weather'],
    category: 'Claim Documentation',
    answer: `STORM DATE VERIFICATION:

If adjuster claims wrong storm date:

1. Obtain Official Weather Records:
   - NOAA Storm Events Database (https://www.ncdc.noaa.gov/stormevents/)
   - National Weather Service reports
   - Local meteorological data

2. Document Evidence:
   - Photos with timestamps
   - Neighbor claims from same date
   - Emergency services reports
   - News coverage of storm

3. Legal Response:
   "The storm date of [your date] is verified by NOAA Storm Events Database. Our client has documented evidence including timestamped photos and neighbor claims. The adjuster's assertion of a different date is contradicted by official meteorological records."

Request:
- Formal reinspection
- Review of all evidence
- Escalation to claims supervisor

NOAA Database: Essential tool for proving storm dates with official government records.`
  },
  {
    keywords: ['pushback', 'denial', 'adjuster', 'fight', 'dispute'],
    category: 'Claim Strategy',
    answer: `HANDLING PUSHBACK & DENIALS:

When you get pushback from adjusters:

1. DOCUMENT EVERYTHING:
   - Write down exactly what they said and when
   - Save all emails and letters
   - Take notes during phone calls

2. IDENTIFY THE PUSHBACK TYPE:
   - "Damage is repairable" → Use GAF guidelines + building codes
   - "No matching required" → Cite Maryland Bulletin 18-23
   - "Scope too broad" → Reference manufacturer requirements

3. ESCALATION PATH:
   - Teammates → Second opinion
   - Team Leader → Professional escalation
   - Sales Manager → Complex disputes
   - Arbitration/Complaint → Force neutral review

4. STAY PROFESSIONAL:
   - Never get emotional or argumentative
   - Cite specific codes, laws, and guidelines
   - Focus on facts and documentation

Key Mindset: Pushback means they're worried about paying - that's actually a good sign your claim has merit!`
  },
  {
    keywords: ['insurance companies', 'carrier', 'contact', 'phone number', 'responsive'],
    category: 'Insurance Info',
    answer: `INSURANCE COMPANY INFORMATION:

I have comprehensive data on 49+ major insurance companies including:
- Contact phone numbers and emails
- Mobile app names and portal URLs
- Best call times to minimize hold
- Responsiveness scores (1-10)
- Known issues and workarounds

Top 5 Most Responsive:
1. Amica (Score: 10/10) - 2 min avg hold
2. USAA (Score: 10/10) - 2 min avg hold
3. State Farm (Score: 9/10) - 2 min avg hold
4. Erie Insurance (Score: 9/10) - 2 min avg hold
5. Farmers of Salem (Score: 9/10) - 3 min avg hold

Top 5 Most Problematic:
1. Liberty Mutual (Score: 1/10) - 15+ min hold
2. SWBC Insurance (Score: 1/10) - 20+ min hold
3. Universal Property (Score: 2/10) - 15 min hold
4. Philadelphia Contributionship (Score: 2/10) - 10 min hold
5. Lemonade (Score: 3/10) - App only

For specific company info, ask: "Tell me about [Company Name]"`
  },
  {
    keywords: ['full approval', 'approved', 'got approval', 'claim approved'],
    category: 'Closing Scripts',
    answer: `FULL APPROVAL PHONE CALL SCRIPT:

When you get full approval, use this script:

📞 STEP 1: CONGRATULATE & CONFIRM
"Great news! [Insurance Company] fully approved your claim for $[AMOUNT]."
Confirm this matches their expectations.

💰 STEP 2: EXPLAIN PAYMENT STRUCTURE
"You'll receive $[ACV] (Actual Cash Value) to start, then $[DEPRECIATION]
after completion. Your $[DEDUCTIBLE] deductible is subtracted from first check."

📅 STEP 3: SCHEDULE IMMEDIATELY
"Let me get you on our schedule. Next available: [DATE].
Project takes approximately [DURATION] to complete."

📝 STEP 4: CONTRACT & DEPOSIT (CRITICAL!)
"I'll send the contract today. We need $[DEPOSIT] to secure your spot.
Payment via check, credit card, or bank transfer."

📄 STEP 5: DOCUMENTS NEEDED
"Please send: (1) Signed contract, (2) Copy of insurance check (both sides),
(3) Proof of homeownership. Deadline: [DATE]"

✅ STEP 6: SET EXPECTATIONS
Walk through: installation process, material selections, HOA requirements,
timeline, and completion date.

🤝 STEP 7: CLOSE & COMMIT
"Any questions? Can I count on you moving forward with The Roof Docs?"
Get verbal commitment. Confirm next steps.

⚠️ FOLLOW UP: If no signature same day, call/text immediately!`
  }
];

export function findOfflineAnswer(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  // Search through knowledge base
  for (const entry of offlineKnowledge) {
    // Check if any keywords match
    const hasMatch = entry.keywords.some(keyword =>
      lowerQuery.includes(keyword.toLowerCase())
    );

    if (hasMatch) {
      return entry.answer;
    }
  }

  return null;
}

export function getOfflineWelcomeMessage(): string {
  return `🔌 SUSAN AI - OFFLINE MODE

I'm currently operating offline with limited capabilities. I can help with:

📚 Available Topics:
• Building Codes - Double layer, low slope, flashing requirements
• GAF Requirements - Storm damage guidelines, warranty rules
• Maryland Law - Matching requirements, Bulletin 18-23
• Insurance Companies - Contact info for 49+ major insurers
• Claim Strategy - Pushback handling, denials, escalation
• Storm Documentation - Date verification, NOAA database
• Closing Scripts - Full approval phone scripts

💡 Try asking:
• "What are the double layer requirements?"
• "What does GAF say about creased shingles?"
• "What is Maryland's matching requirement?"
• "How do I handle pushback?"
• "Which insurance companies are most responsive?"

🌐 For full AI capabilities, reconnect to internet.`;
}
