const data = require('../data/susan_ai_embeddings.json');
const docs = new Map();

data.chunks.forEach(c => {
  const f = c.metadata?.filename;
  if(f) {
    if(!docs.has(f)) docs.set(f, []);
    docs.get(f).push(c.text || '');
  }
});

console.log('Sample full document sizes from embeddings:');
const samples = [
  'Sales Operations and Tasks.docx',
  'RoofER_Master_Documents_Updated.pdf',
  'Training Manual.docx',
  'Virginia Residential Building Codes.docx',
  'GAF Storm Damage Guidelines .pdf'
];

samples.forEach(f => {
  if(docs.has(f)) {
    const chunks = docs.get(f);
    const fullLen = chunks.join('').length;
    console.log(`  ${f}: ${fullLen} chars (${chunks.length} chunks)`);
  }
});

// Get overall stats
const sizes = Array.from(docs.entries()).map(([f, chunks]) => ({
  filename: f,
  size: chunks.join('').length
}));

sizes.sort((a, b) => b.size - a.size);

console.log('\nTop 5 largest documents:');
sizes.slice(0, 5).forEach(d => {
  console.log(`  ${d.filename}: ${d.size} chars`);
});

console.log('\nDocuments over 50KB:');
const large = sizes.filter(d => d.size > 50000);
if(large.length > 0) {
  large.forEach(d => {
    console.log(`  ${d.filename}: ${d.size} chars`);
  });
} else {
  console.log('  None (all documents fit within 50KB limit)');
}
