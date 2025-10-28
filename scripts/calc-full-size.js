const data = require('../data/susan_ai_embeddings.json');
const docs = new Map();

data.chunks.forEach(c => {
  const f = c.metadata?.filename;
  if(f) {
    if(!docs.has(f)) docs.set(f, []);
    docs.get(f).push(c.text || '');
  }
});

const largestDocs = Array.from(docs.entries())
  .map(([f,chunks]) => ({
    filename: f,
    size: chunks.join('').length
  }))
  .sort((a,b) => b.size - a.size)
  .slice(0, 10);

console.log('Top 10 largest documents (full size):');
largestDocs.forEach(d => {
  console.log(`  ${d.filename}: ${d.size} chars (${(d.size/1024).toFixed(1)} KB)`);
});

const totalSize = Array.from(docs.entries())
  .reduce((sum, [f,chunks]) => sum + chunks.join('').length, 0);

console.log('\nIf we include full content for all documents:');
console.log(`  Total content size: ${(totalSize/1024/1024).toFixed(2)} MB`);
console.log(`  Average per doc: ${Math.floor(totalSize / docs.size)} chars`);
console.log(`  Number of docs: ${docs.size}`);

console.log('\nWith 50K limit:');
const limited50k = Array.from(docs.entries())
  .reduce((sum, [f,chunks]) => sum + Math.min(chunks.join('').length, 50000), 0);
console.log(`  Total content size: ${(limited50k/1024/1024).toFixed(2)} MB`);

console.log('\nWith 100K limit:');
const limited100k = Array.from(docs.entries())
  .reduce((sum, [f,chunks]) => sum + Math.min(chunks.join('').length, 100000), 0);
console.log(`  Total content size: ${(limited100k/1024/1024).toFixed(2)} MB`);

console.log('\nDocuments that would benefit from 100K limit:');
const over50k = Array.from(docs.entries())
  .filter(([f,chunks]) => chunks.join('').length > 50000)
  .map(([f,chunks]) => ({
    filename: f,
    size: chunks.join('').length,
    truncated: chunks.join('').length - 50000
  }));
console.log(`  Count: ${over50k.length}`);
over50k.forEach(d => {
  console.log(`  ${d.filename}: ${d.size} chars (losing ${d.truncated} chars)`);
});
