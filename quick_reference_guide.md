# Insider Threat Detection - Quick Reference Guide

## CRITICAL: Immediate Alert Required (Score 90+)

These phrases/patterns require immediate security team notification and potential access restriction.

### Data Theft - CRITICAL

```
✗ "Can I download the entire client database?"
✗ "How do I export all contacts from CRM?"
✗ "Need to backup all customer information to personal drive"
✗ "Can I access the source code repository?"
✗ "How to copy our proprietary algorithms?"
✗ "Can I photograph our trade secret documentation?"
✗ "Export all pricing sheets to Excel"
✗ "Admin access to customer database needed"
```

**Immediate Actions:**
1. Restrict system access immediately
2. Preserve audit logs
3. Alert security team, HR, and legal
4. Begin forensic investigation

---

## HIGH RISK: Enhanced Monitoring Required (Score 70-89)

These patterns indicate significant risk and require close monitoring and investigation.

### Competing Business Planning

```
⚠ "How do I start my own [same industry] company?"
⚠ "What's our non-compete policy and how long does it last?"
⚠ "Can I start a competing business while employed?"
⚠ "How to leave employer and launch competitor?"
⚠ "Can I offer same services independently?"
⚠ "What happens if I violate non-compete agreement?"
```

### Client/Data Access

```
⚠ "Can I get a copy of our client list?"
⚠ "Need client contact information for my project"
⚠ "What's our pricing strategy vs competitors?"
⚠ "Who are our biggest clients and revenue breakdown?"
⚠ "Why is CRM access restricted for my role?"
⚠ "Can I take client files home?"
```

### Financial Fraud

```
⚠ "What's the approval threshold for expenses?"
⚠ "Can I submit expenses without receipts?"
⚠ "How often are invoices actually verified?"
⚠ "Can my LLC invoice this company?"
⚠ "Who audits expense reports and how?"
⚠ "Can I split purchases to avoid approval limits?"
```

### Exit Planning

```
⚠ "Can I contact clients after I leave?"
⚠ "What happens to my clients when I resign?"
⚠ "Can I recruit coworkers to new company?"
⚠ "How long is the non-solicitation period?"
⚠ "What files can I take when I leave?"
⚠ "Can clients choose to follow me after I quit?"
```

**Recommended Actions:**
1. Enhanced monitoring of all activities
2. Notify manager and HR
3. Review recent data access patterns
4. Document all incidents
5. Consider access review/restrictions
6. Prepare for potential exit

---

## MEDIUM RISK: Monitor and Document (Score 40-69)

These patterns warrant documentation and continued monitoring.

### General Business Interest

```
⚡ "Can I have a side business?"
⚡ "What's our moonlighting policy?"
⚡ "Can I do freelance work in same field?"
⚡ "Starting an LLC while working full time - legal?"
⚡ "Independent contractor vs employee status?"
```

### Policy Questions

```
⚡ "Do I need to tell employer about my LLC?"
⚡ "What counts as conflict of interest?"
⚡ "Intellectual property ownership rules?"
⚡ "Can I use work experience for my business?"
⚡ "What's considered confidential information?"
```

### Expense/Financial Queries

```
⚡ "How far back can I submit expenses?"
⚡ "What expenses don't need documentation?"
⚡ "Can I round up mileage claims?"
⚡ "Lost receipt policy - what's allowed?"
⚡ "Can I keep airline miles/credit card rewards?"
```

**Recommended Actions:**
1. Log and document
2. Monitor for escalation
3. Review in context of other behaviors
4. Consider informal manager check-in

---

## RED FLAG KEYWORD COMBINATIONS

When multiple keywords appear in single query, escalate risk level:

### Data + Export
```
"client" + "download"
"customer" + "export"
"database" + "backup"
"CRM" + "Excel"
"contacts" + "copy"
```

### Business + Compete
```
"start" + "company"
"own" + "business"
"compete" + "employer"
"same industry" + "LLC"
```

### Leave + Clients
```
"quit" + "clients"
"resign" + "contact"
"leave" + "take"
"after" + "customers"
```

### Fraud Indicators
```
"threshold" + "avoid"
"without" + "receipt"
"approval" + "bypass"
"split" + "invoice"
```

