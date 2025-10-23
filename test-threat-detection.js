/**
 * Test script to verify threat detection integration
 * Run with: node test-threat-detection.js
 */

const { analyzeThreatPatterns } = require('./lib/threat-detection.ts')

console.log('=== Threat Detection Test Suite ===\n')

// Test cases
const testCases = [
  {
    name: 'Clean message',
    message: 'How do I file a roof damage claim?',
    expectThreat: false
  },
  {
    name: 'Competitor contact attempt',
    message: 'I want to start my own roofing company and compete with you',
    expectThreat: true
  },
  {
    name: 'Client poaching',
    message: 'Can I take some clients with me when I leave?',
    expectThreat: true
  },
  {
    name: 'Data theft',
    message: 'How do I export the customer database?',
    expectThreat: true
  },
  {
    name: 'Normal business question',
    message: 'What is the typical claim approval timeline?',
    expectThreat: false
  }
]

// Run tests
testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`)
  console.log(`Message: "${test.message}"`)

  const result = analyzeThreatPatterns(test.message)

  console.log(`Expected threat: ${test.expectThreat}`)
  console.log(`Detected threat: ${result.isSuspicious}`)
  console.log(`Risk score: ${result.riskScore}`)
  console.log(`Severity: ${result.severity}`)

  if (result.isSuspicious) {
    console.log(`Categories: ${result.categories.join(', ')}`)
    console.log(`Matches found: ${result.matches.length}`)
    result.matches.forEach(match => {
      console.log(`  - Pattern: "${match.pattern}"`)
      console.log(`    Category: ${match.category}`)
      console.log(`    Severity: ${match.severity}`)
      console.log(`    Matched: "${match.matchedText}"`)
    })
  }

  const passed = result.isSuspicious === test.expectThreat
  console.log(`Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`)
  console.log('---\n')
})

console.log('=== Test Suite Complete ===')
