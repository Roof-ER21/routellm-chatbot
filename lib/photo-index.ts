/**
 * Photo Index - Maps roofing terms to knowledge base images
 *
 * This module creates a searchable index of all roofing photo examples
 * from the knowledge base for Susan AI-21 to reference in responses.
 */

import photoLabels from '../public/kb-photo-labels.json';
import imageManifest from '../public/kb-images-manifest.json';

export interface PhotoExample {
  imageUrl: string;
  label: string;
  documentId: string;
  pageNumber: number;
  imageNumber: number;
}

export interface PhotoIndexEntry {
  term: string;
  keywords: string[];
  examples: PhotoExample[];
}

/**
 * Build the complete photo index from photo labels JSON
 */
function buildPhotoIndex(): Map<string, PhotoIndexEntry> {
  const index = new Map<string, PhotoIndexEntry>();

  // Process each document's photo labels
  Object.entries(photoLabels).forEach(([documentId, pages]) => {
    Object.entries(pages as Record<string, string[]>).forEach(([pageKey, labels]) => {
      const pageNumber = parseInt(pageKey.replace('page', ''));

      labels.forEach((label, imageIndex) => {
        // Extract terms from label
        const terms = extractTermsFromLabel(label);

        // Create photo example
        const photoExample: PhotoExample = {
          imageUrl: constructImageUrl(documentId, pageNumber, imageIndex + 1),
          label,
          documentId,
          pageNumber,
          imageNumber: imageIndex + 1
        };

        // Add to index for each term
        terms.forEach(term => {
          if (!index.has(term)) {
            index.set(term, {
              term,
              keywords: getKeywordsForTerm(term),
              examples: []
            });
          }
          index.get(term)!.examples.push(photoExample);
        });
      });
    });
  });

  return index;
}

/**
 * Extract roofing terms from photo labels
 */
function extractTermsFromLabel(label: string): string[] {
  const terms: string[] = [];
  const normalized = label.toLowerCase();

  // Common roofing components - ORDER MATTERS: check longer phrases first!
  const componentMap: Record<string, string[]> = {
    'step flashing': ['step flashing', 'flashing', 'step'],
    'chimney flashing': ['chimney', 'chimney flashing', 'flashing'],
    'chimney': ['chimney', 'chimney flashing'],
    'counter/apron flashing': ['counter flashing', 'apron flashing', 'flashing', 'counter', 'apron'],
    'counter flashing': ['counter flashing', 'counter/apron flashing', 'flashing', 'counter', 'apron'],
    'apron flashing': ['apron flashing', 'counter/apron flashing', 'flashing', 'apron'],
    'skylight flashing': ['skylight', 'skylight flashing', 'flashing'],
    'skylight': ['skylight', 'skylight flashing'],
    'ridge vent': ['ridge', 'ridge vent', 'vent', 'ventilation'],
    'ice and water shield': ['ice and water shield', 'iws', 'underlayment'],
    'drip edge': ['drip edge', 'drip', 'edge metal'],
    'drip/iws/layers': ['drip edge', 'ice and water shield', 'layers', 'drip', 'iws'], // Handle compound labels
    'drip': ['drip edge', 'drip'], // Shorter match for "drip" alone
    'iws': ['ice and water shield', 'iws', 'underlayment'],
    'overhang': ['overhang', 'eave', 'soffit'],
    'gutter width/covers': ['gutter', 'gutter width', 'gutter covers'],
    'gutter': ['gutter', 'gutter width', 'gutter covers'],
    'valley': ['valley', 'valley flashing'],
    'exhaust cap': ['exhaust', 'exhaust cap', 'vent'],
    'shingle damage': ['shingle damage', 'damage', 'shingles', 'shingle'],
    'test square': ['test square', 'test squares', 'testing'],
    'slope overview': ['slope', 'overview', 'roof slope'],
    'elevation': ['elevation', 'house elevation'],
    'metals': ['metals', 'metal work', 'flashing'],
    'interior': ['interior', 'attic', 'inside'],
    'house overview': ['overview', 'house', 'property'],
    'house number': ['house number', 'address'],
    'layers': ['layers', 'roof layers', 'shingle layers']
  };

  // Check each component pattern
  Object.entries(componentMap).forEach(([pattern, termList]) => {
    if (normalized.includes(pattern)) {
      terms.push(...termList);
    }
  });

  // Additional fallback patterns for generic terms
  if (terms.length === 0) {
    if (normalized.includes('flashing')) terms.push('flashing');
    if (normalized.includes('damage')) terms.push('damage');
    if (normalized.includes('vent')) terms.push('vent', 'ventilation');
    if (normalized.includes('metal')) terms.push('metals');
    if (normalized.includes('shingle')) terms.push('shingles');
    if (normalized.includes('drip')) terms.push('drip edge', 'drip');
  }

  return Array.from(new Set(terms)); // Remove duplicates
}

