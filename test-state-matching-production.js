#!/usr/bin/env node

// Test State-Specific Matching Rules - Production Test

const testQuestions = [
  {
    state: 'VA',
    question: 'The insurance company approved partial roof replacement for storm damage. What arguments should I use to get full approval?',
    expectedStrategies: ['repairability', 'brittle test', 'code compliance', 'ice & water shield', 'underlayment'],
    shouldNotContain: ['matching shingles required', 'matching requirement']
  },
  {
    state: 'PA',
    question: 'Insurance denied full roof replacement and only approved partial. Help me write a rebuttal.',
    expectedStrategies: ['repairability', 'brittle test', 'differing dimensions', 'code compliance'],
    shouldNotContain: ['matching shingles required', 'matching requirement']
  },
  {
    state: 'MD',
    question: 'Insurance says they will only cover partial roof. What matching arguments can I use?',
    expectedStrategies: ['MIA Bulletin 18-23', 'matching', 'aesthetic'],
    shouldNotContain: []
  }
];

async function testStateStrategy(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING: ${testCase.state} - "${testCase.question}"`);
  console.log('='.repeat(80) + '\n');

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
      console.log('✅ RESPONSE RECEIVED');
      console.log('─'.repeat(80));
      console.log(data.message);
      console.log('─'.repeat(80));

      const lowerMsg = data.message.toLowerCase();

      // Check for expected strategies
      console.log('\n📊 STRATEGY VALIDATION:');
      let passCount = 0;
      let failCount = 0;

      testCase.expectedStrategies.forEach(strategy => {
        if (lowerMsg.includes(strategy.toLowerCase())) {
          console.log(`✅ Contains expected strategy: "${strategy}"`);
          passCount++;
        } else {
          console.log(`⚠️  Missing expected strategy: "${strategy}"`);
          failCount++;
        }
      });

      // Check for prohibited content
      testCase.shouldNotContain.forEach(prohibited => {
        if (lowerMsg.includes(prohibited.toLowerCase())) {
          console.log(`❌ CRITICAL ERROR: Contains prohibited phrase: "${prohibited}"`);
          failCount++;
        } else {
          console.log(`✅ Correctly avoids: "${prohibited}"`);
          passCount++;
        }
      });

      const totalChecks = testCase.expectedStrategies.length + testCase.shouldNotContain.length;
      const successRate = ((passCount / totalChecks) * 100).toFixed(1);

      console.log(`\n📈 Success Rate: ${successRate}% (${passCount}/${totalChecks})`);

      if (successRate === '100.0') {
        console.log('🎉 PERFECT - All checks passed!');
      } else if (successRate >= 80) {
        console.log('✅ GOOD - Most checks passed');
      } else {
        console.log('❌ NEEDS IMPROVEMENT - Several checks failed');
      }

      return { state: testCase.state, successRate: parseFloat(successRate), passed: passCount, failed: failCount };
    } else {
      console.log('❌ ERROR:', data.error || 'Unknown error');
      return { state: testCase.state, successRate: 0, passed: 0, failed: 1 };
    }
  } catch (error) {
    console.log('❌ FETCH ERROR:', error.message);
    return { state: testCase.state, successRate: 0, passed: 0, failed: 1 };
  }
}

(async () => {
  console.log('\n🚨 TESTING STATE-SPECIFIC MATCHING STRATEGIES - PRODUCTION');
  console.log('Testing that Susan applies correct arguments for VA, PA, and MD\n');

  const results = [];

  for (const testCase of testQuestions) {
    const result = await testStateStrategy(testCase);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds between tests
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');

  results.forEach(result => {
    console.log(`${result.state}: ${result.successRate}% (${result.passed} passed, ${result.failed} failed)`);
  });

  const avgSuccess = (results.reduce((sum, r) => sum + r.successRate, 0) / results.length).toFixed(1);
  console.log(`\nOverall Average: ${avgSuccess}%`);

  if (avgSuccess === '100.0') {
    console.log('\n🎉 ALL TESTS PASSED - Susan has correct state-specific strategies ingrained!');
  } else if (avgSuccess >= 90) {
    console.log('\n✅ MOSTLY CORRECT - Minor improvements needed');
  } else if (avgSuccess >= 75) {
    console.log('\n⚠️  NEEDS ATTENTION - Some strategies not applied correctly');
  } else {
    console.log('\n❌ CRITICAL ISSUES - Major corrections needed');
  }

  console.log('\n' + '='.repeat(80) + '\n');
})();
