# Susan & Agnes AI Integration Architecture

## Overview
Susan and Agnes are specialized AI personalities for roofing insurance training and support.

## Susan 21 (Expert Assistant)

### Core Identity
- Professional British tone
- Roofing insurance expert
- GAF & CertainTeed certified knowledge
- Building codes (IBC, IRC, VA/MD/PA)

### System Prompt Structure
```
You are Susan 21 (S21), expert roofing insurance AI assistant

COMMUNICATION STYLE:
- Professional British tone
- Concise responses (~50% shorter)
- No markdown formatting
- No emojis unless requested

EXPERTISE:
- Roofing insurance claims
- GAF & CertainTeed systems
- Building codes
- Damage assessment

ROOF-ER METHODOLOGY:
- Documentation-heavy
- Template-driven
- Evidence-based negotiation
```

### Implementation
- Model: susan-ai-21:v4.1 (Ollama)
- Endpoint: /api/susan
- Features: Context-aware, code references, template suggestions

## Agnes 21 (Role-Play Trainer)

### Core Identity
- Expert training facilitator
- Realistic scenario simulation
- AI-based performance evaluation

### System Prompt Structure
```
You are Agnes 21, expert role-play trainer

ROLE: Play [homeowner/adjuster/manager]

BEHAVIOR:
- Stay in character
- Be realistic and challenging
- Progress naturally
- Show subtle signs of being convinced
```

### Scenario Categories
1. **Initial Pitch & Objections**
   - Not interested, busy, already talked to someone
   - Trust establishment
   - Value proposition

2. **Inspection & Documentation**
   - Explaining process
   - Building trust
   - Professional presentation

3. **Field Operations**
   - Weather constraints
   - Material questions
   - Timeline management

4. **L.E.A.R.N. Framework**
   - Listen, Empathize, Acknowledge, Respond, Next steps

5. **Insurance Technical**
   - Adjuster negotiations
   - Code compliance
   - Claim documentation

### Scoring System
```javascript
// AI-based evaluation using Ollama
const scoringPrompt = `
Evaluate based on:
1. Expected key points covered
2. Required keywords used
3. Professionalism
4. Clear next steps
5. Objection handling

Format: {score, strengths, improvements, feedback}
`;
```

### Implementation
- Model: susan-ai-21:v4.1 (same as Susan)
- Endpoints: /api/agnes/start, /api/agnes/respond, /api/agnes/end
- Session tracking: In-memory (production uses DB)

## Integration Points

### With Leaderboard App
- Susan chat available in UI
- Agnes training sessions tracked
- Performance metrics logged
- Integration via /api/susan and /api/agnes routes

### With Training Database
- 100+ Q&A scenarios loaded
- 19 real training scenarios across 5 modules
- Expected key points and keywords
- Pass thresholds and difficulty levels

### With Memory MCP
- Session context preserved
- Learning patterns tracked
- User preferences saved
- Performance history maintained

## Deployment Considerations

### Dynamic Import Issue
```typescript
// BROKEN (esbuild bundling):
const routes = await import("./susan/routes.js");

// FIXED:
import routes from "./susan/routes.js";
```

### Model Loading
- Requires Ollama running on localhost:11434
- Model: susan-ai-21:v4.1
- Fallback to susan-ai-21:complete if unavailable

### Environment Variables
- OLLAMA_HOST (default: http://localhost:11434)
- SUSAN_MODEL (default: susan-ai-21:v4.1)
- ENABLE_AGNES (default: true)
