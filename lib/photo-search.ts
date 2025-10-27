/**
 * Photo Search Service for Susan AI-21
 *
 * Provides intelligent photo search and reference generation
 * for visual roofing examples in knowledge base responses.
 */

import { searchPhotos, getPhotosByTerm, PhotoExample } from './photo-index';

export interface PhotoSearchResult {
  examples: PhotoExample[];
  searchTerm: string;
  knowledgeBaseUrl: string;
  totalFound: number;
}

export interface PhotoReference {
  id: string;
  term: string;
  imageUrl: string;
  thumbnailUrl: string;
  label: string;
  documentId: string;
  knowledgeBaseUrl: string;
}

/**
 * Convert PhotoExample to PhotoReference with actual URLs
 */
export function convertToPhotoReference(example: PhotoExample, term: string): PhotoReference {
  // example.imageUrl is already the full path like /kb-images/DOC_ID_page1_img1.png
  const imageUrl = example.imageUrl;
  const thumbnailUrl = example.imageUrl.replace('.png', '_thumb.png');
  const kbUrl = `/knowledge-base?search=${encodeURIComponent(term)}&doc=${example.documentId}`;

  return {
    id: example.imageUrl, // Use full URL as unique ID
    term,
    imageUrl,
    thumbnailUrl,
    label: example.label || `${term} example`,
    documentId: example.documentId,
    knowledgeBaseUrl: kbUrl
  };
}

/**
 * Search for photo examples matching a query
 */
export function searchPhotoExamples(query: string, limit: number = 5): PhotoSearchResult {
  const examples = searchPhotos(query, limit);

  return {
    examples,
    searchTerm: query,
    knowledgeBaseUrl: generateKnowledgeBaseUrl(query),
    totalFound: examples.length
  };
}

/**
 * Get top photo references for a term (with actual URLs)
 */
export function getTopPhotoReferences(term: string, limit: number = 2): PhotoReference[] {
  const examples = getPhotosByTerm(term).slice(0, limit);
  return examples.map(ex => convertToPhotoReference(ex, term));
}

/**
 * Generate knowledge base URL with search filter
 */
function generateKnowledgeBaseUrl(searchTerm: string): string {
  const baseUrl = '/knowledge-base';
  const encodedTerm = encodeURIComponent(searchTerm);
  return `${baseUrl}?search=${encodedTerm}`;
}

/**
 * Detect if user query is asking for visual examples
 */
export function isVisualQuery(query: string): boolean {
  const visualKeywords = [
    'show me',
    'what does',
    'look like',
    'looks like',
    'picture',
    'photo',
    'image',
    'example',
    'see',
    'visual',
    'where is',
    'where\'s',
    'locate',
    'find',
    'identify',
    'recognize',
    'appearance',
    'how to spot',
    'what is the',
    'diagram'
  ];

  const normalized = query.toLowerCase();
  return visualKeywords.some(keyword => normalized.includes(keyword));
}

/**
 * Extract roofing terms from a user query
 */
export function extractRoofingTerms(query: string): string[] {
  const terms: string[] = [];
  const normalized = query.toLowerCase();

  // Common roofing terms to look for
  const roofingTerms = [
    'step flashing',
    'chimney flashing',
    'chimney',
    'counter flashing',
    'apron flashing',
    'skylight flashing',
    'skylight',
    'ridge vent',
    'ridge',
    'drip edge',
    'ice and water shield',
    'overhang',
    'gutter',
    'valley',
    'exhaust cap',
    'exhaust',
    'shingle damage',
    'damage',
    'flashing',
    'vent',
    'ventilation',
    'soffit',
    'fascia',
    'eave',
    'rake',
    'test square',
    'slope',
    'elevation',
    'metals',
    'interior',
    'attic'
  ];

  // Check for each term (longer terms first to avoid partial matches)
  const sortedTerms = roofingTerms.sort((a, b) => b.length - a.length);

  sortedTerms.forEach(term => {
    if (normalized.includes(term)) {
      terms.push(term);
    }
  });

  return Array.from(new Set(terms)); // Remove duplicates
}

/**
 * Generate photo reference message for Susan's response
 */