---

## BEHAVIORAL INDICATORS MATRIX

| Behavior | Low Risk | Medium Risk | High Risk | Critical Risk |
|----------|----------|-------------|-----------|---------------|
| **Data Access** | Normal job duties | Occasional off-scope | Frequent off-scope | Bulk downloads |
| **Work Hours** | Standard schedule | Some after-hours | Regular late/weekend | Vacation access |
| **Questions** | General policy | Specific boundaries | Legal loopholes | Evasive/testing |
| **Attitude** | Engaged | Distracted | Disgruntled | Hostile |
| **Performance** | Strong | Declining | Poor | Minimal effort |
| **External Activity** | None known | Industry networking | Competitor contact | Business formed |

---

## ESCALATION MATRIX

### Level 1: Low Risk (0-39)
- **Action:** Continue routine monitoring
- **Notify:** None required
- **Review:** Quarterly in aggregate
- **Documentation:** Standard logs only

### Level 2: Medium Risk (40-69)
- **Action:** Enhanced monitoring, document incident
- **Notify:** Consider manager awareness (case by case)
- **Review:** Weekly review of user activity
- **Documentation:** Detailed incident log

### Level 3: High Risk (70-89)
- **Action:** Close monitoring, access review
- **Notify:** Manager + HR + Security team
- **Review:** Daily activity review
- **Documentation:** Full investigation file
- **Meeting:** Schedule interview/check-in

### Level 4: Critical Risk (90-100)
- **Action:** Immediate access restriction
- **Notify:** Security + HR + Legal + Executive
- **Review:** Real-time monitoring
- **Documentation:** Forensic evidence preservation
- **Meeting:** Immediate investigation
- **Legal:** Consider injunction/cease and desist

---

## RESPONSE TIME REQUIREMENTS

| Risk Level | Detection to Alert | Alert to Investigation | Investigation to Action |
|------------|-------------------|----------------------|------------------------|
| Critical | <1 minute | <1 hour | <4 hours |
| High | <5 minutes | <4 hours | <24 hours |
| Medium | <1 hour | <1 day | <3 days |
| Low | <24 hours | As needed | As needed |

---

## INDUSTRY-SPECIFIC HIGH-RISK QUERIES

### Technology Companies
```
- "Source code access for personal project"
- "Can I clone the repository?"
- "How do our algorithms work exactly?"
- "Product roadmap for next 2 years?"
- "API keys and credentials list"
```

### Sales Organizations
```
- "Complete customer contact database export"
- "Commission structure breakdown"
- "Why do clients choose us over [competitor]?"
- "Territory assignment and client ownership"
- "Pricing strategy and discount matrix"
```

### Financial Services
```
- "Client portfolio and assets under management"
- "Investment strategy and proprietary models"
- "Fee schedule and margin breakdown"
- "High-net-worth client list"
- "Trading algorithms and strategies"
```

### Healthcare
```
- "Patient roster with contact information"
- "Referral source names and relationships"
- "Treatment protocols and procedures"
- "Insurance contracts and rates"
- "Physician network contact list"
```

### Professional Services
```
- "Client list with engagement details"
- "Methodology frameworks and IP"
- "Proposal templates and pricing models"
- "Partner compensation structure"
- "Client satisfaction scores and feedback"
```

---

## QUICK DECISION TREE

```
User Query Received
        |
        v
Does query contain
critical keywords?
  (client, export, download,
   database, source code)
        |
    YES | NO
        |
        v
Check pattern matching
    Score >= 70?
        |
    YES | NO
        |
        v
IMMEDIATE ALERT          Monitor & Log
Restrict Access          Continue Normal
Investigate Now          Review Weekly
        |                     |
        v                     v
   CRITICAL PATH         STANDARD PATH
```

---

## CONTACT INFORMATION

### Security Team
- **Email:** security-alerts@company.com
- **Slack:** #security-incidents
- **Phone:** xxx-xxx-xxxx (24/7)
- **SIEM Dashboard:** [URL]

### HR Team
- **Email:** hr-investigations@company.com
- **Phone:** xxx-xxx-xxxx
- **Escalation:** VP of HR

