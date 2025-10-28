const oldData = require('../public/kb-documents.json.backup');
const newData = require('../public/kb-documents.json');

console.log('BEFORE vs AFTER Comparison\n');
console.log('=' .repeat(80));

// Overall stats
const oldLengths = oldData.map(d => d.content.length);
const newLengths = newData.map(d => d.content.length);

console.log('\nOverall Statistics:');
console.log('  Documents:', newData.length);
console.log('  Old Avg Length:', Math.floor(oldLengths.reduce((a,b) => a+b, 0)/oldLengths.length), 'chars');
console.log('  New Avg Length:', Math.floor(newLengths.reduce((a,b) => a+b, 0)/newLengths.length), 'chars');
console.log('  Old Max Length:', Math.max(...oldLengths), 'chars');
console.log('  New Max Length:', Math.max(...newLengths), 'chars');

// Show improvements for specific documents
console.log('\nSample Document Improvements:');
const samples = [
  'Sales Operations and Tasks.docx',
  'RoofER_Master_Documents_Updated.pdf',
  'Training Manual.docx',
  'Pushback.docx',
  'GAF Storm Damage Guidelines .pdf'
];

samples.forEach(fn => {
  const oldDoc = oldData.find(d => d.filename === fn);
  const newDoc = newData.find(d => d.filename === fn);
  if(oldDoc && newDoc) {
    const improvement = ((newDoc.content.length - oldDoc.content.length) / oldDoc.content.length * 100).toFixed(0);
    console.log(`  ${fn}:`);
    console.log(`    Before: ${oldDoc.content.length} chars`);
    console.log(`    After:  ${newDoc.content.length} chars`);
    console.log(`    Change: +${improvement}% ${newDoc.content.length === 50000 ? '(hit 50K limit)' : '(complete)'}`);
  }
});

// Check truncation status
console.log('\nTruncation Status:');
const oldTruncated = oldData.filter(d => d.content.length >= 1900).length;
const newTruncated = newData.filter(d => d.content.length >= 49000).length;
console.log(`  Old (at 2K limit): ${oldTruncated} documents`);
console.log(`  New (at 50K limit): ${newTruncated} documents`);

// File size
const fs = require('fs');
const oldSize = fs.statSync('./public/kb-documents.json.backup').size;
const newSize = fs.statSync('./public/kb-documents.json').size;
console.log('\nFile Size:');
console.log(`  Before: ${(oldSize / 1024).toFixed(0)} KB`);
console.log(`  After:  ${(newSize / 1024).toFixed(0)} KB`);
console.log(`  Change: +${((newSize - oldSize) / 1024).toFixed(0)} KB (+${((newSize - oldSize) / oldSize * 100).toFixed(0)}%)`);
console.log(`  Status: ${newSize < 50 * 1024 * 1024 ? 'Within 50MB limit ✓' : 'Exceeds 50MB limit ✗'}`);

console.log('\n' + '='.repeat(80));
