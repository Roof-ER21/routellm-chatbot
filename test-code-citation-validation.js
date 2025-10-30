#!/usr/bin/env node

// Comprehensive Code Citation Validation Test
// Tests that Susan uses CORRECT citations for each argument type

const testCases = [
  {
    state: 'VA',
    testName: 'Virginia Repairability - Should cite GAF, NOT IRC R908.3',
    question: 'The insurance approved partial roof. The shingles are old and brittle. What argument should I use?',
    shouldContain: ['gaf', 'brittle', 'repair', 'warranty'],
    shouldNotContain: ['r908.3', 'irc r908.3', 'building code for repair'],
    checkFor: 'Repairability citation correctness'
  },
  {
    state: 'VA',
    testName: 'Virginia Discontinued - Should cite iTel, NOT IRC codes',
    question: 'The shingles are discontinued 3-tab. How do I argue for full replacement?',
    shouldContain: ['itel', 'discontinued', 'metric', 'english', 'dimension'],
    shouldNotContain: ['r908.3', 'irc code', 'building code'],
    checkFor: 'Discontinued product citation correctness'
  },
  {
    state: 'VA',
    testName: 'Virginia Matching - Should NOT use matching arguments',
    question: 'Can I argue the new shingles won\'t match the existing ones in Virginia?',
    shouldContain: ['repairability', 'virginia does not', 'no matching', 'brittle'],
    shouldNotContain: ['matching requirement', 'matching law', 'required to match'],
    checkFor: 'VA has no matching requirement'
  },
  {
    state: 'MD',
    testName: 'Maryland Matching - Should cite MIA Bulletin 18-23',
    question: 'The insurance says partial is fine but the new siding won\'t match. What can I argue in Maryland?',
    shouldContain: ['mia bulletin 18-23', 'matching', 'mismatch', 'color shade', 'texture'],
    shouldNotContain: ['r908.3', 'irc code', 'building code'],
    checkFor: 'MD MIA Bulletin 18-23 citation'
  },
  {
    state: 'MD',
    testName: 'Maryland Repairability - GAF as secondary to matching',
    question: 'Insurance denied full roof in Maryland. Shingles are old. What should I argue?',
    shouldContain: ['mia bulletin 18-23', 'matching', 'repairability'],
    shouldNotContain: [],
    checkFor: 'MD uses matching first, repairability second'
  },
  {
    state: 'PA',
    testName: 'Pennsylvania Repairability - Should cite GAF, NOT IRC',
    question: 'Pennsylvania property with brittle shingles. Insurance says repair only. Help?',
    shouldContain: ['gaf', 'brittle', 'repairability', 'warranty'],
    shouldNotContain: ['r908.3 for repair', 'irc code for repair'],
    checkFor: 'PA repairability citation correctness'
  },
  {
    state: 'PA',
    testName: 'Pennsylvania Matching - Should NOT use matching',
    question: 'Can I argue matching requirements in Pennsylvania?',
    shouldContain: ['pennsylvania does not', 'no matching', 'repairability', 'brittle'],
    shouldNotContain: ['matching requirement', 'matching law', 'required to match'],
    checkFor: 'PA has no matching requirement'
  },
  {
    state: 'VA',
    testName: 'Virginia Code Compliance - IRC R908.3 ONLY when work approved',
    question: 'Insurance approved full replacement. What materials are required by code?',
    shouldContain: ['irc r908.3', 'ice & water shield', 'underlayment', 'current code'],
    shouldNotContain: ['repairability'],
    checkFor: 'Correct use of IRC R908.3 when work approved'
  }
];

async function runTest(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.testName}`);
  console.log(`STATE: ${testCase.state}`);
  console.log(`CHECKING: ${testCase.checkFor}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch('https://s21.up.railway.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: testCase.question }],
        sessionId: `test-${Date.now()}`,
        repName: 'Test Rep',
        selectedState: testCase.state
      })
    });

    const data = await response.json();

    if (data.message) {
      const lowerMsg = data.message.toLowerCase();

      console.log('\n📄 RESPONSE PREVIEW:');
      console.log(data.message.substring(0, 300) + '...\n');

      let passCount = 0;
      let failCount = 0;

      // Check for required phrases
      console.log('✅ SHOULD CONTAIN:');
      testCase.shouldContain.forEach(phrase => {
        if (lowerMsg.includes(phrase.toLowerCase())) {
          console.log(`   ✅ Found: "${phrase}"`);
          passCount++;
        } else {
          console.log(`   ❌ MISSING: "${phrase}"`);
          failCount++;
        }
      });

      // Check for prohibited phrases
      if (testCase.shouldNotContain.length > 0) {
        console.log('\n❌ SHOULD NOT CONTAIN:');
        testCase.shouldNotContain.forEach(phrase => {
          if (lowerMsg.includes(phrase.toLowerCase())) {
            console.log(`   ❌ CRITICAL ERROR: Found prohibited phrase: "${phrase}"`);
            failCount++;
          } else {
            console.log(`   ✅ Correctly avoids: "${phrase}"`);
            passCount++;
          }
        });
      }

      const totalChecks = testCase.shouldContain.length + testCase.shouldNotContain.length;
      const successRate = ((passCount / totalChecks) * 100).toFixed(1);

      console.log(`\n📊 RESULT: ${successRate}% (${passCount}/${totalChecks})`);

      if (successRate === '100.0') {
        console.log('🎉 PERFECT - All citations correct!');
        return { test: testCase.testName, passed: true, successRate: parseFloat(successRate) };
      } else if (successRate >= 75) {
        console.log('⚠️  MOSTLY CORRECT - Minor issues');
        return { test: testCase.testName, passed: false, successRate: parseFloat(successRate) };
      } else {
        console.log('❌ FAILED - Incorrect citations');
        return { test: testCase.testName, passed: false, successRate: parseFloat(successRate) };
      }
    } else {
      console.log('❌ ERROR:', data.error || 'Unknown error');
      return { test: testCase.testName, passed: false, successRate: 0 };
    }
  } catch (error) {
    console.log('❌ FETCH ERROR:', error.message);
    return { test: testCase.testName, passed: false, successRate: 0 };
  }
}

(async () => {
  console.log('\n🔬 COMPREHENSIVE CODE CITATION VALIDATION TEST');
  console.log('Testing that Susan uses CORRECT citations for each argument type\n');
  console.log('Target: https://s21.up.railway.app\n');

  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between tests
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL VALIDATION RESULTS');
  console.log('='.repeat(80) + '\n');

  let totalPassed = 0;
  let totalFailed = 0;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} [${result.successRate}%] ${result.test}`);
    if (result.passed) totalPassed++;
    else totalFailed++;
  });

  const overallRate = ((totalPassed / results.length) * 100).toFixed(1);
  console.log(`\n📈 OVERALL: ${overallRate}% (${totalPassed}/${results.length} tests passed)`);

  if (overallRate === '100.0') {
    console.log('\n🎉 ALL TESTS PASSED - Susan has correct code citation logic!');
  } else if (overallRate >= 87.5) {
    console.log('\n✅ MOSTLY PASSING - Minor improvements needed');
  } else if (overallRate >= 75) {
    console.log('\n⚠️  NEEDS ATTENTION - Several citation errors remain');
  } else {
    console.log('\n❌ CRITICAL ISSUES - Major citation problems detected');
  }

  console.log('\n' + '='.repeat(80) + '\n');
})();
