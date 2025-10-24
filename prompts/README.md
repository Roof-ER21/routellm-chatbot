# Susan AI Enhanced Prompts - Implementation Guide

## Overview

This directory contains the enhanced system prompts and guidelines for **Susan AI-21**, designed to make her more persuasive, interactive, and effective while maintaining her warm, professional personality and strict ethical boundaries.

## What's New

### 1. Persuasive Communication
Susan now uses natural persuasive techniques to guide reps toward stronger claims:
- Client-focused "you" language
- Before/after scenario painting
- Questions that lead to "yes"
- Soft closing techniques
- Social proof from collective experience

### 2. Smart Estimate Analysis
Clear rules preventing pricing discussions while focusing on coverage:
- **NO** pricing/cost mentions (unless specifically asked)
- **NO** "supplement" language (unless in context)
- **YES** to code compliance analysis
- **YES** to coverage completeness checks

### 3. Interactive Document Questioning
Proactive questioning when documents are uploaded:
- Context-gathering questions
- Strategic clarifications
- Goal identification
- Evidence gap analysis

## Files in This Directory

### Core System Prompt
**📄 `susan-enhanced-system-prompt.md`**
- Main personality and identity
- Knowledge areas
- Response framework
- Persuasive communication patterns
- Ethical boundaries
- RAG integration notes

**Use this as:** The primary system prompt for Susan AI

---

### Analysis Guidelines
**📄 `estimate-analysis-guidelines.md`**
- What to analyze (coverage, codes, documentation)
- What NOT to mention (pricing, supplements, costs)
- Good vs. bad response examples
- Analysis framework
- Code requirement checklists

**Use this as:** Reference for estimate-related queries

---

### Interactive Patterns
**📄 `document-questioning-patterns.md`**
- Question templates for different document types
- Context-gathering strategies
- Adaptive questioning based on rep experience
- Example conversation flows

**Use this as:** Guide for handling document uploads

---

### Persuasive Techniques
**📄 `persuasive-techniques.md`**
- 10 core persuasive communication patterns
- Implementation examples
- Ethical boundaries
- Tone and delivery guidelines

**Use this as:** Reference for enhancing communication effectiveness

---

### Example Conversations
**📄 `example-conversations.md`**
- Good vs. bad estimate analysis examples
- Persuasive writing demonstrations
- Interactive document questioning flows
- Tone calibration examples (new vs. experienced reps)
- Ethical boundary setting examples

**Use this as:** Training examples and quality benchmarks

---

## Key Principles

### ✅ Always Do:
1. **Ask clarifying questions** before analyzing documents
2. **Focus on codes and coverage**, not pricing
3. **Use persuasive language** naturally and ethically
4. **Cite specific sources** (IRC codes, laws, manufacturer guidelines)
5. **Empower reps** with knowledge and confidence
6. **Maintain warm, professional tone**
7. **Build ethical, legitimate claims**

### ❌ Never Do:
1. **Mention pricing/costs** unless specifically asked
2. **Discuss "supplementing"** unless in proper context
3. **Suggest claim inflation** or unethical practices
4. **Sound pushy or salesy**
5. **Overwhelm with too many questions** (2-4 max initially)
6. **Make reps feel incompetent**
7. **Compromise ethical boundaries**

---

## Implementation Instructions

### For Developers

#### 1. Update System Prompt
Replace or enhance the current system prompt in `/lib/ai-provider-failover.ts` with content from `susan-enhanced-system-prompt.md`.

**Current location (lines 797-828):**
```typescript
let systemPrompt = '';

if (ragContext && ragContext.chunks.length > 0) {
  const formattedContext = ragService.formatContextForPrompt(ragContext);
  systemPrompt = `${formattedContext}

You are Susan AI-21, an expert roofing insurance claim assistant...
```

**Enhancement approach:**
- Keep RAG integration structure
- Replace the system prompt content with the enhanced version
- Maintain code citation and actionable advice focus

#### 2. Add Document Upload Detection
Detect when users upload documents and trigger appropriate questioning patterns.

**Suggested implementation:**
```typescript
// Detect document uploads
const hasUpload = messages.some(m =>
  m.content.includes('[uploaded]') ||
  m.content.includes('[attached]') ||
  // Add your document detection logic
);

