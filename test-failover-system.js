// Test the actual failover system from the codebase

async function testFailoverSystem() {
  console.log('🧪 TESTING ACTUAL FAILOVER SYSTEM\n');

  // Import the failover system
  const { aiFailover } = await import('./lib/ai-provider-failover.ts');

  const testMessages = [
    { role: 'user', content: 'What is a roof inspection?' }
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Testing with: "What is a roof inspection?"');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    console.log('Attempting to get response from failover system...\n');
    const response = await aiFailover.getResponse(testMessages);

    console.log('✅ FAILOVER SYSTEM WORKING!\n');
    console.log('Response Details:');
    console.log('  Provider:', response.provider);
    console.log('  Model:', response.model);
    console.log('  Offline:', response.offline || false);
    console.log('  Message Preview:', response.message.substring(0, 200) + '...\n');

    // Test forcing Ollama
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing Ollama directly (force provider)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
      const ollamaResponse = await aiFailover.getResponseFrom('Ollama', testMessages);
      console.log('✅ OLLAMA WORKING!\n');
      console.log('Response Details:');
      console.log('  Provider:', ollamaResponse.provider);
      console.log('  Model:', ollamaResponse.model);
      console.log('  Message Preview:', ollamaResponse.message.substring(0, 200) + '...\n');
    } catch (ollamaError) {
      console.log('❌ OLLAMA FAILED:', ollamaError.message);
      console.log('   This is expected if Ollama is not running or models not installed\n');
    }

    // Test static knowledge
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Testing Static Knowledge (offline fallback)...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const staticResponse = await aiFailover.getResponseFrom('StaticKnowledge', testMessages);
    console.log('✅ STATIC KNOWLEDGE WORKING!\n');
    console.log('Response Details:');
    console.log('  Provider:', staticResponse.provider);
    console.log('  Model:', staticResponse.model);
    console.log('  Offline:', staticResponse.offline);
    console.log('  Message Preview:', staticResponse.message.substring(0, 300) + '...\n');

    // Get health status
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Provider Health Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    const health = aiFailover.getHealthStatus();
    console.log(JSON.stringify(health, null, 2));

  } catch (error) {
    console.error('❌ FAILOVER SYSTEM FAILED:', error.message);
    console.error('\nThis indicates a critical issue - no providers are working!\n');
    process.exit(1);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 FAILOVER SYSTEM TEST COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

testFailoverSystem().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