/**
 * Get additional keywords for search term matching
 */
function getKeywordsForTerm(term: string): string[] {
  const keywordMap: Record<string, string[]> = {
    'step flashing': ['step', 'flashing', 'sidewall', 'wall flashing', 'step-flashing'],
    'chimney': ['chimney', 'fireplace', 'chimney cricket', 'saddle'],
    'chimney flashing': ['chimney', 'flashing', 'base flashing', 'cap flashing'],
    'counter flashing': ['counter', 'apron', 'flashing', 'wall', 'counterflashing'],
    'apron flashing': ['apron', 'flashing', 'front', 'head wall'],
    'skylight': ['skylight', 'window', 'curb', 'sky light'],
    'skylight flashing': ['skylight', 'flashing', 'curb flashing'],
    'ridge': ['ridge', 'peak', 'ridge cap', 'ridge line'],
    'ridge vent': ['ridge', 'vent', 'ventilation', 'ridge-vent', 'air vent'],
    'drip edge': ['drip', 'edge', 'drip-edge', 'eave edge', 'metal edge'],
    'ice and water shield': ['iws', 'ice', 'water', 'shield', 'underlayment', 'ice & water'],
    'overhang': ['overhang', 'eave', 'soffit', 'fascia', 'rake'],
    'gutter': ['gutter', 'gutter system', 'downspout', 'drainage'],
    'valley': ['valley', 'valley flashing', 'open valley', 'closed valley'],
    'exhaust': ['exhaust', 'vent', 'pipe', 'stack', 'penetration'],
    'exhaust cap': ['exhaust', 'cap', 'vent cap', 'jack', 'boot'],
    'damage': ['damage', 'hail', 'wind', 'wear', 'deterioration', 'broken'],
    'shingle damage': ['shingle', 'damage', 'missing', 'cracked', 'torn', 'granule loss'],
    'test square': ['test', 'square', 'testing', 'inspection area'],
    'slope': ['slope', 'pitch', 'angle', 'facet'],
    'elevation': ['elevation', 'side', 'view', 'front', 'rear', 'left', 'right'],
    'metals': ['metal', 'flashing', 'trim', 'edge metal', 'gable trim'],
    'interior': ['interior', 'attic', 'inside', 'ceiling', 'rafters'],
    'overview': ['overview', 'full view', 'perspective', 'aerial'],
    'layers': ['layers', 'tear-off', 'existing', 'multiple layers']
  };

  return keywordMap[term.toLowerCase()] || [term];
}

/**
 * Construct image URL from document ID, page number, and image number
 */
function constructImageUrl(documentId: string, pageNumber: number, imageNumber: number): string {
  return `/kb-images/${documentId}_page${pageNumber}_img${imageNumber}.png`;
}

/**
 * Common roofing search terms mapped to standardized terms
 */
