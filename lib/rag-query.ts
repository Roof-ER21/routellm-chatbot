/**
 * RAG Query System
 *
 * Semantic search and retrieval for insurance knowledge base
 * Uses PostgreSQL + pgvector for fast vector similarity search
 */

import { Pool } from 'pg';

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RAGResult {
  documentId: string;
  filename: string;
  chunkText: string;
  score: number;
  metadata: {
    category: string;
    scenarios?: string[];
    states?: string[];
    tags?: string[];
  };
  chunkIndex: number;
  totalChunks: number;
}

export interface RAGQueryOptions {
  topK?: number;
  minScore?: number;
  category?: string;
  state?: string;
  useCache?: boolean;
}

export interface RAGQueryResult {
  query: string;
  results: RAGResult[];
  totalResults: number;
  queryTime: number;
  fromCache: boolean;
}

// ============================================================================
// RAG QUERY FUNCTIONS
// ============================================================================

/**
 * Generate embedding for query using OpenAI
 */
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Query RAG system with semantic search
 */
export async function queryRAG(
  query: string,
  options: RAGQueryOptions = {}
): Promise<RAGQueryResult> {
  const startTime = Date.now();

  const {
    topK = 5,
    minScore = 0.7,
    category,
    state,
    useCache = true,
  } = options;

  try {
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Build SQL query with filters
    let sqlQuery = `
      SELECT
        c.id,
        c.document_id,
        c.text,
        c.chunk_index,
        c.total_chunks,
        d.filename,
        d.metadata,
        1 - (c.embedding <=> $1::vector) as score
      FROM rag_chunks c
      JOIN rag_documents d ON c.document_id = d.id
      WHERE 1 - (c.embedding <=> $1::vector) > $2
    `;

    const params: any[] = [`[${queryEmbedding.join(',')}]`, minScore];
    let paramIndex = 2;

    // Add category filter
    if (category) {
      paramIndex++;
      sqlQuery += ` AND d.metadata->>'category' = $${paramIndex}`;
      params.push(category);
    }

    // Add state filter
    if (state) {
      paramIndex++;
      sqlQuery += ` AND d.metadata->'states' @> $${paramIndex}::jsonb`;
      params.push(JSON.stringify([state]));
    }

    // Order by score and limit
    sqlQuery += `
      ORDER BY score DESC
      LIMIT $${paramIndex + 1}
    `;
    params.push(topK);

    // Execute query
    const result = await pool.query(sqlQuery, params);

    // Transform results
    const ragResults: RAGResult[] = result.rows.map((row: any) => ({
      documentId: row.document_id,
      filename: row.filename,
      chunkText: row.text,
      score: parseFloat(row.score),
      metadata: row.metadata,
      chunkIndex: row.chunk_index,
      totalChunks: row.total_chunks,
    }));

    const queryTime = Date.now() - startTime;

    // Log analytics
    await logQueryAnalytics(query, ragResults.length, queryTime, false);

    return {
      query,
      results: ragResults,
      totalResults: ragResults.length,
      queryTime,
      fromCache: false,
    };

  } catch (error: any) {
    console.error('[RAG Query Error]', error.message);

    // Return empty results on error
    return {
      query,
      results: [],
      totalResults: 0,
      queryTime: Date.now() - startTime,
      fromCache: false,
    };
  }
}

/**
 * Format RAG results for LLM context injection
 */
export function formatRAGContext(results: RAGResult[]): string {
  if (results.length === 0) {
    return '';
  }

  const contextParts = [
    '## Retrieved Knowledge Base Context\n',
    'The following information was retrieved from our knowledge base to help answer your question:\n',
  ];

  results.forEach((result, index) => {
    const categoryLabel = result.metadata.category.replace(/_/g, ' ').toUpperCase();
    const sourceInfo = `**[${index + 1}]** ${result.filename} (${categoryLabel}) - Relevance: ${(result.score * 100).toFixed(1)}%`;

    contextParts.push(`\n${sourceInfo}\n`);
    contextParts.push(`${result.chunkText}\n`);
    contextParts.push(`---\n`);
  });

  return contextParts.join('');
}

/**
 * Get citations from RAG results for response
 */
export function getRAGCitations(results: RAGResult[]): string[] {
  return results.map((result, index) => {
    const category = result.metadata.category.replace(/_/g, ' ');
    return `[${index + 1}] ${result.filename} (${category}) - Score: ${(result.score * 100).toFixed(1)}%`;
  });
}

/**
 * Log query analytics to database
 */
async function logQueryAnalytics(
  query: string,
  resultCount: number,
  queryTime: number,
  fromCache: boolean
): Promise<void> {
  try {
    await pool.query(`
      INSERT INTO rag_analytics (
        query_text,
        result_count,
        query_latency_ms,
        from_cache,
        timestamp
      )
      VALUES ($1, $2, $3, $4, NOW())
    `, [query, resultCount, queryTime, fromCache]);
  } catch (error: any) {
    // Don't fail the query if analytics logging fails
    console.error('[RAG Analytics Error]', error.message);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract insurance scenario from user query
 */
export function extractScenario(query: string): string | undefined {
  const scenarioKeywords = {
    'partial_replacement': ['partial', 'partial replacement', 'half', 'section'],
    'full_denial': ['denial', 'denied', 'rejected', 'full denial'],
    'matching_dispute': ['matching', 'match', 'shingle match', 'color match'],
    'double_layer': ['double layer', 'two layer', 'overlay', 'second layer'],
    'low_slope': ['low slope', 'flat roof', 'low pitch', '2:12'],
    'creased_shingles': ['creased', 'crease', 'shipping damage'],
    'discontinued_shingles': ['discontinued', 'no longer available', 'obsolete'],
  };

  const lowerQuery = query.toLowerCase();

  for (const [scenario, keywords] of Object.entries(scenarioKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      return scenario;
    }
  }

  return undefined;
}

/**
 * Extract state from user query
 */
export function extractState(query: string): string | undefined {
  const statePatterns = [
    /\b(VA|Virginia)\b/i,
    /\b(MD|Maryland)\b/i,
    /\b(PA|Pennsylvania)\b/i,
    /\b(NJ|New Jersey)\b/i,
    /\b(DE|Delaware)\b/i,
  ];

  const stateMap: Record<string, string> = {
    'VA': 'VA',
    'Virginia': 'VA',
    'MD': 'MD',
    'Maryland': 'MD',
    'PA': 'PA',
    'Pennsylvania': 'PA',
    'NJ': 'NJ',
    'New Jersey': 'NJ',
    'DE': 'DE',
    'Delaware': 'DE',
  };

  for (const pattern of statePatterns) {
    const match = query.match(pattern);
    if (match) {
      const matchedState = match[1];
      return stateMap[matchedState] || matchedState;
    }
  }

  return undefined;
}

/**
 * Determine if query needs RAG lookup
 */
export function shouldUseRAG(query: string): boolean {
  // Always use RAG for insurance-related queries
  const ragKeywords = [
    'code', 'irc', 'ibc', 'building code',
    'gaf', 'warranty', 'manufacturer',
    'template', 'email', 'letter',
    'argument', 'pushback', 'denial',
    'shingle', 'roof', 'replacement',
    'insurance', 'adjuster', 'claim',
    'what', 'how', 'why', 'when', 'where',
  ];

  const lowerQuery = query.toLowerCase();

  return ragKeywords.some(keyword => lowerQuery.includes(keyword));
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  queryRAG,
  formatRAGContext,
  getRAGCitations,
  extractScenario,
  extractState,
  shouldUseRAG,
};