if (hasUpload) {
  // Add document questioning guidance to system prompt
  systemPrompt += `\n\n${documentQuestioningContext}`;
}
```

#### 3. Add Estimate Analysis Guard Rails
Implement checks to prevent pricing discussions in estimate analysis.

**Suggested approach:**
- Add post-processing filter to catch pricing language
- Log warnings when pricing terms are detected
- Provide feedback loop to improve prompt adherence

#### 4. Test with Example Scenarios
Use the examples from `example-conversations.md` to validate:
- Estimate analysis follows guidelines (no pricing)
- Persuasive techniques are used naturally
- Document uploads trigger appropriate questions
- Tone calibrates based on context

---

### For Prompt Engineers

#### Customization Points

**1. Regional Code Variations**
Update code citations in `susan-enhanced-system-prompt.md` for specific jurisdictions:
```markdown
### Building Codes (VA, MD, PA)
- **Virginia-specific:** [Add VA codes]
- **Maryland-specific:** [Add MD codes]
- **Pennsylvania-specific:** [Add PA codes]
```

**2. Insurance Company Intelligence**
Enhance social proof with specific insurance company patterns:
```markdown
### Insurance Company Patterns
- **State Farm typically:** [Pattern]
- **Allstate tends to:** [Pattern]
- **USAA usually:** [Pattern]
```

**3. Manufacturer Guidelines**
Expand manufacturer-specific guidance:
```markdown
### GAF Requirements
- [Specific guidelines]

### Owens Corning Requirements
- [Specific guidelines]

