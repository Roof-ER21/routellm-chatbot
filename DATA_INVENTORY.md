# DATA INVENTORY - COMPLETE LISTING

---

## 1. TEMPLATES (9 Total)

### Template 1: Post-Adjuster Meeting Email
- **ID:** `post_adjuster_meeting`
- **Purpose:** Initial follow-up after adjuster inspection
- **When to Use:** Within same day of adjuster meeting
- **Required Attachments:** Photo Report, Claim Authorization
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER, PHOTO HIGHLIGHTS

### Template 2: Partial Denial Response
- **ID:** `partial_denial_response`
- **Purpose:** Challenge partial approval when full replacement needed
- **When to Use:** When only some slopes/elevations approved
- **Required Attachments:** Photo Report, Roof-ER Estimate
- **Optional Attachments:** GAF Guidelines, iTel Report, Building Code References
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER, ARGUMENT SELECTION
- **Argument Options:** manufacturer_requirements, material_discontinuation, building_code_compliance, cost_effectiveness

### Template 3: iTel / Discontinued Product
- **ID:** `itel_discontinued`
- **Purpose:** Argue full replacement due to unavailable matching materials
- **When to Use:** When iTel report confirms discontinuation
- **Required Attachments:** iTel Report, Discontinued Shingle List, Photo Report
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER, ARGUMENT MODULE SELECTION
- **Argument Modules:**
  - No similar matches available
  - Discontinued product (supplier confirmation)
  - English vs Metric dimension incompatibility

### Template 4: GAF Guidelines
- **ID:** `gaf_guidelines`
- **Purpose:** Use manufacturer recommendations to support full replacement
- **When to Use:** When damage affects 2+ shingles per plane
- **Required Attachments:** GAF Storm Damage Guidelines (TAB-R-2011-126), Photo Report
- **Supporting Documents:**
  - GAF Storm Damage Guidelines (TAB-R-2011-126)
  - GAF Slope Replacement Bulletin (TAB-R-164, 2024)
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER

### Template 5: Siding Argument
- **ID:** `siding_argument`
- **Purpose:** Argue full siding replacement (discontinued, code, or damage)
- **When to Use:** Siding claims with partial denials
- **Required Attachments:** Photo Report
- **Optional Attachments:** iTel Report, Building Code References
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER, ARGUMENT MODULE SELECTION, ATTACHMENTS LIST
- **Argument Modules:**
  - Damage (additional findings)
  - Discontinued (iTel + special order costs)
  - Code housewrap (6" overlap requirement)
- **Code References:**
  - Maryland IRC 2018 R703.2 & R703.4
  - Virginia ICC Building Code (ICC 2021)
  - Maryland Insurance Administration Bulletin 18-23

### Template 6: Repair Attempt / Brittle Test
- **ID:** `repair_attempt`
- **Purpose:** Demonstrate roof is irreparable via failed repair attempt
- **When to Use:** After brittle test failure
- **Required Attachments:** Repair Attempt Video, Repair Attempt Photos, Photo Report
- **Optional Attachments:** iTel Report, GAF Guidelines
- **Brittle Test Requirements:**
  - Video showing shingles cracking during manipulation
  - Close-up photos of creases after prying shingles up
  - Granule loss documentation
  - Before/after comparison
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER

### Template 7: Appraisal Request
- **ID:** `appraisal_request`
- **Purpose:** Invoke policy's appraisal clause when negotiations deadlock
- **When to Use:** Last resort before arbitration, after negotiations exhausted
- **Sender:** CUSTOMER (drafted by rep)
- **Required Attachments:** Previous correspondence, Roof-ER Estimate, Insurance Estimate
- **Appraiser Info:**
  - Name: Edmund O'Brien
  - Phone: 270-839-4971
  - Email: ed@keyadjusting.com
- **Critical Notes:**
  - Customer sends, not rep (stronger legal position)
  - Rep provides template and instructions to customer
  - Rep is BCCd to monitor response
  - Only use when negotiations exhausted
- **Fields:** DATE OF LOSS, POLICY NUMBER, CLAIM NUMBER, REP NAME, ROOF-ER ESTIMATE, INSURANCE ESTIMATE, INSURANCE CARRIER, HOMEOWNER NAME, HOMEOWNER CONTACT, ROOF AND/OR SIDING

### Template 8: Customer to Insurance Escalation
- **ID:** `customer_to_insurance`
- **Purpose:** Homeowner-sent email to escalate claim (stronger than rep-sent)
- **When to Use:** After rep's attempts fail; adds homeowner's voice
- **Sender:** CUSTOMER (drafted by rep)
- **Strategic Notes:**
  - Shifts dynamic from contractor dispute to policyholder rights
  - Insurance companies prioritize homeowner complaints (state regulation risk)
  - Documents homeowner's dissatisfaction for potential complaint filing
  - Shows unified front between homeowner and contractor
- **Fields:** INSURANCE COMPANY, PROPERTY ADDRESS, REP NAME, SCOPE TYPE, PARTIAL SCOPE DESCRIPTION, STATE, RESPONSE DEADLINE, HOMEOWNER NAME, HOMEOWNER CONTACT, POLICY NUMBER, CLAIM NUMBER

### Template 9: Estimate Request
- **ID:** `estimate_request`
- **Purpose:** Request copy of insurance's estimate when not yet received
- **When to Use:** After adjuster meeting, when estimate not provided promptly (3-5 days)
- **Required Attachments:** Claim Authorization
- **Process Notes:**
  - Send 3-5 days after adjuster meeting
  - If no response in 5-7 days, escalate to phone call
  - Document all estimate requests for timeline tracking
- **Fields:** REP NAME, CUSTOMER NAME, CLAIM NUMBER, ADJUSTER MEETING DATE, CUSTOMER EMAIL, REP EMAIL

---

## 2. ARGUMENTS (15 Total)

### Building Code Arguments (4)

#### 1. IRC_R908_3
- **Category:** Building Code
- **Title:** IRC R908.3 - Matching Shingle Requirement
- **Success Rate:** 92%
- **Usage Count:** 1,247
- **Description:** International Residential Code requires matching color, size, and quality for roof repairs
- **Full Text:** Per IRC Section R908.3, when re-roofing or repairing an existing roof, replacement materials must match the existing roof in color, size, and quality. This is not a suggestion—it is a mandatory building code requirement adopted by most jurisdictions.
- **Applicable Scenarios:** Partial roof replacement, Storm damage repairs, Insurance claim disputes, Contractor scope disagreements
- **Supporting Evidence:** IRC Section R908.3 text, Local building department interpretation, Building permit requirements, Code enforcement letters
- **Best Practices:** Always cite specific IRC section number, Include local jurisdiction adoption date, Attach code text as reference, Mention building permit would require compliance
- **States:** VA, MD, PA, All IRC jurisdictions

#### 2. VA_R908_3
- **Category:** Building Code
- **Title:** Virginia Building Code R908.3
- **Success Rate:** 95%
- **Usage Count:** 423
- **Description:** Virginia-specific matching requirement with state enforcement
- **Full Text:** The Virginia Residential Code, Section R908.3, mandates that roof repairs must use materials matching the existing roof in color, size, and quality. Virginia building officials strictly enforce this requirement, and permits will not be issued for non-matching repairs.
- **Applicable Scenarios:** Virginia properties only
- **Supporting Evidence:** Virginia Residential Code Section R908.3, DHCD interpretations, Local building official statements
- **Best Practices:** Reference Virginia DHCD website, Cite specific local jurisdiction, Mention permit requirement, Include building official contact info if available
- **States:** VA

#### 3. MD_R908_3
- **Category:** Building Code
- **Title:** Maryland Building Code R908.3
- **Success Rate:** 93%
- **Usage Count:** 312
- **Description:** Maryland adoption of IRC matching requirements
- **Full Text:** Maryland has adopted the International Residential Code Section R908.3, requiring roof repairs to match existing materials in color, size, and quality. The Maryland Department of Labor enforces this through local building inspectors.
- **Applicable Scenarios:** Maryland properties only
- **Supporting Evidence:** Maryland IRC adoption statute, MD Dept of Labor guidance, Local jurisdiction requirements
- **Best Practices:** Reference Maryland-specific adoption, Cite local county building code, Include permit necessity
- **States:** MD

#### 4. PA_UCC_3404_5
- **Category:** Building Code
- **Title:** Pennsylvania UCC Section 3404.5
- **Success Rate:** 90%
- **Usage Count:** 278
- **Description:** Pennsylvania Uniform Construction Code roofing material requirements
- **Full Text:** Under the Pennsylvania Uniform Construction Code (UCC) Section 3404.5, roofing materials used in repairs must be compatible with and match existing roof materials. This ensures structural integrity and uniform appearance.
- **Applicable Scenarios:** Pennsylvania properties only
- **Supporting Evidence:** PA UCC Section 3404.5, PA Department of Labor & Industry guidance, Municipal building code enforcement
- **Best Practices:** Cite PA UCC specifically, Reference local municipality adoption, Mention uniform construction code authority
- **States:** PA

### Manufacturer Specification Arguments (2)

#### 5. GAF_MATCHING_REQ
- **Category:** Manufacturer Specification
- **Title:** GAF Matching Requirement
- **Success Rate:** 88%
- **Usage Count:** 634
- **Description:** GAF requires matching materials for warranty validity
- **Full Text:** According to GAF's installation manual and warranty terms, repairs must use matching shingles from the same product line. Using non-matching materials voids the manufacturer warranty and may create installation defects.
- **Applicable Scenarios:** GAF shingles installed, Warranty claims, Proper installation arguments
- **Supporting Evidence:** GAF Installation Standards Manual, GAF Warranty Terms, GAF Technical Support statements, GAF Product Line specifications
- **Best Practices:** Identify specific GAF product line, Reference warranty void clause, Attach GAF installation manual excerpt, Mention manufacturer support availability

#### 6. OC_MATCHING_REQ
- **Category:** Manufacturer Specification
- **Title:** Owens Corning Matching Requirement
- **Success Rate:** 86%
- **Usage Count:** 412
- **Description:** Owens Corning warranty requires same product line
- **Full Text:** Owens Corning's Limited Warranty specifically requires that replacement shingles come from the same product line as the original installation. Mixed products void warranty coverage and may cause performance issues.
- **Applicable Scenarios:** Owens Corning shingles, Warranty preservation, Installation standards
- **Supporting Evidence:** Owens Corning Limited Warranty, Professional Standards guide, Product line compatibility charts
- **Best Practices:** Cite specific warranty language, Reference product line requirements, Include warranty void consequences

### Insurance Regulation Arguments (2)

#### 7. STATE_MATCHING_REGS
- **Category:** Insurance Regulation
- **Title:** State Insurance Regulations - Matching Coverage
- **Success Rate:** 78%
- **Usage Count:** 892
- **Description:** State regulations requiring insurers to cover matching materials
- **Full Text:** State insurance regulations in many jurisdictions require carriers to provide coverage for matching materials when repairs cannot reasonably match existing materials. Depreciation should not apply to building code-required matching.
- **Applicable Scenarios:** Insurance claim disputes, Depreciation arguments, Matching coverage denial
- **Supporting Evidence:** State insurance code citations, Insurance commissioner opinions, Case law precedents, Policy interpretation guidelines
- **Best Practices:** Research state-specific regulations, Cite insurance commissioner opinions, Reference similar case outcomes, Include policy language analysis

#### 8. DEPRECIATION_LIMITATION
- **Category:** Insurance Regulation
- **Title:** Depreciation Not Applicable to Code Requirements
- **Success Rate:** 72%
- **Usage Count:** 567
- **Description:** Argument that depreciation should not apply to mandatory code compliance
- **Full Text:** When matching is required by building code, it is not a matter of choice but legal necessity. Depreciation should not be applied to code-mandated matching materials, as the insured has no option but to comply with building regulations.
- **Applicable Scenarios:** RCV vs ACV disputes, Depreciation challenges, Code compliance arguments
- **Supporting Evidence:** Building code requirements, Legal necessity argument, Insurance bad faith precedents, State regulatory guidance
- **Best Practices:** Link depreciation to code requirement, Emphasize "no choice" element, Cite bad faith concerns, Reference policyholder rights

### Industry Standard Arguments (2)

#### 9. NRCA_STANDARDS
- **Category:** Industry Standard
- **Title:** NRCA Roofing Standards - Matching Best Practice
- **Success Rate:** 82%
- **Usage Count:** 445
- **Description:** National Roofing Contractors Association standards for repair matching
- **Full Text:** The National Roofing Contractors Association (NRCA) recommends that roof repairs use materials matching the existing roof to ensure proper performance, weatherproofing, and aesthetic consistency. This is recognized industry best practice.
- **Applicable Scenarios:** Professional standards arguments, Contractor qualification, Best practice citations
- **Supporting Evidence:** NRCA Roofing Manual, Industry best practice guides, Professional association standards, Contractor licensing requirements
- **Best Practices:** Reference NRCA as authoritative source, Cite specific manual sections, Link to professional standards, Emphasize industry consensus

#### 10. VISIBLE_MISMATCH
- **Category:** Industry Standard
- **Title:** Visible Mismatch Standard
- **Success Rate:** 85%
- **Usage Count:** 621
- **Description:** Industry standard that visible mismatches are unacceptable
- **Full Text:** Industry standards universally recognize that visibly mismatched roofing materials are unacceptable workmanship. Even if materials are technically similar, visible color or texture differences constitute substandard work that no reputable contractor would perform.
- **Applicable Scenarios:** Aesthetic mismatch arguments, Workmanship standards, Property appearance concerns
- **Supporting Evidence:** Contractor standards of care, Workmanship warranty language, Industry best practices, Customer satisfaction standards
- **Best Practices:** Use photos showing mismatch examples, Reference professional pride, Cite customer expectations, Link to property value impact

### Warranty Protection Arguments (1)

#### 11. WARRANTY_VOID_RISK
- **Category:** Warranty Protection
- **Title:** Non-Matching Materials Void Warranty
- **Success Rate:** 87%
- **Usage Count:** 789
- **Description:** Using non-matching materials voids manufacturer and contractor warranties
- **Full Text:** Installing non-matching roofing materials will void both the manufacturer's product warranty and the contractor's workmanship warranty. This exposes the homeowner to significant financial risk if future issues arise with the roof.
- **Applicable Scenarios:** Warranty preservation, Risk mitigation, Long-term protection arguments
- **Supporting Evidence:** Manufacturer warranty terms, Contractor warranty exclusions, Warranty void clauses, Industry warranty standards
- **Best Practices:** Quote specific warranty language, Quantify financial risk, Compare warranty value vs mismatch cost, Emphasize homeowner protection

### Property Value Arguments (2)

#### 12. PROPERTY_VALUE_IMPACT
- **Category:** Property Value
- **Title:** Mismatched Roof Reduces Property Value
- **Success Rate:** 76%
- **Usage Count:** 534
- **Description:** Visible roof mismatches negatively impact home resale value and marketability
- **Full Text:** Real estate professionals consistently report that visible roof mismatches reduce property values and make homes harder to sell. Home inspectors flag mismatched roofs as potential concerns, which can derail sales or reduce offers.
- **Applicable Scenarios:** Property value arguments, Resale concerns, Home inspection issues
- **Supporting Evidence:** Realtor assessments, Home inspection reports, Appraisal impact studies, Market analysis data
- **Best Practices:** Cite real estate professional opinions, Reference home inspection standards, Quantify potential value loss, Include market comparables

#### 13. CURB_APPEAL
- **Category:** Property Value
- **Title:** Curb Appeal and Aesthetic Impact
- **Success Rate:** 74%
- **Usage Count:** 412
- **Description:** Roof appearance significantly affects overall home curb appeal
- **Full Text:** The roof represents approximately 40% of a home's visible exterior. A mismatched roof dramatically reduces curb appeal and creates an impression of poor maintenance, affecting both property value and neighborhood aesthetics.
- **Applicable Scenarios:** Aesthetic arguments, Neighborhood standards, HOA concerns
- **Supporting Evidence:** Curb appeal studies, Real estate marketing data, HOA architectural standards, Property presentation guidelines
- **Best Practices:** Use visual examples, Reference neighborhood standards, Cite HOA requirements if applicable, Emphasize homeowner pride

### Safety & Liability Arguments (2)

#### 14. BUILDING_PERMIT_REQUIRED
- **Category:** Safety & Liability
- **Title:** Building Permit Requires Code Compliance
- **Success Rate:** 91%
- **Usage Count:** 723
- **Description:** Local building permits mandate IRC compliance including matching requirements
- **Full Text:** Any roof repair or replacement requires a building permit in most jurisdictions. Building inspectors will not approve permits for non-matching repairs that violate IRC R908.3. Proceeding without proper permits exposes the homeowner to legal and liability risks.
- **Applicable Scenarios:** Permit requirements, Code enforcement, Legal compliance
- **Supporting Evidence:** Local building department requirements, Permit application requirements, Code enforcement policies, Inspection failure examples
- **Best Practices:** Reference local building department, Cite permit denial risk, Mention inspection failure consequences, Include enforcement penalties

#### 15. LIABILITY_EXPOSURE
- **Category:** Safety & Liability
- **Title:** Contractor Liability for Non-Compliant Work
- **Success Rate:** 83%
- **Usage Count:** 389
- **Description:** Contractors face liability for installing non-code-compliant repairs
- **Full Text:** Licensed contractors who knowingly install non-code-compliant repairs (including mismatched materials) face professional liability, potential license sanctions, and legal exposure. No reputable contractor should agree to non-compliant work.
- **Applicable Scenarios:** Contractor responsibility, Professional standards, License protection
- **Supporting Evidence:** Contractor licensing requirements, Professional liability standards, Board sanctions for violations, Legal precedents
- **Best Practices:** Reference contractor licensing board, Cite professional standards, Mention liability insurance implications, Emphasize contractor reputation risk

---

## 3. BUILDING CODES (All Present)

### Core Building Codes (5)

#### 1. IRC R908.3
- **Code:** International Residential Code
- **Section:** R908.3
- **Description:** Matching shingle requirement - existing shingles must match in color, size, quality
- **Applicability:** All jurisdictions adopting IRC
- **Success Rate:** 92%

#### 2. IBC 1510.3
- **Code:** International Building Code
- **Section:** 1510.3
- **Description:** Re-roofing requirements and material compatibility
- **Applicability:** Commercial buildings
- **Success Rate:** 88%

#### 3. VA Building Code R908.3
- **Code:** Virginia Building Code
- **Section:** R908.3
- **Description:** Virginia-specific matching requirements
- **Applicability:** Virginia properties only
- **Success Rate:** 95%

#### 4. MD Building Code R908.3
- **Code:** Maryland Building Code
- **Section:** R908.3
- **Description:** Maryland-specific matching requirements
- **Applicability:** Maryland properties only
- **Success Rate:** 93%

#### 5. PA UCC 3404.5
- **Code:** Pennsylvania Uniform Construction Code
- **Section:** 3404.5
- **Description:** Pennsylvania roofing materials requirements
- **Applicability:** Pennsylvania properties only
- **Success Rate:** 90%

### Additional State-Specific Codes (from Knowledge Base)

#### Virginia
- **R908.3** - Roof replacement requires removal of ALL existing layers down to deck
- **R905.2.2** - Asphalt shingles only on slopes 2/12 or greater (17% slope minimum)
- **R703** - Weather-resistant barrier and flashing requirements
- **908.5** - Damaged flashings must be replaced during reroofing

#### Maryland
- **R703** - Exterior wrap code - water-resistive barrier requirements, 6" overlap at corners
- **R908.3** - Roof replacement - complete tear-off to deck required
- **Bulletin 18-23** - Mismatch claims - settlement options include full replacement
- **Title 27 Subtitle 3** - Unfair claim settlement practices - MD insurance law

#### Pennsylvania
- **R908.3** - Roof replacement mandates complete removal of all layers to deck - no exceptions

#### Double Layer Prohibition
- **Section 1511.3.1.1** - CANNOT recover (add third layer) on double-layer roofs
- **Section 1511.3** - Must remove ALL existing layers during replacement

---

## 4. KNOWLEDGE BASE STRUCTURE

### Total: 1000+ Q&A Entries across 8 Domains

#### Domain 1: Q&A Knowledge Database (Q1-Q1000+)
- Insurance Pushback & Arguments (Q1-Q100)
- Documentation & Templates (Q101-Q200)
- GAF Manufacturer Guidelines (Q201-Q300)
- Building Code Requirements (Q301-Q400)
- Arbitration & Escalation (Q401-Q500)
- Training & Best Practices (Q501-Q600)
- Knowledge Base Guidance (Q601-Q750)
- Troubleshooting (Q751-Q1000+)

#### Domain 2: Email Templates (13 Templates)
- Photo Report Template (65% success)
- Repair Attempt Template (85% success with video)
- iTel Template (75% success)
- Customer to Insurance Template (60% success when used as escalation)
- Generic Partial Template
- Siding Argument Template
- Estimate Request Template
- GAF Guidelines Template (70% success)
- Post Adjuster Meeting Template
- Danny's Repair Attempt Video Template (85% success)

#### Domain 3: Sales Scripts (7 Scripts)
1. Initial Pitch Script (Phase 1: Initial Contact)
2. Inspection and Post-Inspection Script (Phase 2)
3. Contingency and Claim Authorization Script (Phase 3)
4. Post Adjuster Meeting Script (Phase 4)
5. Full Approval Estimate Phone Call (Phase 5A)
6. Partial Estimate/Denial Phone Call (Phase 5B)
7. Claim Filing Information Sheet (Phase 3 Prep)

#### Domain 4: Insurance Legal Weapons (20+ Arguments)
- Building Codes (VA, MD, PA, Double Layer)
- GAF Manufacturer Guidelines
- Maryland-Specific Regulations
- Discontinued Shingles List
- Arbitration & Appraisal
- Complaint Escalation Process

#### Domain 5: Customer Resources & Products
- Standard Materials (shingles, underlayment, ventilation, flashing)
- Warranties (GAF Standard, System Plus, Silver Pledge, Golden Pledge, Workmanship)
- Deductible Education
- Project Timeline

#### Domain 6: Legal Agreements & Forms (11 Documents)
- Contingency Agreements (DMV, PA)
- Project Agreements (MD, VA)
- Authorization Forms (Claim Auth)
- Testing Agreements (iTel, Repair Attempt)
- Operational Forms (Emergency Tarp, COI, Liens)

#### Domain 7: Operations & Procedures (8 Guides)
- Sales Operations & CRM
- Repair Attempt Procedure
- Hover Upload Process
- Role Definitions (Sales, Brandon, Danny, Ford, Reese, Amber, PCs, Field)
- Mission & Values
- Top 10 Cheat Sheet
- 5-Day Training Program
- CRM Integrations

#### Domain 8: Visual Reference & Image Analysis (24 Images)
- Roof Anatomy (9 diagrams)
- Damage Examples (3 forensic photos)
- Territory Maps (4 coverage areas)
- Reference Images (2 templates)
- Building Code Images (6 legal citations)

---

## STATISTICS SUMMARY

### Templates
- **Total:** 9 templates
- **Average Fields:** 4-11 fields per template
- **Complete Data:** 100% (all templates have all required fields)

### Arguments
- **Total:** 15 arguments
- **Categories:** 7 categories
- **Average Success Rate:** 84%
- **Total Usage:** 8,600+ combined uses
- **State-Specific:** 3 arguments (VA, MD, PA)

### Building Codes
- **Core Codes:** 5 (IRC, IBC, VA, MD, PA)
- **Additional Codes:** 10+ state-specific variations
- **Average Success Rate:** 92%

### Knowledge Base
- **Total Entries:** 1000+ Q&A pairs
- **Domains:** 8 comprehensive domains
- **Email Templates:** 13 (with success rates)
- **Sales Scripts:** 7 (full sales process coverage)
- **File Size:** 407KB
- **Coverage States:** 6 (VA, MD, PA, DC, DE, WV)

---

**Last Updated:** 2025-10-24
**Data Integrity:** 100% (all existing data complete and accessible)
**Overall Completeness:** 85% (minor gaps in template and argument counts)
