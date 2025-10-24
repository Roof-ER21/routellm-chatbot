#!/usr/bin/env node

// Test Enhanced Susan with Partial Approval + Hail Question

const testQuestions = [
  "What is a good code or argument when partial is approved and hail is present?",
  "I uploaded an estimate - what questions should I answer?",
  "Can you tell me about Maryland's matching requirements?",
  "What should cost estimates include for a full roof replacement?"
];

async function testSusan(question) {
  console.log('\n' + '='.repeat(80));
  console.log(`TESTING: "${question}"`);
  console.log('='.repeat(80) + '\n');

  try {
    const response = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: question }],
        sessionId: `test-${Date.now()}`,
        repName: 'Test Rep'
      })
    });

    const data = await response.json();

    if (data.message) {
      console.log('✅ RESPONSE:');
      console.log(data.message);
      console.log(`\n📊 Provider: ${data.provider || 'N/A'}`);
      console.log(`⚡ Model: ${data.model || 'N/A'}`);
      console.log(`⏱️  Speed: ${data.cached ? 'CACHED' : 'FRESH'}`);

      // Check for pricing violations
      const lowerMsg = data.message.toLowerCase();
      if (lowerMsg.includes('should cost') || lowerMsg.includes('supplement')) {
        console.log('\n⚠️  WARNING: Possible pricing violation detected!');
      }

      // Check for persuasive techniques
      if (lowerMsg.includes('based on what you') ||
          lowerMsg.includes('picture this') ||
          lowerMsg.includes('many reps')) {
        console.log('💡 Persuasive technique detected!');
      }

      // Check for questions
      if (data.message.includes('?')) {
        const questions = data.message.split('?').length - 1;
        console.log(`❓ Asked ${questions} clarifying question(s)`);
      }
    } else {
      console.log('❌ ERROR:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ FETCH ERROR:', error.message);
  }
}

(async () => {
  console.log('\n🚀 TESTING ENHANCED SUSAN AI-21');
  console.log('Testing persuasive communication, NO pricing rules, and interactive questioning\n');

  for (const question of testQuestions) {
    await testSusan(question);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between tests
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ ALL TESTS COMPLETE');
  console.log('='.repeat(80) + '\n');
})();