const SEARCH_TERM_ALIASES: Record<string, string[]> = {
  // Flashing variations
  'flashing': ['step flashing', 'chimney flashing', 'counter flashing', 'apron flashing', 'skylight flashing', 'valley'],
  'step': ['step flashing'],
  'sidewall flashing': ['step flashing'],
  'wall flashing': ['step flashing', 'counter flashing'],

  // Chimney variations
  'fireplace': ['chimney'],
  'chimney cricket': ['chimney'],
  'saddle': ['chimney'],

  // Ridge variations
  'peak': ['ridge', 'ridge vent'],
  'ridge cap': ['ridge', 'ridge vent'],
  'ridge line': ['ridge', 'ridge vent'],

  // Ventilation variations
  'vent': ['ridge vent', 'exhaust cap'],
  'ventilation': ['ridge vent', 'exhaust cap'],
  'air vent': ['ridge vent'],
  'exhaust vent': ['exhaust cap'],
  'pipe vent': ['exhaust cap'],
  'plumbing vent': ['exhaust cap'],

  // Edge variations
  'drip': ['drip edge'],
  'edge metal': ['drip edge', 'metals'],
  'eave edge': ['drip edge', 'overhang'],

  // Underlayment variations
  'iws': ['ice and water shield'],
  'ice shield': ['ice and water shield'],
  'water shield': ['ice and water shield'],
  'underlayment': ['ice and water shield'],

  // Eave variations
  'eave': ['overhang', 'drip edge'],
  'soffit': ['overhang'],
  'fascia': ['overhang', 'metals'],
  'rake': ['overhang', 'metals'],

  // Damage variations
  'hail damage': ['shingle damage', 'damage'],
  'wind damage': ['shingle damage', 'damage'],
  'storm damage': ['shingle damage', 'damage'],
  'granule loss': ['shingle damage', 'damage'],
  'missing shingles': ['shingle damage', 'damage'],
  'cracked shingles': ['shingle damage', 'damage'],

  // General terms
  'roof': ['overview', 'slope', 'elevation'],
  'inspection': ['test square', 'overview'],
  'penetration': ['exhaust cap', 'skylight'],
  'trim': ['metals', 'drip edge']
};

// Build index on module load
const photoIndex = buildPhotoIndex();

/**
 * Get all photo examples for a specific term
 */
export function getPhotosByTerm(term: string): PhotoExample[] {
  const normalized = term.toLowerCase().trim();
  const entry = photoIndex.get(normalized);
  return entry ? entry.examples : [];
}

/**
 * Search for photos matching a query
 * Returns photos sorted by relevance
 */
export function searchPhotos(query: string, limit: number = 10): PhotoExample[] {
  const normalized = query.toLowerCase().trim();
  const results = new Map<string, { photo: PhotoExample; score: number }>();

  // Direct term matches
  const directMatches = getPhotosByTerm(normalized);
  directMatches.forEach(photo => {
    const key = photo.imageUrl;
    if (!results.has(key)) {
      results.set(key, { photo, score: 100 });
    }
  });

  // Alias matches
  const aliases = SEARCH_TERM_ALIASES[normalized] || [];
  aliases.forEach(alias => {
    const matches = getPhotosByTerm(alias);
    matches.forEach(photo => {
      const key = photo.imageUrl;
      if (!results.has(key)) {
        results.set(key, { photo, score: 90 });
      }
    });
  });

  // Keyword matches
  photoIndex.forEach(entry => {
    if (entry.keywords.some(keyword => keyword.includes(normalized) || normalized.includes(keyword))) {
      entry.examples.forEach(photo => {
        const key = photo.imageUrl;
        if (!results.has(key)) {
          results.set(key, { photo, score: 70 });
        }
      });
    }
  });

  // Label substring matches
  photoIndex.forEach(entry => {
    entry.examples.forEach(photo => {
      if (photo.label.toLowerCase().includes(normalized)) {
        const key = photo.imageUrl;
        if (!results.has(key)) {
          results.set(key, { photo, score: 50 });
        }
      }
    });
  });

  // Sort by score and return top results
  const sortedResults = Array.from(results.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.photo);

  return sortedResults;
}

/**
 * Get all available terms in the photo index
 */
export function getAllPhotoTerms(): string[] {
  return Array.from(photoIndex.keys()).sort();
}

/**
 * Get statistics about the photo index
 */
export function getPhotoIndexStats() {
  let totalPhotos = 0;
  photoIndex.forEach(entry => {
    totalPhotos += entry.examples.length;
  });

  return {
    totalTerms: photoIndex.size,
    totalPhotos,
    documentsIndexed: Object.keys(imageManifest).length,
    terms: getAllPhotoTerms()
  };
}

export { photoIndex };
