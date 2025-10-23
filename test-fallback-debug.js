// Test Fallback Mechanism with Abacus Empty Response Simulation

const DEPLOYMENT_TOKEN = process.env.DEPLOYMENT_TOKEN || '2670ce30456644ddad56a334786a3a1a';
const DEPLOYMENT_ID = process.env.ABACUS_DEPLOYMENT_ID || '6a1d18f38';

async function testAbacusResponse() {
  console.log('🧪 Testing Abacus Response Structure...\n');

  try {
    const response = await fetch('https://api.abacus.ai/api/v0/getChatResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploymentToken: DEPLOYMENT_TOKEN,
        deploymentId: DEPLOYMENT_ID,
        messages: [
          { is_user: true, text: 'Hello' }
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      console.error('❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }

    const data = await response.json();
    console.log('📦 Full Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    // Check message extraction logic
    const assistantMessages = data.result?.messages?.filter((msg) => !msg.is_user) || [];
    console.log('📨 Assistant Messages Found:', assistantMessages.length);

    if (assistantMessages.length > 0) {
      const lastMessage = assistantMessages[assistantMessages.length - 1];
      console.log('📝 Last Assistant Message:');
      console.log('  - has text:', !!lastMessage.text);
      console.log('  - text value:', lastMessage.text);
      console.log('  - text length:', lastMessage.text?.length || 0);
      console.log('  - text trimmed:', lastMessage.text?.trim());
      console.log('  - is empty after trim:', !lastMessage.text?.trim());
    } else {
      console.log('⚠️  NO assistant messages in response!');
      console.log('  This would cause fallback to trigger');
    }

    // Simulate validation logic from ai-provider-failover.ts
    const message = assistantMessages[assistantMessages.length - 1]?.text || '';
    console.log('\n🔍 Validation Check:');
    console.log('  - message extracted:', JSON.stringify(message));
    console.log('  - message.trim().length:', message.trim().length);
    console.log('  - Would pass validation?', message && message.trim().length > 0);

    if (!message || message.trim().length === 0) {
      console.log('\n❌ VALIDATION FAILED - This would trigger fallback');
      console.log('   Error: "Abacus returned empty response"');
    } else {
      console.log('\n✅ Validation would pass');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAbacusResponse().catch(console.error);
