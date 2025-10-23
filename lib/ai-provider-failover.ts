/**
 * AI Provider Failover System
 *
 * Multi-tier cascade with offline support:
 * 1. Abacus.AI (primary)
 * 2. Hugging Face Inference API (backup 1)
 * 3. OpenRouter (backup 2)
 * 4. Ollama Local (backup 3)
 * 5. Static Knowledge Base (offline fallback)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  model: string;
  provider: string;
  cached?: boolean;
  offline?: boolean;
  confidence?: number;
}

export interface ProviderHealth {
  failures: number;
  lastSuccess: number;
  lastFailure: number;
  circuitOpen: boolean;
}

// ============================================================================
// PROVIDER HEALTH MONITORING
// ============================================================================

class HealthMonitor {
  private health: Map<string, ProviderHealth> = new Map();
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // Increased from 3 to 5 to be less aggressive
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // Reduced from 60s to 30s for faster recovery

  recordSuccess(provider: string): void {
    const health = this.getHealth(provider);
    health.failures = 0;
    health.lastSuccess = Date.now();
    health.circuitOpen = false;
  }

  recordFailure(provider: string): void {
    const health = this.getHealth(provider);
    health.failures++;
    health.lastFailure = Date.now();

    if (health.failures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      health.circuitOpen = true;
      console.log(`[HealthMonitor] Circuit breaker opened for ${provider}`);
    }
  }

  shouldSkip(provider: string): boolean {
    const health = this.getHealth(provider);

    // Check if circuit breaker should reset
    if (health.circuitOpen &&
        Date.now() - health.lastFailure > this.CIRCUIT_BREAKER_TIMEOUT) {
      console.log(`[HealthMonitor] Circuit breaker reset for ${provider}`);
      health.circuitOpen = false;
      health.failures = 0;
    }

    return health.circuitOpen;
  }

  private getHealth(provider: string): ProviderHealth {
    if (!this.health.has(provider)) {
      this.health.set(provider, {
        failures: 0,
        lastSuccess: Date.now(),
        lastFailure: 0,
        circuitOpen: false
      });
    }
    return this.health.get(provider)!;
  }

  getStatus(): Record<string, ProviderHealth> {
    const status: Record<string, ProviderHealth> = {};
    this.health.forEach((health, provider) => {
      status[provider] = { ...health };
    });
    return status;
  }
}

// ============================================================================
// AI PROVIDERS
// ============================================================================

class AbacusProvider {
  async call(messages: AIMessage[]): Promise<AIResponse> {
    const deploymentToken = process.env.DEPLOYMENT_TOKEN;
    const deploymentId = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38';

    if (!deploymentToken) {
      throw new Error('DEPLOYMENT_TOKEN not configured');
    }

    const enhancedMessages = messages.map(msg => ({
      is_user: msg.role === 'user',
      text: msg.content
    }));

    const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploymentToken,
        deploymentId,
        messages: enhancedMessages,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      throw new Error(`Abacus API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[AbacusProvider] Response structure:', {
      success: data.success,
      hasResult: !!data.result,
      hasMessages: !!data.result?.messages,
      messageCount: data.result?.messages?.length || 0
    });

    const assistantMessages = data.result.messages.filter((msg: any) => !msg.is_user);
    const message = assistantMessages[assistantMessages.length - 1]?.text || '';

    console.log('[AbacusProvider] Extracted message:', {
      assistantMessageCount: assistantMessages.length,
      hasText: !!message,
      textLength: message.length,
      textPreview: message.substring(0, 100)
    });

    // Validate response - must have content
    if (!message || message.trim().length === 0) {
      console.error('[AbacusProvider] Empty response detected - triggering fallback');
      throw new Error('Abacus returned empty response');
    }

    console.log('[AbacusProvider] ✅ Valid response received');
    return {
      message: message.trim(),
      model: 'Susan AI-21',
      provider: 'Abacus.AI'
    };
  }
}

class HuggingFaceProvider {
  async call(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    // Skip if API key is not configured (optional provider)
    if (!apiKey || apiKey === 'your_huggingface_api_key_here') {
      console.log('[HuggingFaceProvider] API key not configured - skipping');
      throw new Error('HUGGINGFACE_API_KEY not configured - add to Railway env vars for HuggingFace backup');
    }

    // Try multiple models in order of availability
    // Start with popular, fast models
    const models = [
      'Qwen/Qwen2.5-7B-Instruct',           // Qwen3 model (if you meant Qwen2.5)
      'Qwen/Qwen2.5-Coder-7B-Instruct',     // Qwen coder variant
      'mistralai/Mistral-7B-Instruct-v0.2', // Mistral (reliable fallback)
      'microsoft/phi-2',                     // Phi-2 (fast)
      'google/flan-t5-large'                 // T5 (backup)
    ];

    // Environment variable takes highest priority
    const preferredModel = process.env.HUGGINGFACE_MODEL;
    if (preferredModel) {
      console.log(`[HuggingFaceProvider] Using configured model: ${preferredModel}`);
      models.unshift(preferredModel);
    }

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[HuggingFaceProvider] Trying model: ${model}`);

        // Convert messages to a simple, model-agnostic prompt
        const prompt = this.formatPrompt(messages);

        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 512,
              temperature: 0.7,
              top_p: 0.9,
              return_full_text: false
            }
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`[HuggingFaceProvider] Model ${model} failed:`, errorText);

          // Handle model loading
          if (response.status === 503 || errorText.includes('loading')) {
            lastError = new Error(`Model ${model} is loading`);
            continue; // Try next model
          }

          lastError = new Error(`HuggingFace API error: ${response.status}`);
          continue; // Try next model
        }

        const result = await response.json();
        const message = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;

        // Validate response - must have content
        if (!message || message.trim().length === 0) {
          console.log(`[HuggingFaceProvider] Model ${model} returned empty response`);
          lastError = new Error('HuggingFace returned empty response');
          continue; // Try next model
        }

        console.log(`[HuggingFaceProvider] ✅ Success with model: ${model}`);
        return {
          message: message.trim(),
          model: model,
          provider: 'HuggingFace'
        };
      } catch (error: any) {
        console.log(`[HuggingFaceProvider] Model ${model} error:`, error.message);
        lastError = error;
        continue; // Try next model
      }
    }

    // All models failed
    throw lastError || new Error('HuggingFace: All models failed');
  }

  private formatPrompt(messages: AIMessage[]): string {
    // Simple role-tagged prompt that works across most models
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n`;
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }

    prompt += 'Assistant: ';
    return prompt;
  }
}

class OllamaProvider {
  async call(messages: AIMessage[]): Promise<AIResponse> {
    const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';

    // Try multiple models in order of preference
    const models = [
      'qwen2.5:7b',      // Preferred model
      'qwen2.5:14b',     // Fallback if 7b not available
      'qwen3-coder:latest', // Alternative
      'gemma2:latest'    // Final fallback
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[OllamaProvider] Trying model: ${model}`);

        // Try to connect to Ollama
        const response = await fetch(`${ollamaUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: model,
            messages: messages.map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            stream: false
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.log(`[OllamaProvider] Model ${model} failed:`, errorText);
          lastError = new Error(`Ollama API error: ${response.status} - ${errorText}`);
          continue; // Try next model
        }

        const data = await response.json();
        const message = data.message?.content || '';

        // Validate response - must have content
        if (!message || message.trim().length === 0) {
          console.log(`[OllamaProvider] Model ${model} returned empty response`);
          lastError = new Error('Ollama returned empty response');
          continue; // Try next model
        }

        console.log(`[OllamaProvider] ✅ Success with model: ${model}`);
        return {
          message: message.trim(),
          model: `Ollama ${model}`,
          provider: 'Ollama (Local)'
        };
      } catch (error: any) {
        console.log(`[OllamaProvider] Model ${model} error:`, error.message);
        lastError = error;
        continue; // Try next model
      }
    }

    // All models failed
    throw lastError || new Error('Ollama: All models failed');
  }
}

class StaticKnowledgeProvider {
  private knowledgeBase: Map<string, string> = new Map();
  private offlineEntries: Array<{ keywords?: string[]; answer: string }> = [];

  constructor() {
    this.loadKnowledgeBase();
    this.tryLoadExternalKB();
  }

  async call(messages: AIMessage[]): Promise<AIResponse> {
    const userMessage = messages[messages.length - 1]?.content.toLowerCase() || '';

    // Try to find relevant knowledge
    const response = this.findRelevantKnowledge(userMessage);

    return {
      message: response,
      model: 'Static Knowledge Base',
      provider: 'Offline',
      offline: true,
      confidence: 0.7
    };
  }

  private loadKnowledgeBase(): void {
    // Common roofing questions and answers
    this.knowledgeBase.set('double layer',
      `DOUBLE LAYER REPLACEMENT REQUIREMENTS:

Per IRC Section R908.3 (VA/MD/PA):
"Roof replacement shall include the removal of ALL existing layers of roof coverings down to the roof deck."

IRC Section 1511.3.1.1 - Critical Exception:
Roof recover is PROHIBITED when TWO OR MORE layers already exist. This means:
- Double-layer roofs CANNOT be recovered
- Double-layer roofs CANNOT be repaired by overlay
- The ONLY legal option is FULL REPLACEMENT with complete tear-off

Your Legal Argument:
"Building code explicitly prohibits roof recover on double-layer roofs. Section 1511.3.1.1 states roof recover is not permitted where existing roof has two or more applications. Therefore, partial replacement is not code-compliant and full tear-off is required."`
    );

    this.knowledgeBase.set('low slope',
      `LOW SLOPE / FLAT ROOF REQUIREMENTS:

Virginia Residential Code R905.2.2:
"Asphalt shingles shall be used only on roof slopes of two units vertical in 12 units horizontal (17-percent slope) or greater."

This means:
- Minimum slope: 2:12 (2 inches of rise per 12 inches of run)
- Slopes below 2:12 require different roofing materials (TPO, EPDM, etc.)
- Shingles on low-slope roofs violate building code

Your Legal Argument:
"The existing roof slope is below 2:12 minimum required for asphalt shingles. Per R905.2.2, shingles are prohibited on this slope. The roof must be replaced with appropriate low-slope roofing system."`
    );

    this.knowledgeBase.set('matching',
      `MARYLAND MATCHING REQUIREMENTS:

Maryland Insurance Administration Bulletin 18-23:
"When replacing roofing materials, the insurer shall replace the damaged roofing materials with materials of like kind and quality."

Maryland Code § 27-303 (Unfair Claim Settlement Practices):
Failing to match materials is an unfair settlement practice with penalties up to $2,500 per violation.

Your Legal Argument:
"Maryland law requires matching 'like kind and quality.' Since the damaged shingles are discontinued and unavailable, the insurer must replace the entire visible roof section to maintain uniformity as required by Bulletin 18-23."`
    );

    this.knowledgeBase.set('gaf',
      `GAF MANUFACTURER REQUIREMENTS:

GAF Storm Damage Guidelines:
"Creased shingles have lost their sealant bond and cannot be repaired. Wind-lifted shingles that have been creased must be replaced."

Key GAF Principles:
1. Creasing = functional damage (not cosmetic)
2. Creased shingles lose wind resistance
3. Repairs void warranty
4. Replacement required for warranty compliance

Your Legal Argument:
"GAF manufacturer guidelines state creased shingles cannot be repaired and must be replaced. Attempting repair would void the warranty and leave the homeowner without manufacturer coverage."`
    );

    this.knowledgeBase.set('storm date',
      `STORM DATE VERIFICATION:

If adjuster claims wrong storm date:

1. Obtain Official Weather Records:
   - NOAA Storm Events Database
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
- Escalation to claims supervisor`
    );

    this.knowledgeBase.set('insurance companies',
      `I have information on 49 major insurance companies including contact details, apps, and responsiveness scores.

Would you like to:
1. Search for a specific insurance company
2. See the highest-rated companies
3. Get contact information for claims

Please let me know which company you need information about.`
    );
  }

  private findRelevantKnowledge(query: string): string {
    const q = String(query || '').toLowerCase();
    // Check for exact keyword matches
    for (const [keyword, answer] of this.knowledgeBase.entries()) {
      if (q.includes(keyword)) {
        return answer;
      }
    }

    // Try offline entries with simple scoring
    let best = { score: 0, answer: '' };
    const tokens = q.split(/[^a-z0-9]+/).filter(Boolean);
    for (const e of this.offlineEntries) {
      const ans = String(e.answer || '');
      const ansLC = ans.toLowerCase();
      const kws = (e.keywords || []).map(x => String(x).toLowerCase());
      let score = 0;
      for (const kw of kws) if (q.includes(kw)) score += 3;
      for (const t of tokens) if (t.length > 2 && ansLC.includes(t)) score += 1;
      if (score > best.score && score >= 3) best = { score, answer: ans };
    }
    if (best.answer) return best.answer;

    // Default response for offline mode
    return `SUSAN AI - OFFLINE MODE

I'm currently operating in offline mode with limited capabilities. I can help with:

Building Codes - Double layer, low slope, flashing requirements
GAF Requirements - Storm damage guidelines, warranty rules
Maryland Law - Matching requirements, Bulletin 18-23
Insurance Companies - Contact info for 49 major insurers
Common Arguments - Storm date verification, claim denials

Common Questions I Can Answer Offline:
- What are the double layer requirements?
- What does GAF say about creased shingles?
- What is Maryland's matching requirement?
- How do I verify the storm date?
- Which insurance companies are most responsive?

Please try asking one of these questions, or reconnect to internet for full AI capabilities.`;
  }

  // Load additional KB from public/offline-kb.json (server-side)
  private tryLoadExternalKB(): void {
    try {
      // Avoid dynamic import issues; use fs to read JSON at runtime
      const fs = require('fs');
      const path = require('path');
      const kbPath = path.join(process.cwd(), 'public', 'offline-kb.json');
      const insPath = path.join(process.cwd(), 'public', 'offline-insurance.json');
      if (fs.existsSync(kbPath)) {
        const raw = fs.readFileSync(kbPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.entries)) {
          this.offlineEntries = data.entries;
          for (const entry of data.entries) {
            const ans = String(entry.answer || '').trim();
            const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
            for (const kw of keywords) {
              const key = String(kw || '').toLowerCase();
              if (key && ans) {
                // Add to map, later entries can refine earlier ones
                this.knowledgeBase.set(key, ans);
              }
            }
          }
        }
      }

      // Load insurance intel as knowledge entries
      if (fs.existsSync(insPath)) {
        const raw = fs.readFileSync(insPath, 'utf-8');
        const companies = JSON.parse(raw);
        if (Array.isArray(companies)) {
          for (const c of companies) {
            const name = String(c.name || '').trim();
            if (!name) continue;
            const kws = [name.toLowerCase(), name.toLowerCase().replace(/\s+/g, '-')];
            const intel = c.intel || {};
            const summary = [
              name,
              c.phone ? `Phone: ${c.phone}${c.phone_instructions ? ' (' + c.phone_instructions + ')' : ''}` : null,
              c.email ? `Email: ${c.email}` : null,
              intel.best_call_times ? `Best call times: ${intel.best_call_times}` : null,
              intel.current_delays ? `Delays: ${intel.current_delays}` : null,
              intel.proven_workarounds ? `Workarounds: ${intel.proven_workarounds}` : null,
              intel.alternative_channels ? `Alt channels: ${intel.alternative_channels}` : null,
              intel.executive_escalation ? `Exec escalation: ${intel.executive_escalation}` : null,
            ].filter(Boolean).join('\n');
            if (summary) {
              this.offlineEntries.push({ keywords: kws, answer: summary });
              for (const k of kws) this.knowledgeBase.set(k, summary);
            }
          }
        }
      }
    } catch (e) {
      // best-effort; ignore failures and keep built-in answers
    }
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  provider: string = 'unknown'
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Retry] ${provider} attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error: any) {
      console.warn(`[Retry] ${provider} attempt ${attempt} failed:`, error.message);
      lastError = error;

      if (attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        await sleep(backoff);
      }
    }
  }

  throw lastError || new Error(`${provider} failed after ${maxRetries} retries`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// MAIN FAILOVER ORCHESTRATOR
// ============================================================================

export class AIProviderFailover {
  private healthMonitor = new HealthMonitor();
  private abacus = new AbacusProvider();
  private huggingface = new HuggingFaceProvider();
  private ollama = new OllamaProvider();
  private staticKnowledge = new StaticKnowledgeProvider();

  async getResponse(messages: AIMessage[]): Promise<AIResponse> {
    // Add system context
    const enhancedMessages: AIMessage[] = [
      {
        role: 'system',
        content: `You are Susan AI-21, an expert roofing insurance claim assistant. You have comprehensive knowledge of:
- Building codes for VA, MD, PA (double layer, slope, flashing)
- GAF manufacturer requirements and warranty guidelines
- Maryland Insurance Administration matching requirements
- Legal arguments and rebuttals for insurance claims
- Storm damage assessment standards

Always cite specific codes and provide actionable advice.`
      },
      ...messages
    ];

    // Define provider cascade
    const providers = [
      {
        name: 'Abacus.AI',
        call: () => this.abacus.call(enhancedMessages)
      },
      {
        name: 'HuggingFace',
        call: () => this.huggingface.call(enhancedMessages)
      },
      {
        name: 'Ollama',
        call: () => this.ollama.call(enhancedMessages)
      },
      {
        name: 'StaticKnowledge',
        call: () => this.staticKnowledge.call(enhancedMessages)
      }
    ];

    // Try each provider in order
    const attemptedProviders: string[] = [];
    for (const provider of providers) {
      // Skip if circuit breaker is open
      if (this.healthMonitor.shouldSkip(provider.name)) {
        console.log(`[Failover] ⏭️  Skipping ${provider.name} (circuit breaker open)`);
        attemptedProviders.push(`${provider.name} (skipped - circuit breaker)`);
        continue;
      }

      try {
        console.log(`[Failover] 🔄 Attempting ${provider.name}...`);
        attemptedProviders.push(provider.name);
        const response = await callWithRetry(
          () => provider.call(),
          3,
          provider.name
        );

        this.healthMonitor.recordSuccess(provider.name);
        console.log(`[Failover] ✅ SUCCESS with ${provider.name}`);
        return response;

      } catch (error: any) {
        console.error(`[Failover] ❌ ${provider.name} failed:`, error.message);
        this.healthMonitor.recordFailure(provider.name);
        // Continue to next provider
      }
    }

    // All providers failed - return error
    const failedList = attemptedProviders.join(', ');
    console.error(`[Failover] 💥 All providers exhausted. Attempted: ${failedList}`);
    throw new Error(`All AI providers failed (tried: ${failedList}). Please check your internet connection or try again later.`);
  }

  getHealthStatus() {
    return this.healthMonitor.getStatus();
  }

  // Direct call to a specific provider (useful for testing/forcing)
  async getResponseFrom(providerName: 'Abacus.AI' | 'HuggingFace' | 'Ollama' | 'StaticKnowledge', messages: AIMessage[]): Promise<AIResponse> {
    const enhancedMessages: AIMessage[] = [
      {
        role: 'system',
        content: `You are Susan AI-21, an expert roofing insurance claim assistant. You have comprehensive knowledge of:
- Building codes for VA, MD, PA (double layer, slope, flashing)
- GAF manufacturer requirements and warranty guidelines
- Maryland Insurance Administration matching requirements
- Legal arguments and rebuttals for insurance claims
- Storm damage assessment standards

Always cite specific codes and provide actionable advice.`
      },
      ...messages
    ];

    const map: Record<string, () => Promise<AIResponse>> = {
      'Abacus.AI': () => callWithRetry(() => this.abacus.call(enhancedMessages), 3, 'Abacus.AI'),
      'HuggingFace': () => callWithRetry(() => this.huggingface.call(enhancedMessages), 3, 'HuggingFace'),
      'Ollama': () => callWithRetry(() => this.ollama.call(enhancedMessages), 3, 'Ollama'),
      'StaticKnowledge': () => callWithRetry(() => this.staticKnowledge.call(enhancedMessages), 1, 'StaticKnowledge'),
    };

    if (!map[providerName]) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    try {
      const res = await map[providerName]();
      this.healthMonitor.recordSuccess(providerName);
      return res;
    } catch (err: any) {
      this.healthMonitor.recordFailure(providerName);
      throw err;
    }
  }
}

// Export singleton
export const aiFailover = new AIProviderFailover();