### Legal Team
- **Email:** legal-urgent@company.com
- **Phone:** xxx-xxx-xxxx
- **Outside Counsel:** [Contact if needed]

---

## INVESTIGATION CHECKLIST

### Immediate (First Hour)
- [ ] Preserve audit logs and evidence
- [ ] Document query and context
- [ ] Check user's recent activity (7 days)
- [ ] Review data access patterns
- [ ] Check for data exports/downloads
- [ ] Verify current employment status
- [ ] Alert appropriate stakeholders

### Short-Term (First Day)
- [ ] Interview direct manager
- [ ] Review HR records and performance
- [ ] Analyze network/system logs
- [ ] Check email communications
- [ ] Review expense reports
- [ ] Search for related queries
- [ ] Assess business impact
- [ ] Consult with legal

### Investigation (First Week)
- [ ] Forensic analysis of devices
- [ ] Complete timeline of activities
- [ ] Identify all data accessed
- [ ] Interview colleagues/witnesses
- [ ] External activity research
- [ ] Damage assessment
- [ ] Determine response strategy
- [ ] Document all findings

---

## FALSE POSITIVE INDICATORS

Not all flagged queries are threats. Consider these legitimate reasons:

### Valid Business Reasons
✓ Manager conducting audit of team data access
✓ HR investigating another employee issue
✓ Legal/compliance review of policies
✓ New employee learning systems and policies
✓ Project requiring cross-departmental data
✓ Business process improvement initiative
✓ Preparing for legitimate client meeting
✓ Training or documentation purposes

### How to Verify
1. Check user's role and responsibilities
2. Verify business context with manager
3. Review timing (during work hours vs. suspicious times)
4. Check for manager approval/authorization
5. Review user's history (first-time vs. pattern)
6. Confirm legitimate project or assignment

---

## PATTERNS BY TIME OF DAY

### Highly Suspicious Times
```
🌙 Late Night (10 PM - 6 AM)
   Especially: Data downloads, CRM exports
   Exception: International time zones, authorized work

🌅 Weekend Activity
   Especially: Policy research, client data access
   Exception: On-call rotations, project deadlines

🏖️ During Vacation/PTO
   Especially: Any system access
   Exception: True emergencies only
```

### Normal Times (Lower Concern)
```
☀️ Business Hours (9 AM - 6 PM)
   Still monitor, but context matters
   Many legitimate business needs
```

---

## COMMUNICATION TEMPLATES

### To Security Team (Critical Alert)
```
SUBJECT: [CRITICAL] Insider Threat Detected - User [ID]

Risk Score: [Score]/100
User: [Name/ID]
Department: [Dept]
Query: "[Exact query]"
Timestamp: [DateTime]
Categories: [List]

Immediate actions taken:
- [List any automatic restrictions]

Recommended next steps:
- [From analysis]

Dashboard Link: [URL]
```

### To Manager (High Risk Alert)
```
SUBJECT: Employee Activity Review Required - [Name]

We've detected potentially concerning activity patterns
for one of your direct reports that requires review.

Employee: [Name]
Alert Level: HIGH
Date/Time: [DateTime]

Please contact HR/Security to discuss next steps.
This requires prompt attention within 24 hours.

[Contact information]
```

---

## METRICS TO TRACK

### Daily Metrics
- Total queries processed
- Flagged queries (by risk level)
- Critical alerts generated
- Response time (alert to action)
- False positive rate

### Weekly Metrics
- Top 10 high-risk users
- Category breakdown trends
- Department-level patterns
- Investigation status updates
- Resolution outcomes

### Monthly Metrics
- Total investigations opened
- Confirmed threats vs. false positives
- Average time to resolution
- Policy violations detected
- Training effectiveness

---

## REMEMBER

1. **Speed Matters:** Critical threats require immediate action
2. **Context Matters:** Not every flag is a threat
3. **Privacy Matters:** Follow legal and ethical guidelines
4. **Documentation Matters:** Log everything properly
5. **Communication Matters:** Alert right people promptly
6. **Balance Matters:** Security vs. employee trust
7. **Updates Matter:** Patterns evolve, stay current

---

**Quick Reference Version:** 1.0
**Last Updated:** 2025-10-06
**Print this guide and keep accessible for rapid response**