export function generatePhotoReference(searchTerm: string, foundCount: number): string {
  if (foundCount === 0) {
    return '';
  }

  const kbUrl = generateKnowledgeBaseUrl(searchTerm);

  return `\n\n📸 I have ${foundCount} photo example${foundCount > 1 ? 's' : ''} of ${searchTerm} in the knowledge base.\nView examples: ${kbUrl}`;
}

/**
 * Analyze query and return photo suggestions for Susan
 */
export function analyzeQueryForPhotos(query: string): {
  hasVisualIntent: boolean;
  suggestedTerms: string[];
  photoReferences: PhotoSearchResult[];
} {
  const hasVisualIntent = isVisualQuery(query);
  const suggestedTerms = extractRoofingTerms(query);

  // Get photo results for each term
  const photoReferences = suggestedTerms.map(term =>
    searchPhotoExamples(term, 5)
  ).filter(result => result.totalFound > 0);

  return {
    hasVisualIntent,
    suggestedTerms,
    photoReferences
  };
}

/**
 * Format photo reference for inclusion in Susan's response
 */
export function formatPhotoReferenceForResponse(analysis: ReturnType<typeof analyzeQueryForPhotos>): string {
  if (analysis.photoReferences.length === 0) {
    return '';
  }

  // If visual intent is clear, be more explicit
  if (analysis.hasVisualIntent) {
    const references = analysis.photoReferences
      .map(ref => `- ${ref.searchTerm}: ${ref.knowledgeBaseUrl} (${ref.totalFound} example${ref.totalFound > 1 ? 's' : ''})`)
      .join('\n');

    return `\n\n📸 Photo Examples Available:\n${references}`;
  }

  // Otherwise, be more subtle
  if (analysis.photoReferences.length === 1) {
    const ref = analysis.photoReferences[0];
    return generatePhotoReference(ref.searchTerm, ref.totalFound);
  }

  // Multiple terms - show compact reference
  const termsList = analysis.photoReferences
    .map(ref => ref.searchTerm)
    .join(', ');

  return `\n\n📸 Photo examples available for: ${termsList}\nView in Knowledge Base: /knowledge-base`;
}

/**
 * Get specific photo examples for a term (used by API/components)
 */
export function getPhotoExamplesForTerm(term: string): PhotoExample[] {
  return getPhotosByTerm(term);
}

/**
 * Check if a specific term has photo examples
 */
export function hasPhotoExamples(term: string): boolean {
  return getPhotosByTerm(term).length > 0;
}

/**
 * Get photo reference instruction for Susan's system prompt
 */
export function getPhotoReferenceInstruction(): string {
  return `
PHOTO EXAMPLES CAPABILITY:

You have access to 299 professional roofing photo examples in the knowledge base covering:
- Step flashing, chimney flashing, counter/apron flashing
- Skylight flashing, valley flashing
- Ridge vents, exhaust caps, ventilation
- Drip edge, ice and water shield, overhangs
- Gutter systems and covers
- Shingle damage (hail, wind, wear)
- Test squares and inspection areas
- Roof slopes, elevations, and overviews
- Metal work and trim
- Interior/attic views

WHEN TO REFERENCE PHOTOS:

1. VISUAL IDENTIFICATION QUESTIONS:
   - "What does [X] look like?"
   - "Where is [X] located?"
   - "Show me [X]"
   - "How do I spot [X]?"

2. INSTALLATION/DAMAGE QUESTIONS:
   - When explaining proper installation
   - When describing damage types
   - When discussing inspection techniques
   - When teaching identification skills

3. TECHNICAL EXPLANATIONS:
   - When explaining roof components
   - When discussing repair procedures
   - When providing training guidance

HOW TO REFERENCE PHOTOS:

Use this format naturally in your responses:

"📸 I can show you photo examples of [topic]. View examples: [Knowledge Base URL]"

Example:
"Step flashing is installed along the sides of chimneys and wall-roof intersections to prevent water infiltration. Each piece should overlap the one below it by at least 2 inches.

📸 I have 12 photo examples of step flashing installation. View examples: /knowledge-base?search=step+flashing"

IMPORTANT:
- Only mention photos when relevant to the question
- Keep photo references brief and natural
- Always provide the knowledge base link
- Don't force photo references into every response
- Use the 📸 emoji to make references visually distinct
`;
}

// Types are already exported from photo-index.ts
// Re-exporting here causes conflicts, so just import and use them
