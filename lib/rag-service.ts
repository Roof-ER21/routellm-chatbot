/**
 * RAG (Retrieval-Augmented Generation) Service
 *
 * Production-grade RAG system for Susan AI-21
 * - Semantic search using cosine similarity
 * - In-memory caching for performance
 * - OpenAI embeddings for query encoding
 * - Optimized for < 100ms retrieval time
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EmbeddingChunk {
  id: string;
  text: string;
  embedding: number[];
  metadata?: {
    domain?: string;
    section?: string;
    source?: string;
    keywords?: string[];
    qa_id?: string;
  };
}

export interface SearchResult {
  chunk: EmbeddingChunk;
  score: number;
  relevance: 'high' | 'medium' | 'low';
}

export interface RAGContext {
  chunks: SearchResult[];
  sources: string[];
  queryEmbedding?: number[];
  timestamp: number;
  cacheHit: boolean;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Compute cosine similarity between two vectors
 * Optimized for performance - uses single loop
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // Single loop for all calculations
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Generate cache key for query
 */
function getCacheKey(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ============================================================================
// RAG SERVICE
// ============================================================================

export class RAGService {
  private embeddings: EmbeddingChunk[] = [];
  private isLoaded = false;
  private queryCache = new Map<string, RAGContext>();
  private readonly CACHE_TTL = 1000 * 60 * 15; // 15 minutes
  private readonly CACHE_MAX_SIZE = 1000;
  private embeddingDimension = 1536; // OpenAI text-embedding-ada-002

  constructor() {
    // Load embeddings on initialization
    this.loadEmbeddings().catch(err => {
      console.error('[RAGService] Failed to load embeddings:', err);
    });
  }

  /**
   * Load embeddings from JSON file
   * Supports both pre-generated and runtime generation
   */
  private async loadEmbeddings(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');

      // Check for embeddings file
      const embeddingsPath = path.join(process.cwd(), 'data', 'susan_ai_embeddings.json');

      if (!fs.existsSync(embeddingsPath)) {
        console.log('[RAGService] No embeddings file found at:', embeddingsPath);
        console.log('[RAGService] Run: npm run kb:build to generate embeddings');
        this.isLoaded = false;
        return;
      }

      console.log('[RAGService] Loading embeddings from:', embeddingsPath);
      const startTime = Date.now();

      const rawData = fs.readFileSync(embeddingsPath, 'utf-8');
      const data = JSON.parse(rawData);

      // Validate structure
      if (!data.chunks || !Array.isArray(data.chunks)) {
        throw new Error('Invalid embeddings file structure - missing chunks array');
      }

      this.embeddings = data.chunks;
      this.embeddingDimension = data.metadata?.embedding_dimension || 1536;

      const loadTime = Date.now() - startTime;
      console.log(`[RAGService] ✅ Loaded ${this.embeddings.length} embeddings in ${loadTime}ms`);
      console.log(`[RAGService] Embedding dimension: ${this.embeddingDimension}`);

      this.isLoaded = true;

    } catch (error: any) {
      console.error('[RAGService] Error loading embeddings:', error);
      this.isLoaded = false;
      throw error;
    }
  }

  /**
   * Generate embedding for query using OpenAI
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured - required for RAG query embeddings');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: query
        }),
        signal: AbortSignal.timeout(10000) // 10s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const embedding = data.data?.[0]?.embedding;

      if (!embedding || !Array.isArray(embedding)) {
        throw new Error('Invalid embedding response from OpenAI');
      }

      return embedding;

    } catch (error: any) {
      console.error('[RAGService] Error generating query embedding:', error);
      throw error;
    }
  }

  /**
   * Search for relevant chunks using semantic similarity
   *
   * @param query - User query
   * @param topK - Number of results to return (default: 5)
   * @param minScore - Minimum similarity score threshold (default: 0.7)
   */
  async search(
    query: string,
    topK: number = 5,
    minScore: number = 0.7
  ): Promise<RAGContext> {
    const startTime = Date.now();

    // Check feature flag
    const ragEnabled = process.env.RAG_ENABLED !== 'false';
    if (!ragEnabled) {
      console.log('[RAGService] RAG is disabled via RAG_ENABLED flag');
      return {
        chunks: [],
        sources: [],
        timestamp: Date.now(),
        cacheHit: false
      };
    }

    // Check if embeddings are loaded
    if (!this.isLoaded || this.embeddings.length === 0) {
      console.warn('[RAGService] Embeddings not loaded - returning empty results');
      return {
        chunks: [],
        sources: [],
        timestamp: Date.now(),
        cacheHit: false
      };
    }

    // Check cache
    const cacheKey = getCacheKey(query);
    const cached = this.queryCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
      console.log(`[RAGService] ✅ Cache hit for query: "${query.substring(0, 50)}..."`);
      return {
        ...cached,
        cacheHit: true
      };
    }

    try {
      // Generate query embedding
      console.log(`[RAGService] Generating embedding for query: "${query.substring(0, 50)}..."`);
      const queryEmbedding = await this.generateQueryEmbedding(query);

      // Get top-K from environment or use parameter
      const k = parseInt(process.env.RAG_TOP_K || String(topK));

      // Compute similarities for all chunks
      const similarities: SearchResult[] = [];

      for (const chunk of this.embeddings) {
        const score = cosineSimilarity(queryEmbedding, chunk.embedding);

        if (score >= minScore) {
          similarities.push({
            chunk,
            score,
            relevance: score >= 0.85 ? 'high' : score >= 0.75 ? 'medium' : 'low'
          });
        }
      }

      // Sort by score descending and take top-K
      similarities.sort((a, b) => b.score - a.score);
      const topResults = similarities.slice(0, k);

      // Extract unique sources
      const sources = Array.from(
        new Set(
          topResults
            .map(r => r.chunk.metadata?.source)
            .filter(Boolean) as string[]
        )
      );

      const result: RAGContext = {
        chunks: topResults,
        sources,
        queryEmbedding,
        timestamp: Date.now(),
        cacheHit: false
      };

      // Cache result
      this.queryCache.set(cacheKey, result);

      // Enforce cache size limit
      if (this.queryCache.size > this.CACHE_MAX_SIZE) {
        const firstKey = this.queryCache.keys().next().value;
        this.queryCache.delete(firstKey);
      }

      const searchTime = Date.now() - startTime;
      console.log(`[RAGService] ✅ Found ${topResults.length} relevant chunks in ${searchTime}ms`);
      console.log(`[RAGService] Top scores:`, topResults.slice(0, 3).map(r => r.score.toFixed(3)));

      return result;

    } catch (error: any) {
      console.error('[RAGService] Search error:', error);

      // Return empty results on error (graceful degradation)
      return {
        chunks: [],
        sources: [],
        timestamp: Date.now(),
        cacheHit: false
      };
    }
  }

  /**
   * Format RAG context for LLM prompt injection
   */
  formatContextForPrompt(context: RAGContext): string {
    if (!context.chunks || context.chunks.length === 0) {
      return '';
    }

    const chunks = context.chunks
      .map((result, index) => {
        const source = result.chunk.metadata?.source || 'Unknown';
        const qaId = result.chunk.metadata?.qa_id || '';
        const score = (result.score * 100).toFixed(1);

        return `[${index + 1}] (Source: ${source}${qaId ? `, ${qaId}` : ''}, Relevance: ${score}%)
${result.chunk.text}`;
      })
      .join('\n\n');

    return `Based on these company knowledge base documents:

${chunks}

---`;
  }

  /**
   * Get service status and statistics
   */
  getStatus() {
    return {
      loaded: this.isLoaded,
      totalChunks: this.embeddings.length,
      cacheSize: this.queryCache.size,
      embeddingDimension: this.embeddingDimension,
      enabled: process.env.RAG_ENABLED !== 'false'
    };
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.queryCache.clear();
    console.log('[RAGService] Cache cleared');
  }

  /**
   * Reload embeddings (useful if embeddings file is updated)
   */
  async reload(): Promise<void> {
    console.log('[RAGService] Reloading embeddings...');
    this.embeddings = [];
    this.isLoaded = false;
    this.clearCache();
    await this.loadEmbeddings();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let ragServiceInstance: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService();
  }
  return ragServiceInstance;
}

// Export singleton instance
export const ragService = getRAGService();