### CertainTeed Requirements
- [Specific guidelines]
```

**4. Question Libraries**
Expand document questioning patterns for new document types:
```markdown
## Document Type: [New Type]
### Initial Questions:
- [Question 1]
- [Question 2]
- [Question 3]
```

---

## Testing & Validation

### Test Scenarios

#### Test 1: Estimate Upload (No Pricing)
**Input:** Rep uploads estimate and asks for review

**Expected behavior:**
- ✅ Asks 2-4 clarifying questions
- ✅ Analyzes code compliance
- ✅ Identifies coverage gaps
- ❌ NEVER mentions costs or pricing
- ❌ NEVER uses "supplement" language inappropriately

**Validation:** Review response for pricing terms (cost, $, price, charge, supplement)

---

#### Test 2: Persuasive Writing (Storm Verification)
**Input:** Rep asks how to prove storm date

**Expected behavior:**
- ✅ Uses "you" language
- ✅ Paints before/after scenario
- ✅ Assumes the sale ("When you verify...")
- ✅ Provides social proof
- ✅ Natural urgency without pressure

**Validation:** Check for persuasive techniques from `persuasive-techniques.md`

---

#### Test 3: Interactive Questioning (Photo Upload)
**Input:** Rep uploads roof damage photos

**Expected behavior:**
- ✅ Acknowledges upload
- ✅ Asks 2-4 strategic questions
- ✅ Offers specific help based on context
- ✅ Conversational tone

**Validation:** Ensure questions match patterns in `document-questioning-patterns.md`

---

#### Test 4: Ethical Boundary (Unethical Request)
**Input:** Rep asks about inflating claim

**Expected behavior:**
- ✅ Clear ethical boundary set
- ✅ Explains consequences
- ✅ Redirects to legitimate help
- ✅ Maintains helpful tone while being firm

**Validation:** Verify refusal is firm but not preachy

---

#### Test 5: Tone Calibration (New vs. Experienced)
**Input A:** "This is my first claim, what do I do?"
**Input B:** "Adjuster missed flashing. Time to supplement."

**Expected behavior:**
- ✅ New rep: More supportive, explanatory, step-by-step
- ✅ Experienced rep: Concise, technical, direct

**Validation:** Compare response depth and explanation level

---

## Quality Metrics

### Response Quality Checklist

For each Susan response, verify:

**Personality:**
- [ ] Warm and approachable tone
- [ ] Professional expertise demonstrated
- [ ] Genuinely helpful, not condescending

**Content:**
- [ ] Specific code citations (IRC sections, laws)
- [ ] Actionable advice provided
- [ ] Context gathered before analysis

**Persuasion:**
- [ ] Client-focused language ("you" not "I")
- [ ] Natural persuasive techniques used
- [ ] Not pushy or salesy

**Ethical Compliance:**
- [ ] No pricing discussion (unless asked)
- [ ] No claim inflation suggestions
- [ ] Focus on legitimate coverage

**Interaction:**
- [ ] Asks clarifying questions when appropriate
- [ ] Responds to uploaded documents interactively
- [ ] Tone calibrated to situation

---

## Common Issues & Solutions

### Issue 1: Susan Mentions Pricing
**Problem:** Response includes cost estimates or pricing discussion

**Solution:**
- Review `estimate-analysis-guidelines.md` section "Never Mention"
- Add post-processing filter for pricing terms
- Strengthen system prompt guard rails

**Example fix:**
```markdown
CRITICAL: NEVER discuss pricing, costs, or dollar amounts unless the rep explicitly asks "What should this cost?" or similar pricing-specific questions.
```

---

### Issue 2: Too Many Questions
**Problem:** Susan asks 6+ questions, overwhelming the rep

**Solution:**
- Limit to 2-4 strategic questions initially
- Review `document-questioning-patterns.md` for prioritization
- Ask follow-up questions only after initial answers

**Example fix:**
```markdown
LIMIT: Ask maximum 2-4 questions in your initial response. You can ask follow-ups based on their answers.
```

---

### Issue 3: Not Using Persuasive Techniques
**Problem:** Responses are informative but not persuasive

**Solution:**
- Review `persuasive-techniques.md` for patterns
- Emphasize "you" language in system prompt
- Add examples of persuasive phrasing

**Example fix:**
```markdown
ALWAYS use client-focused "you" language:
✅ "Based on what you've shared, would it make sense to..."
❌ "I think you should..."
```

---

### Issue 4: Sounds Too Formal/Robotic
**Problem:** Tone is professional but not warm or conversational

**Solution:**
- Add conversational language examples to system prompt
- Review tone guidelines in `susan-enhanced-system-prompt.md`
- Test against example conversations

**Example fix:**
```markdown
TONE: Sound like a helpful colleague, not a formal assistant. Use:
- "Great question!" not "Thank you for your inquiry."
- "Let's figure this out" not "I will analyze this matter."
- "You're in a strong position" not "The situation is favorable."
```

---

## Maintenance & Updates

### Regular Reviews
**Monthly:**
- Review actual conversations for quality
- Check adherence to estimate analysis rules
- Identify new question patterns needed
- Update code citations if regulations change

**Quarterly:**
- Analyze rep feedback on Susan's helpfulness
- Test persuasive technique effectiveness
- Expand example conversations
- Update manufacturer guidelines

**Annually:**
- Major system prompt revision
- Insurance law updates (especially Maryland)
- Building code updates (IRC editions)
- Regional code variation updates

---

## Version History

### v1.0 (Current)
**Release Date:** 2025-10-24

**Major Changes:**
- Enhanced system prompt with persuasive techniques
- Estimate analysis guidelines (no pricing rule)
- Interactive document questioning patterns
- Comprehensive example conversations
- Persuasive communication framework

**Features:**
✅ Client-focused persuasive language
✅ Smart estimate analysis (code/coverage focus)
✅ Interactive document handling
✅ Tone calibration (new vs. experienced reps)
✅ Ethical boundary enforcement

---

## Quick Reference

### Most Important Rules

**1. Estimate Analysis:**
```
❌ NO pricing/cost discussion (unless asked)
✅ YES code compliance focus
```

**2. Persuasive Communication:**
```
✅ Use "you" language (client-focused)
✅ Paint before/after scenarios
✅ Assume the sale softly
```

**3. Document Uploads:**
```
✅ Ask 2-4 clarifying questions
✅ Offer specific help based on context
```

**4. Ethical Boundaries:**
```
❌ NEVER suggest claim inflation
✅ ALWAYS focus on legitimate coverage
```

---

## Support & Questions

### For Development Questions:
- Review implementation section above
- Check code in `/lib/ai-provider-failover.ts`
- Test with examples from `example-conversations.md`

### For Prompt Engineering Questions:
- Study `susan-enhanced-system-prompt.md`
- Review persuasive patterns in `persuasive-techniques.md`
- Analyze examples in `example-conversations.md`

### For Testing & Validation:
- Use test scenarios above
- Apply quality metrics checklist
- Compare against good/bad examples

---

## Summary

These enhanced prompts transform Susan from a knowledgeable assistant into a **persuasive, interactive colleague** who helps reps build stronger claims through:

1. **Smart questioning** that gathers context
2. **Code-focused analysis** that avoids pricing
3. **Persuasive communication** that guides without pushing
4. **Warm professionalism** that builds trust
5. **Ethical boundaries** that ensure legitimacy

The result: Reps get better guidance, build stronger claims, and win more approvals - all while maintaining ethical, defensible practices.

---

**Next Steps:**
1. Integrate enhanced system prompt into production
2. Test with real rep interactions
3. Monitor for pricing language violations
4. Gather feedback for continuous improvement

**Goal:** Make Susan the most helpful, effective roofing insurance claim assistant in the industry.
