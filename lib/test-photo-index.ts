/**
 * Test script for photo index and search functionality
 * Run with: npx tsx lib/test-photo-index.ts
 */

import { searchPhotos, getPhotosByTerm, getPhotoIndexStats, getAllPhotoTerms } from './photo-index';
import { searchPhotoExamples, isVisualQuery, extractRoofingTerms, analyzeQueryForPhotos } from './photo-search';

console.log('=== PHOTO INDEX TEST ===\n');

// Test 1: Get index statistics
console.log('1. Photo Index Statistics:');
const stats = getPhotoIndexStats();
console.log(`   - Total terms indexed: ${stats.totalTerms}`);
console.log(`   - Total photos: ${stats.totalPhotos}`);
console.log(`   - Documents indexed: ${stats.documentsIndexed}`);
console.log('');

// Test 2: Show some indexed terms
console.log('2. Sample indexed terms:');
const allTerms = getAllPhotoTerms();
console.log(`   ${allTerms.slice(0, 20).join(', ')}...`);
console.log('');

// Test 3: Search for specific terms
console.log('3. Search for "step flashing":');
const stepFlashingResults = searchPhotos('step flashing', 5);
console.log(`   Found ${stepFlashingResults.length} examples`);
stepFlashingResults.forEach((photo, idx) => {
  console.log(`   ${idx + 1}. ${photo.label} - ${photo.imageUrl}`);
});
console.log('');

console.log('4. Search for "chimney":');
const chimneyResults = searchPhotos('chimney', 5);
console.log(`   Found ${chimneyResults.length} examples`);
chimneyResults.forEach((photo, idx) => {
  console.log(`   ${idx + 1}. ${photo.label} - ${photo.imageUrl}`);
});
console.log('');

console.log('5. Search for "damage":');
const damageResults = searchPhotos('damage', 5);
console.log(`   Found ${damageResults.length} examples`);
damageResults.forEach((photo, idx) => {
  console.log(`   ${idx + 1}. ${photo.label} - ${photo.imageUrl}`);
});
console.log('');

console.log('6. Search for "ridge vent":');
const ridgeVentResults = searchPhotos('ridge vent', 5);
console.log(`   Found ${ridgeVentResults.length} examples`);
ridgeVentResults.forEach((photo, idx) => {
  console.log(`   ${idx + 1}. ${photo.label} - ${photo.imageUrl}`);
});
console.log('');

// Test 4: Test visual query detection
console.log('7. Visual Query Detection:');
const testQueries = [
  "What does step flashing look like?",
  "Where is the drip edge?",
  "Show me examples of hail damage",
  "How do I calculate depreciation?",
  "What's the IRC code for matching?"
];

testQueries.forEach(query => {
  const isVisual = isVisualQuery(query);
  console.log(`   "${query}" - Visual: ${isVisual ? 'YES' : 'NO'}`);
});
console.log('');

// Test 5: Extract roofing terms from queries
console.log('8. Extract Roofing Terms:');
const termTestQueries = [
  "Where's step flashing on a roof?",
  "Show me chimney flashing and ridge vent",
  "What does shingle damage from hail look like?"
];

termTestQueries.forEach(query => {
  const terms = extractRoofingTerms(query);
  console.log(`   "${query}"`);
  console.log(`   Extracted: ${terms.join(', ')}`);
});
console.log('');

// Test 6: Full query analysis
console.log('9. Full Query Analysis:');
const analysisQuery = "Where's step flashing on a roof?";
const analysis = analyzeQueryForPhotos(analysisQuery);
console.log(`   Query: "${analysisQuery}"`);
console.log(`   Visual intent: ${analysis.hasVisualIntent}`);
console.log(`   Suggested terms: ${analysis.suggestedTerms.join(', ')}`);
console.log(`   Photo references found: ${analysis.photoReferences.length}`);
analysis.photoReferences.forEach(ref => {
  console.log(`     - ${ref.searchTerm}: ${ref.totalFound} examples`);
  console.log(`       URL: ${ref.knowledgeBaseUrl}`);
});
console.log('');

// Test 7: Direct term lookup
console.log('10. Direct term lookup for specific categories:');
const testTerms = ['flashing', 'vent', 'gutter', 'overhang', 'metals'];
testTerms.forEach(term => {
  const photos = getPhotosByTerm(term);
  console.log(`   "${term}": ${photos.length} photos`);
});
console.log('');

console.log('=== TEST COMPLETE ===');
